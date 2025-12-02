const db = require('./config/db');

async function testTopNhanVien() {
  try {
    console.log('Testing Top Nhan Vien query...\n');
    
    // All-time (no month filter)
    const [result] = await db.query(`
      SELECT 
        nv.ID,
        nv.TenNhanVien,
        nv.Email,
        COUNT(DISTINCT kh.ID) as SoKhachHang,
        COUNT(DISTINCT co.ID) as SoCoHoi,
        COUNT(DISTINCT CASE WHEN co.TrangThaiCoHoi = 'Thành công' THEN co.ID END) as SoCoHoiThanhCong,
        COALESCE(SUM(hd.GiaTri), 0) as TongDoanhThu,
        COUNT(DISTINCT hd.ID) as SoHopDong
      FROM NhanVien nv
      LEFT JOIN KhachHang kh ON nv.ID = kh.ID_NhanVien
      LEFT JOIN CoHoi co ON nv.ID = co.ID_NhanVien
      LEFT JOIN HoSo hs ON co.ID = hs.ID_CoHoi
      LEFT JOIN HopDong hd ON hs.ID = hd.ID_HoSo
      WHERE nv.ID_Role = 1
      GROUP BY nv.ID, nv.TenNhanVien, nv.Email
      ORDER BY TongDoanhThu DESC, SoHopDong DESC
      LIMIT 10
    `);
    
    console.log('Top Nhan Vien (All-time):');
    console.log(JSON.stringify(result, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testTopNhanVien();
