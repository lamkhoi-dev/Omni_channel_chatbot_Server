const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

/**
 * =====================================================
 * SETUP HOÀN CHỈNH DATABASE CRM BIC HÀ NỘI
 * =====================================================
 * File: setup-complete-database.js
 * Chức năng: Tạo database, schema, migration, seed data
 * Chạy 1 lần duy nhất để khởi tạo toàn bộ hệ thống
 * =====================================================
 */

async function setupCompleteDatabase() {
  let connection;
  
  try {
    console.log('\n┌─────────────────────────────────────────────────┐');
    console.log('│  SETUP HOÀN CHỈNH DATABASE CRM BIC HÀ NỘI      │');
    console.log('└─────────────────────────────────────────────────┘\n');

    // =====================================================
    // BƯỚC 1: KẾT NỐI MYSQL
    // =====================================================
    console.log('📡 [1/6] Kết nối MySQL Server...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });
    console.log('✅ Kết nối thành công!\n');

    // =====================================================
    // BƯỚC 2: XÓA VÀ TẠO LẠI DATABASE
    // =====================================================
    console.log('🗑️  [2/6] Xóa database cũ (nếu có)...');
    await connection.query('DROP DATABASE IF EXISTS crm_bic');
    console.log('✅ Đã xóa database cũ\n');

    console.log('📝 [3/6] Tạo database mới...');
    await connection.query('CREATE DATABASE crm_bic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await connection.query('USE crm_bic');
    console.log('✅ Database "crm_bic" đã được tạo\n');

    // =====================================================
    // BƯỚC 3: TẠO CẤU TRÚC BẢNG (SCHEMA)
    // =====================================================
    console.log('🏗️  [4/6] Tạo cấu trúc bảng...');

    // 1. Bảng Role
    await connection.query(`
      CREATE TABLE Role (
        ID INT PRIMARY KEY AUTO_INCREMENT,
        TenRole VARCHAR(50) NOT NULL,
        Mota TEXT
      )
    `);
    await connection.query(`
      INSERT INTO Role (TenRole, Mota) VALUES 
      ('Nhân viên', 'Nhân viên kinh doanh'),
      ('Quản lý', 'Quản lý chi nhánh'),
      ('Ban giám đốc', 'Ban giám đốc')
    `);

    // 2. Bảng NhanVien
    await connection.query(`
      CREATE TABLE NhanVien (
        ID INT PRIMARY KEY AUTO_INCREMENT,
        ID_Role INT NOT NULL DEFAULT 1,
        TenNhanVien VARCHAR(100) NOT NULL,
        CCCD VARCHAR(20),
        DiemThuong INT DEFAULT 0,
        Email VARCHAR(100),
        Username VARCHAR(50) NOT NULL UNIQUE,
        MatKhau VARCHAR(255) NOT NULL,
        TrangThaiNhanVien ENUM('Hoạt động', 'Khóa') DEFAULT 'Hoạt động',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (ID_Role) REFERENCES Role(ID) ON DELETE RESTRICT,
        INDEX idx_role (ID_Role),
        INDEX idx_username (Username),
        INDEX idx_status (TrangThaiNhanVien)
      )
    `);

    // 3. Bảng KhachHang (CÓ CÁC TRƯỜNG MỚI)
    await connection.query(`
      CREATE TABLE KhachHang (
        ID INT PRIMARY KEY AUTO_INCREMENT,
        ID_NhanVien INT NOT NULL,
        TenKhachHang VARCHAR(100),
        CCCD VARCHAR(20),
        NgaySinh DATE,
        TenDoanhNghiep VARCHAR(200),
        MaSoThue VARCHAR(20),
        NgayThanhLap DATE,
        LoaiKhachHang ENUM('Cá nhân', 'Doanh nghiệp') NOT NULL,
        NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
        SoDienThoai VARCHAR(15),
        Email VARCHAR(100),
        DiaChi TEXT,
        TrangThaiKhachHang ENUM('Tiềm năng', 'Đang chăm sóc', 'Thành công', 'Rời bỏ', 'Không tiềm năng') DEFAULT 'Tiềm năng',
        GhiChu TEXT,
        FOREIGN KEY (ID_NhanVien) REFERENCES NhanVien(ID) ON DELETE CASCADE,
        INDEX idx_nhanvien (ID_NhanVien),
        INDEX idx_status (TrangThaiKhachHang),
        INDEX idx_loai (LoaiKhachHang),
        INDEX idx_cccd (CCCD),
        INDEX idx_mst (MaSoThue)
      )
    `);

    // 4. Bảng CoHoi
    await connection.query(`
      CREATE TABLE CoHoi (
        ID INT PRIMARY KEY AUTO_INCREMENT,
        ID_KhachHang INT NOT NULL,
        ID_NhanVien INT NOT NULL,
        TenCoHoi VARCHAR(200) NOT NULL,
        TrangThaiCoHoi ENUM('Mới', 'Chờ xử lý', 'Thành công', 'Thất bại') DEFAULT 'Mới',
        GiaTri DECIMAL(15,2) DEFAULT 0,
        NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
        GhiChu TEXT,
        FOREIGN KEY (ID_KhachHang) REFERENCES KhachHang(ID) ON DELETE CASCADE,
        FOREIGN KEY (ID_NhanVien) REFERENCES NhanVien(ID) ON DELETE CASCADE,
        INDEX idx_khachhang (ID_KhachHang),
        INDEX idx_nhanvien (ID_NhanVien),
        INDEX idx_status (TrangThaiCoHoi),
        INDEX idx_composite (TrangThaiCoHoi, NgayTao)
      )
    `);

    // 5. Bảng LichHen
    await connection.query(`
      CREATE TABLE LichHen (
        ID INT PRIMARY KEY AUTO_INCREMENT,
        ID_CoHoi INT NOT NULL,
        ThoiGianHen DATETIME NOT NULL,
        DiaDiem VARCHAR(255),
        NoiDung TEXT,
        KetQuaSauCuocHen TEXT,
        TrangThaiLichHen ENUM('Sắp diễn ra', 'Hoàn thành', 'Hủy', 'Quá hạn') DEFAULT 'Sắp diễn ra',
        FOREIGN KEY (ID_CoHoi) REFERENCES CoHoi(ID) ON DELETE CASCADE,
        INDEX idx_cohoi (ID_CoHoi),
        INDEX idx_thoigian (ThoiGianHen),
        INDEX idx_status (TrangThaiLichHen)
      )
    `);

    // 6. Bảng HoSo
    await connection.query(`
      CREATE TABLE HoSo (
        ID INT PRIMARY KEY AUTO_INCREMENT,
        ID_CoHoi INT NOT NULL,
        TenHoSo VARCHAR(200) NOT NULL,
        FileHoSo VARCHAR(500),
        TrangThaiHoSo ENUM('Chờ duyệt', 'Đã duyệt', 'Bổ sung') DEFAULT 'Chờ duyệt',
        NgayUpload DATETIME DEFAULT CURRENT_TIMESTAMP,
        NgayDuyet DATETIME,
        GhiChu TEXT,
        FOREIGN KEY (ID_CoHoi) REFERENCES CoHoi(ID) ON DELETE CASCADE,
        INDEX idx_cohoi (ID_CoHoi),
        INDEX idx_status (TrangThaiHoSo)
      )
    `);

    // 7. Bảng HopDong
    await connection.query(`
      CREATE TABLE HopDong (
        ID INT PRIMARY KEY AUTO_INCREMENT,
        ID_HoSo INT NOT NULL,
        MaHopDong VARCHAR(50) NOT NULL UNIQUE,
        NgayHieuLuc DATE NOT NULL,
        NgayHetHan DATE NOT NULL,
        GiaTri DECIMAL(15,2) NOT NULL,
        FileHopDong VARCHAR(500),
        FOREIGN KEY (ID_HoSo) REFERENCES HoSo(ID) ON DELETE CASCADE,
        INDEX idx_hoso (ID_HoSo),
        INDEX idx_expiry (NgayHetHan)
      )
    `);

    // 8. Bảng ThongBao
    await connection.query(`
      CREATE TABLE ThongBao (
        ID INT PRIMARY KEY AUTO_INCREMENT,
        ID_NhanVien INT NOT NULL,
        LoaiThongBao ENUM('Tái tục', 'Hồ sơ duyệt', 'Lịch hẹn', 'Khác') NOT NULL,
        NoiDung TEXT NOT NULL,
        TrangThai ENUM('Chưa đọc', 'Đã đọc') DEFAULT 'Chưa đọc',
        NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ID_NhanVien) REFERENCES NhanVien(ID) ON DELETE CASCADE,
        INDEX idx_nhanvien (ID_NhanVien),
        INDEX idx_status (TrangThai),
        INDEX idx_created (NgayTao)
      )
    `);

    console.log('✅ Đã tạo 8 bảng chính\n');

    // =====================================================
    // BƯỚC 4: THÊM DỮ LIỆU MẪU (SEED DATA)
    // =====================================================
    console.log('🌱 [5/6] Thêm dữ liệu mẫu...');

    // Generate hashed password (123456)
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Nhân viên (5 người)
    await connection.query(`
      INSERT INTO NhanVien (ID_Role, TenNhanVien, CCCD, Email, Username, MatKhau, DiemThuong, TrangThaiNhanVien) VALUES
      (3, 'Nguyễn Văn An', '001099123456', 'nguyenvanan@bic.vn', 'admin', ?, 150, 'Hoạt động'),
      (2, 'Trần Thị Bình', '001099234567', 'tranthibinh@bic.vn', 'manager1', ?, 100, 'Hoạt động'),
      (1, 'Lê Minh Cường', '001099345678', 'leminhcuong@bic.vn', 'nhanvien1', ?, 80, 'Hoạt động'),
      (1, 'Phạm Thu Dung', '001099456789', 'phamthudung@bic.vn', 'nhanvien2', ?, 65, 'Hoạt động'),
      (1, 'Hoàng Văn Em', '001099567890', 'hoangvanem@bic.vn', 'nhanvien3', ?, 45, 'Hoạt động')
    `, [hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword]);

    // Khách hàng (8 khách - CÓ DỮ LIỆU MỚI)
    await connection.query(`
      INSERT INTO KhachHang (ID_NhanVien, TenKhachHang, CCCD, NgaySinh, TenDoanhNghiep, MaSoThue, NgayThanhLap, LoaiKhachHang, SoDienThoai, Email, DiaChi, TrangThaiKhachHang, NgayTao, GhiChu) VALUES
      (3, 'Nguyễn Thị Lan', '001088234567', '1985-03-15', NULL, NULL, NULL, 'Cá nhân', '0901234567', 'nguyenlan@gmail.com', '123 Láng Hạ, Đống Đa, Hà Nội', 'Thành công', '2024-09-15 09:30:00', 'KH đã mua bảo hiểm nhân thọ 20 năm'),
      (3, 'Trần Văn Hùng', '001088345678', '1990-07-20', NULL, NULL, NULL, 'Cá nhân', '0912345678', 'tranhung@gmail.com', '456 Giải Phóng, Hai Bà Trưng, Hà Nội', 'Đang chăm sóc', '2024-10-20 14:15:00', 'Quan tâm bảo hiểm ô tô'),
      (3, NULL, NULL, NULL, 'Công ty TNHH ABC', '0123456789', '2015-05-10', 'Doanh nghiệp', '0243567890', 'info@abc.com.vn', '789 Trần Duy Hưng, Cầu Giấy, Hà Nội', 'Tiềm năng', '2024-11-10 10:00:00', 'Doanh nghiệp 50 nhân viên, cần bảo hiểm sức khỏe tập thể'),
      (4, 'Lê Thị Mai', '001088456789', '1988-11-05', NULL, NULL, NULL, 'Cá nhân', '0923456789', 'lemai@yahoo.com', '321 Nguyễn Trãi, Thanh Xuân, Hà Nội', 'Thành công', '2024-08-05 11:20:00', 'Mua bảo hiểm ung thư'),
      (4, 'Phạm Đức Thắng', '001088567890', '1982-02-14', NULL, NULL, NULL, 'Cá nhân', '0934567890', 'phamthang@outlook.com', '654 Tây Sơn, Đống Đa, Hà Nội', 'Rời bỏ', '2024-07-12 16:45:00', 'Hợp đồng cũ đã hết hạn, không tái tục'),
      (4, NULL, NULL, NULL, 'Siêu thị XYZ', '0987654321', '2010-08-20', 'Doanh nghiệp', '0243999888', 'contact@xyz.vn', '147 Phạm Hùng, Nam Từ Liêm, Hà Nội', 'Đang chăm sóc', '2024-11-01 08:30:00', 'Cần bảo hiểm tài sản và trách nhiệm doanh nghiệp'),
      (5, 'Vũ Minh Tuấn', '001088678901', '1995-06-30', NULL, NULL, NULL, 'Cá nhân', '0945678901', 'vutuan@gmail.com', '258 Kim Mã, Ba Đình, Hà Nội', 'Tiềm năng', '2024-11-15 13:00:00', 'Mới tiếp cận, chưa quyết định'),
      (5, 'Đỗ Thị Hương', '001088789012', '1992-09-12', NULL, NULL, NULL, 'Cá nhân', '0956789012', 'dohuong@hotmail.com', '369 Hoàng Quốc Việt, Cầu Giấy, Hà Nội', 'Không tiềm năng', '2024-06-20 10:10:00', 'Đã hẹn 2 lần không đến, không liên lạc được')
    `);

    // Cơ hội (8 cơ hội)
    await connection.query(`
      INSERT INTO CoHoi (ID_KhachHang, ID_NhanVien, TenCoHoi, TrangThaiCoHoi, GiaTri, NgayTao, GhiChu) VALUES
      (1, 3, 'Bảo hiểm nhân thọ 20 năm - Nguyễn Thị Lan', 'Thành công', 50000000, '2024-09-15 10:00:00', 'Đã ký hợp đồng thành công'),
      (2, 3, 'Bảo hiểm ô tô Vios - Trần Văn Hùng', 'Chờ xử lý', 8500000, '2024-10-25 15:30:00', 'Đang chờ bổ sung hồ sơ đăng kiểm xe'),
      (3, 3, 'Bảo hiểm sức khỏe tập thể 50 người - Công ty ABC', 'Mới', 120000000, '2024-11-12 11:00:00', 'Cần hẹn gặp giám đốc công ty'),
      (4, 4, 'Bảo hiểm ung thư - Lê Thị Mai', 'Thành công', 30000000, '2024-08-10 09:00:00', 'Hợp đồng 15 năm'),
      (5, 4, 'Tái tục bảo hiểm sức khỏe - Phạm Đức Thắng', 'Thất bại', 15000000, '2024-10-01 14:00:00', 'Khách không quan tâm tái tục'),
      (6, 4, 'Bảo hiểm tài sản + TNDN - Siêu thị XYZ', 'Chờ xử lý', 85000000, '2024-11-05 10:30:00', 'Đang thẩm định giá trị tài sản'),
      (7, 5, 'Bảo hiểm du lịch - Vũ Minh Tuấn', 'Mới', 2000000, '2024-11-16 14:00:00', 'Khách cần đi công tác nước ngoài tháng 12'),
      (8, 5, 'Bảo hiểm sức khỏe - Đỗ Thị Hương', 'Thất bại', 12000000, '2024-07-01 11:00:00', 'Không liên lạc được sau lần hẹn đầu tiên')
    `);

    // Lịch hẹn (12 cuộc hẹn)
    await connection.query(`
      INSERT INTO LichHen (ID_CoHoi, ThoiGianHen, DiaDiem, NoiDung, KetQuaSauCuocHen, TrangThaiLichHen) VALUES
      (1, '2024-09-18 14:00:00', 'Văn phòng BIC Láng Hạ', 'Tư vấn sản phẩm bảo hiểm nhân thọ', 'KH đồng ý mua, đã ký hợp đồng', 'Hoàn thành'),
      (1, '2024-09-22 10:00:00', 'Văn phòng BIC Láng Hạ', 'Nộp hồ sơ và ký hợp đồng chính thức', 'Hoàn tất thủ tục, hợp đồng có hiệu lực', 'Hoàn thành'),
      (2, '2024-10-28 16:00:00', 'Quán cafe The Coffee House Giải Phóng', 'Tư vấn gói bảo hiểm ô tô', 'KH đồng ý, cần bổ sung giấy tờ xe', 'Hoàn thành'),
      (2, '2024-12-02 09:00:00', 'Văn phòng BIC Hai Bà Trưng', 'Nộp hồ sơ và hoàn tất thủ tục', NULL, 'Sắp diễn ra'),
      (3, '2024-12-05 14:00:00', 'Công ty TNHH ABC - Trần Duy Hưng', 'Gặp giám đốc để trình bày gói bảo hiểm tập thể', NULL, 'Sắp diễn ra'),
      (4, '2024-08-12 10:30:00', 'Nhà hàng Ngọc Mai - Nguyễn Trãi', 'Tư vấn bảo hiểm ung thư', 'KH rất quan tâm, hẹn gặp lại để ký', 'Hoàn thành'),
      (4, '2024-08-18 15:00:00', 'Văn phòng BIC Thanh Xuân', 'Ký hợp đồng bảo hiểm', 'Đã ký thành công', 'Hoàn thành'),
      (5, '2024-10-05 14:00:00', 'SĐT - Gọi điện thoại', 'Nhắc nhở tái tục hợp đồng', 'KH nói bận, hẹn gọi lại', 'Hoàn thành'),
      (5, '2024-10-15 10:00:00', 'SĐT - Gọi điện thoại', 'Gọi lại lần 2', 'KH không nghe máy', 'Hủy'),
      (6, '2024-11-08 09:30:00', 'Siêu thị XYZ - Phạm Hùng', 'Khảo sát tài sản cần bảo hiểm', 'Đã khảo sát, đang lập báo giá', 'Hoàn thành'),
      (6, '2024-12-03 14:00:00', 'Siêu thị XYZ - Phòng họp', 'Trình bày phương án bảo hiểm', NULL, 'Sắp diễn ra'),
      (7, '2024-11-20 13:00:00', 'Quán cafe Highlands Kim Mã', 'Tư vấn bảo hiểm du lịch', 'KH cần thời gian suy nghĩ', 'Hoàn thành')
    `);

    // Hồ sơ (4 hồ sơ)
    await connection.query(`
      INSERT INTO HoSo (ID_CoHoi, TenHoSo, FileHoSo, TrangThaiHoSo, NgayUpload, NgayDuyet, GhiChu) VALUES
      (1, 'Hồ sơ bảo hiểm nhân thọ - Nguyễn Thị Lan', '1726988400000-hoso-nguyen-thi-lan.pdf', 'Đã duyệt', '2024-09-20 11:00:00', '2024-09-21 09:30:00', 'Hồ sơ đầy đủ, đã duyệt'),
      (4, 'Hồ sơ bảo hiểm ung thư - Lê Thị Mai', '1723442400000-hoso-le-thi-mai.pdf', 'Đã duyệt', '2024-08-14 14:30:00', '2024-08-15 10:00:00', 'Đã kiểm tra sức khỏe, đạt'),
      (2, 'Hồ sơ bảo hiểm ô tô - Trần Văn Hùng', '1730098800000-hoso-tran-van-hung.pdf', 'Chờ duyệt', '2024-11-01 16:00:00', NULL, 'Đã upload, chờ quản lý duyệt'),
      (6, 'Hồ sơ bảo hiểm DN - Siêu thị XYZ', '1731045600000-hoso-sieu-thi-xyz.pdf', 'Bổ sung', '2024-11-10 10:00:00', NULL, 'Thiếu giấy phép kinh doanh, cần bổ sung')
    `);

    // Hợp đồng (2 hợp đồng)
    await connection.query(`
      INSERT INTO HopDong (ID_HoSo, MaHopDong, NgayHieuLuc, NgayHetHan, GiaTri, FileHopDong) VALUES
      (1, 'BIC-HN-2024-001', '2024-09-25', '2044-09-24', 50000000, '1727265600000-hopdong-BIC-HN-2024-001.pdf'),
      (2, 'BIC-HN-2024-002', '2024-08-20', '2025-02-19', 30000000, '1724140800000-hopdong-BIC-HN-2024-002.pdf')
    `);

    // Thông báo (6 thông báo)
    await connection.query(`
      INSERT INTO ThongBao (ID_NhanVien, LoaiThongBao, NoiDung, TrangThai, NgayTao) VALUES
      (3, 'Lịch hẹn', 'Bạn có lịch hẹn với Công ty ABC vào 14:00 ngày 05/12/2024', 'Chưa đọc', '2024-12-01 08:00:00'),
      (3, 'Lịch hẹn', 'Bạn có lịch hẹn với Trần Văn Hùng vào 09:00 ngày 02/12/2024', 'Chưa đọc', '2024-12-01 08:00:00'),
      (4, 'Tái tục', 'Hợp đồng BIC-HN-2024-002 của KH Lê Thị Mai sẽ hết hạn vào 19/02/2025', 'Đã đọc', '2024-11-20 06:00:00'),
      (4, 'Hồ sơ duyệt', 'Hồ sơ bảo hiểm DN - Siêu thị XYZ cần bổ sung giấy tờ', 'Chưa đọc', '2024-11-12 14:30:00'),
      (4, 'Lịch hẹn', 'Bạn có lịch hẹn với Siêu thị XYZ vào 14:00 ngày 03/12/2024', 'Chưa đọc', '2024-12-01 08:00:00'),
      (2, 'Hồ sơ duyệt', 'Có 2 hồ sơ đang chờ duyệt', 'Chưa đọc', '2024-12-01 09:00:00')
    `);

    console.log('✅ Đã thêm dữ liệu mẫu thành công\n');

    // =====================================================
    // BƯỚC 5: THỐNG KÊ DỮ LIỆU
    // =====================================================
    console.log('📊 [6/6] Thống kê dữ liệu...');
    
    const [nhanvien] = await connection.query('SELECT COUNT(*) as count FROM NhanVien');
    const [khachhang] = await connection.query('SELECT COUNT(*) as count FROM KhachHang');
    const [cohoi] = await connection.query('SELECT COUNT(*) as count FROM CoHoi');
    const [lichhen] = await connection.query('SELECT COUNT(*) as count FROM LichHen');
    const [hoso] = await connection.query('SELECT COUNT(*) as count FROM HoSo');
    const [hopdong] = await connection.query('SELECT COUNT(*) as count FROM HopDong');
    const [thongbao] = await connection.query('SELECT COUNT(*) as count FROM ThongBao');

    console.log('\n┌─────────────────────────────────────────────────┐');
    console.log('│           THỐNG KÊ DỮ LIỆU                      │');
    console.log('├─────────────────────────────────────────────────┤');
    console.log(`│  👤 Nhân viên:        ${String(nhanvien[0].count).padStart(3)} người                  │`);
    console.log(`│  👥 Khách hàng:       ${String(khachhang[0].count).padStart(3)} khách                  │`);
    console.log(`│  💼 Cơ hội:           ${String(cohoi[0].count).padStart(3)} cơ hội                 │`);
    console.log(`│  📅 Lịch hẹn:         ${String(lichhen[0].count).padStart(3)} cuộc hẹn               │`);
    console.log(`│  📄 Hồ sơ:            ${String(hoso[0].count).padStart(3)} hồ sơ                  │`);
    console.log(`│  📋 Hợp đồng:         ${String(hopdong[0].count).padStart(3)} hợp đồng               │`);
    console.log(`│  🔔 Thông báo:        ${String(thongbao[0].count).padStart(3)} thông báo              │`);
    console.log('└─────────────────────────────────────────────────┘\n');

    // =====================================================
    // BƯỚC 6: THÔNG TIN TÀI KHOẢN
    // =====================================================
    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│         TÀI KHOẢN ĐĂNG NHẬP TEST                │');
    console.log('├─────────────────────────────────────────────────┤');
    console.log('│  👑 admin      | 123456 | Ban giám đốc         │');
    console.log('│  👔 manager1   | 123456 | Quản lý              │');
    console.log('│  👨 nhanvien1  | 123456 | Nhân viên (Cường)    │');
    console.log('│  👩 nhanvien2  | 123456 | Nhân viên (Dung)     │');
    console.log('│  👦 nhanvien3  | 123456 | Nhân viên (Em)       │');
    console.log('└─────────────────────────────────────────────────┘\n');

    console.log('┌─────────────────────────────────────────────────┐');
    console.log('│  🎉 SETUP HOÀN CHỈNH THÀNH CÔNG!               │');
    console.log('└─────────────────────────────────────────────────┘\n');

    console.log('📌 Lưu ý:');
    console.log('   - Database: crm_bic');
    console.log('   - Charset: utf8mb4');
    console.log('   - Đã có đầy đủ: Schema + Migration + Seed Data');
    console.log('   - Bảng KhachHang đã có các trường mới: CCCD, NgaySinh, MaSoThue, NgayThanhLap');
    console.log('   - Mật khẩu mặc định: 123456 (Vui lòng đổi sau khi đăng nhập!)');
    console.log('\n🚀 Bạn có thể chạy backend ngay bây giờ: npm start\n');

  } catch (error) {
    console.error('\n❌ LỖI SETUP DATABASE:', error.message);
    console.error('   Chi tiết:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Đã đóng kết nối database\n');
    }
  }
}

// Chạy setup
setupCompleteDatabase();
