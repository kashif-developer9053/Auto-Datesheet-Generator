import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    await connectDB();
    const mongoose = (await import('mongoose')).default;
    const db = mongoose.connection.db;

    const courses = await db.collection('courses')
      .aggregate([
        {
          $lookup: {
            from: 'departments',
            localField: 'department',
            foreignField: '_id',
            as: 'department'
          }
        },
        {
          $unwind: '$department'
        },
        {
          $project: {
            _id: 1,
            name: 1,
            code: 1,
            creditHours: 1,
            department: {
              _id: 1,
              name: 1
            }
          }
        },
        {
          $sort: { name: 1 }
        }
      ]).toArray();

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { db } = await connectDB();
    const course = await request.json();

    // Validate required fields
    if (!course.name || !course.code || !course.department || !course.semester || !course.faculty) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if course code already exists
    const existingCourse = await db.collection('courses').findOne({ code: course.code });
    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course code already exists' },
        { status: 400 }
      );
    }

    // Convert string IDs to ObjectId
    course.department = new ObjectId(course.department);
    course.faculty = new ObjectId(course.faculty);

    const result = await db.collection('courses').insertOne(course);
    return NextResponse.json({ _id: result.insertedId, ...course });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { db } = await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const course = await request.json();

    // Validate required fields
    if (!course.name || !course.code || !course.department || !course.semester || !course.faculty) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if course code already exists for other courses
    const existingCourse = await db.collection('courses').findOne({
      code: course.code,
      _id: { $ne: new ObjectId(id) }
    });
    
    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course code already exists' },
        { status: 400 }
      );
    }

    // Convert string IDs to ObjectId
    course.department = new ObjectId(course.department);
    course.faculty = new ObjectId(course.faculty);

    const result = await db.collection('courses').updateOne(
      { _id: new ObjectId(id) },
      { $set: course }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ _id: id, ...course });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    await connectDB();
    const mongoose = (await import('mongoose')).default;
    const db = mongoose.connection.db;

    // Convert string ID to ObjectId
    const objectId = new ObjectId(id);

    // Delete the course
    const result = await db.collection('courses').deleteOne({
      _id: objectId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    
    // Handle invalid ObjectId error
    if (error.message.includes('Invalid ObjectId')) {
      return NextResponse.json(
        { error: 'Invalid course ID format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
} 