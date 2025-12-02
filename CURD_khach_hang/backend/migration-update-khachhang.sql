-- Migration: Thêm các trường mới cho bảng KhachHang
-- Ngày: 2025-12-01

-- Thêm các trường cho Cá nhân
ALTER TABLE KhachHang 
ADD COLUMN CCCD VARCHAR(20) AFTER TenKhachHang,
ADD COLUMN NgaySinh DATE AFTER CCCD;

-- Thêm các trường cho Doanh nghiệp  
ALTER TABLE KhachHang
ADD COLUMN MaSoThue VARCHAR(20) AFTER TenDoanhNghiep,
ADD COLUMN NgayThanhLap DATE AFTER MaSoThue;

-- Tạo index cho các trường mới
CREATE INDEX idx_cccd ON KhachHang(CCCD);
CREATE INDEX idx_mst ON KhachHang(MaSoThue);

-- Kiểm tra cấu trúc bảng sau migration
DESCRIBE KhachHang;
