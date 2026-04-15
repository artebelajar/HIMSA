# API Routes Structure

This directory contains all backend API endpoints for the HIMSA application.

## Directory Structure

```
app/api/
├── auth/
│   ├── login/route.ts
│   ├── register/route.ts
│   ├── logout/route.ts
│   └── me/route.ts
├── articles/
│   ├── route.ts (GET/POST)
│   └── [id]/route.ts (GET/PUT/DELETE)
├── quotes/
│   ├── route.ts (GET/POST)
│   └── [id]/route.ts (GET/PUT/DELETE)
├── posters/
│   ├── route.ts (GET/POST)
│   └── [id]/route.ts (GET/PUT/DELETE)
├── schedule/
│   ├── security/route.ts (GET/PUT)
│   └── welfare/route.ts (GET/PUT)
├── messages/
│   └── route.ts (GET/POST)
├── hafalan/
│   └── route.ts (GET/PUT)
└── kas/
    └── route.ts (GET/PUT)
```

## Performance Guidelines

### 1. Response Caching
- Use Next.js `revalidateTag()` for database caching
- Cache user data with 5-minute TTL
- Cache schedule data with 1-hour TTL
- Cache public content with 1-day TTL

### 2. Pagination
- Default: 10-20 items per page
- Max: 100 items per page
- Always return `total` and `hasMore` fields

### 3. Database Queries
- Select only needed fields (avoid SELECT *)
- Use WHERE clauses for filtering
- Create indexes for frequently queried fields
- Use LIMIT for result sets

### 4. Error Handling
```typescript
// Standard error response
{
  error: "Error message",
  code: "ERROR_CODE",
  status: 400
}
```

### 5. Authentication
- All protected routes should verify JWT token
- Check user permissions before operations
- Implement rate limiting on sensitive endpoints

## Example API Response Format

```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful",
  "timestamp": "2024-02-14T10:30:00Z"
}
```

## Rate Limiting
- Auth endpoints: 5 requests per minute
- Public endpoints: 30 requests per minute
- Protected endpoints: 100 requests per minute

## To Implement
1. Copy example route files from `/examples/api-routes/`
2. Implement authentication middleware
3. Add database queries using Supabase client
4. Set up error handling and logging
5. Test all endpoints before deployment

## Security Notes
- Always validate input with Zod
- Implement CORS properly
- Use HTTPS only in production
- Sanitize user inputs
- Implement SQL injection prevention (use parameterized queries)
- Enable rate limiting on all endpoints
