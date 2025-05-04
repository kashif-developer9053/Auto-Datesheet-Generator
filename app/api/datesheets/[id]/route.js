import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    const { db } = await connectDB();
    const id = params.id;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid Datesheet ID' },
        { status: 400 }
      );
    }

    const datesheet = await db.collection('datesheets').aggregate([
      // ... rest of the aggregation pipeline
    ]).next();

    if (!datesheet) {
      return NextResponse.json(
        { error: 'Datesheet not found' },
        { status: 404 }
      );
    }

    console.log('Fetched datesheet:', JSON.stringify(datesheet, null, 2));
    return NextResponse.json(datesheet);
  } catch (error) {
    console.error('Error fetching datesheet:', error);
    return NextResponse.json(
      { error: `Failed to fetch datesheet: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = params.id;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid Datesheet ID' },
        { status: 400 }
      );
    }

    const { db } = await connectDB();
    if (!db) {
      throw new Error('Database connection not established');
    }

    const result = await db.collection('datesheets').deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Datesheet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting datesheet:', error);
    return NextResponse.json(
      { error: `Failed to delete datesheet: ${error.message}` },
      { status: 500 }
    );
  }
}