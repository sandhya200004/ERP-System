// Quick test to decode a JWT token
const jwt = require('jsonwebtoken');

// Get token from command line
const token = process.argv[2];

if (!token) {
  console.log('Usage: node test-jwt.js <YOUR_JWT_TOKEN>');
  console.log('Copy your JWT token from browser localStorage or network tab');
  process.exit(1);
}

try {
  const decoded = jwt.decode(token);
  console.log('Decoded JWT payload:');
  console.log(JSON.stringify(decoded, null, 2));
  
  console.log('\n=== Checking required fields ===');
  console.log('company_id:', decoded.company_id);
  console.log('sub (user id):', decoded.sub);
  console.log('iat (issued at):', new Date(decoded.iat * 1000).toISOString());
  console.log('exp (expires at):', new Date(decoded.exp * 1000).toISOString());
  
  const now = Date.now() / 1000;
  if (decoded.exp < now) {
    console.log('\n⚠️  TOKEN EXPIRED - You need to log in again!');
  } else {
    console.log('\n✅ Token is valid');
  }
} catch (error) {
  console.error('Error decoding token:', error.message);
}
