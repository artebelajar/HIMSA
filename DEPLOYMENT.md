# HIMSA Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables
- [ ] Create `.env.local` with all required variables
- [ ] Set production Supabase credentials
- [ ] Generate secure JWT secret
- [ ] Configure API URLs
- [ ] Set up monitoring and logging

### 2. Database Setup
- [ ] Create Supabase project
- [ ] Run migration scripts (see BACKEND_SETUP.md)
- [ ] Set up Row Level Security policies
- [ ] Create database indexes
- [ ] Set up automated backups

### 3. Security
- [ ] Enable HTTPS
- [ ] Set up CORS properly
- [ ] Configure environment variables
- [ ] Review authentication system
- [ ] Enable rate limiting
- [ ] Set up security headers

### 4. Testing
- [ ] Run unit tests
- [ ] Run integration tests
- [ ] Test all API endpoints
- [ ] Load test the application
- [ ] Test error handling

### 5. Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Set up analytics
- [ ] Set up performance monitoring
- [ ] Set up uptime monitoring
- [ ] Configure logging

## Deployment Steps

### Option 1: Deploy to Vercel (Recommended)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/himsa.git
git push -u origin main
```

2. **Connect to Vercel**
- Go to https://vercel.com/new
- Import your GitHub repository
- Set environment variables in Vercel dashboard
- Deploy

3. **Vercel Dashboard Configuration**
```
NEXT_PUBLIC_SUPABASE_URL = your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_anon_key
SUPABASE_SERVICE_ROLE_KEY = your_service_role_key
NODE_ENV = production
```

### Option 2: Deploy to Self-Hosted Server

1. **Install Dependencies**
```bash
npm ci
```

2. **Build Application**
```bash
npm run build
```

3. **Start Server**
```bash
npm start
```

4. **Set up Reverse Proxy (Nginx)**
```nginx
server {
  listen 80;
  server_name yourdomain.com;
  
  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

5. **SSL Certificate (Let's Encrypt)**
```bash
certbot certonly --standalone -d yourdomain.com
```

## Performance Optimization

### 1. CDN Configuration
- Enable Vercel Edge Network
- Configure caching headers
- Enable compression
- Optimize images

### 2. Database Optimization
```sql
-- Create indexes
CREATE INDEX idx_articles_author_id ON articles(author_id);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_security_schedule_date ON security_schedule(date);
CREATE INDEX idx_welfare_schedule_date ON welfare_schedule(date);

-- Analyze tables
ANALYZE articles;
ANALYZE messages;
ANALYZE security_schedule;
ANALYZE welfare_schedule;
```

### 3. Application Optimization
- Enable Next.js compression
- Optimize bundle size
- Implement code splitting
- Use React lazy loading
- Enable caching strategies

## Database Backups

### Automatic Backups (Supabase)
- Daily automated backups
- 30-day retention
- Point-in-time recovery available

### Manual Backups
```bash
# Export database
pg_dump postgres://user:password@host/dbname > backup.sql

# Restore database
psql postgres://user:password@host/dbname < backup.sql
```

## Monitoring & Logging

### Error Tracking (Sentry)
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Application Logging
- Use structured logging
- Log to external service
- Set appropriate log levels
- Monitor error rates

### Performance Monitoring
- Monitor API response times
- Monitor database query times
- Monitor bundle size
- Monitor Core Web Vitals

## Maintenance

### Regular Tasks
- Monitor application logs daily
- Check error rates weekly
- Update dependencies monthly
- Run security audits monthly
- Review performance metrics weekly

### Database Maintenance
- Analyze tables regularly
- Reindex tables
- Clean up old logs
- Monitor storage usage

## Rollback Procedure

If deployment fails:

1. **Check Vercel Dashboard**
   - View deployment logs
   - Check error messages
   - Redeploy previous version

2. **Manual Rollback**
   ```bash
   git revert HEAD
   git push
   ```

3. **Database Rollback**
   - Restore from backup
   - Run migration rollback

## Support & Troubleshooting

### Common Issues

**Application not loading**
- Check environment variables
- Check Supabase connection
- Check database status
- View application logs

**Slow response times**
- Check database indexes
- Check API response times
- Check CDN configuration
- Review database queries

**Database connection errors**
- Verify connection string
- Check IP whitelist
- Check database credentials
- Check firewall rules

### Debug Mode
```bash
NODE_ENV=development npm run dev
DEBUG=* npm start
```

## Cost Estimation

### Vercel (Monthly)
- Hobby: $0 (limited)
- Pro: $20
- Enterprise: Custom

### Supabase (Monthly)
- Free: $0 (limited)
- Pro: $25
- Paid: Usage-based

### Estimated Total: $45-100/month for production setup

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] Authentication implemented
- [ ] Authorization implemented
- [ ] Input validation
- [ ] Error handling
- [ ] Security headers set
