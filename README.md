# 🛒 Grosur - Online Grocery Backend

This is the backend for the Grosur application, built with Express.js, TypeScript, Prisma, and PostgreSQL/MySQL.

## 🚀 Tech Stack

- **Framework**: Express.js
- **Runtime**: Node.js
- **Language**: TypeScript
- **Database**: Prisma ORM (PostgreSQL/MySQL)
- **Validation**: Zod
- **Authentication**: JWT (JSON Web Token)
- **Security**: Helmet, CORS

## 📁 Directory Structure

```text
src/
├── config/        # Environment and Database configuration
├── controllers/   # HTTP Layer (Request handling)
├── services/      # Business Logic Layer
├── middleware/    # Auth, Validation, Error Handlers
├── routes/        # API Routes
├── utils/         # Helper functions
├── types/         # TypeScript definitions
└── index.ts       # Entry point
```

## 🛠️ Setup & Development

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure environment**:
   Copy `.env.example` to `.env` and fill in the values.

3. **Database setup**:

   ```bash
   npx prisma migrate dev
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

## 🚦 Clean Code Standards

- Max **200 lines** per file.
- Max **15 lines** per function.
- Uniform API responses.
- Zod-based server-side validation.
