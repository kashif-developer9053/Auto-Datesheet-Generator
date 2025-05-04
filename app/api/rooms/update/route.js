export async function POST(request) {
  try {
    const { db } = await connectDB();
    
    // Update all existing rooms to set isAvailable to true
    await db.collection('rooms').updateMany(
      {}, // match all rooms
      { $set: { isAvailable: true } }
    );

    return NextResponse.json({ message: 'Rooms updated successfully' });
  } catch (error) {
    console.error('Error updating rooms:', error);
    return NextResponse.json({ error: 'Failed to update rooms' }, { status: 500 });
  }
} 