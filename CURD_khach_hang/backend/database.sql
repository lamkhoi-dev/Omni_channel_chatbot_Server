-- CRM BIC Hà Nội - Database Schema
-- Tạo database
CREATE DATABASE IF NOT EXISTS crm_bic CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crm_bic;

-- 1. Role
CREATE TABLE Role (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    TenRole VARCHAR(50) NOT NULL,
    Mota TEXT
);

INSERT INTO Role (TenRole, Mota) VALUES 
('Nhân viên', 'Nhân viên kinh doanh'),
('Quản lý', 'Quản lý chi nhánh'),
('Ban giám đốc', 'Ban giám đốc');

-- 2. NhanVien
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
);

-- Insert default admin account (password: admin123)
INSERT INTO NhanVien (ID_Role, TenNhanVien, Email, Username, MatKhau) VALUES
(3, 'Admin', 'admin@bic.vn', 'admin', '$2a$10$zQZ9J5qKZ5qKZ5qKZ5qKZOqKZ5qKZ5qKZ5qKZ5qKZ5qKZ5qKZ5qK.');
-- Note: Hash này là placeholder, sẽ được generate lại khi chạy ứng dụng

-- 3. KhachHang
CREATE TABLE KhachHang (
    ID INT PRIMARY KEY AUTO_INCREMENT,
    ID_NhanVien INT NOT NULL,
    TenKhachHang VARCHAR(100),
    TenDoanhNghiep VARCHAR(200),
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
    INDEX idx_loai (LoaiKhachHang)
);

-- 4. CoHoi
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
);

-- 5. LichHen
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
);

-- 6. HoSo
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
);

-- 7. HopDong
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
);

-- 8. ThongBao
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
);
