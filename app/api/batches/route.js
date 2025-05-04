import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { ObjectId } from 'mongodb';
import Batch from '@/models/Batch';

export async function GET(request) {
  try {
    // Get departmentId from query parameters
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('departmentId');

    // Connect to database with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        await connectDB();
        break; // If connection successful, break the retry loop
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      }
    }

    // Create query based on whether departmentId is provided
    const query = departmentId ? { department: departmentId } : {};

    // Find batches with timeout
    const batches = await Promise.race([
      Batch.find(query)
        .select('_id name department totalStudents')
        .populate('department', 'name') // Populate department name
        .sort({ name: 1 })
        .lean()
        .exec(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 5000)
      )
    ]);

    if (!batches || batches.length === 0) {
      return NextResponse.json([], { status: 200 }); // Return empty array if no batches found
    }

    return NextResponse.json(batches);

  } catch (error) {
    console.error('Batch fetch error:', error);
    
    // Specific error handling
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      return NextResponse.json(
        { error: 'Database connection timed out. Please try again.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch batches. Please try again.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { db } = await connectDB();
    const batch = await request.json();

    // Validate required fields
    if (!batch.name || !batch.department || !batch.totalStudents) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if batch name already exists in the department
    const existingBatch = await db.collection('batches').findOne({
      name: batch.name,
      department: new ObjectId(batch.department)
    });

    if (existingBatch) {
      return NextResponse.json(
        { error: 'Batch name already exists in this department' },
        { status: 400 }
      );
    }

    // Convert string IDs to ObjectId
    batch.department = new ObjectId(batch.department);
    batch.totalStudents = parseInt(batch.totalStudents);

    const result = await db.collection('batches').insertOne(batch);
    return NextResponse.json({ _id: result.insertedId, ...batch });
  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { db } = await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 }
      );
    }

    const batch = await request.json();

    // Validate required fields
    if (!batch.name || !batch.department || !batch.totalStudents) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if batch name already exists for other batches in the same department
    const existingBatch = await db.collection('batches').findOne({
      name: batch.name,
      department: new ObjectId(batch.department),
      _id: { $ne: new ObjectId(id) }
    });
    
    if (existingBatch) {
      return NextResponse.json(
        { error: 'Batch name already exists in this department' },
        { status: 400 }
      );
    }

    // Convert string IDs to ObjectId
    batch.department = new ObjectId(batch.department);
    batch.totalStudents = parseInt(batch.totalStudents);

    const result = await db.collection('batches').updateOne(
      { _id: new ObjectId(id) },
      { $set: batch }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ _id: id, ...batch });
  } catch (error) {
    console.error('Error updating batch:', error);
    return NextResponse.json({ error: 'Failed to update batch' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { db } = await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 }
      );
    }

    const result = await db.collection('batches').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    return NextResponse.json({ error: 'Failed to delete batch' }, { status: 500 });
  }
}