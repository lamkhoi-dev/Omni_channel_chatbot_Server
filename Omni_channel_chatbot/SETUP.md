# ChatDesk - Hướng dẫn Setup

> 📝 **Hướng dẫn này cho development trên localhost.**  
> 🚂 **Để deploy production lên Railway, xem:** [DEPLOY_RAILWAY.md](DEPLOY_RAILWAY.md)

## Bước 1: Cài đặt PostgreSQL + Milvus Cloud

### 1.1. Cài PostgreSQL
- Download: https://www.postgresql.org/download/windows/
- Chọn version 15+ khi cài
- Password: `210506`
- Port: `5432` (mặc định)

### 1.2. Tạo database
```cmd
# Mở Command Prompt, chạy:
psql -U postgres

# Trong psql console:
CREATE DATABASE chatdesk;
\q
```

> Không cần cài extension gì thêm — vector embeddings được lưu trên Milvus Cloud.

### 1.3. Tạo tài khoản Milvus Cloud (Zilliz)

Milvus Cloud (Zilliz) dùng để lưu và tìm kiếm embedding vectors cho RAG. Không cần cài Docker hay extension PostgreSQL.

1. Truy cập: https://cloud.zilliz.com/
2. Đăng ký tài khoản miễn phí (Free tier có sẵn)
3. Tạo **Cluster** mới:
   - **Cluster Type**: Serverless (miễn phí)
   - **Region**: Chọn region gần bạn (VD: `aws-eu-central-1`)
   - Click **Create Cluster**
4. Sau khi tạo xong, click vào Cluster → **Connect**:
   - Copy **Public Endpoint (URI)**: `https://in03-xxxxxxx.serverless.aws-eu-central-1.cloud.zilliz.com`
   - Copy **API Key (Token)**: `xxxxxxxxxxxxxxxx`
5. Điền 2 giá trị này vào `.env` ở Bước 3.1

#### Kiểm tra kết nối Milvus Cloud
```python
# Chạy nhanh trong Python:
from pymilvus import MilvusClient
client = MilvusClient(
    uri="https://in03-xxxxxxx.serverless.aws-eu-central-1.cloud.zilliz.com",
    token="your-api-token-here"
)
print("Collections:", client.list_collections())
print("Milvus Cloud connected!")
```

## Bước 2: Tạo Facebook App

### 2.1. Vào Facebook Developers
1. Truy cập: https://developers.facebook.com/
2. Đăng nhập bằng tài khoản Facebook của bạn
3. Click **"My Apps"** → **"Create App"**

### 2.2. Cấu hình App
- **App Type**: Business
- **App Name**: ChatDesk (hoặc tên bạn muốn)
- Click **Create App**

### 2.3. Thêm Products vào Facebook App

Sau khi tạo App xong, bạn sẽ thấy **App Dashboard**. Cần thêm 2 sản phẩm:

#### A. Thêm Messenger
1. Ở sidebar trái, click **"Add Product"** (hoặc tìm mục **"All Products"**)
2. Tìm **"Messenger"** trong danh sách → Click **"Set Up"**
3. Messenger sẽ xuất hiện ở sidebar trái

#### B. Thêm Facebook Login for Business
1. Quay lại **"Add Product"**
2. Tìm **"Facebook Login for Business"** → Click **"Set Up"**
   - ⚠️ Chọn đúng **"Facebook Login for Business"**, KHÔNG phải "Facebook Login" thường
3. Facebook Login sẽ xuất hiện ở sidebar trái

#### C. (Tùy chọn) Thêm Instagram
1. Quay lại **"Add Product"**
2. Tìm **"Instagram"** → Click **"Set Up"**

### 2.4. Lấy App ID và App Secret

1. Ở sidebar trái, click **"Settings"** → **"Basic"**
2. Bạn sẽ thấy:
   - **App ID**: Dãy số dài (vd: `123456789012345`) — copy lại
   - **App Secret**: Click **"Show"** → Nhập mật khẩu Facebook → copy lại
3. Ở trang này, cũng cần điền:
   - **App Domains**: `localhost`
   - **Privacy Policy URL**: Điền tạm `https://localhost:5173/privacy` (bắt buộc nếu muốn public)
4. Click **"Save Changes"**

### 2.5. Cấu hình OAuth Redirect URI (Facebook Login)

Đây là bước **quan trọng nhất** để OAuth hoạt động:

