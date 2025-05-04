import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Datesheet from '@/models/DateSheet';
import { ObjectId } from 'mongodb';

// Helper function to assign rooms and faculty
function assignRoomsAndFaculty(totalStudents, rooms, faculty, examDate, examTiming, existingSchedule, roomIndex, facultyIndex) {
  const assignments = [];
  let remainingStudents = totalStudents;

  // Sort rooms by capacity (descending) but prioritize room at roomIndex
  let availableRooms = [...rooms].sort((a, b) => (b.capacity || 0) - (a.capacity || 0));

  // Check for room and faculty conflicts
  const isRoomAvailable = (room, date, timing) => {
    return !existingSchedule.some(entry =>
      entry.date.getTime() === date.getTime() &&
      entry.timing.startTime === timing.startTime &&
      entry.roomAssignments.some(assignment => 
        assignment.roomId && assignment.roomId.toString() === (room._id || room.id).toString()
      )
    );
  };

  const isFacultyAvailable = (facultyMember, date, timing) => {
    return !existingSchedule.some(entry =>
      entry.date.getTime() === date.getTime() &&
      entry.timing.startTime === timing.startTime &&
      entry.roomAssignments.some(assignment =>
        assignment.facultyId && assignment.facultyId.toString() === (facultyMember._id || facultyMember.id).toString()
      )
    );
  };

  // Track faculty assigned within this exam to ensure uniqueness when multiple faculty are available
  const assignedFacultyIdsThisExam = new Set();

  while (remainingStudents > 0 && availableRooms.length > 0) {
    // Try the room at roomIndex first, then others
    let selectedRoom = null;
    const preferredRoomIndex = roomIndex % availableRooms.length;
    if (isRoomAvailable(availableRooms[preferredRoomIndex], examDate, examTiming)) {
      selectedRoom = availableRooms[preferredRoomIndex];
      availableRooms.splice(preferredRoomIndex, 1);
    } else {
      for (let i = 0; i < availableRooms.length; i++) {
        if (isRoomAvailable(availableRooms[i], examDate, examTiming)) {
          selectedRoom = availableRooms[i];
          availableRooms.splice(i, 1);
          break;
        }
      }
    }

    if (!selectedRoom) {
      throw new Error(`No available rooms for ${remainingStudents} students on ${examDate} at ${examTiming.startTime}.`);
    }

    // Find an available faculty member, starting from facultyIndex
    let selectedFaculty = null;
    for (let i = 0; i < faculty.length; i++) {
      const currentFaculty = faculty[(facultyIndex + i) % faculty.length];
      const facultyId = (currentFaculty._id || currentFaculty.id).toString();
      if (faculty.length === 1 || (!assignedFacultyIdsThisExam.has(facultyId) && isFacultyAvailable(currentFaculty, examDate, examTiming))) {
        selectedFaculty = currentFaculty;
        assignedFacultyIdsThisExam.add(facultyId);
        facultyIndex = (facultyIndex + i + 1) % faculty.length;
        break;
      }
    }

    if (!selectedFaculty) {
      throw new Error(`No available faculty for room ${selectedRoom.name} on ${examDate} at ${examTiming.startTime}.`);
    }

    const studentsInThisRoom = Math.min(remainingStudents, selectedRoom.capacity || 30);
    assignments.push({
      roomId: selectedRoom._id || selectedRoom.id,
      roomName: selectedRoom.name,
      facultyId: selectedFaculty._id || selectedFaculty.id,
      facultyName: selectedFaculty.name,
      assignedStudents: studentsInThisRoom
    });

    remainingStudents -= studentsInThisRoom;
  }

  if (remainingStudents > 0) {
    throw new Error(`Insufficient room capacity for ${remainingStudents} students on ${examDate} at ${examTiming.startTime}.`);
  }

  return { assignments, nextRoomIndex: (roomIndex + 1) % rooms.length, nextFacultyIndex: facultyIndex };
}

