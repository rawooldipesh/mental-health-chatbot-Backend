# FEELFree — Backend

> REST API backend for the FEELFree AI-powered mental health chatbot. Built with Node.js, Express, and MongoDB.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express v5 |
| Database | MongoDB + Mongoose |
| Authentication | JWT + bcryptjs |
| AI / Chat | OpenAI API |
| Security | Helmet, CORS, Joi, Zod |
| Logging | Morgan |
| Dev Tool | Nodemon |

---

## 📁 Folder Structure

```
mental-health-chatbot-backend/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── authController.js      # Register, login, user auth logic
│   └── moodController.js      # Mood logging and retrieval
├── middleware/
│   ├── auth.js                # JWT authentication middleware
│   └── validate.js            # Request validation middleware
├── models/
│   ├── Message.js             # Chat message schema
│   ├── Session.js             # Chat session schema
│   ├── Summary.js             # Weekly sentiment summary schema
│   └── User.js                # User profile schema
├── routes/
│   ├── authRoutes.js          # /api/auth
│   ├── chatRoutes.js          # /api/chat
│   ├── messages.js            # /api/messages
│   ├── moodRoutes.js          # /api/moods
│   └── sessions.js            # /api/sessions
├── utils/                     # Helper utilities
├── validations/               # Joi/Zod validation schemas
├── .env                       # Environment variables (never commit)
├── .gitignore
├── server.js                  # App entry point
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- OpenAI API key

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/mental-health-chatbot-backend.git
cd mental-health-chatbot-backend

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env
# Fill in your values (see Environment Variables section below)

# 4. Start development server
npm run dev
```

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (auto-restart on change) |
| `npm start` | Start production server |

---

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following keys:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=your_openai_api_key
CORS_ORIGIN=http://localhost:8082,http://your-device-ip:8082
SENTIMENT_URL=http://localhost:8001/analyze
GEMINI_API_KEY=your_gemini_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GROQ_API_KEY=your_groq_api_key
```

> ⚠️ **Never commit your `.env` file.** It is already listed in `.gitignore`.

---

## 📡 API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login and receive JWT token | No |

### Chat — `/api/chat`
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/chat` | Send message, receive AI response | Yes |

### Sessions — `/api/sessions`
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/sessions` | Get all chat sessions for user | Yes |
| POST | `/api/sessions` | Create a new chat session | Yes |
| DELETE | `/api/sessions/:id` | Delete a session | Yes |

### Messages — `/api/messages`
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/messages/:sessionId` | Get all messages in a session | Yes |
| POST | `/api/messages` | Save a message | Yes |

### Moods — `/api/moods`
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/moods` | Get mood entries for user | Yes |
| POST | `/api/moods` | Log a new mood entry | Yes |
| GET | `/api/moods/summary` | Get weekly sentiment summary | Yes |

---

## 🔒 Security

- **Helmet** — sets secure HTTP headers
- **JWT** — all protected routes require a valid Bearer token
- **bcryptjs** — passwords are hashed before storing
- **CORS** — only whitelisted origins are allowed
- **Validation** — all incoming requests are validated using Joi/Zod schemas
- **Cache Control** — all responses are set to no-cache to prevent stale data

---

## 🗄️ Database Models

| Model | Description |
|---|---|
| `User` | Stores user profile, hashed password, anonymous flag |
| `Session` | Represents a chat session tied to a user |
| `Message` | Individual chat messages linked to a session |
| `Summary` | Weekly sentiment summary aggregated from mood entries |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---



## 📄 License

This project is for academic purposes — A.C. Patil College of Engineering, Mumbai University.
