import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Department from '@/models/Department';
import { ObjectId } from 'mongodb';

export async function GET() {
    try {
        await connectDB();

        const departments = await Department.find()
            .select('_id name')
            .sort({ name: 1 });

        if (!departments) {
            return NextResponse.json([], { status: 200 });
        }

        return NextResponse.json(departments);

    } catch (error) {
        console.error('Department fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch departments' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
  try {
    const { db } = await connectDB();
    const department = await request.json();

    if (!department.name || !department.code) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const existingDepartment = await db.collection('departments').findOne({ code: department.code });
    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Department code already exists' },
        { status: 400 }
      );
    }

    const result = await db.collection('departments').insertOne(department);
    return NextResponse.json({ _id: result.insertedId, ...department });
  } catch (error) {
    console.error('Error in POST /api/departments:', error);
    return NextResponse.json(
      { error: 'Failed to create department', details: error.message },
      { status: 500 }
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
        { error: 'Department ID is required' },
        { status: 400 }
      );
    }

    const department = await request.json();

    if (!department.name || !department.code) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const existingDepartment = await db.collection('departments').findOne({
      code: department.code,
      _id: { $ne: new ObjectId(id) }
    });
    
    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Department code already exists' },
        { status: 400 }
      );
    }

    const result = await db.collection('departments').updateOne(
      { _id: new ObjectId(id) },
      { $set: department }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ _id: id, ...department });
  } catch (error) {
    console.error('Error in PUT /api/departments:', error);
    return NextResponse.json(
      { error: 'Failed to update department', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { db } = await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Department ID is required' },
        { status: 400 }
      );
    }

    const result = await db.collection('departments').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/departments:', error);
    return NextResponse.json(
      { error: 'Failed to delete department', details: error.message },
      { status: 500 }
    );
  }
} 