const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    // Try to connect to the database
    await prisma.$connect();
    console.log('✅ Successfully connected to the database!');
    
    // Try a simple query
    const users = await prisma.user.findMany();
    console.log('📊 Current users in database:', users);
    
  } catch (error) {
    console.error('❌ Error connecting to the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection(); 