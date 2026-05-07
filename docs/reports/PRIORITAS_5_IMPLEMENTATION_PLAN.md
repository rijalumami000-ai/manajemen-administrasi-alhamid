# Prioritas 5 - Login & Role Pengguna Implementation Plan

**Date:** 2026-05-02  
**Agent:** Kiro  
**Status:** 📋 PLANNING  
**Scope:** Authentication, Authorization, Profile Management  

---

## 📋 Overview

Implementasi sistem authentication dan authorization lengkap dengan:
1. **Login System** - Username/password authentication
2. **Role Management** - Admin, Guru, Staff roles
3. **Profile Management** - View and edit user profile
4. **Change Password** - Secure password change
5. **Session Management** - JWT-based sessions
6. **Protected Routes** - Role-based access control

---

## 🎯 Features to Implement

### 1. Authentication System
- [ ] Login page (username + password)
- [ ] Logout functionality
- [ ] Session management (JWT)
- [ ] Remember me (optional)
- [ ] Password hashing (bcrypt)

### 2. Authorization System
- [ ] Role-based access control (RBAC)
- [ ] Roles: Admin, Guru, Staff
- [ ] Permission matrix
- [ ] Protected API endpoints
- [ ] Protected frontend routes

### 3. User Management
- [ ] User CRUD operations (Admin only)
- [ ] User list with roles
- [ ] Create user with role assignment
- [ ] Edit user details
- [ ] Deactivate/activate user

### 4. Profile Management
- [ ] View own profile
- [ ] Edit profile (name, email, phone)
- [ ] Upload profile photo (optional)
- [ ] View activity log (optional)

### 5. Password Management
- [ ] Change password (authenticated users)
- [ ] Password validation (min 8 chars, complexity)
- [ ] Confirm current password
- [ ] Reset password (Admin only)

---

## 🗄️ Database Schema

### Table: `users`

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- bcrypt hashed
  email VARCHAR(100) UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL,  -- 'admin', 'guru', 'staff'
  phone VARCHAR(20),
  photo_url VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Default admin user
INSERT INTO users (username, password, email, full_name, role) 
VALUES ('admin', '$2b$10$...', 'admin@sekolah.com', 'Administrator', 'admin');
```

### Table: `sessions` (Optional - for session tracking)

```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `activity_logs` (Optional - for audit trail)

