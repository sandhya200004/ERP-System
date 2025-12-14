const axios = require('axios');
const bcrypt = require('bcrypt');

async function testLogin() {
  try {
    console.log('Testing login...');
    const response = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'veerajmatnale@triverse.com',
      password: 'admin123'
    });
    console.log('✅ Login successful!');
    console.log('User:', response.data.user);
    console.log('Token:', response.data.accessToken.substring(0, 20) + '...');
  } catch (error) {
    console.log('❌ Login failed!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Also verify password hash
async function checkPasswordHash() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  const user = await prisma.users.findUnique({
    where: { email: 'veerajmatnale@triverse.com' }
  });
  
  if (!user) {
    console.log('❌ User not found in database!');
    return;
  }
  
  console.log('\nUser found in database:');
  console.log('Email:', user.email);
  console.log('Name:', user.first_name, user.last_name);
  console.log('Status:', user.status);
  
  const isMatch = await bcrypt.compare('admin123', user.password_hash);
  console.log('Password hash valid:', isMatch ? '✅' : '❌');
  
  await prisma.$disconnect();
}

async function run() {
  await checkPasswordHash();
  await testLogin();
}

run();
