# 📋 Deployment Checklist: Smart Migration Feature

## ✅ Pre-Deployment Checklist

### 1. Database Migration
- [ ] Backup database production
- [ ] Run migration script: `node migrations/add_tingkat_to_kelas.js up`
- [ ] Verify all classes have tingkat assigned
- [ ] Test rollback script (optional): `node migrations/add_tingkat_to_kelas.js down`

### 2. Code Verification
- [ ] All services implemented:
  - [ ] `src/services/autoAdvanceEngine.js`
  - [ ] `src/services/alumniManager.js`
  - [ ] `src/services/migrationValidator.js`
  - [ ] `src/utils/classProgressionMap.js`
- [ ] Routes updated:
  - [ ] `src/routes/tahunAjaranRoutes.js` (migration & rollback)
  - [ ] `src/routes/kelasRoutes.js` (tingkat support)
- [ ] Frontend updated:
  - [ ] `frontend/src/components/features/MigrationModal.jsx`
  - [ ] `frontend/src/pages/Santri.jsx`

### 3. Testing Completed
- [ ] Basic migration works
- [ ] Rollback works
- [ ] Add/edit kelas works
- [ ] Alumni creation works (optional but recommended)
- [ ] Validation works (missing classes detected)

### 4. Frontend Build
- [ ] Run: `cd frontend && npm run build`
- [ ] Copy to public: `Copy-Item -Path "frontend/dist/*" -Destination "public/" -Recurse -Force`
- [ ] Test in browser: All features work

---

## 🚀 Deployment Steps

### Step 1: Backup Production Database

```bash
# PostgreSQL backup
pg_dump -U [username] -d [database_name] > backup_before_migration_$(date +%Y%m%d).sql

# Or use your preferred backup method
```

### Step 2: Deploy Code to Production

```bash
# Pull latest code
git pull origin main

# Install dependencies (if any new)
npm install
cd frontend && npm install && cd ..

# Build frontend
cd frontend
npm run build
cd ..

# Copy frontend to public
Copy-Item -Path "frontend/dist/*" -Destination "public/" -Recurse -Force
```

### Step 3: Run Database Migration

```bash
# Run migration
node migrations/add_tingkat_to_kelas.js up

# Verify
# Check that all classes have tingkat assigned
```

### Step 4: Restart Server

```bash
# Stop current server
# Start server with process manager (PM2, systemd, etc.)

# Example with PM2:
pm2 restart app

# Or manual:
node server.js
```

### Step 5: Verify Deployment

- [ ] Server starts without errors
- [ ] Can access application
- [ ] Can view santri list
- [ ] Can open migration modal
- [ ] Preview shows auto-advance correctly

---

## 🔄 Rollback Plan (If Something Goes Wrong)

### If Migration Script Fails:

```bash
# Rollback database migration
node migrations/add_tingkat_to_kelas.js down

# Restore from backup
psql -U [username] -d [database_name] < backup_before_migration_YYYYMMDD.sql
```

### If Application Breaks:

```bash
# Revert to previous code version
git revert HEAD

# Or checkout previous commit
git checkout [previous_commit_hash]

# Rebuild frontend
cd frontend && npm run build && cd ..
Copy-Item -Path "frontend/dist/*" -Destination "public/" -Recurse -Force

# Restart server
pm2 restart app
```

---

## 📊 Post-Deployment Verification

### 1. Smoke Tests
- [ ] Application loads
- [ ] Can login (if applicable)
- [ ] Can view santri list
- [ ] Can view kelas list
- [ ] Can add new kelas

### 2. Feature Tests
- [ ] Open migration modal
- [ ] Preview shows class progression
- [ ] Can execute migration
- [ ] Migration statistics correct
- [ ] Can rollback migration

### 3. Performance Check
- [ ] Page load times acceptable
- [ ] Migration completes in reasonable time
- [ ] No memory leaks
- [ ] Database queries optimized

---

## 🐛 Troubleshooting

### Issue: "Some classes do not have tingkat assigned"

**Solution:**
```sql
-- Find classes without tingkat
SELECT id, jenis, nama FROM kelas WHERE tingkat IS NULL;

-- Update manually
UPDATE kelas SET tingkat = [correct_tingkat] WHERE id = [class_id];
```

### Issue: Migration fails with "Missing target classes"

**Solution:**
- Check error message for missing classes
- Add missing classes via UI or SQL
- Retry migration

### Issue: Frontend not updating

**Solution:**
```bash
# Clear browser cache (Ctrl+Shift+R)
# Or rebuild frontend
cd frontend && npm run build && cd ..
Copy-Item -Path "frontend/dist/*" -Destination "public/" -Recurse -Force
```

---

## 📝 Documentation Updates

### Update User Manual
- [ ] Document new migration flow
- [ ] Document auto-advance feature
- [ ] Document alumni management
- [ ] Document rollback feature

### Update Technical Documentation
- [ ] API documentation (if applicable)
- [ ] Database schema changes
- [ ] Service architecture
- [ ] Deployment procedures

---

## 🎓 Training Users

### Key Points to Communicate:

1. **Auto-Advance Feature**
   - System automatically advances class levels
   - Preview shows current → next class
   - Can exclude specific students

2. **Alumni Management**
   - Diniyah level 6 → Alumni (if no Sekolah)
   - MTs level 9 → Continues to MA (not alumni)
   - MA level 12 → Alumni immediately

3. **Rollback Capability**
   - Can undo migration if needed
   - Deletes alumni records created during migration
   - Restores all statuses

4. **Validation**
   - System checks for missing classes
   - Prevents migration if classes don't exist
   - Clear error messages

---

## ✅ Final Checklist

- [ ] Database backed up
- [ ] Code deployed
- [ ] Migration script executed
- [ ] Server restarted
- [ ] Smoke tests passed
- [ ] Feature tests passed
- [ ] Users trained
- [ ] Documentation updated
- [ ] Monitoring in place

---

## 🎉 Deployment Complete!

**Congratulations!** The Smart Migration feature is now live in production! 🚀

**Next Steps:**
- Monitor for any issues
- Gather user feedback
- Plan for future enhancements

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Version:** 1.0.0