// Helper function to generate schedule
async function generateSchedule(courses, startDate, endDate, allowedDays, gapDays, examTimings, rooms, faculty) {
  const schedule = [];
  let currentDate = new Date(startDate);
  const endDateTime = new Date(endDate);
  let courseIndex = 0;
  let roomIndex = 0;
  let facultyIndex = 0;

  // Default allowed days if not provided
  allowedDays = allowedDays || {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false
  };

  // Helper function to check if a day is allowed
  const isDayAllowed = (date) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = date.getDay();
    const dayName = days[dayIndex];
    return allowedDays[dayName];
  };

  // Helper function to add days to a date
  const addDays = (date, days) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  };

  // If no exam timings provided, create a default
  if (!examTimings || examTimings.length === 0) {
    examTimings = [
      { startTime: '09:00 AM', endTime: '12:00 PM' },
      { startTime: '02:00 PM', endTime: '05:00 PM' }
    ];
  }

  // Ensure exam timings are in the correct format
  examTimings = examTimings.map(timing => {
    if (typeof timing === 'string') {
      const [startTime, endTime] = timing.split(' - ');
      return { startTime, endTime };
    }
    return timing;
  });

  while (currentDate <= endDateTime && courseIndex < courses.length) {
    if (!isDayAllowed(currentDate)) {
      currentDate = addDays(currentDate, 1);
      continue;
    }

    const timing = examTimings[courseIndex % examTimings.length];
    const course = courses[courseIndex];

    // Calculate room assignments
    const { assignments, nextRoomIndex, nextFacultyIndex } = assignRoomsAndFaculty(
      course.totalStudents || 30,
      rooms,
      faculty,
      currentDate,
      timing,
      schedule,
      roomIndex,
      facultyIndex
    );

    schedule.push({
      date: new Date(currentDate),
      courseName: course.name,
      courseCode: course.code,
      courseId: course._id || course.id,
      timing: timing,
      totalStudents: course.totalStudents || 30,
      roomAssignments: assignments
    });

    courseIndex++;
    roomIndex = nextRoomIndex;
    facultyIndex = nextFacultyIndex;
    if (courseIndex % examTimings.length === 0) {
      currentDate = addDays(currentDate, gapDays + 1);
    }
  }

  if (courseIndex < courses.length) {
    throw new Error(`Unable to schedule all courses within the given date range. ${courses.length - courseIndex} courses remain unscheduled.`);
  }

  return schedule;
}

