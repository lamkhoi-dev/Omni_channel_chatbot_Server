# ChatDesk - Project Plan

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend | Python 3.11+ / FastAPI | Best AI/LLM ecosystem, async, fast |
| Database | PostgreSQL + pgvector | Relational + vector search in 1 DB |
| ORM | SQLAlchemy 2.0 + Alembic | Mature, async support |
| Auth | JWT (python-jose + passlib) | Stateless, simple |
| LLM | Groq API (`llama-3.3-70b-versatile`) | Ultra-fast inference |
| Embedding | sentence-transformers (local) | Free, no API cost, ~100MB model |
| Frontend | React 18 + Vite | SPA, fast dev |
| UI Library | Ant Design | Functional UI, quick to build |
| Realtime | WebSocket (FastAPI native) | Live message updates |
| HTTP Client | Axios | Frontend API calls |
| State | Zustand | Lightweight state management |

---

## Project Structure

```
Omni_channel_chatbot/
├── plan.md
├── requirement.txt
├── backend/
│   ├── main.py                    # FastAPI app entry
│   ├── requirements.txt           # Python dependencies
│   ├── .env                       # Environment variables
│   ├── alembic.ini                # Alembic config
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py              # Settings (env vars)
│   │   ├── database.py            # DB connection, session
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py            # Business + Admin users
│   │   │   ├── channel.py         # Facebook Page, Instagram connections
│   │   │   ├── contact.py         # End customers
│   │   │   ├── conversation.py    # Conversations
│   │   │   ├── message.py         # Messages
│   │   │   └── product.py         # Products + vector embeddings
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── channel.py
│   │   │   ├── contact.py
│   │   │   ├── conversation.py
│   │   │   ├── message.py
│   │   │   └── product.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── deps.py            # Dependencies (get_current_user, etc.)
│   │   │   ├── auth.py            # Login, Register
│   │   │   ├── users.py           # Business profile management
│   │   │   ├── channels.py        # FB/IG integration
│   │   │   ├── contacts.py        # Contact management
│   │   │   ├── conversations.py   # Conversation list
│   │   │   ├── messages.py        # Send/receive messages
│   │   │   ├── products.py        # Product CRUD
│   │   │   └── webhooks.py        # FB/IG webhook receiver
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── facebook_service.py
│   │   │   ├── instagram_service.py
│   │   │   ├── ai_service.py      # Groq LLM + RAG logic
│   │   │   └── embedding_service.py # sentence-transformers
│   │   └── websocket/
│   │       ├── __init__.py
│   │       └── manager.py         # WebSocket connection manager
│   └── tests/
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── .env
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/
│   │   │   └── client.js          # Axios instance
│   │   ├── store/
│   │   │   ├── authStore.js
│   │   │   ├── chatStore.js
│   │   │   └── channelStore.js
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Chat.jsx           # Main chat interface
│   │   │   ├── Channels.jsx       # FB/IG integration page
│   │   │   ├── Products.jsx       # Product management
│   │   │   └── Settings.jsx       # Business info
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── ConversationList.jsx
│   │   │   ├── MessagePanel.jsx
│   │   │   ├── ContactInfo.jsx
│   │   │   └── ProductForm.jsx
│   │   └── utils/
│   │       └── websocket.js
│   └── public/
```

---

## Database Schema

### users
| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | |
| email | VARCHAR(255) UNIQUE | Login email |
| password_hash | VARCHAR(255) | bcrypt hashed |
| role | ENUM('business', 'admin') | |
| business_name | VARCHAR(255) | Company name (business only) |
| business_description | TEXT | For AI context |
| phone | VARCHAR(20) | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### channels
| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | |
| business_id | UUID (FK → users) | Owner |
| platform | ENUM('facebook', 'instagram') | |
| platform_page_id | VARCHAR(255) | FB Page ID or IG account ID |
| page_name | VARCHAR(255) | |
| access_token | TEXT | Encrypted page access token |
| is_active | BOOLEAN | |
| created_at | TIMESTAMP | |

### contacts
| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | |
| business_id | UUID (FK → users) | |
| platform | ENUM('facebook', 'instagram') | |
| platform_user_id | VARCHAR(255) | FB/IG user ID |
| display_name | VARCHAR(255) | |
| profile_pic_url | TEXT | |
| created_at | TIMESTAMP | |

### conversations
| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | |
| business_id | UUID (FK → users) | |
| channel_id | UUID (FK → channels) | |
| contact_id | UUID (FK → contacts) | |
| platform | ENUM('facebook', 'instagram') | |
| last_message_at | TIMESTAMP | For sorting |
| is_ai_enabled | BOOLEAN DEFAULT true | Toggle AI auto-reply |
| created_at | TIMESTAMP | |

### messages
| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | |
| conversation_id | UUID (FK → conversations) | |
| sender_type | ENUM('contact', 'business', 'ai') | Who sent it |
| content | TEXT | Message text |
| platform_message_id | VARCHAR(255) | FB/IG message ID |
| created_at | TIMESTAMP | |

