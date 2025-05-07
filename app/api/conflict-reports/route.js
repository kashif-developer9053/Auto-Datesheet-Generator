import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ConflictReport from '@/models/ConflictReport';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    await connectDB();
    const { datesheetId, title, description, reportedBy } = await request.json();

    // Validate required fields with specific error messages
    const missingFields = [];
    if (!datesheetId) missingFields.push('datesheetId');
    if (!title) missingFields.push('title');
    if (!description) missingFields.push('description');
    if (!reportedBy) missingFields.push('reportedBy');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate that datesheetId is a valid ObjectId string
    if (!ObjectId.isValid(datesheetId)) {
      return NextResponse.json(
        { error: 'Invalid datesheetId' },
        { status: 400 }
      );
    }

    // Validate reportedBy is a non-empty string
    if (typeof reportedBy !== 'string' || reportedBy.trim() === '') {
      return NextResponse.json(
        { error: 'reportedBy must be a non-empty string' },
        { status: 400 }
      );
    }

    const conflictReport = new ConflictReport({
      datesheetId: new ObjectId(datesheetId),
      title,
      description,
      reportedBy, // Store as string (name)
    });

    await conflictReport.save();

    return NextResponse.json({
      success: true,
      message: 'Conflict report submitted successfully',
      data: conflictReport,
    });
  } catch (error) {
    console.error('Error submitting conflict report:', error);
    return NextResponse.json(
      { error: 'Failed to submit conflict report' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const reports = await ConflictReport.aggregate([
      {
        $lookup: {
          from: 'datesheets',
          localField: 'datesheetId',
          foreignField: '_id',
          as: 'datesheet',
        },
      },
      {
        $unwind: {
          path: '$datesheet',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: { $toString: '$_id' },
          datesheetId: { $toString: '$datesheetId' },
          datesheetName: '$datesheet.name',
          title: 1,
          description: 1,
          reportedBy: 1, // Now a string (name)
          createdAt: 1,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    console.log('Fetched conflict reports:', JSON.stringify(reports, null, 2));

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching conflict reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conflict reports' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid or missing report ID' },
        { status: 400 }
      );
    }

    const result = await ConflictReport.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Conflict report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Conflict report deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting conflict report:', error);
    return NextResponse.json(
      { error: 'Failed to delete conflict report' },
      { status: 500 }
    );
  }
}