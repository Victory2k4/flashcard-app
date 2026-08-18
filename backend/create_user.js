const bcrypt = require('bcryptjs');
const db = require('./db/setup');

async function createTestUser() {
  const email = 'test@example.com';
  const password = 'password123';
  const fullName = 'Test User';
  
  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      console.log('Test user already exists.');
      return;
    }
    const password_hash = await bcrypt.hash(password, 10);
    db.prepare('INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)').run(email, password_hash, fullName);
    console.log('Test user created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (err) {
    console.error(err);
  }
}

createTestUser();
