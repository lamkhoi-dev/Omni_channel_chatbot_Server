const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  let connection;
  
  try {
    // Connect to MySQL without database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL');

    // Drop existing database if exists
    console.log('🗑️  Dropping existing database (if exists)...');
    await connection.query('DROP DATABASE IF EXISTS crm_bic');
    console.log('✅ Old database dropped');

    // Create new database
    console.log('📝 Creating new database...');
    await connection.query('CREATE DATABASE crm_bic');
    console.log('✅ New database created');

    // Read SQL file
    const sqlFile = await fs.readFile(path.join(__dirname, 'database.sql'), 'utf8');
    
    // Execute SQL
    console.log('📝 Executing database schema...');
    await connection.query(sqlFile);
    console.log('✅ Database schema created successfully');

    // Use crm_bic database
    await connection.query(`USE crm_bic`);
    
    // Generate hashed passwords (Tất cả dùng password: 123456)
    const defaultPassword = await bcrypt.hash('123456', 10);
    console.log('🔑 Default password for all accounts: 123456');
    
    // Update admin password
    await connection.query(
      'UPDATE NhanVien SET MatKhau = ? WHERE Username = "admin"',
      [defaultPassword]
    );
    console.log('✅ Admin account updated');
    console.log('   Username: admin');
    console.log('   Password: 123456');
    
    // Create test employee (Nhân viên)
    await connection.query(
      `INSERT INTO NhanVien (ID_Role, TenNhanVien, CCCD, Email, Username, MatKhau, TrangThaiNhanVien) 
       VALUES (1, 'Nguyễn Văn A', '001234567891', 'nhanvien1@bic.vn', 'nhanvien1', ?, 'Hoạt động')`,
      [defaultPassword]
    );
    console.log('✅ Employee account created');
    console.log('   Username: nhanvien1');
    console.log('   Password: 123456');
    
    // Create test manager (Quản lý)
    await connection.query(
      `INSERT INTO NhanVien (ID_Role, TenNhanVien, CCCD, Email, Username, MatKhau, TrangThaiNhanVien) 
       VALUES (2, 'Trần Thị B', '001234567892', 'quanly1@bic.vn', 'quanly1', ?, 'Hoạt động')`,
      [defaultPassword]
    );
    console.log('✅ Manager account created');
    console.log('   Username: quanly1');
    console.log('   Password: 123456');
    console.log('\n   ⚠️  Password mặc định: 123456 (Vui lòng đổi sau khi đăng nhập!)');

    console.log('\n🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
