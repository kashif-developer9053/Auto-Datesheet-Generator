import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ManualDatesheet from '@/models/ManualDatesheet';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    await connectDB();
    const manualDatesheets = await ManualDatesheet.find().sort({ createdAt: -1 });
    return NextResponse.json(manualDatesheets);
  } catch (error) {
    console.error('Error fetching manual datesheets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch manual datesheets' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { db } = await connectDB();
    let data;
    try {
      data = await request.json();
    } catch (jsonError) {
      console.error('Error parsing JSON from request:', jsonError);
      return NextResponse.json({
        error: 'Invalid JSON in request body',
        details: jsonError.message
      }, { status: 400 });
    }
    console.log('Received manual datesheet data:', JSON.stringify(data, null, 2));

    const {
      name,
      academicYear,
      examPeriod,
      departmentId,
      batchId,
      semester,
      startDate,
      endDate,
      schedule,
    } = data;

    // Validate required fields
    if (!name || !academicYear || !examPeriod || !departmentId || !batchId || !semester || !startDate || !endDate) {
      throw new Error('All fields are required');
    }
    if (!Array.isArray(schedule) || schedule.length === 0) {
      throw new Error('Schedule array is required and must not be empty');
    }

    // Validate schedule entries
    for (const exam of schedule) {
      if (!exam.courseId || !exam.date || !exam.timing?.startTime || !exam.timing?.endTime) {
        throw new Error('Each schedule entry must include courseId, date, and timing');
      }
      if (!exam.roomAssignments || !Array.isArray(exam.roomAssignments) || exam.roomAssignments.length === 0) {
        throw new Error('Each schedule entry must include at least one room assignment');
      }
      for (const assignment of exam.roomAssignments) {
        if (!assignment.roomId || !assignment.facultyId || !assignment.assignedStudents) {
          throw new Error('Each room assignment must include roomId, facultyId, and assignedStudents');
        }
      }
    }

    // Fetch course details to populate courseCode and courseName
    const courseIds = schedule.map((exam) => new ObjectId(exam.courseId));
    const courses = await db.collection('courses').find({ _id: { $in: courseIds } }).toArray();

    // Validate room and faculty availability
    const roomIds = schedule.flatMap((exam) => exam.roomAssignments.map((ra) => new ObjectId(ra.roomId)));
    const facultyIds = schedule.flatMap((exam) => exam.roomAssignments.map((ra) => new ObjectId(ra.facultyId)));
    const [rooms, faculty] = await Promise.all([
      db.collection('rooms').find({ _id: { $in: roomIds } }).toArray(),
      db.collection('users').find({ _id: { $in: facultyIds }, role: 'faculty' }).toArray(),
    ]);

    // Check for conflicts in both manual and auto datesheets
    const [existingManualDatesheets, existingAutoDatesheets] = await Promise.all([
      db.collection('manualdatesheets').find({
        departmentId: new ObjectId(departmentId),
        $or: [
          { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } },
        ],
      }).toArray(),
      db.collection('datesheets').find({
        departmentId: new ObjectId(departmentId),
        $or: [
          { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(startDate) } },
        ],
      }).toArray(),
    ]);

    const existingSchedule = [
      ...existingManualDatesheets.flatMap((ds) => ds.schedules.flatMap((s) => s.schedule)),
      ...existingAutoDatesheets.flatMap((ds) => ds.schedules.flatMap((s) => s.schedule)),
    ];

    for (const exam of schedule) {
      const examDate = new Date(exam.date);
      for (const assignment of exam.roomAssignments) {
        const room = rooms.find((r) => r._id.toString() === assignment.roomId);
        const facultyMember = faculty.find((f) => f._id.toString() === assignment.facultyId);
        if (!room) throw new Error(`Room ${assignment.roomId} not found`);
        if (!facultyMember) throw new Error(`Faculty ${assignment.facultyId} not found`);

        // Check room availability
        const roomConflict = existingSchedule.some((entry) =>
          entry.date.getTime() === examDate.getTime() &&
          entry.timing.startTime === exam.timing.startTime &&
          entry.roomAssignments.some((ra) => ra.roomId.toString() === assignment.roomId)
        );
        if (roomConflict) {
          throw new Error(`Room ${room.name} is already assigned on ${examDate} at ${exam.timing.startTime}`);
        }

        // Check faculty availability
        const facultyConflict = existingSchedule.some((entry) =>
          entry.date.getTime() === examDate.getTime() &&
          entry.timing.startTime === exam.timing.startTime &&
          entry.roomAssignments.some((ra) => ra.facultyId.toString() === assignment.facultyId)
        );
        if (facultyConflict) {
          throw new Error(`Faculty ${facultyMember.name} is already assigned on ${examDate} at ${exam.timing.startTime}`);
        }

        // Verify room capacity
        const course = courses.find((c) => c._id.toString() === exam.courseId);
        if (!course) throw new Error(`Course ${exam.courseId} not found`);
        if (room.capacity < assignment.assignedStudents) {
          throw new Error(`Room ${room.name} capacity (${room.capacity}) is less than assigned students (${assignment.assignedStudents})`);
        }
      }
    }

    // Format schedule
    const formattedSchedule = schedule.map((exam) => {
      const course = courses.find((c) => c._id.toString() === exam.courseId);
      return {
        date: new Date(exam.date),
        courseId: new ObjectId(exam.courseId),
        courseCode: course?.code || '',
        courseName: course?.name || '',
        totalStudents: course?.totalStudents || exam.roomAssignments[0].assignedStudents,
        timing: exam.timing,
        roomAssignments: exam.roomAssignments.map((ra) => ({
          roomId: new ObjectId(ra.roomId),
          roomName: rooms.find((r) => r._id.toString() === ra.roomId)?.name || '',
          facultyId: new ObjectId(ra.facultyId),
          facultyName: faculty.find((f) => f._id.toString() === ra.facultyId)?.name || '',
          assignedStudents: ra.assignedStudents,
        })),
      };
    });

    // Create manual datesheet document
    const manualDatesheet = {
      name,
      academicYear,
      examPeriod,
      departmentId: new ObjectId(departmentId),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      schedules: [
        {
          batchId: new ObjectId(batchId),
          semester,
          examTimings: Array.from(
            new Set(
              schedule.map((exam) => `${exam.timing.startTime} - ${exam.timing.endTime}`)
            )
          ).map((slot) => {
            const [startTime, endTime] = slot.split(' - ');
            return { startTime, endTime };
          }),
          schedule: formattedSchedule,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Saving manual datesheet:', JSON.stringify(manualDatesheet, null, 2));
    const result = await db.collection('manualdatesheets').insertOne(manualDatesheet);

    return NextResponse.json({
      success: true,
      datesheetId: result.insertedId,
    });
  } catch (error) {
    console.error('Error creating manual datesheet:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create manual datesheet' },
      { status: 400 }
    );
  }
}