1. Ở sidebar trái, click **"Facebook Login for Business"** → **"Settings"**
2. Tìm mục **"Valid OAuth Redirect URIs"** và nhập chính xác:
   ```
   http://localhost:8000/api/channels/facebook/callback
   ```
3. Các tùy chọn khác giữ mặc định:
   - **Client OAuth Login**: `Yes`
   - **Web OAuth Login**: `Yes`
   - **Enforce HTTPS**: `No` (vì đang dùng localhost)
4. Click **"Save Changes"**

> ⚠️ **Lưu ý**: URI phải khớp **CHÍNH XÁC** với giá trị `FB_OAUTH_REDIRECT_URI` trong file `.env` của backend. Sai 1 ký tự là OAuth sẽ báo lỗi "redirect_uri mismatch".

### 2.6. Cấu hình Webhook (Nhận tin nhắn từ Facebook/Instagram)

Webhook cho phép Facebook gửi tin nhắn mới về backend. Cần **domain HTTPS public** (không dùng được localhost). Để test trên máy local, dùng **ngrok**:

#### A. Cài và chạy ngrok (chỉ cần khi test local)
```bash
# Cài ngrok: https://ngrok.com/download
# Chạy tunnel tới port 8000 của backend:
ngrok http 8000
```
ngrok sẽ cho 1 URL dạng: `https://abc123.ngrok-free.app`

#### B. Đăng ký Webhook trong Facebook App
1. Sidebar trái → **"Messenger"** → **"Messenger Settings"**
2. Scroll xuống mục **"Webhooks"**
3. Click **"Add Callback URL"**
4. Điền:
   - **Callback URL**: `https://abc123.ngrok-free.app/api/webhooks/facebook`
     - Thay `abc123.ngrok-free.app` bằng URL ngrok của bạn
     - Nếu đã deploy server thật: `https://your-domain.com/api/webhooks/facebook`
   - **Verify Token**: `chatdesk_verify_token`
     - Phải khớp với `FB_VERIFY_TOKEN` trong file `.env`
5. Click **"Verify and Save"**
   - Facebook sẽ gửi GET request tới backend để xác minh
   - Backend tự động trả về `hub.challenge` nếu token đúng

#### C. Subscribe webhook events
Sau khi verify thành công:
1. Vẫn ở mục **"Webhooks"**, tìm phần **"Webhook Fields"**
2. Click **"Add Subscriptions"** và chọn:
   - ✅ `messages` — Nhận tin nhắn mới
   - ✅ `messaging_postbacks` — Nhận nút bấm/quick replies
   - ✅ `messaging_optins` — Nhận opt-in events
   - ✅ `message_deliveries` — Trạng thái gửi tin
   - ✅ `message_reads` — Trạng thái đã đọc
3. Click **"Save"**

#### D. Kết nối Page với Webhook
1. Vẫn trong **"Messenger Settings"**, tìm mục **"Webhooks"**
2. Click **"Add or Remove Pages"**
3. Chọn Facebook Page bạn muốn nhận tin nhắn → **"Done"**
4. Nếu chưa thấy Page, bạn cần kết nối Page trước (xem Bước 5.2)

> 💡 **Tip**: Nếu chỉ muốn test OAuth trước (không cần nhận tin nhắn real-time), có thể bỏ qua bước Webhook này và quay lại sau.

### 2.7. Kiểm tra Permissions

Ở chế độ **Development**, app chỉ hoạt động với:
- Các tài khoản **Admin/Developer** của app
- Các Page/Instagram **mà tài khoản đó quản lý**

Bạn **không cần** request App Review khi đang dev. Permissions mặc định đã có sẵn cho tài khoản Admin.

Để kiểm tra permissions:
1. Sidebar trái → **"App Review"** → **"Permissions and Features"**
2. Xác nhận các quyền sau đang ở trạng thái **"Ready for Testing"** hoặc **"Approved"**:

| Permission | Mục đích | Bắt buộc? |
|---|---|---|
| `pages_messaging` | Gửi/nhận tin nhắn qua Page | ✅ Có |
| `pages_read_engagement` | Đọc thông tin Page | ✅ Có |
| `pages_manage_metadata` | Subscribe webhooks | ✅ Có |
| `instagram_basic` | Đọc thông tin Instagram Business | Chỉ khi dùng IG |
| `instagram_manage_messages` | Gửi/nhận tin nhắn Instagram | Chỉ khi dùng IG |

3. Nếu permission nào chưa có, click **"Request"** bên cạnh

### 2.8. Thêm Test User (nếu cần)

