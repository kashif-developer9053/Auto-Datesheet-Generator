import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const { db } = await connectDB();
    const rooms = await db.collection('rooms').find().toArray();
    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { db } = await connectDB();
    const room = await request.json();

    // Validate required fields
    if (!room.name || !room.capacity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await db.collection('rooms').insertOne({
      ...room,
      isAvailable: true,
      createdAt: new Date()
    });

    return NextResponse.json({ _id: result.insertedId, ...room });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { db } = await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    const room = await request.json();

    // Validate required fields
    if (!room.name || !room.capacity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if room name already exists for other rooms
    const existingRoom = await db.collection('rooms').findOne({
      name: room.name,
      _id: { $ne: new ObjectId(id) }
    });
    
    if (existingRoom) {
      return NextResponse.json(
        { error: 'Room name already exists' },
        { status: 400 }
      );
    }

    // Convert capacity to number
    room.capacity = parseInt(room.capacity);

    const result = await db.collection('rooms').updateOne(
      { _id: new ObjectId(id) },
      { $set: room }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ _id: id, ...room });
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { db } = await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    const result = await db.collection('rooms').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
  }
} 