export async function GET() {
  try {
    await connectDB();
    const datesheets = await Datesheet.find().sort({ createdAt: -1 });
    return NextResponse.json(datesheets);
  } catch (error) {
    console.error('Error fetching datesheets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch datesheets' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
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
    console.log('Received data:', JSON.stringify(data, null, 2));

    // Validate required fields in the request
    if (!data.startDate || !data.endDate) {
      throw new Error('Start date and end date are required');
    }

    if (!data.departmentSchedules || !Array.isArray(data.departmentSchedules)) {
      throw new Error('Department schedules are required and must be an array');
    }

    data.departmentSchedules.forEach((deptSchedule, index) => {
      if (!deptSchedule.departmentId) {
        throw new Error(`Department ID is required for schedule at index ${index}`);
      }
      if (!deptSchedule.batchId) {
        throw new Error(`Batch ID is required for schedule at index ${index}`);
      }
      if (!deptSchedule.semester) {
        throw new Error(`Semester is required for schedule at index ${index}`);
      }
    });

    console.log('Department schedules:', JSON.stringify(data.departmentSchedules, null, 2));

    // Connect to MongoDB
    const { db } = await connectDB();

    // Group department schedules by departmentId
    const departmentGroups = data.departmentSchedules.reduce((acc, deptSchedule) => {
      const deptId = deptSchedule.departmentId;
      if (!acc[deptId]) {
        acc[deptId] = [];
      }
      acc[deptId].push(deptSchedule);
      return acc;
    }, {});

    const datesheetDocuments = [];

    // Process each department group
    for (const departmentId of Object.keys(departmentGroups)) {
      const deptSchedules = departmentGroups[departmentId];
      const schedulesBySemesterAndBatch = [];

      for (const deptSchedule of deptSchedules) {
        console.log('Processing schedule:', deptSchedule);

        const {
          departmentId,
          batchId,
          semester,
          timeSlots,
          courses: configCourses = [],
          faculty: configFaculty = [],
          rooms: configRooms = []
        } = deptSchedule;

        // Validate required fields
        if (!departmentId || !batchId || !semester) {
          throw new Error('Department ID, Batch ID, and Semester are required for each configuration');
        }

        // Fetch courses, rooms, and faculty from the database
        const [courses, rooms] = await Promise.all([
          // Fetch courses if not provided
          configCourses.length > 0
            ? Promise.resolve(configCourses)
            : db.collection('courses').find({
                department: new ObjectId(departmentId),
                semester: semester
              }).toArray(),
          // Fetch rooms, including those without isAvailable or with isAvailable: true
          configRooms.length > 0
            ? Promise.resolve(configRooms)
            : db.collection('rooms').find({
                $or: [
                  { isAvailable: true },
                  { isAvailable: { $exists: false } }
                ]
              }).toArray()
        ]);

        // Fetch faculty with fixed query that handles different department field formats
        const faculty = configFaculty.length > 0
          ? configFaculty
          : await db.collection('users').find({
              role: 'faculty',
              $or: [
                { departmentId: new ObjectId(departmentId) },
                { departmentId: departmentId },
                { department: new ObjectId(departmentId) },
                { department: departmentId }
              ]
            }).toArray();

        console.log(`Fetched rooms:`, JSON.stringify(rooms, null, 2));
        console.log(`Fetched faculty:`, JSON.stringify(faculty, null, 2));
        console.log(`Fetched courses:`, JSON.stringify(courses, null, 2));

        if (!courses || courses.length === 0) {
          throw new Error(`No courses found for department ${departmentId}, semester ${semester}. Please add courses first.`);
        }

        if (!rooms || rooms.length === 0) {
          throw new Error(`No rooms found. Please ensure rooms are added to the database.`);
        }

        if (!faculty || faculty.length === 0) {
          throw new Error(`No faculty found for department ${departmentId}. Please ensure faculty members are assigned to the department.`);
        }

        // Add totalStudents to courses if not present
        const coursesToUse = courses.map(course => ({
          ...course,
          totalStudents: course.totalStudents || 30
        }));

        // Format exam timings
        const formattedExamTimings = Array.isArray(timeSlots)
          ? timeSlots.map(timing => {
              if (typeof timing === 'string' && timing.includes(' - ')) {
                const [startTime, endTime] = timing.split(' - ');
                return { startTime, endTime };
              }
              return timing;
            })
          : [];

        // Generate schedule for this department, batch, and semester
        const scheduleData = await generateSchedule(
          coursesToUse,
          new Date(data.startDate),
          new Date(data.endDate),
          data.allowedDays || {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: false,
            sunday: false
          },
          data.gapDays || 0,
          formattedExamTimings,
          rooms,
          faculty
        );

        // Add schedule to the list for this department
        schedulesBySemesterAndBatch.push({
          batchId: new ObjectId(batchId),
          semester,
          examTimings: formattedExamTimings,
          schedule: scheduleData
        });
      }

      // Create a single datesheet document for the department
      const datesheet = {
        name: `${data.name || 'Exam'}`,
        academicYear: data.academicYear || new Date().getFullYear().toString(),
        examPeriod: data.examPeriod || 'Regular',
        departmentId: new ObjectId(departmentId),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        schedules: schedulesBySemesterAndBatch,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      datesheetDocuments.push(datesheet);
    }

    // Save all datesheet documents
    console.log(`Attempting to save ${datesheetDocuments.length} datesheet documents`);
    const result = await db.collection('datesheets').insertMany(datesheetDocuments);
    console.log('Created datesheets:', result);

    return NextResponse.json({
      success: true,
      datesheets: result.insertedIds
    });
  } catch (error) {
    console.error('Error creating datesheets:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create datesheets' },
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
        { error: 'DateSheet ID is required' },
        { status: 400 }
      );
    }

    const datesheet = await request.json();

    if (!datesheet.course || !datesheet.room || !datesheet.date || !datesheet.startTime || !datesheet.endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const existingDatesheet = await db.collection('datesheets').findOne({
      room: new ObjectId(datesheet.room),
      date: new Date(datesheet.date),
      _id: { $ne: new ObjectId(id) },
      $or: [
        {
          startTime: { $lte: datesheet.startTime },
          endTime: { $gt: datesheet.startTime }
        },
        {
          startTime: { $lt: datesheet.endTime },
          endTime: { $gte: datesheet.endTime }
        },
        {
          startTime: { $gte: datesheet.startTime },
          endTime: { $lte: datesheet.endTime }
        }
      ]
    });

    if (existingDatesheet) {
      return NextResponse.json(
        { error: 'Time slot conflict with existing datesheet' },
        { status: 400 }
      );
    }

    datesheet.course = new ObjectId(datesheet.course);
    datesheet.room = new ObjectId(datesheet.room);
    datesheet.date = new Date(datesheet.date);

    const result = await db.collection('datesheets').updateOne(
      { _id: new ObjectId(id) },
      { $set: datesheet }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'DateSheet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ _id: id, ...datesheet });
  } catch (error) {
    console.error('Error updating datesheet:', error);
    return NextResponse.json({ error: 'Failed to update datesheet' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { db } = await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'DateSheet ID is required' },
        { status: 400 }
      );
    }

    const result = await db.collection('datesheets').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'DateSheet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'DateSheet deleted successfully' });
  } catch (error) {
    console.error('Error deleting datesheet:', error);
    return NextResponse.json({ error: 'Failed to delete datesheet' }, { status: 500 });
  }
}