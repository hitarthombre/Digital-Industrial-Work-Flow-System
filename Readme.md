# Digital Industrial Workflow System (DIWS)

Digital Industrial Workflow System (DIWS) is a modern web application for managing industrial workflows, operations, and media assets.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, TypeScript, TailwindCSS v4
- **Backend**: Node.js, Express, TypeScript, Mongoose
- **Database**: MongoDB (MongoDB Atlas / local)
- **Media Storage**: Cloudinary (Image & file management)
- **Logging & Validation**: Winston, Zod, Morgan

---

## 🚀 Environment Setup

### 1. Backend Setup (`server/.env`)

Copy `server/.env.example` to `server/.env` or configure the following environment variables in `server/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb+srv://moretrupti546_db_user:<password>@cluster0.bph4mn5.mongodb.net/?appName=Cluster0

# JWT Configuration
JWT_SECRET=supersecretjwtsecretkeychangeinproduction
JWT_EXPIRES_IN=7d

# Redis Configuration (For queues/cache)
REDIS_HOST=localhost
REDIS_PORT=6379

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=484731253898674
CLOUDINARY_API_SECRET=Xgtp8Y8jWN6PsxEWHOIdxg6cwEc
```

### 2. Frontend Setup (`client/.env`)

Copy `client/.env.example` to `client/.env` or configure the following environment variables in `client/.env`:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Site Title/Branding
VITE_APP_TITLE=Digital Industrial Workflow System
```

---

## 🏃 Running the Application

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas cluster or local MongoDB instance
- Cloudinary account

### Backend (Server)

```bash
cd server
npm install
npm run dev
```

To build for production:
```bash
npm run build
npm start
```

### Frontend (Client)

```bash
cd client
npm install
npm run dev
```

The client dev server will be accessible at `http://localhost:5173`.

---

## 📂 Project Structure

```
.
├── client/                 # Vite + React TypeScript Frontend
│   ├── src/               # React Components, Hooks, & UI
│   ├── .env               # Client environment variables (local)
│   └── package.json
├── server/                 # Express TypeScript Backend
│   ├── src/
│   │   ├── config/        # DB & Cloudinary Configuration
│   │   └── app.ts         # Main Server Application entry point
│   ├── .env               # Server environment variables (local)
│   └── package.json
└── docs/                   # Planning, Architecture, & Design docs
```

Enjoy !!!