Để test nhắn tin từ tài khoản khác vào Page:
1. Sidebar trái → **"Roles"** → **"Test Users"**
2. Click **"Add"** để tạo test user
3. Hoặc dùng tài khoản Facebook thật khác (không phải admin của app)

---

## Bước 3: Cấu hình Backend

### 3.1. Update file `.env`

Mở file `backend/.env` và điền thông tin Facebook App vừa tạo:

```env
# ======= DATABASE =======
DATABASE_URL=postgresql+asyncpg://postgres:210506@localhost:5432/chatdesk

# ======= JWT AUTH =======
SECRET_KEY=chatdesk-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# ======= AI / LLM =======
GROQ_API_KEY=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
GROQ_MODEL=llama-3.3-70b-versatile
EMBEDDING_MODEL=all-MiniLM-L6-v2

# ======= MILVUS CLOUD (Zilliz) =======
# Lấy từ Zilliz Cloud Dashboard > Cluster > Connect
MILVUS_URI=https://in03-xxxxxxx.serverless.aws-eu-central-1.cloud.zilliz.com
MILVUS_TOKEN=your-api-token-here

# ======= FACEBOOK (BẮT BUỘC) =======
# Lấy từ Facebook App > Settings > Basic
FB_APP_ID=123456789012345
FB_APP_SECRET=abc123def456ghi789
FB_VERIFY_TOKEN=chatdesk_verify_token

# OAuth callback — phải khớp với "Valid OAuth Redirect URIs" ở Bước 2.5
FB_OAUTH_REDIRECT_URI=http://localhost:8000/api/channels/facebook/callback
```

> ⚠️ Thay `123456789012345` và `abc123def456ghi789` bằng App ID và App Secret thật từ Bước 2.4.

### 3.2. Chạy Database Migration

```bash
cd backend

# Tạo migration file (lần đầu)
.venv\Scripts\python.exe -m alembic revision --autogenerate -m "Initial migration"

# Chạy migration — tạo tables trong PostgreSQL
.venv\Scripts\python.exe -m alembic upgrade head
```

Nếu thành công sẽ thấy:
```
INFO  [alembic.runtime.migration] Running upgrade  -> xxxx, Initial migration
```

### 3.3. Khởi động Backend

```bash
cd backend
.venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Nếu thành công:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to stop)
INFO:     Loading embedding model...
INFO:     Application startup complete.
```

- **API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs (mở để test API trực tiếp)

> ⚠️ Lần đầu chạy sẽ download AI embedding model (~100MB), chờ 1-2 phút.

---

## Bước 4: Khởi động Frontend

```bash
cd frontend
npm run dev
```

Nếu thành công:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

Mở trình duyệt tại: http://localhost:5173

---

## Bước 5: Test toàn bộ Flow

### 5.1. Đăng ký tài khoản Doanh nghiệp
1. Mở http://localhost:5173
2. Click **"Đăng ký doanh nghiệp"**
3. Điền đầy đủ:
   - **Tên doanh nghiệp**: VD: `Cửa hàng ABC`
   - **Email**: VD: `admin@abc.com`
   - **Mật khẩu**: Tạo mật khẩu
4. Click **"Đăng ký"**
5. Hệ thống tự động đăng nhập và chuyển đến Dashboard

### 5.2. Kết nối Facebook Page (OAuth)
1. Ở sidebar trái, click **"Kênh kết nối"**
2. Click nút **"Kết nối Facebook (OAuth)"**
3. Trình duyệt chuyển đến Facebook:
   - Đăng nhập Facebook (nếu chưa đăng nhập)
   - Facebook hỏi: "ChatDesk muốn truy cập Pages của bạn" → Click **"Continue"**
   - Chọn Pages muốn kết nối → Click **"Done"**
   - Xác nhận permissions → Click **"Done"**
4. Facebook redirect về `http://localhost:5173/channels?success=true`
5. Trang hiển thị thông báo **"Kết nối thành công"**
6. Danh sách hiện các Page đã kết nối (cả Instagram nếu Page có liên kết IG Business)

**Nếu bị lỗi:**
- `error=no_pages`: Tài khoản Facebook không quản lý Page nào → Tạo Facebook Page trước
- `redirect_uri mismatch`: URI trong code không khớp với Facebook App → Kiểm tra lại Bước 2.5