### products
| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | |
| business_id | UUID (FK → users) | |
| name | VARCHAR(255) | Product name |
| description | TEXT | Full description |
| price | DECIMAL(12,2) | |
| status | ENUM('available', 'out_of_stock') | |
| extra_info | JSONB | Flexible fields |
| embedding | VECTOR(384) | pgvector - sentence-transformers |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Business registration |
| POST | `/api/auth/login` | Login (Business + Admin) |
| GET | `/api/auth/me` | Get current user |

### Users / Business Profile
| Method | Path | Description |
|---|---|---|
| GET | `/api/users/profile` | Get business profile |
| PUT | `/api/users/profile` | Update business info |

### Channels (Integration)
| Method | Path | Description |
|---|---|---|
| GET | `/api/channels` | List connected channels |
| POST | `/api/channels/facebook` | Connect Facebook Page |
| POST | `/api/channels/instagram` | Connect Instagram |
| DELETE | `/api/channels/{id}` | Disconnect channel |

### Webhooks
| Method | Path | Description |
|---|---|---|
| GET | `/api/webhooks/facebook` | FB webhook verification |
| POST | `/api/webhooks/facebook` | FB webhook receive messages |
| GET | `/api/webhooks/instagram` | IG webhook verification |
| POST | `/api/webhooks/instagram` | IG webhook receive messages |

### Contacts
| Method | Path | Description |
|---|---|---|
| GET | `/api/contacts` | List contacts |
| GET | `/api/contacts/{id}` | Contact detail |

### Conversations
| Method | Path | Description |
|---|---|---|
| GET | `/api/conversations` | List conversations |
| GET | `/api/conversations/{id}` | Conversation detail |
| PATCH | `/api/conversations/{id}/ai` | Toggle AI on/off |

### Messages
| Method | Path | Description |
|---|---|---|
| GET | `/api/conversations/{id}/messages` | Get messages |
| POST | `/api/conversations/{id}/messages` | Send message (manual) |

### Products
| Method | Path | Description |
|---|---|---|
| GET | `/api/products` | List products |
| POST | `/api/products` | Create product (auto-embed) |
| PUT | `/api/products/{id}` | Update product (re-embed) |
| DELETE | `/api/products/{id}` | Delete product |

### WebSocket
| Path | Description |
|---|---|
| `ws://host/ws/{business_id}` | Realtime message updates |

---

## AI / RAG Flow

```
1. Product Created/Updated
   → Concat: "{name} - {description} - Giá: {price} - {status}"
   → sentence-transformers encode → vector (384 dims)
   → Save to products.embedding (pgvector)

2. Contact Sends Message
   → Webhook receives message
   → Save to DB
   → If conversation.is_ai_enabled:
       a. Encode question → vector
       b. SELECT * FROM products
          WHERE business_id = ?
          ORDER BY embedding <=> question_vector
          LIMIT 5
       c. Build prompt:
          - System: "Bạn là trợ lý bán hàng của {business_name}. {business_description}"
          - Context: Top-5 products data
          - Chat history: Last 10 messages
          - User message
       d. Call Groq API (llama-3.3-70b-versatile)
       e. Save AI response to DB
       f. Send AI response back via FB/IG API
       g. Push update via WebSocket to frontend
```

---

## Implementation Order

1. **Backend init** — FastAPI project, config, DB connection
2. **Database models** — SQLAlchemy models + Alembic migration
3. **Auth module** — Register, Login, JWT middleware
4. **Business profile** — CRUD user info
5. **Channel integration** — Connect FB/IG pages (token storage)
6. **Webhook handler** — Receive FB/IG messages
7. **Contact management** — Auto-create contacts from webhooks
8. **Conversation & Messages** — Store and serve chat data
9. **Product management** — CRUD + auto-embedding (pgvector)
10. **AI service** — RAG retrieval + Groq LLM call
11. **WebSocket** — Realtime push to frontend
12. **Frontend init** — React + Vite + Ant Design
13. **Frontend Auth** — Login/Register pages
14. **Frontend Chat UI** — Main inbox interface
15. **Frontend Channels** — Integration management page
16. **Frontend Products** — Product CRUD page
17. **E2E Integration** — Connect everything, test flow

---

## Environment Variables

```env
# Backend .env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/chatdesk
SECRET_KEY=your-jwt-secret-key
GROQ_API_KEY=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
GROQ_MODEL=llama-3.3-70b-versatile
EMBEDDING_MODEL=all-MiniLM-L6-v2

# Facebook (provided later)
FB_APP_ID=
FB_APP_SECRET=
FB_VERIFY_TOKEN=

# Frontend .env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

## Notes

- Facebook/Instagram credentials will be provided later by the user
- Embedding model `all-MiniLM-L6-v2` outputs 384-dim vectors, runs locally, no API cost
- Groq free tier: 14,400 requests/day — sufficient for PoC
- UI is functional-only (PoC), no fancy design needed
