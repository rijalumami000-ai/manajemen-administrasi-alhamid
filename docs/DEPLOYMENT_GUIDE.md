# Deployment Guide - Sistem Informasi Pesantren

**Last Updated**: May 2, 2026

## 📋 Pre-Deployment Checklist

### Backend Preparation
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Database backup created
- [ ] API endpoints tested
- [ ] CORS configured for production domain
- [ ] Session secret configured
- [ ] Port configuration set
- [ ] Error logging configured
- [ ] Rate limiting configured (if needed)

### Frontend Preparation
- [ ] Environment variables configured
- [ ] API base URL set to production
- [ ] Build tested locally
- [ ] Assets optimized
- [ ] Console.log statements removed
- [ ] Source maps configured
- [ ] Meta tags updated
- [ ] Favicon added

### Security
- [ ] HTTPS/SSL certificate ready
- [ ] Secure headers configured
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] CSRF protection enabled
- [ ] Password hashing verified
- [ ] Session security configured
- [ ] Input validation on all endpoints

### Testing
- [ ] All features tested manually
- [ ] Cross-browser testing completed
- [ ] Mobile testing completed
- [ ] Performance testing completed
- [ ] Load testing completed (if needed)

## 🔧 Environment Configuration

### Backend Environment Variables

Create `.env` file in root directory:

```env
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
DB_NAME=pesantren_db
DB_PORT=3306

# Session Configuration
SESSION_SECRET=your_very_long_random_secret_key_here_min_32_chars

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# Optional: Email Configuration (if needed)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Optional: File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

### Frontend Environment Variables

Create `.env.production` in `frontend/` directory:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_NAME=Sistem Informasi Pesantren
```

## 🏗️ Build Process

### 1. Backend Build

```bash
# Install dependencies
npm install --production

# Run database migrations (if any)
npm run migrate

# Test the server
npm start
```

### 2. Frontend Build

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Test the build locally
npm run preview
```

The build output will be in `frontend/dist/` directory.

### 3. Build Optimization

**Vite automatically optimizes:**
- Code splitting
- Tree shaking
- Minification
- Asset optimization
- Gzip compression

**Check build size:**
```bash
cd frontend
npm run build
# Check dist/ folder size
du -sh dist/
```

**Target**: < 1MB for initial bundle

## 🚀 Deployment Options

### Option 1: VPS/Dedicated Server (Recommended)

#### Requirements
- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+ installed
- MySQL 8+ installed
- Nginx installed
- SSL certificate (Let's Encrypt)

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Certbot (for SSL)
sudo apt install -y certbot python3-certbot-nginx
```

#### Step 2: Database Setup

```bash
# Login to MySQL
sudo mysql

# Create database and user
CREATE DATABASE pesantren_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pesantren_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON pesantren_db.* TO 'pesantren_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import database schema
mysql -u pesantren_user -p pesantren_db < database/schema.sql
```

#### Step 3: Deploy Backend

```bash
# Create app directory
sudo mkdir -p /var/www/pesantren-api
sudo chown $USER:$USER /var/www/pesantren-api

# Clone or upload your code
cd /var/www/pesantren-api
# Upload your backend files here

# Install dependencies
npm install --production

# Create .env file
nano .env
# Add your production environment variables

# Start with PM2
pm2 start server.js --name pesantren-api
pm2 save
pm2 startup
```

#### Step 4: Deploy Frontend

```bash
# Create frontend directory
sudo mkdir -p /var/www/pesantren-frontend
sudo chown $USER:$USER /var/www/pesantren-frontend

# Upload built files
cd /var/www/pesantren-frontend
# Upload contents of frontend/dist/ here
```

#### Step 5: Nginx Configuration

Create `/etc/nginx/sites-available/pesantren`:

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/pesantren-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/pesantren /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 6: SSL Certificate

