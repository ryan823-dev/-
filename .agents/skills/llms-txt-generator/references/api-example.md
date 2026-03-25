# REST/GraphQL API Pattern

## Recommended Files

```
llm-docs/
├── llm.txt              # API overview and base URLs
├── llm.version.txt      # API version and changelog
├── llm.endpoints.txt    # All endpoints with methods
├── llm.models.txt       # Request/response schemas
├── llm.auth.txt         # Authentication methods
├── llm.errors.txt       # Error codes and handling
└── llm.examples.txt     # Common request examples
```

## Data Sources

| Source | Extraction Method |
|--------|-------------------|
| OpenAPI/Swagger | Parse spec file directly |
| Route definitions | Parse Express/FastAPI routes |
| TypeScript types | Extract from shared types |
| JSDoc comments | Parse endpoint documentation |

## llm.endpoints.txt Example

```markdown
# API Endpoints - {Project}

Base URL: `https://api.example.com/v1`

## Authentication

All endpoints require Bearer token unless marked as public.

\`\`\`
Authorization: Bearer {token}
\`\`\`

## Users

### GET /users

List all users with pagination.

**Query Parameters:**
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| page | int | no | 1 | Page number |
| limit | int | no | 20 | Items per page |
| sort | string | no | "created_at" | Sort field |
| order | string | no | "desc" | Sort order |

**Response:** `200 OK`
\`\`\`json
{
  "data": [
    { "id": "usr_123", "email": "user@example.com", "name": "John" }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
\`\`\`

### POST /users

Create a new user.

**Request Body:**
\`\`\`json
{
  "email": "string (required)",
  "name": "string (required)",
  "role": "admin | user (default: user)"
}
\`\`\`

**Response:** `201 Created`
\`\`\`json
{
  "id": "usr_124",
  "email": "new@example.com",
  "name": "Jane",
  "role": "user",
  "created_at": "2024-01-15T10:30:00Z"
}
\`\`\`

### GET /users/:id

Get user by ID.

**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | string | User ID (usr_xxx format) |

**Response:** `200 OK` or `404 Not Found`

### PUT /users/:id

Update user.

### DELETE /users/:id

Delete user (soft delete).
```

## llm.models.txt Example

```markdown
# Data Models - {Project}

## User

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | auto | Unique identifier (usr_xxx) |
| email | string | yes | Email address (unique) |
| name | string | yes | Display name |
| role | enum | no | "admin" \| "user" (default: "user") |
| status | enum | no | "active" \| "inactive" \| "pending" |
| created_at | datetime | auto | Creation timestamp |
| updated_at | datetime | auto | Last update timestamp |

## Order

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | auto | Unique identifier (ord_xxx) |
| user_id | string | yes | Reference to User |
| items | array | yes | Array of OrderItem |
| total | number | auto | Calculated total |
| status | enum | no | "pending" \| "paid" \| "shipped" \| "delivered" |

## Nested Types

### OrderItem
| Field | Type | Description |
|-------|------|-------------|
| product_id | string | Reference to Product |
| quantity | int | Item quantity |
| price | number | Unit price at order time |
```

## llm.auth.txt Example

```markdown
# Authentication - {Project}

## Methods

### API Key (for server-to-server)

\`\`\`
X-API-Key: {api_key}
\`\`\`

### Bearer Token (for user sessions)

\`\`\`
Authorization: Bearer {jwt_token}
\`\`\`

## Obtaining Tokens

### Login

\`\`\`bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secret"
}
\`\`\`

Response:
\`\`\`json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "expires_in": 3600
}
\`\`\`

### Refresh

\`\`\`bash
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJ..."
}
\`\`\`

## Scopes

| Scope | Description |
|-------|-------------|
| read:users | Read user data |
| write:users | Create/update users |
| admin | Full access |
```

## llm.errors.txt Example

```markdown
# Error Handling - {Project}

## Error Response Format

\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
\`\`\`

## Error Codes

| HTTP | Code | Description | Resolution |
|------|------|-------------|------------|
| 400 | VALIDATION_ERROR | Invalid request | Check request body |
| 401 | UNAUTHORIZED | Missing/invalid token | Authenticate |
| 403 | FORBIDDEN | Insufficient permissions | Check scopes |
| 404 | NOT_FOUND | Resource not found | Verify ID |
| 409 | CONFLICT | Resource already exists | Use different ID |
| 429 | RATE_LIMITED | Too many requests | Wait and retry |
| 500 | INTERNAL_ERROR | Server error | Contact support |
```
