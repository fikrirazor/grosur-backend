# Store Admin Management API Documentation

This document provides a guide to the endpoints used for managing Store Admin accounts.

## Base URL
`http://localhost:8000/api/admin/store-admins`

## Endpoints

### 1. Get All Store Admins
Retrieve a paginated list of store admins.
- **URL**: `GET /`
- **Auth**: Required (Super Admin)
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
- **Response** (200 OK):
```json
{
  "success": true,
  "message": "Store Admins retrieved",
  "data": [...],
  "pagination": {
    "page": 1,
    "totalPage": 5,
    "totalRows": 45
  }
}
```

### 2. Create Store Admin
Create a new admin user and assign them to a store.
- **URL**: `POST /`
- **Auth**: Required (Super Admin)
- **Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "managedStoreId": "uuid-of-store"
}
```
- **Response** (201 Created):
```json
{
  "success": true,
  "message": "Store Admin created successfully",
  "data": { "id": "...", "name": "...", ... }
}
```

### 3. Update Store Admin
Update details or reassignment of an admin.
- **URL**: `PATCH /:id`
- **Auth**: Required (Super Admin)
- **Body**: (Optional fields)
```json
{
  "name": "John Updated",
  "managedStoreId": "new-uuid-of-store",
  "isVerified": true
}
```

### 4. Delete Store Admin
Delete an admin account.
- **URL**: `DELETE /:id`
- **Auth**: Required (Super Admin)

### 5. List All Stores
Get a list of available stores for dropdown assignment.
- **URL**: `GET /list/all`
- **Auth**: Required (Super Admin)

---

## Audit Logs
Every CREATE, UPDATE, and DELETE action is recorded in the `ActionLog` table in the database with the following details:
- `action`: Type of action (e.g., `CREATE_STORE_ADMIN`)
- `actorId`: ID of the Super Admin who performed the action.
- `targetId`: ID of the affected User.
- `details`: JSON payload of the request.