```bash
# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

### Option 2: Docker Deployment

#### Dockerfile (Backend)

Create `Dockerfile` in root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

#### Dockerfile (Frontend)

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: pesantren_db
      MYSQL_USER: pesantren_user
      MYSQL_PASSWORD: secure_password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "3306:3306"

  backend:
    build: .
    environment:
      NODE_ENV: production
      DB_HOST: mysql
      DB_USER: pesantren_user
      DB_PASSWORD: secure_password
      DB_NAME: pesantren_db
      SESSION_SECRET: your_secret_key
    ports:
      - "3000:3000"
    depends_on:
      - mysql

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

Deploy with Docker:
```bash
docker-compose up -d
```

### Option 3: Cloud Platforms

#### Vercel (Frontend Only)

```bash
cd frontend

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Heroku (Backend)

```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create pesantren-api

# Add MySQL addon
heroku addons:create jawsdb:kitefin

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=your_secret

# Deploy
git push heroku main
```

#### Railway (Full Stack)

1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically on push

## 🔒 Security Hardening

### 1. Nginx Security Headers

Add to nginx config:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

### 2. Rate Limiting

Install express-rate-limit:

```bash
npm install express-rate-limit
```

Add to server.js:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 3. Helmet.js

```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

## 📊 Monitoring & Logging

### PM2 Monitoring

```bash
# View logs
pm2 logs pesantren-api

# Monitor resources
pm2 monit

# View status
pm2 status
```

### Log Files

Configure in server.js:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 🔄 Backup Strategy

### Database Backup

Create backup script `backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/pesantren"
mkdir -p $BACKUP_DIR

mysqldump -u pesantren_user -p'password' pesantren_db > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

Schedule with cron:
```bash
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

## 🧪 Post-Deployment Testing

### Smoke Tests

- [ ] Homepage loads
- [ ] Login works
- [ ] Dashboard displays data
- [ ] Create operation works
- [ ] Edit operation works
- [ ] Delete operation works
- [ ] Search works
- [ ] Filter works
- [ ] Pagination works
- [ ] Logout works

### Performance Tests

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test homepage
ab -n 1000 -c 10 https://yourdomain.com/

# Test API endpoint
ab -n 1000 -c 10 https://api.yourdomain.com/api/santri
```

### SSL Test

Visit: https://www.ssllabs.com/ssltest/

Target: A+ rating

## 📱 Domain Configuration

### DNS Records

Add these records to your domain:

```
Type    Name    Value                   TTL
A       @       your_server_ip          3600
A       www     your_server_ip          3600
A       api     your_server_ip          3600
```

## 🔧 Maintenance

### Update Application

```bash
# Pull latest code
cd /var/www/pesantren-api
git pull

# Install dependencies
npm install --production

# Restart
pm2 restart pesantren-api

# Frontend
cd /var/www/pesantren-frontend
# Upload new build files
```

### Update SSL Certificate

```bash
# Certbot auto-renews, but you can force renewal
sudo certbot renew --force-renewal
```

### Monitor Disk Space

```bash
df -h
```

### Monitor Memory

```bash
free -h
```

## 🆘 Troubleshooting

### Backend Not Starting

```bash
# Check logs
pm2 logs pesantren-api

# Check if port is in use
sudo lsof -i :3000

# Restart
pm2 restart pesantren-api
```

### Frontend Not Loading

```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log

# Test Nginx config
sudo nginx -t
```

### Database Connection Error

```bash
# Check MySQL status
sudo systemctl status mysql

# Check MySQL error log
sudo tail -f /var/log/mysql/error.log

# Test connection
mysql -u pesantren_user -p pesantren_db
```

### SSL Certificate Issues

```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew
```

## 📞 Support

For deployment issues, check:
1. Server logs: `pm2 logs`
2. Nginx logs: `/var/log/nginx/`
3. MySQL logs: `/var/log/mysql/`
4. Application logs: `./logs/`

---

**Deployment Complete!** 🎉

Your application is now live and accessible to users.
