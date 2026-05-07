# 📋 Alumni Refactor Plan

**Tanggal:** 2026-05-01  
**Agent:** Kiro  
**Prioritas:** Prioritas 2 dari ROADMAP  
**Status:** 🔄 IN PROGRESS - Phase 1: Analysis

---

## 📊 Current State Analysis

### File Sizes:
| File | Lines | Size | Status |
|------|-------|------|--------|
| `public/alumni_script.js` | 821 | 30 KB | ⚠️ **TOO BIG** |
| `public/alumni.html` | 619 | 18 KB | ⚠️ **TOO BIG** |
| `src/routes/alumniRoutes.js` | 374 | 14 KB | ⚠️ **BIG** |

### Functions in alumni_script.js (35 functions):

**Utility Functions (5):**
1. `escapeHtml()` - HTML escaping
2. `mergeAdditionalInfo()` - Merge alumni data
3. `rememberAdditionalInfo()` - LocalStorage
4. `toDateInputValue()` - Date formatting
5. `formatDate()` - Date display

**Sidebar Functions (3):**
6. `setSidebarState()` - Sidebar toggle
7. `closeSidebar()` - Close sidebar
8. `setMenuGroupExpanded()` - Menu expand/collapse

**Data Loading (4):**
9. `init()` - Initialize
10. `loadKamarList()` - Load kamar data
11. `loadAlumni()` - Load alumni data
12. `loadSantriList()` - Load santri for migration

**Display Functions (3):**
13. `displayAlumni()` - Display alumni cards
14. `updateStats()` - Update statistics
15. `populateYearFilter()` - Populate year dropdown

**Search & Filter (2):**
16. `searchAlumni()` - Search functionality
17. `resetSearch()` - Reset search

**Modal Functions (6):**
18. `openAddModal()` - Open add modal
19. `closeAddModal()` - Close add modal
20. `openEditModal()` - Open edit modal
21. `closeEditModal()` - Close edit modal
22. `closeDetailModal()` - Close detail modal
23. `openAdditionalModal()` - Open additional info modal
24. `closeAdditionalModal()` - Close additional modal

**Autocomplete (2):**
25. `setupSantriAutocomplete()` - Setup autocomplete
26. `loadSantriPreview()` - Preview santri data

**CRUD Operations (5):**
27. `saveManualAlumni()` - Create alumni manually
28. `migrateSantri()` - Migrate santri to alumni
29. `updateAlumni()` - Update alumni
30. `deleteAlumni()` - Delete alumni
31. `saveAdditionalInfo()` - Save additional info

**Detail View (6):**
32. `showDetail()` - Show detail modal
33. `displayDetailInfo()` - Display info tab
34. `displayDetailKelas()` - Display kelas history
35. `displayDetailKamar()` - Display kamar history
36. `displayDetailPrestasi()` - Display prestasi
37. `displayDetailPelanggaran()` - Display pelanggaran

**Tab Switching (1):**
38. `switchDetailTab()` - Switch detail tabs

---

## 🎯 Refactor Strategy

### Goal:
Pisahkan `alumni_script.js` (821 lines) menjadi modul-modul kecil yang terorganisir, mengikuti pola yang sudah diterapkan Codex pada fitur lain.

### Target Structure:

```
public/js/features/
  alumniFeature.js          (Main orchestrator, ~150 lines)
  
public/js/utils/
  alumniDisplay.js          (Display & rendering, ~200 lines)
  alumniModal.js            (Modal management, ~150 lines)
  alumniCrud.js             (CRUD operations, ~200 lines)
  alumniDetail.js           (Detail view, ~150 lines)
```

---

## 📦 Module Breakdown

### 1. `public/js/features/alumniFeature.js` (Main)

**Responsibility:** Orchestrator & initialization

**Functions:**
- `init()` - Main initialization
- `loadAlumni()` - Load alumni data
- `loadSantriList()` - Load santri list
- `loadKamarList()` - Load kamar list
- `searchAlumni()` - Search functionality
- `resetSearch()` - Reset search
- Global state management (allAlumni, allSantri, allKamar)

**Exports:**
```javascript
export {
  init,
  loadAlumni,
  searchAlumni,
  resetSearch,
  allAlumni,
  allSantri
};
```

---

### 2. `public/js/utils/alumniDisplay.js`

**Responsibility:** Display & rendering functions

**Functions:**
- `displayAlumni()` - Render alumni cards
- `updateStats()` - Update statistics
- `populateYearFilter()` - Populate year filter
- `formatDate()` - Date formatting
- `escapeHtml()` - HTML escaping

**Exports:**
```javascript
export {
  displayAlumni,
  updateStats,
  populateYearFilter,
  formatDate,
  escapeHtml
};
```

---

### 3. `public/js/utils/alumniModal.js`

**Responsibility:** Modal management

**Functions:**
- `openAddModal()` - Open add modal
- `closeAddModal()` - Close add modal
- `openEditModal()` - Open edit modal
- `closeEditModal()` - Close edit modal
- `openAdditionalModal()` - Open additional info modal
- `closeAdditionalModal()` - Close additional modal
- `setupSantriAutocomplete()` - Autocomplete setup
- `loadSantriPreview()` - Preview santri
- `toDateInputValue()` - Date input helper

