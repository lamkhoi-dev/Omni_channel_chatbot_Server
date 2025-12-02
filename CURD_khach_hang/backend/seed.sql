-- =============================================
-- SEED DATA FOR CRM BIC HANOI - TEST VERSION
-- =============================================
-- File: seed.sql
-- Purpose: Dữ liệu test nhẹ cho hệ thống CRM
-- Date: November 27, 2025
-- =============================================

USE crm_bic;

-- Xóa dữ liệu cũ (giữ lại Role)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE ThongBao;
TRUNCATE TABLE HopDong;
TRUNCATE TABLE HoSo;
TRUNCATE TABLE LichHen;
TRUNCATE TABLE CoHoi;
TRUNCATE TABLE KhachHang;
TRUNCATE TABLE NhanVien;
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- 1. NHÂN VIÊN (5 người)
-- =============================================
-- Password mặc định cho tất cả: "123456"
-- Hash: $2a$10$yFoYdBEOa/FWHMJKgyuWquFUxvWAltp68mwy4NoV7JUBkZ3bMxCem

INSERT INTO NhanVien (ID_Role, TenNhanVien, CCCD, Email, Username, MatKhau, DiemThuong, TrangThaiNhanVien) VALUES
-- Ban giám đốc
(3, 'Nguyễn Văn An', '001099123456', 'nguyenvanan@bic.vn', 'admin', '$2a$10$yFoYdBEOa/FWHMJKgyuWquFUxvWAltp68mwy4NoV7JUBkZ3bMxCem', 150, 'Hoạt động'),

-- Quản lý
(2, 'Trần Thị Bình', '001099234567', 'tranthibinh@bic.vn', 'manager1', '$2a$10$yFoYdBEOa/FWHMJKgyuWquFUxvWAltp68mwy4NoV7JUBkZ3bMxCem', 100, 'Hoạt động'),

-- Nhân viên kinh doanh
(1, 'Lê Minh Cường', '001099345678', 'leminhcuong@bic.vn', 'nhanvien1', '$2a$10$yFoYdBEOa/FWHMJKgyuWquFUxvWAltp68mwy4NoV7JUBkZ3bMxCem', 80, 'Hoạt động'),
(1, 'Phạm Thu Dung', '001099456789', 'phamthudung@bic.vn', 'nhanvien2', '$2a$10$yFoYdBEOa/FWHMJKgyuWquFUxvWAltp68mwy4NoV7JUBkZ3bMxCem', 65, 'Hoạt động'),
(1, 'Hoàng Văn Em', '001099567890', 'hoangvanem@bic.vn', 'nhanvien3', '$2a$10$yFoYdBEOa/FWHMJKgyuWquFUxvWAltp68mwy4NoV7JUBkZ3bMxCem', 45, 'Hoạt động');

-- =============================================
-- 2. KHÁCH HÀNG (8 khách)
-- =============================================

INSERT INTO KhachHang (ID_NhanVien, TenKhachHang, TenDoanhNghiep, LoaiKhachHang, SoDienThoai, Email, DiaChi, TrangThaiKhachHang, NgayTao, GhiChu) VALUES
-- Khách hàng của Lê Minh Cường (ID=3)
(3, 'Nguyễn Thị Lan', NULL, 'Cá nhân', '0901234567', 'nguyenlan@gmail.com', '123 Láng Hạ, Đống Đa, Hà Nội', 'Thành công', '2024-09-15 09:30:00', 'KH đã mua bảo hiểm nhân thọ 20 năm'),
(3, 'Trần Văn Hùng', NULL, 'Cá nhân', '0912345678', 'tranhung@gmail.com', '456 Giải Phóng, Hai Bà Trưng, Hà Nội', 'Đang chăm sóc', '2024-10-20 14:15:00', 'Quan tâm bảo hiểm ô tô'),
(3, NULL, 'Công ty TNHH ABC', 'Doanh nghiệp', '0243567890', 'info@abc.com.vn', '789 Trần Duy Hưng, Cầu Giấy, Hà Nội', 'Tiềm năng', '2024-11-10 10:00:00', 'Doanh nghiệp 50 nhân viên, cần bảo hiểm sức khỏe tập thể'),

