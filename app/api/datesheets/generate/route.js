import { NextResponse } from 'next/server';
import  connectDB  from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const { db } = await connectDB();
    const {
      departmentId,
      semester,
      examPeriod,
      academicYear,
      selectedDays,
      examTimings
    } = await request.json();

    // Validate input
    if (!departmentId || !semester || !examPeriod || !academicYear) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Convert string IDs to ObjectId
    const deptId = new ObjectId(departmentId);

    // Fetch required data
    const [courses, batches, rooms, faculty] = await Promise.all([
      // Get courses for the semester
      db.collection('courses').find({
        departmentId: deptId,
        semester: parseInt(semester)
      }).toArray(),
      
      // Get batches for the department and semester
      db.collection('batches').find({
        departmentId: deptId,
        semester: parseInt(semester)
      }).toArray(),
      
      // Get available rooms
      db.collection('rooms').find({
        isAvailable: true
      }).toArray(),
      
      // Get faculty from the department
      db.collection('users').find({
        departmentId: deptId,
        role: 'faculty'
      }).toArray()
    ]);

    if (courses.length === 0) {
      return NextResponse.json({ error: 'No courses found for the selected semester' }, { status: 404 });
    }

    // Create datesheet document
    const datesheet = {
      name: `${examPeriod} ${academicYear} - Semester ${semester}`,
      departmentId: deptId,
      semester: parseInt(semester),
      academicYear,
      examPeriod,
      schedule: generateSchedule(courses, faculty, rooms),
      version: 1.0,
      createdAt: new Date(),
      status: 'draft'
    };

    const result = await db.collection('datesheets').insertOne(datesheet);
    return NextResponse.json({ 
      success: true, 
      _id: result.insertedId,
      ...datesheet
    });

  } catch (error) {
    console.error('Error generating datesheet:', error);
    return NextResponse.json({ error: 'Failed to generate datesheet' }, { status: 500 });
  }
}

function generateSchedule(courses, faculty, rooms) {
  // Simple schedule generation for now
  return courses.map((course, index) => ({
    date: new Date(Date.now() + index * 24 * 60 * 60 * 1000), // One exam per day
    timing: '09:00 AM - 11:00 AM',
    courseId: course._id,
    courseName: `${course.code} ${course.name}`,
    faculty: faculty[index % faculty.length],
    room: rooms[0],
  }));
} 