export async function PUT(request) {
  try {
    const { db } = await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Manual Datesheet ID is required' },
        { status: 400 }
      );
    }

    const updates = await request.json();

    // Validate required fields (example, adjust as needed)
    if (!updates.name || !updates.academicYear || !updates.examPeriod || !updates.departmentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure ObjectIds are properly formatted
    if (updates.departmentId) updates.departmentId = new ObjectId(updates.departmentId);
    if (updates.schedules) {
      updates.schedules = updates.schedules.map((s) => ({
        ...s,
        batchId: new ObjectId(s.batchId),
        schedule: s.schedule.map((entry) => ({
          ...entry,
          courseId: new ObjectId(entry.courseId),
          date: new Date(entry.date),
          roomAssignments: entry.roomAssignments.map((ra) => ({
            ...ra,
            roomId: new ObjectId(ra.roomId),
            facultyId: new ObjectId(ra.facultyId),
          })),
        })),
      }));
    }

    updates.updatedAt = new Date();

    const result = await db.collection('manualdatesheets').updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Manual Datesheet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ _id: id, ...updates });
  } catch (error) {
    console.error('Error updating manual datesheet:', error);
    return NextResponse.json({ error: 'Failed to update manual datesheet' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { db } = await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Manual Datesheet ID is required' },
        { status: 400 }
      );
    }

    const result = await db.collection('manualdatesheets').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Manual Datesheet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Manual Datesheet deleted successfully' });
  } catch (error) {
    console.error('Error deleting manual datesheet:', error);
    return NextResponse.json({ error: 'Failed to delete manual datesheet' }, { status: 500 });
  }
}