-- Khách hàng của Phạm Thu Dung (ID=4)
(4, 'Lê Thị Mai', NULL, 'Cá nhân', '0923456789', 'lemai@yahoo.com', '321 Nguyễn Trãi, Thanh Xuân, Hà Nội', 'Thành công', '2024-08-05 11:20:00', 'Mua bảo hiểm ung thư'),
(4, 'Phạm Đức Thắng', NULL, 'Cá nhân', '0934567890', 'phamthang@outlook.com', '654 Tây Sơn, Đống Đa, Hà Nội', 'Rời bỏ', '2024-07-12 16:45:00', 'Hợp đồng cũ đã hết hạn, không tái tục'),
(4, NULL, 'Siêu thị XYZ', 'Doanh nghiệp', '0243999888', 'contact@xyz.vn', '147 Phạm Hùng, Nam Từ Liêm, Hà Nội', 'Đang chăm sóc', '2024-11-01 08:30:00', 'Cần bảo hiểm tài sản và trách nhiệm doanh nghiệp'),

-- Khách hàng của Hoàng Văn Em (ID=5)
(5, 'Vũ Minh Tuấn', NULL, 'Cá nhân', '0945678901', 'vutuan@gmail.com', '258 Kim Mã, Ba Đình, Hà Nội', 'Tiềm năng', '2024-11-15 13:00:00', 'Mới tiếp cận, chưa quyết định'),
(5, 'Đỗ Thị Hương', NULL, 'Cá nhân', '0956789012', 'dohuong@hotmail.com', '369 Hoàng Quốc Việt, Cầu Giấy, Hà Nội', 'Không tiềm năng', '2024-06-20 10:10:00', 'Đã hẹn 2 lần không đến, không liên lạc được');

-- =============================================
-- 3. CƠ HỘI (10 cơ hội)
-- =============================================

INSERT INTO CoHoi (ID_KhachHang, ID_NhanVien, TenCoHoi, TrangThaiCoHoi, GiaTri, NgayTao, GhiChu) VALUES
-- Cơ hội của Lê Minh Cường
(1, 3, 'Bảo hiểm nhân thọ 20 năm - Nguyễn Thị Lan', 'Thành công', 50000000, '2024-09-15 10:00:00', 'Đã ký hợp đồng thành công'),
(2, 3, 'Bảo hiểm ô tô Vios - Trần Văn Hùng', 'Chờ xử lý', 8500000, '2024-10-25 15:30:00', 'Đang chờ bổ sung hồ sơ đăng kiểm xe'),
(3, 3, 'Bảo hiểm sức khỏe tập thể 50 người - Công ty ABC', 'Mới', 120000000, '2024-11-12 11:00:00', 'Cần hẹn gặp giám đốc công ty'),

-- Cơ hội của Phạm Thu Dung
(4, 4, 'Bảo hiểm ung thư - Lê Thị Mai', 'Thành công', 30000000, '2024-08-10 09:00:00', 'Hợp đồng 15 năm'),
(5, 4, 'Tái tục bảo hiểm sức khỏe - Phạm Đức Thắng', 'Thất bại', 15000000, '2024-10-01 14:00:00', 'Khách không quan tâm tái tục'),
(6, 4, 'Bảo hiểm tài sản + TNDN - Siêu thị XYZ', 'Chờ xử lý', 85000000, '2024-11-05 10:30:00', 'Đang thẩm định giá trị tài sản'),

-- Cơ hội của Hoàng Văn Em
(7, 5, 'Bảo hiểm du lịch - Vũ Minh Tuấn', 'Mới', 2000000, '2024-11-16 14:00:00', 'Khách cần đi công tác nước ngoài tháng 12'),
(8, 5, 'Bảo hiểm sức khỏe - Đỗ Thị Hương', 'Thất bại', 12000000, '2024-07-01 11:00:00', 'Không liên lạc được sau lần hẹn đầu tiên');

-- =============================================
-- 4. LỊCH HẸN (12 cuộc hẹn)
-- =============================================

INSERT INTO LichHen (ID_CoHoi, ThoiGianHen, DiaDiem, NoiDung, KetQuaSauCuocHen, TrangThaiLichHen) VALUES
-- Lịch hẹn cơ hội #1 (Thành công)
(1, '2024-09-18 14:00:00', 'Văn phòng BIC Láng Hạ', 'Tư vấn sản phẩm bảo hiểm nhân thọ', 'KH đồng ý mua, đã ký hợp đồng', 'Hoàn thành'),
(1, '2024-09-22 10:00:00', 'Văn phòng BIC Láng Hạ', 'Nộp hồ sơ và ký hợp đồng chính thức', 'Hoàn tất thủ tục, hợp đồng có hiệu lực', 'Hoàn thành'),