**Exports:**
```javascript
export {
  openAddModal,
  closeAddModal,
  openEditModal,
  closeEditModal,
  openAdditionalModal,
  closeAdditionalModal,
  setupSantriAutocomplete,
  loadSantriPreview
};
```

---

### 4. `public/js/utils/alumniCrud.js`

**Responsibility:** CRUD operations

**Functions:**
- `saveManualAlumni()` - Create alumni
- `migrateSantri()` - Migrate santri
- `updateAlumni()` - Update alumni
- `deleteAlumni()` - Delete alumni
- `saveAdditionalInfo()` - Save additional info
- `mergeAdditionalInfo()` - Merge data
- `rememberAdditionalInfo()` - LocalStorage

**Exports:**
```javascript
export {
  saveManualAlumni,
  migrateSantri,
  updateAlumni,
  deleteAlumni,
  saveAdditionalInfo
};
```

---

### 5. `public/js/utils/alumniDetail.js`

**Responsibility:** Detail view & tabs

**Functions:**
- `showDetail()` - Show detail modal
- `closeDetailModal()` - Close detail modal
- `displayDetailInfo()` - Display info tab
- `displayDetailKelas()` - Display kelas history
- `displayDetailKamar()` - Display kamar history
- `displayDetailPrestasi()` - Display prestasi
- `displayDetailPelanggaran()` - Display pelanggaran
- `switchDetailTab()` - Switch tabs

**Exports:**
```javascript
export {
  showDetail,
  closeDetailModal,
  switchDetailTab
};
```

---

## 🔄 Migration Steps

### Phase 1: Analysis ✅ DONE
- [x] Analyze file sizes
- [x] List all functions
- [x] Group functions by responsibility
- [x] Create refactor plan

### Phase 2: Create Module Structure
- [ ] Create `public/js/features/alumniFeature.js`
- [ ] Create `public/js/utils/alumniDisplay.js`
- [ ] Create `public/js/utils/alumniModal.js`
- [ ] Create `public/js/utils/alumniCrud.js`
- [ ] Create `public/js/utils/alumniDetail.js`

### Phase 3: Move Functions
- [ ] Move display functions to alumniDisplay.js
- [ ] Move modal functions to alumniModal.js
- [ ] Move CRUD functions to alumniCrud.js
- [ ] Move detail functions to alumniDetail.js
- [ ] Keep main orchestrator in alumniFeature.js

### Phase 4: Update alumni_script.js
- [ ] Import all modules
- [ ] Wire up functions
- [ ] Remove sidebar code (use shared sidebar from main)
- [ ] Keep only initialization code

### Phase 5: Update alumni.html
- [ ] Change script import to use modules
- [ ] Update inline onclick handlers (if any)
- [ ] Test all functionality

### Phase 6: Backend Review
- [ ] Review `src/routes/alumniRoutes.js` (374 lines)
- [ ] Check if needs refactoring
- [ ] Extract service layer if needed

### Phase 7: Testing
- [ ] Test alumni list display
- [ ] Test search & filter
- [ ] Test add alumni (manual)
- [ ] Test migrate santri
- [ ] Test edit alumni
- [ ] Test delete alumni
- [ ] Test detail view (all tabs)
- [ ] Test additional info
- [ ] Test responsive design

### Phase 8: Documentation
- [ ] Update `docs/alumni/` documentation
- [ ] Add JSDoc comments
- [ ] Update PROJECT_STRUCTURE.md

---

## 🎨 UI Consistency Check

Compare with dashboard (`public/index.html`):

**To Check:**
- [ ] Sidebar structure sama?
- [ ] Card styling sama?
- [ ] Modal styling sama?
- [ ] Button styling sama?
- [ ] Form styling sama?
- [ ] Table styling sama?
- [ ] Responsive behavior sama?

**To Align:**
- [ ] Use same CSS classes
- [ ] Use same component patterns
- [ ] Use same color scheme
- [ ] Use same spacing

---

## ⚠️ Risks & Considerations

### Risks:
1. **Breaking functionality** - Alumni feature complex dengan banyak modal
2. **LocalStorage data** - Jangan sampai hilang (alumniAdditionalInfo, santriKamarOverrides)
3. **Inline handlers** - Perlu update jika ada onclick di HTML
4. **Global state** - allAlumni, allSantri, allKamar perlu dikelola dengan baik

### Mitigation:
1. **Test setiap step** - Jangan lanjut jika ada yang rusak
2. **Backup file** - Simpan alumni_script.js original
3. **Incremental refactor** - Satu modul per step
4. **Keep localStorage** - Jangan ubah key names

---

## 📊 Expected Results

### Before:
```
public/alumni_script.js    821 lines (monolithic)
```

### After:
```
public/js/features/alumniFeature.js     ~150 lines
public/js/utils/alumniDisplay.js        ~200 lines
public/js/utils/alumniModal.js          ~150 lines
public/js/utils/alumniCrud.js           ~200 lines
public/js/utils/alumniDetail.js         ~150 lines
-------------------------------------------
Total:                                  ~850 lines (modular)
```

**Benefits:**
- ✅ Modular & maintainable
- ✅ Easier to test
- ✅ Consistent with other features
- ✅ Better code organization
- ✅ Reusable components

---

## 🚀 Next Action

**Ready to start Phase 2: Create Module Structure**

Mau saya lanjut? 🎯
