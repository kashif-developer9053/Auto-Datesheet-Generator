import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    // Make sure we're working with the resolved params
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid department ID' }, { status: 400 });
    }

    const { db } = await connectDB();
    const department = await db.collection('departments').findOne({ _id: new ObjectId(id) });

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json(department);
  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json({ error: 'Failed to fetch department' }, { status: 500 });
  }
}