-- Lịch hẹn cơ hội #2 (Đang xử lý)
(2, '2024-10-28 16:00:00', 'Quán cafe The Coffee House Giải Phóng', 'Tư vấn gói bảo hiểm ô tô', 'KH đồng ý, cần bổ sung giấy tờ xe', 'Hoàn thành'),
(2, '2024-11-28 09:00:00', 'Văn phòng BIC Hai Bà Trưng', 'Nộp hồ sơ và hoàn tất thủ tục', NULL, 'Sắp diễn ra'),

-- Lịch hẹn cơ hội #3 (Mới)
(3, '2024-11-29 14:00:00', 'Công ty TNHH ABC - Trần Duy Hưng', 'Gặp giám đốc để trình bày gói bảo hiểm tập thể', NULL, 'Sắp diễn ra'),

-- Lịch hẹn cơ hội #4 (Thành công)
(4, '2024-08-12 10:30:00', 'Nhà hàng Ngọc Mai - Nguyễn Trãi', 'Tư vấn bảo hiểm ung thư', 'KH rất quan tâm, hẹn gặp lại để ký', 'Hoàn thành'),
(4, '2024-08-18 15:00:00', 'Văn phòng BIC Thanh Xuân', 'Ký hợp đồng bảo hiểm', 'Đã ký thành công', 'Hoàn thành'),

-- Lịch hẹn cơ hội #5 (Thất bại)
(5, '2024-10-05 14:00:00', 'SĐT - Gọi điện thoại', 'Nhắc nhở tái tục hợp đồng', 'KH nói bận, hẹn gọi lại', 'Hoàn thành'),
(5, '2024-10-15 10:00:00', 'SĐT - Gọi điện thoại', 'Gọi lại lần 2', 'KH không nghe máy', 'Hủy'),

-- Lịch hẹn cơ hội #6 (Đang xử lý)
(6, '2024-11-08 09:30:00', 'Siêu thị XYZ - Phạm Hùng', 'Khảo sát tài sản cần bảo hiểm', 'Đã khảo sát, đang lập báo giá', 'Hoàn thành'),
(6, '2024-11-30 14:00:00', 'Siêu thị XYZ - Phòng họp', 'Trình bày phương án bảo hiểm', NULL, 'Sắp diễn ra'),

-- Lịch hẹn cơ hội #7 (Mới)
(7, '2024-11-20 13:00:00', 'Quán cafe Highlands Kim Mã', 'Tư vấn bảo hiểm du lịch', 'KH cần thời gian suy nghĩ', 'Hoàn thành');

-- =============================================
-- 5. HỒ SƠ (4 hồ sơ)
-- =============================================

INSERT INTO HoSo (ID_CoHoi, TenHoSo, FileHoSo, TrangThaiHoSo, NgayUpload, NgayDuyet, GhiChu) VALUES
-- Hồ sơ đã duyệt
(1, 'Hồ sơ bảo hiểm nhân thọ - Nguyễn Thị Lan', '1726988400000-hoso-nguyen-thi-lan.pdf', 'Đã duyệt', '2024-09-20 11:00:00', '2024-09-21 09:30:00', 'Hồ sơ đầy đủ, đã duyệt'),
(4, 'Hồ sơ bảo hiểm ung thư - Lê Thị Mai', '1723442400000-hoso-le-thi-mai.pdf', 'Đã duyệt', '2024-08-14 14:30:00', '2024-08-15 10:00:00', 'Đã kiểm tra sức khỏe, đạt'),

-- Hồ sơ chờ duyệt
(2, 'Hồ sơ bảo hiểm ô tô - Trần Văn Hùng', '1730098800000-hoso-tran-van-hung.pdf', 'Chờ duyệt', '2024-11-01 16:00:00', NULL, 'Đã upload, chờ quản lý duyệt'),

-- Hồ sơ cần bổ sung
(6, 'Hồ sơ bảo hiểm DN - Siêu thị XYZ', '1731045600000-hoso-sieu-thi-xyz.pdf', 'Bổ sung', '2024-11-10 10:00:00', NULL, 'Thiếu giấy phép kinh doanh, cần bổ sung');

-- =============================================
-- 6. HỢP ĐỒNG (2 hợp đồng)
-- =============================================

