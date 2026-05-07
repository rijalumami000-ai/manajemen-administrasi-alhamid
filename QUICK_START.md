# 🚀 Quick Start Guide

**Sistem Informasi Pesantren - React Version 2.0.0**

---

## ⚡ Super Quick Start (5 Minutes)

```bash
# 1. Clone & Install
git clone <repository-url>
cd pesantren-system
npm install
cd frontend && npm install && cd ..

# 2. Setup Database
# Create PostgreSQL database named 'sekolah_info'
psql -U postgres -c "CREATE DATABASE sekolah_info;"
psql -U postgres sekolah_info -f sql/init.sql
psql -U postgres sekolah_info -f sql/auth_schema.sql

# 3. Configure Environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Run Application
npm run dev:all

# 5. Open Browser
# Frontend: http://localhost:3001
# Backend: http://localhost:3000
```

**Default Login:**
- Username: `admin`
- Password: `admin123`

---

## 📋 Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 8+ ([Download](https://www.postgresql.org/download/))
- **npm** or **yarn**
- **Git** (optional)

---

## 🔧 Detailed Setup

### 1. Install Dependencies

```bash
# Backend dependencies
npm install

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Database Setup

**Create Database:**
```bash
psql -U postgres
CREATE DATABASE sekolah_info;
\q
```

**Import Schema:**
```bash
# Main schema
psql -U postgres sekolah_info -f sql/init.sql

# Authentication schema
psql -U postgres sekolah_info -f sql/auth_schema.sql
```

**Verify:**
```bash
psql -U postgres sekolah_info -c "\dt"
# Should show 13 tables
```

### 3. Environment Configuration

**Create `.env` file:**
```bash
cp .env.example .env
```

**Edit `.env`:**
```env
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=sekolah_info
PGPORT=5432
```

### 4. Run Application

**Option 1: Run Both (Recommended)**
```bash
npm run dev:all
```

**Option 2: Run Separately**
```bash
# Terminal 1 - Backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Access Application

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000/api

---

## 👤 Default Users

| Username | Password | Role | Access |
|----------|----------|------|--------|
| `admin` | `admin123` | Admin | Full access |
| `guru1` | `guru123` | Guru | Limited access |
| `staff1` | `staff123` | Staff | View only |

⚠️ **Change passwords after first login!**

---

## 🎯 First Steps After Login

1. **Explore Dashboard** - View summary statistics
2. **Check Data Santri** - View existing students
3. **Try Adding Data** - Create a new student
4. **Test Search & Filter** - Use search functionality
5. **Change Your Password** - Profile → Change Password

---

## 📁 Project Structure

```
pesantren-system/
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── styles/       # CSS files
│   └── package.json
├── src/                  # Backend source
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   └── utils/            # Utilities
├── sql/                  # Database schema
├── docs/                 # Documentation
├── tests/                # Test files
├── server.js             # Backend entry
└── package.json
```

---

## 🧪 Testing

### Run API Tests

```bash
# Verify all endpoints
node tests/verify_all_endpoints.js

# Comprehensive feature tests
node tests/api/test_all_features_comprehensive.js

# Authentication tests
node tests/api/test_auth_complete.js
```

**Expected:** All tests should pass (100% pass rate)

### Manual Testing

Use the comprehensive checklist:
```bash
# Open in browser
docs/TESTING_CHECKLIST.md
```

---

## 🐛 Troubleshooting

### Backend Won't Start

**Problem:** `Error: connect ECONNREFUSED`

**Solution:**
```bash
# Check PostgreSQL is running
# Windows:
services.msc  # Look for PostgreSQL

# Mac/Linux:
sudo systemctl status postgresql

# Verify database exists
psql -U postgres -l | grep sekolah_info
```

### Frontend Won't Start

**Problem:** `Error: Cannot find module`

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Login Not Working

**Problem:** Invalid credentials

**Solution:**
```bash
# Reset admin password
psql -U postgres sekolah_info

UPDATE users 
SET password = '$2b$10$YourHashedPassword' 
WHERE username = 'admin';
```

Or check `sql/auth_schema.sql` for default passwords.

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

---

## 📚 Documentation

### Essential Docs
- **[Project Status](docs/PROJECT_STATUS.md)** - Current status
- **[Development Guide](docs/DEVELOPMENT_GUIDE.md)** - Development guidelines
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Deploy to production
- **[Testing Checklist](docs/TESTING_CHECKLIST.md)** - 200+ test checkpoints

### Feature Docs
- **[Roadmap](docs/ROADMAP.md)** - Project roadmap
- **[React Migration](docs/REACT_MIGRATION_SUMMARY.md)** - Migration overview
- **[Alumni Feature](docs/alumni/ALUMNI_IMPLEMENTATION_SUMMARY.md)** - Alumni docs

---

## 🚀 Next Steps

### For Developers
1. Read `docs/DEVELOPMENT_GUIDE.md`
2. Explore the codebase
3. Try making a small change
4. Run tests
5. Check documentation

### For Users
1. Change default passwords
2. Add your data (santri, guru, kelas, kamar)
3. Explore all features
4. Report any issues
5. Provide feedback

### For Deployment
1. Read `docs/DEPLOYMENT_GUIDE.md`
2. Choose deployment platform
3. Configure production environment
4. Deploy backend & frontend
5. Setup monitoring

---

## 💡 Tips

### Development
- Use `npm run dev:all` for hot reload
- Check browser console for errors
- Use React DevTools for debugging
- Check `docs/AGENT_NOTES.md` for recent changes

### Performance
- Frontend build: `cd frontend && npm run build`
- Check bundle size: `du -sh frontend/dist`
- Optimize images before upload
- Use pagination for large datasets

### Security
- Change default passwords immediately
- Use strong passwords (min 8 chars)
- Keep dependencies updated
- Review `docs/DEPLOYMENT_GUIDE.md` security section

---

## 📞 Getting Help

### Documentation
- Check `docs/` folder for comprehensive guides
- Read `README.md` for overview
- Check `CHANGELOG.md` for recent changes

### Common Issues
- Database connection: Check `.env` file
- Port conflicts: Change port in config
- Module not found: Run `npm install`
- Build errors: Clear cache and rebuild

### Support
- Review documentation first
- Check testing checklist
- Look at agent notes for recent changes
- Check GitHub issues (if applicable)

---

## ✅ Checklist

Before you start developing:

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 8+ installed
- [ ] Database created and schema imported
- [ ] `.env` file configured
- [ ] Dependencies installed (backend & frontend)
- [ ] Application runs without errors
- [ ] Can login with default credentials
- [ ] All tests pass
- [ ] Documentation reviewed

---

## 🎉 You're Ready!

The application is now running. Start exploring and building!

**Happy Coding!** 🚀

---

**Version:** 2.0.0  
**Status:** Production Ready  
**Last Updated:** 2026-05-02
