const db = require('./config/db');

async function testRevenue() {
  try {
    console.log('Testing revenue query...\n');
    
    // Test 2024
    const year = 2024;
    const [result2024] = await db.query(`
      SELECT 
        MONTH(hd.NgayHieuLuc) as thang,
        YEAR(hd.NgayHieuLuc) as nam,
        SUM(hd.GiaTri) as tongDoanhThu,
        COUNT(DISTINCT hd.ID) as soHopDong
      FROM HopDong hd
      JOIN HoSo hs ON hd.ID_HoSo = hs.ID
      JOIN CoHoi co ON hs.ID_CoHoi = co.ID
      WHERE YEAR(hd.NgayHieuLuc) = ?
      GROUP BY MONTH(hd.NgayHieuLuc), YEAR(hd.NgayHieuLuc)
      ORDER BY thang
    `, [year]);
    
    console.log('Revenue 2024:', JSON.stringify(result2024, null, 2));
    
    // Test 2025
    const year2 = 2025;
    const [result2025] = await db.query(`
      SELECT 
        MONTH(hd.NgayHieuLuc) as thang,
        YEAR(hd.NgayHieuLuc) as nam,
        SUM(hd.GiaTri) as tongDoanhThu,
        COUNT(DISTINCT hd.ID) as soHopDong
      FROM HopDong hd
      JOIN HoSo hs ON hd.ID_HoSo = hs.ID
      JOIN CoHoi co ON hs.ID_CoHoi = co.ID
      WHERE YEAR(hd.NgayHieuLuc) = ?
      GROUP BY MONTH(hd.NgayHieuLuc), YEAR(hd.NgayHieuLuc)
      ORDER BY thang
    `, [year2]);
    
    console.log('\nRevenue 2025:', JSON.stringify(result2025, null, 2));
    
    // Total
    const total = result2024.reduce((sum, r) => sum + parseFloat(r.tongDoanhThu || 0), 0) +
                  result2025.reduce((sum, r) => sum + parseFloat(r.tongDoanhThu || 0), 0);
    console.log('\nTotal revenue all years:', total);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testRevenue();
