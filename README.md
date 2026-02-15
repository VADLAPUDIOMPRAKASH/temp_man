# Task Manager - Backend API

RESTful API for the Task Manager application built with Node.js, Express, TypeScript, and MongoDB.

## 🚀 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **File Upload**: Multer
- **Security**: bcryptjs for password hashing

## 📋 Prerequisites

- Node.js 18 or higher
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

## 🛠️ Installation

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Configure `.env` file**
   ```env
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/taskmanager
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   NODE_ENV=development
   ```

   **Generate a secure JWT secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```
Runs with hot-reload using `tsx watch`. Server starts at `http://localhost:5001`

### Production Build
```bash
npm run build
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.ts              # MongoDB connection
│   ├── middleware/
│   │   ├── auth.ts            # JWT authentication
│   │   └── boardRole.ts       # Role-based access control
│   ├── models/
│   │   ├── User.ts            # User schema
│   │   ├── Board.ts           # Board schema
│   │   ├── BoardMember.ts     # Board membership schema
│   │   ├── List.ts            # List (column) schema
│   │   ├── Card.ts            # Card (task) schema
│   │   ├── Comment.ts         # Comment schema
│   │   └── Activity.ts        # Activity log schema
│   ├── routes/
│   │   ├── auth.ts            # Authentication routes
│   │   ├── boards.ts          # Board CRUD routes
│   │   ├── lists.ts           # List CRUD routes
│   │   ├── cards.ts           # Card CRUD routes
│   │   ├── members.ts         # Board member routes
│   │   ├── search.ts          # Search functionality
│   │   └── upload.ts          # File upload routes
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── app.ts                 # Express app configuration
│   └── server.ts              # Server entry point
├── uploads/                   # File upload directory
├── dist/                      # Compiled JavaScript (after build)
├── .env                       # Environment variables (not in git)
├── .env.example               # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Boards
- `GET /api/boards` - Get all boards for current user
- `POST /api/boards` - Create new board
- `GET /api/boards/:boardId` - Get board by ID
- `PATCH /api/boards/:boardId` - Update board
- `DELETE /api/boards/:boardId` - Delete board

### Lists
- `GET /api/boards/:boardId/lists` - Get all lists in board
- `POST /api/boards/:boardId/lists` - Create new list
- `PATCH /api/boards/:boardId/lists/:listId` - Update list
- `DELETE /api/boards/:boardId/lists/:listId` - Delete list
- `POST /api/boards/:boardId/lists/reorder` - Reorder lists

### Cards
- `GET /api/boards/:boardId/cards` - Get all cards in board
- `POST /api/boards/:boardId/cards` - Create new card
- `GET /api/boards/:boardId/cards/:cardId` - Get card details
- `PATCH /api/boards/:boardId/cards/:cardId` - Update card
- `DELETE /api/boards/:boardId/cards/:cardId` - Delete card
- `POST /api/boards/:boardId/cards/:cardId/comments` - Add comment
- `POST /api/boards/:boardId/cards/:cardId/attachments` - Add attachment

### Members
- `GET /api/boards/:boardId/members` - Get board members
- `POST /api/boards/:boardId/members/invite` - Invite member
- `PATCH /api/boards/:boardId/members/:memberId` - Update member role
- `DELETE /api/boards/:boardId/members/:memberId` - Remove member

### Search
- `GET /api/search?q=...&boardId=...` - Search cards

### Upload
- `POST /api/upload` - Upload file

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication.

**Request Header:**
```
Authorization: Bearer <token>
```

**Protected Routes:**
All routes except `/api/auth/register` and `/api/auth/login` require authentication.

## 👥 Role-Based Access Control

Board members have three roles:

- **Admin**: Full access (manage members, delete board)
- **Editor**: Can create/edit/delete lists and cards
- **Viewer**: Read-only access

## 📝 Data Models

### User
```typescript
{
  name: string
  email: string (unique)
  password: string (hashed)
}
```

### Board
```typescript
{
  name: string
  createdBy: ObjectId (User)
}
```

### List
```typescript
{
  title: string
  board: ObjectId (Board)
  order: number
}
```

### Card
```typescript
{
  title: string
  description?: string
  list: ObjectId (List)
  order: number
  dueDate?: Date
  labels: string[]
  attachments: Array<{name, url, uploadedAt}>
  createdBy: ObjectId (User)
}
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5001 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/taskmanager |
| `JWT_SECRET` | Secret key for JWT signing | (required) |
| `NODE_ENV` | Environment mode | development |

## 🧪 Testing the API

You can test the API using:

- **Postman**: Import the endpoints
- **cURL**: Command-line testing
- **Thunder Client**: VS Code extension

**Example - Register User:**
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

**Example - Login:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

## 🐛 Common Issues

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod` or check MongoDB Atlas connection
- Verify `MONGODB_URI` in `.env` file

### Port Already in Use
- Change `PORT` in `.env` file
- Kill process using port: `lsof -ti:5001 | xargs kill`

### JWT Token Invalid
- Ensure `JWT_SECRET` is set in `.env`
- Check token expiration (default: 7 days)

## 📦 Dependencies

### Production
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `express-validator` - Request validation
- `multer` - File upload handling
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables

### Development
- `typescript` - Type safety
- `tsx` - TypeScript execution
- `@types/*` - Type definitions

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Environment Setup
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Configure MongoDB Atlas for cloud database
- Set up proper CORS origins

## 📄 License

MIT

## 👨‍💻 Author

Task Manager Backend API