```sql
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,  -- 'login', 'logout', 'create', 'update', 'delete'
  entity_type VARCHAR(50),  -- 'santri', 'guru', 'alumni', etc.
  entity_id INTEGER,
  description TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 Role & Permission Matrix

### Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **Admin** | Full system access | All features |
| **Guru** | Teacher access | View all, Edit own data |
| **Staff** | Staff access | View all, Limited edit |

### Permissions by Feature

| Feature | Admin | Guru | Staff |
|---------|-------|------|-------|
| **Dashboard** | ✅ Full | ✅ View | ✅ View |
| **Santri** | ✅ CRUD | ✅ View, Edit | ✅ View |
| **Guru** | ✅ CRUD | ✅ View own | ✅ View |
| **Kelas** | ✅ CRUD | ✅ View | ✅ View |
| **Kamar** | ✅ CRUD | ✅ View | ✅ View |
| **Tahun Ajaran** | ✅ CRUD | ✅ View | ✅ View |
| **Pelanggaran** | ✅ CRUD | ✅ CRUD | ✅ View |
| **Prestasi** | ✅ CRUD | ✅ CRUD | ✅ View |
| **Alumni** | ✅ CRUD | ✅ View | ✅ View |
| **Users** | ✅ CRUD | ❌ None | ❌ None |
| **Settings** | ✅ Full | ❌ None | ❌ None |

---

## 🏗️ Implementation Phases

### Phase 1: Database Setup ✅
**Estimated Time:** 30 minutes

- [ ] Create `users` table
- [ ] Create `sessions` table (optional)
- [ ] Create `activity_logs` table (optional)
- [ ] Add default admin user
- [ ] Test database schema

**Files:**
- `sql/auth_schema.sql` (new)
- `src/database/initDatabase.js` (update)

---

### Phase 2: Backend - Authentication ✅
**Estimated Time:** 1-2 hours

- [ ] Install dependencies (bcrypt, jsonwebtoken)
- [ ] Create auth utilities
  - Password hashing
  - JWT generation/verification
  - Token middleware
- [ ] Create auth service
  - Login
  - Logout
  - Verify token
  - Refresh token
- [ ] Create auth routes
  - POST /api/auth/login
  - POST /api/auth/logout
  - GET /api/auth/me
  - POST /api/auth/refresh

**Files:**
- `src/utils/authUtils.js` (new)
- `src/services/authService.js` (new)
- `src/routes/authRoutes.js` (new)
- `src/middleware/authMiddleware.js` (new)

---

### Phase 3: Backend - User Management ✅
**Estimated Time:** 1 hour

- [ ] Create user service
  - Get all users
  - Get user by ID
  - Create user
  - Update user
  - Delete/deactivate user
- [ ] Create user routes
  - GET /api/users (Admin only)
  - GET /api/users/:id (Admin only)
  - POST /api/users (Admin only)
  - PUT /api/users/:id (Admin only)
  - DELETE /api/users/:id (Admin only)

**Files:**
- `src/services/userService.js` (new)
- `src/routes/userRoutes.js` (new)

---

### Phase 4: Backend - Profile & Password ✅
**Estimated Time:** 1 hour

- [ ] Create profile service
  - Get own profile
  - Update own profile
  - Change password
- [ ] Create profile routes
  - GET /api/profile
  - PUT /api/profile
  - POST /api/profile/change-password

**Files:**
- `src/services/profileService.js` (new)
- `src/routes/profileRoutes.js` (new)

---

### Phase 5: Backend - Authorization Middleware ✅
**Estimated Time:** 1 hour

- [ ] Create role middleware
  - requireAuth
  - requireRole(['admin'])
  - requireRole(['admin', 'guru'])
- [ ] Apply to existing routes
  - Protect all API routes
  - Add role checks
- [ ] Update error handling

**Files:**
- `src/middleware/roleMiddleware.js` (new)
- All route files (update)

---

### Phase 6: Frontend - Login Page ✅
**Estimated Time:** 1-2 hours

- [ ] Create login page HTML
- [ ] Create login page CSS
- [ ] Create login page JS
  - Form validation
  - API call
  - Token storage
  - Redirect after login
- [ ] Error handling

**Files:**
- `public/login.html` (new)
- `public/css/login.css` (new)
- `public/js/auth/login.js` (new)

---

### Phase 7: Frontend - Auth State Management ✅
**Estimated Time:** 1 hour

- [ ] Create auth utility
  - Check if logged in
  - Get current user
  - Logout
  - Token refresh
- [ ] Add auth check to all pages
- [ ] Redirect to login if not authenticated
- [ ] Show user info in navbar

**Files:**
- `public/js/utils/authState.js` (new)
- `public/index.html` (update - add navbar user info)
- `public/script.js` (update - add auth check)

---

### Phase 8: Frontend - User Management ✅
**Estimated Time:** 1-2 hours

- [ ] Create user management page
- [ ] User list table
- [ ] Create user modal
- [ ] Edit user modal
- [ ] Role assignment
- [ ] Activate/deactivate user

**Files:**
- `public/js/features/userFeature.js` (new)
- `public/js/utils/userCrud.js` (new)
- Add to navigation menu

---

### Phase 9: Frontend - Profile Management ✅
**Estimated Time:** 1 hour

- [ ] Create profile page/modal
- [ ] View profile
- [ ] Edit profile form
- [ ] Change password form
- [ ] Validation

**Files:**
- `public/js/features/profileFeature.js` (new)
- `public/js/utils/profileCrud.js` (new)
- Add to user menu

---

### Phase 10: Frontend - Role-Based UI ✅
**Estimated Time:** 1 hour

- [ ] Hide/show menu items based on role
- [ ] Hide/show buttons based on role
- [ ] Disable features based on role
- [ ] Show role badge

**Files:**
- `public/js/utils/roleUtils.js` (new)
- All feature files (update)

---

### Phase 11: Testing ✅
**Estimated Time:** 1-2 hours

- [ ] Test authentication flow
- [ ] Test authorization (role checks)
- [ ] Test user management
- [ ] Test profile management
- [ ] Test password change
- [ ] Test protected routes
- [ ] Test error handling

**Files:**
- `tests/api/test_auth.js` (new)
- `tests/api/test_users.js` (new)
- `tests/api/test_profile.js` (new)

---

### Phase 12: Documentation ✅
**Estimated Time:** 30 minutes

- [ ] API documentation
- [ ] User guide
- [ ] Admin guide
- [ ] Security notes

**Files:**
- `docs/guides/AUTH_SYSTEM_GUIDE.md` (new)
- `docs/guides/USER_MANAGEMENT_GUIDE.md` (new)
- `docs/reports/PRIORITAS_5_IMPLEMENTATION_SUMMARY.md` (new)

---

## 🔒 Security Considerations

### Password Security
- ✅ Use bcrypt for hashing (cost factor: 10)
- ✅ Minimum 8 characters
- ✅ Require complexity (uppercase, lowercase, number)
- ✅ Never store plain text passwords
- ✅ Never log passwords

### Token Security
- ✅ Use JWT with secret key
- ✅ Short expiration (1 hour)
- ✅ Refresh token mechanism
- ✅ Store in httpOnly cookie (or localStorage with caution)
- ✅ Validate on every request

### Session Security
- ✅ Logout invalidates token
- ✅ Track active sessions
- ✅ Auto-logout on inactivity (optional)
- ✅ Single session per user (optional)

### API Security
- ✅ All routes require authentication (except login)
- ✅ Role-based access control
- ✅ Rate limiting (optional)
- ✅ CORS configuration
- ✅ Input validation

### Frontend Security
- ✅ No sensitive data in localStorage
- ✅ XSS prevention
- ✅ CSRF protection (if using cookies)
- ✅ Secure password input
- ✅ Auto-logout on token expiry

---

## 📦 Dependencies to Install

```bash
npm install bcrypt jsonwebtoken cookie-parser
```

**Packages:**
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT token generation/verification
- `cookie-parser` - Cookie parsing (if using httpOnly cookies)

---

## 🎨 UI/UX Design

### Login Page
- Clean, centered design
- School logo
- Username field
- Password field (with show/hide toggle)
- Remember me checkbox (optional)
- Login button
- Error message display

### Navbar (After Login)
- User name display
- Role badge
- Profile dropdown
  - View Profile
  - Change Password
  - Logout

### User Management Page (Admin Only)
- User list table
- Add User button
- Edit/Delete actions
- Role filter
- Active/Inactive filter

### Profile Page
- User info display
- Edit profile button
- Change password button
- Activity log (optional)

---

## 🧪 Testing Checklist

### Authentication Tests
- [ ] Login with valid credentials → Success
- [ ] Login with invalid credentials → Error
- [ ] Login with inactive user → Error
- [ ] Logout → Token invalidated
- [ ] Access protected route without token → 401
- [ ] Access protected route with expired token → 401
- [ ] Access protected route with valid token → Success

### Authorization Tests
- [ ] Admin access admin-only route → Success
- [ ] Guru access admin-only route → 403
- [ ] Staff access admin-only route → 403
- [ ] Admin CRUD users → Success
- [ ] Guru CRUD users → 403

### User Management Tests
- [ ] Create user with valid data → Success
- [ ] Create user with duplicate username → Error
- [ ] Update user → Success
- [ ] Deactivate user → Success
- [ ] Delete user → Success

### Profile Tests
- [ ] View own profile → Success
- [ ] Update own profile → Success
- [ ] Change password with correct current password → Success
- [ ] Change password with wrong current password → Error
- [ ] Change password with weak password → Error

---

## 📊 Success Criteria

### Must Have
- ✅ Login/logout working
- ✅ JWT authentication working
- ✅ Role-based access control working
- ✅ User management (Admin only)
- ✅ Profile management
- ✅ Change password
- ✅ Protected routes (backend)
- ✅ Protected routes (frontend)

### Nice to Have
- ⚠️ Remember me functionality
- ⚠️ Session tracking
- ⚠️ Activity logs
- ⚠️ Profile photo upload
- ⚠️ Password reset via email
- ⚠️ Two-factor authentication

---

## 📝 Implementation Order

**Recommended order:**

1. **Database** → Create tables and default user
2. **Backend Auth** → Login, logout, token verification
3. **Backend Middleware** → Auth and role middleware
4. **Backend User Management** → CRUD operations
5. **Backend Profile** → Profile and password management
6. **Frontend Login** → Login page and auth state
7. **Frontend Auth Check** → Protect all pages
8. **Frontend User Management** → Admin user management
9. **Frontend Profile** → Profile and password pages
10. **Frontend Role UI** → Hide/show based on role
11. **Testing** → Comprehensive testing
12. **Documentation** → Guides and API docs

---

## ⏱️ Time Estimate

| Phase | Estimated Time |
|-------|----------------|
| Phase 1: Database | 30 min |
| Phase 2: Backend Auth | 1-2 hours |
| Phase 3: Backend Users | 1 hour |
| Phase 4: Backend Profile | 1 hour |
| Phase 5: Backend Authorization | 1 hour |
| Phase 6: Frontend Login | 1-2 hours |
| Phase 7: Frontend Auth State | 1 hour |
| Phase 8: Frontend Users | 1-2 hours |
| Phase 9: Frontend Profile | 1 hour |
| Phase 10: Frontend Role UI | 1 hour |
| Phase 11: Testing | 1-2 hours |
| Phase 12: Documentation | 30 min |

**Total:** 11-16 hours (1-2 days of focused work)

---

## 🚀 Quick Start (After Implementation)

### For Admin
1. Login with default credentials
2. Go to User Management
3. Create users with roles
4. Assign permissions

### For Users
1. Login with provided credentials
2. View dashboard (based on role)
3. Access allowed features
4. Update profile
5. Change password

---

## 📚 Related Documentation

- **Authentication Guide:** `docs/guides/AUTH_SYSTEM_GUIDE.md` (to be created)
- **User Management Guide:** `docs/guides/USER_MANAGEMENT_GUIDE.md` (to be created)
- **API Documentation:** `docs/api/AUTH_API.md` (to be created)
- **Security Best Practices:** `docs/guides/SECURITY_GUIDE.md` (to be created)

---

**Status:** 📋 **PLAN COMPLETE - Ready for Implementation**  
**Next:** Start with Phase 1 (Database Setup)

---

**Prepared By:** Kiro  
**Date:** 2026-05-02  
**Estimated Completion:** 2026-05-03 or 2026-05-04
