const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('✅ Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migration-update-khachhang.sql');
    const sql = await fs.readFile(migrationPath, 'utf8');

    console.log('🔄 Running migration...');
    
    // Execute migration
    await connection.query(sql);

    console.log('✅ Migration completed successfully');
    
    // Show table structure
    const [rows] = await connection.query('DESCRIBE KhachHang');
    console.log('\n📋 KhachHang table structure:');
    console.table(rows);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

runMigration();