### 5.3. Nhập Sản phẩm (để AI học)
1. Ở sidebar trái, click **"Sản phẩm"**
2. Click **"Thêm sản phẩm"**, điền:
   - **Tên**: `Áo thun nam basic`
   - **Mô tả**: `Áo thun nam cotton 100%, form regular fit, có 4 màu: trắng, đen, xám, navy. Size S-XXL.`
   - **Giá**: `199000`
3. Click **"Lưu"**
4. Hệ thống tự động:
   - Tạo embedding vector 384 chiều từ tên + mô tả
   - Lưu vào Milvus (vector database)
   - Vector này dùng cho RAG khi AI trả lời khách hàng

> 💡 **Mô tả càng chi tiết, AI trả lời càng chính xác.** Nên mô tả: giá, chất liệu, size, màu, công dụng, cách sử dụng...

### 5.4. Test AI Chatbot (cần Webhook đã set up)
1. Mở một trình duyệt khác (hoặc incognito), đăng nhập Facebook bằng **tài khoản khác** (không phải admin)
2. Vào Facebook Page đã kết nối → Click **"Nhắn tin"**
3. Gửi: `"Cho mình hỏi giá áo thun nam"`
4. Quay lại ChatDesk (http://localhost:5173):
   - Tin nhắn hiện trong mục **"Hội thoại"** (real-time qua WebSocket)
   - AI tự động trả lời dựa trên product knowledge (RAG search)
   - Khách hàng nhận được phản hồi tự động trên Messenger

### 5.5. Chat tay (tắt AI)
1. Trong trang **"Hội thoại"**, click vào cuộc trò chuyện
2. Toggle **"AI tự động"** → OFF
3. Gõ tin nhắn và gửi thủ công → Tin được gửi qua Facebook Messenger API

---

## Bước 6: Deploy lên Server thật

Khi test xong trên localhost, deploy lên server có **HTTPS**:

### 6.1. Cập nhật Webhook URL
1. Vào Facebook App → **Messenger** → **Webhooks**
2. Edit Callback URL: `https://your-domain.com/api/webhooks/facebook`
3. Verify Token: `chatdesk_verify_token`
4. Click **"Verify and Save"**

### 6.2. Cập nhật OAuth Redirect URI
1. Vào **Facebook Login for Business** → **Settings**
2. Thay **Valid OAuth Redirect URIs**: `https://your-domain.com/api/channels/facebook/callback`
3. Bật **Enforce HTTPS**: `Yes`

### 6.3. Cập nhật `.env` trên server
```env
FB_OAUTH_REDIRECT_URI=https://your-domain.com/api/channels/facebook/callback
```

### 6.4. App Review (nếu muốn public cho nhiều doanh nghiệp)
1. Vào **App Review** → **Permissions and Features**
2. Request các permissions: `pages_messaging`, `pages_read_engagement`, `pages_manage_metadata`
3. Điền Business Verification, Privacy Policy, Data Deletion URL
4. Submit review → Facebook duyệt trong 1-5 ngày

---

## Troubleshooting

### ❌ Lỗi PostgreSQL connection
```
sqlalchemy.exc.OperationalError: could not connect to server
```
- Kiểm tra PostgreSQL service đang chạy: `pg_isready -U postgres`
- Kiểm tra password trong `.env` đúng: `210506`
- Kiểm tra port 5432 không bị app khác chiếm
- Trên Windows: Services → tìm `postgresql` → Start

### ❌ Lỗi Milvus Cloud connection
```
Failed to connect to Milvus
```
- Kiểm tra `MILVUS_URI` và `MILVUS_TOKEN` trong `.env` đúng
- Lấy lại từ Zilliz Cloud: https://cloud.zilliz.com/ → Cluster → Connect
- Kiểm tra cluster đang ở trạng thái **Running** (không phải Paused)
- Free tier cluster có thể tự pause sau thời gian không dùng → Click **Resume**

### ❌ OAuth báo "redirect_uri mismatch"
- URI trong **Facebook App > Facebook Login > Settings > Valid OAuth Redirect URIs** phải **y hệt** giá trị `FB_OAUTH_REDIRECT_URI` trong `.env`
- Kiểm tra: dấu `/` cuối, `http` vs `https`, port

### ❌ OAuth báo "App Not Setup" hoặc "This app is in development mode"
- App đang ở chế độ Development → Chỉ hoạt động với admin/developer accounts
- Thêm tài khoản test: **Roles** → **Test Users** → **Add**

### ❌ Webhook verify failed (403)
- `FB_VERIFY_TOKEN` trong `.env` phải khớp với Verify Token đã nhập ở Facebook App
- Backend phải đang chạy và có thể truy cập từ internet (dùng ngrok nếu local)
- Kiểm tra URL đúng: `/api/webhooks/facebook` (không phải `/api/channels/...`)

### ❌ Webhook không nhận được tin nhắn
- Đảm bảo đã subscribe **"messages"** field ở Bước 2.6.C
- Đảm bảo đã **kết nối Page với Webhook** ở Bước 2.6.D
- Localhost KHÔNG nhận được webhook → Phải dùng ngrok hoặc server public
- Kiểm tra logs backend: `INFO: Facebook webhook received: {...}`

### ❌ AI không trả lời
- Kiểm tra `GROQ_API_KEY` hợp lệ
- Kiểm tra đã thêm sản phẩm ở Bước 5.3
- Kiểm tra `is_ai_enabled=True` cho conversation (mặc định là True)
- Xem logs backend: `ERROR: Failed to send AI response...`

### ❌ Embedding model download lỗi
- Model `all-MiniLM-L6-v2` (~90MB) tự download lần đầu
- Cần kết nối internet ổn định
- Có thể mất 1-3 phút lần đầu khởi động

---

## Các lệnh hữu ích

```bash
# === BACKEND ===
cd backend

# Khởi động backend (auto-reload khi code thay đổi)
.venv\Scripts\python.exe -m uvicorn main:app --reload

# Reset toàn bộ database (⚠️ XÓA HẾT DATA)
.venv\Scripts\python.exe -m alembic downgrade base
.venv\Scripts\python.exe -m alembic upgrade head

# Tạo migration mới sau khi sửa models
.venv\Scripts\python.exe -m alembic revision --autogenerate -m "Mô tả thay đổi"
.venv\Scripts\python.exe -m alembic upgrade head

# === FRONTEND ===
cd frontend

# Khởi động dev server
npm run dev

# Build production
npm run build

# Preview production build
npm run preview

# === DATABASE ===
# Kết nối vào database
psql -U postgres -d chatdesk

# Xem tất cả tables
\dt

# Xem channels đã kết nối
SELECT id, platform, page_name, is_active FROM channels;

# Xem products
SELECT id, name, price, status FROM products;
```

---

## Kiến trúc OAuth Flow

```
┌─────────────┐     1. Click "Kết nối Facebook"     ┌──────────┐
│   Frontend   │ ──────────────────────────────────► │  Backend  │
│  :5173       │                                     │  :8000    │
└──────────────┘                                     └────┬─────┘
                                                          │
                  2. Redirect đến Facebook OAuth          │
                  (kèm state + redirect_uri)              │
                                                          ▼
                                                   ┌──────────────┐
                                                   │   Facebook    │
                                                   │   OAuth       │
                                                   │   Dialog      │
                                                   └──────┬───────┘
                                                          │
                  3. User chọn Pages + Authorize          │
                                                          ▼
┌──────────────┐     5. Redirect về frontend      ┌──────────────┐
│   Frontend   │ ◄──────────────────────────────── │   Backend    │
│  :5173       │     (?success=true)               │   Callback   │
│              │                                   │   /facebook/ │
│  Hiển thị    │                                   │   callback   │
│  "Thành công"│                                   │              │
└──────────────┘                                   │  4. Backend: │
                                                   │  - Đổi code  │
                                                   │    → token   │
                                                   │  - Lấy Pages │
                                                   │  - Lưu DB    │
                                                   │  - Subscribe │
                                                   │    webhook   │
                                                   │  - Lấy IG    │
                                                   │    accounts  │
                                                   └──────────────┘
```

---

## Tóm tắt các URL quan trọng

| URL | Dùng cho |
|---|---|
| `http://localhost:5173` | Frontend (giao diện người dùng) |
| `http://localhost:8000` | Backend API |
| `http://localhost:8000/docs` | Swagger API documentation |
| `http://localhost:8000/api/channels/facebook/oauth` | Bắt đầu OAuth flow |
| `http://localhost:8000/api/channels/facebook/callback` | OAuth redirect URI (Facebook gọi về) |
| `http://localhost:8000/api/webhooks/facebook` | Webhook endpoint (Facebook gửi tin nhắn về) |
| `http://localhost:8000/api/webhooks/instagram` | Webhook endpoint cho Instagram |
| `http://localhost:8000/ws/{business_id}` | WebSocket (real-time tin nhắn) |

Xong! Hệ thống đã sẵn sàng.
