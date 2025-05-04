import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

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