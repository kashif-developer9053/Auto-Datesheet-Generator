import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  try {
    console.log('Attempting to connect to database...');
    await connectDB();
    console.log('Database connection successful');

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    // Query users based on role
    const query = role ? { role } : {};
    const users = await User.find(query).select('-password');

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    console.log('Starting user creation process...');
    const { db } = await connectDB();
    const body = await request.json();
    console.log('Received user data:', { ...body, password: '***' });

    // Validate required fields
    if (!body.name || !body.email || !body.password || !body.role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate department for faculty and students
    if ((body.role === 'faculty' || body.role === 'student') && !body.department) {
      return NextResponse.json(
        { error: 'Department is required for faculty and students' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Convert department to ObjectId if it exists
    if (body.department) {
      body.department = new ObjectId(body.department);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);
    console.log('Password hashed successfully');
    
    // Create user
    const result = await db.collection('users').insertOne({
      ...body,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = body;
    
    return NextResponse.json({ _id: result.insertedId, ...userWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/users:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create user',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 