INSERT INTO HopDong (ID_HoSo, MaHopDong, NgayHieuLuc, NgayHetHan, GiaTri, FileHopDong) VALUES
-- Hợp đồng đang có hiệu lực
(1, 'BIC-HN-2024-001', '2024-09-25', '2044-09-24', 50000000, '1727265600000-hopdong-BIC-HN-2024-001.pdf'),

-- Hợp đồng sắp hết hạn (để test thông báo tái tục)
(2, 'BIC-HN-2024-002', '2024-08-20', '2025-02-19', 30000000, '1724140800000-hopdong-BIC-HN-2024-002.pdf');

-- =============================================
-- 7. THÔNG BÁO (6 thông báo)
-- =============================================

INSERT INTO ThongBao (ID_NhanVien, LoaiThongBao, NoiDung, TrangThai, NgayTao) VALUES
-- Thông báo cho Lê Minh Cường (ID=3)
(3, 'Lịch hẹn', 'Bạn có lịch hẹn với Công ty ABC vào 14:00 ngày 29/11/2024', 'Chưa đọc', '2024-11-27 08:00:00'),
(3, 'Lịch hẹn', 'Bạn có lịch hẹn với Trần Văn Hùng vào 09:00 ngày 28/11/2024', 'Chưa đọc', '2024-11-27 08:00:00'),

-- Thông báo cho Phạm Thu Dung (ID=4)
(4, 'Tái tục', 'Hợp đồng BIC-HN-2024-002 của KH Lê Thị Mai sẽ hết hạn vào 19/02/2025', 'Đã đọc', '2024-11-20 06:00:00'),
(4, 'Hồ sơ duyệt', 'Hồ sơ bảo hiểm DN - Siêu thị XYZ cần bổ sung giấy tờ', 'Chưa đọc', '2024-11-12 14:30:00'),
(4, 'Lịch hẹn', 'Bạn có lịch hẹn với Siêu thị XYZ vào 14:00 ngày 30/11/2024', 'Chưa đọc', '2024-11-27 08:00:00'),

-- Thông báo cho Quản lý (ID=2)
(2, 'Hồ sơ duyệt', 'Có 2 hồ sơ đang chờ duyệt', 'Chưa đọc', '2024-11-27 09:00:00');

-- =============================================
-- KẾT THÚC SEED DATA
-- =============================================

SELECT '=== SEED DATA IMPORTED SUCCESSFULLY ===' AS Status;
SELECT 'Nhân viên:', COUNT(*) FROM NhanVien;
SELECT 'Khách hàng:', COUNT(*) FROM KhachHang;
SELECT 'Cơ hội:', COUNT(*) FROM CoHoi;
SELECT 'Lịch hẹn:', COUNT(*) FROM LichHen;
SELECT 'Hồ sơ:', COUNT(*) FROM HoSo;
SELECT 'Hợp đồng:', COUNT(*) FROM HopDong;
SELECT 'Thông báo:', COUNT(*) FROM ThongBao;

-- =============================================
-- HƯỚNG DẪN SỬ DỤNG
-- =============================================
-- 1. Import file này vào database:
--    mysql -u root -p crm_bic < seed.sql
--
-- 2. Hoặc trong MySQL Workbench/phpMyAdmin:
--    - Mở file này
--    - Execute toàn bộ script
--
-- 3. Tài khoản đăng nhập test:
--    Username: admin      | Password: 123456 | Role: Ban giám đốc
--    Username: manager1   | Password: 123456 | Role: Quản lý
--    Username: nhanvien1  | Password: 123456 | Role: Nhân viên (Lê Minh Cường)
--    Username: nhanvien2  | Password: 123456 | Role: Nhân viên (Phạm Thu Dung)
--    Username: nhanvien3  | Password: 123456 | Role: Nhân viên (Hoàng Văn Em)
--
-- 4. Kịch bản test:
--    - Đăng nhập nhanvien1: Xem 3 KH, 3 cơ hội, có lịch hẹn sắp tới
--    - Đăng nhập nhanvien2: Xem 3 KH, 3 cơ hội, có thông báo tái tục
--    - Đăng nhập manager1: Duyệt hồ sơ chờ duyệt, xem toàn bộ dữ liệu
--    - Đăng nhập admin: Xem báo cáo tổng hợp, KPI các nhân viên
-- =============================================
