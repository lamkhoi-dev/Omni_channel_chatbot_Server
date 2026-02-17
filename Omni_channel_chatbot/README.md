# ChatDesk - Omni-channel Chatbot Platform

Nền tảng quản lý tin nhắn tập trung giúp doanh nghiệp vừa và nhỏ quản lý tương tác khách hàng từ Facebook & Instagram với AI tự động trả lời.

## 🎯 Features

- ✅ **Multi-channel Integration**: Kết nối Facebook Page & Instagram Business
- 🤖 **AI Chatbot**: Tự động trả lời tin nhắn bằng Groq LLM (Llama 3.3 70B)
- 📚 **Product Knowledge Base**: RAG với Milvus vector database
- 💬 **Real-time Chat**: WebSocket cho tin nhắn real-time
- 👥 **Multi-user**: Business users và Admin dashboard
- 🔐 **OAuth Integration**: Kết nối Facebook/Instagram qua OAuth 2.0

## 🏗️ Architecture

```
Frontend (React + Vite)
   ↓
Backend (FastAPI + Python)
   ↓
├─ PostgreSQL (User/Product data)
├─ Milvus Cloud (Vector embeddings - RAG)
└─ Groq LLM (AI responses)
```

## 📁 Project Structure

```
Omni_channel_chatbot/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # REST endpoints
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── services/    # Business logic (AI, Milvus, etc.)
│   │   └── websocket/   # WebSocket manager
│   ├── alembic/         # Database migrations
│   ├── .env             # Environment variables
│   ├── requirements.txt # Python dependencies
│   └── main.py          # FastAPI app
├── frontend/            # React frontend
│   ├── src/
│   │   ├── api/        # API client
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   └── store/      # Zustand state management
│   └── package.json
├── SETUP.md            # Setup guide (localhost)
├── DEPLOY_RAILWAY.md   # Deploy guide (Railway)
└── requirement.txt     # Project requirements spec
```

## 🚀 Quick Start

### 1. Local Development

```bash
# Setup PostgreSQL, Milvus Cloud, Facebook App
# Xem hướng dẫn chi tiết: SETUP.md

# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

### 2. Deploy to Railway (Production)

```bash
# Xem hướng dẫn chi tiết: DEPLOY_RAILWAY.md

# Quick deploy
railway login
cd backend
railway link
railway up

# Run migrations
railway run alembic upgrade head
```

## 🔧 Tech Stack

### Backend
- **Framework**: FastAPI 0.115
- **Database**: PostgreSQL 15+ (SQLAlchemy + Asyncpg)
- **Vector DB**: Milvus Cloud (Zilliz)
- **AI/LLM**: Groq API (Llama 3.3 70B)
- **Embeddings**: sentence-transformers (all-MiniLM-L6-v2)
- **Auth**: JWT (python-jose)
- **Real-time**: WebSocket

### Frontend
- **Framework**: React 18 + Vite
- **UI Library**: Ant Design
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Real-time**: WebSocket

### Infrastructure
- **Hosting**: Railway (Backend), Vercel/Netlify (Frontend)
- **Database**: Railway Postgres
- **Vector DB**: Milvus Cloud (Zilliz)
- **Monitoring**: Railway Logs

## 📊 Database Schema

```sql
users          → id, email, password_hash, role (business/admin)
channels       → id, business_id, platform, page_id, access_token
contacts       → id, business_id, platform_user_id, name
conversations  → id, business_id, contact_id, channel_id, is_ai_enabled
messages       → id, conversation_id, content, direction (incoming/outgoing)
products       → id, business_id, name, description, price, extra_info (JSONB)
```

**Vector Storage** (Milvus):
```
product_embeddings:
  - id (VARCHAR)
  - business_id (VARCHAR)
  - embedding (FLOAT_VECTOR[384])
```

## 🔐 Environment Variables

See: [backend/.env.example](backend/.env.example)

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `GROQ_API_KEY` - Groq LLM API key
- `MILVUS_URI` & `MILVUS_TOKEN` - Milvus Cloud credentials
- `FB_APP_ID` & `FB_APP_SECRET` - Facebook App credentials

## 📖 Documentation

- **Setup Local**: [SETUP.md](SETUP.md)
- **Deploy Railway**: [DEPLOY_RAILWAY.md](DEPLOY_RAILWAY.md)
- **Requirements**: [requirement.txt](requirement.txt)
- **API Docs**: `http://localhost:8000/docs` (Swagger UI)

## 🧪 Testing

### Backend
```bash
cd backend

# Test admin login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@chatdesk.vn","password":"admin123"}'

# Test Milvus connection
python test_milvus.py
```

### Frontend
```bash
cd frontend
npm run dev

# Open: http://localhost:5173
# Login as admin: admin@chatdesk.vn / admin123
# Register business user
# Connect Facebook Page
# Add products
# Test AI chatbot via Facebook Messenger
```

## 🐛 Troubleshooting

See detailed troubleshooting in [SETUP.md](SETUP.md#troubleshooting)

Common issues:
- PostgreSQL connection → Check password & port
- Milvus connection → Check URI & token, cluster status
- Facebook OAuth error → Check redirect URI matches exactly
- Webhook not receiving → Must use HTTPS (ngrok or Railway)
- CORS error → Add frontend domain to `CORS_ORIGINS`

## 📝 License

MIT

## 👥 Authors

ChatDesk Team

## 🙏 Acknowledgments

- **Facebook Graph API** - Messenger & Instagram integration
- **Groq** - Fast LLM inference
- **Milvus** - Vector database for RAG
- **Railway** - Easy deployment platform
