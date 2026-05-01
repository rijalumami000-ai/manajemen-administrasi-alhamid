# Implementation Plan: Pelanggaran & Prestasi

## Overview

This implementation plan breaks down the "Pelanggaran & Prestasi" feature into discrete, incremental coding tasks. The feature adds violation and achievement tracking capabilities to the SI Internal Pesantren application, following the existing architecture patterns (Node.js/Express backend, vanilla JavaScript frontend, PostgreSQL database).

The implementation follows this sequence:
1. Database schema setup
2. Backend API endpoints for pelanggaran
3. Backend API endpoints for prestasi
4. Frontend UI structure and navigation
5. Frontend forms and CRUD operations for pelanggaran
6. Frontend forms and CRUD operations for prestasi
7. Integration and final testing

## Tasks

- [x] 1. Set up database schema for pelanggaran and prestasi tables
  - Add CREATE TABLE statements to sql/init.sql for both pelanggaran and prestasi tables
  - Include all required columns: id, santri_id, jenis, tanggal, deskripsi, sanksi/penghargaan, created_at
  - Add foreign key constraints with ON DELETE RESTRICT to santri table
  - Add indexes on santri_id and tanggal columns for query performance
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 2. Implement backend API endpoints for pelanggaran
  - [x] 2.1 Create GET /api/pelanggaran endpoint
    - Write SQL query with JOIN to santri table to retrieve all pelanggaran records
    - Include santri NIS and nama in response
    - Order by tanggal DESC
    - Add error handling with try-catch
    - _Requirements: 7.1, 7.8_
  
  - [x] 2.2 Create POST /api/pelanggaran endpoint
    - Validate required fields: santri_id, jenis, tanggal
    - Use normalizeText function for text inputs
    - Insert record into pelanggaran table
    - Return 201 status with created record
    - Return 400 status for validation errors
    - _Requirements: 1.3, 1.4, 7.2, 7.6, 7.8, 10.1, 10.2, 10.3, 10.7_
  
  - [x] 2.3 Create PUT /api/pelanggaran/:id endpoint
    - Validate required fields: santri_id, jenis, tanggal
    - Check if record exists, return 404 if not found
    - Update record in pelanggaran table
    - Return updated record
    - _Requirements: 1.6, 7.3, 7.7, 7.8_
  
  - [x] 2.4 Create DELETE /api/pelanggaran/:id endpoint
    - Check if record exists, return 404 if not found
    - Delete record from pelanggaran table
    - Return success message
    - _Requirements: 1.7, 7.4, 7.7, 7.8_
  
  - [x] 2.5 Create GET /api/pelanggaran/santri/:santriId endpoint
    - Write SQL query to retrieve all pelanggaran for specific santri
    - Include JOIN to santri table for santri details
    - Order by tanggal DESC
    - _Requirements: 5.1, 5.3, 7.5, 7.8_

- [x] 3. Checkpoint - Verify pelanggaran API endpoints
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement backend API endpoints for prestasi
  - [x] 4.1 Create GET /api/prestasi endpoint
    - Write SQL query with JOIN to santri table to retrieve all prestasi records
    - Include santri NIS and nama in response
    - Order by tanggal DESC
    - Add error handling with try-catch
    - _Requirements: 8.1, 8.8_
  
  - [x] 4.2 Create POST /api/prestasi endpoint
    - Validate required fields: santri_id, jenis, tanggal
    - Use normalizeText function for text inputs
    - Insert record into prestasi table
    - Return 201 status with created record
    - Return 400 status for validation errors
    - _Requirements: 3.3, 3.4, 8.2, 8.6, 8.8, 10.4, 10.5, 10.6, 10.7_
  
  - [x] 4.3 Create PUT /api/prestasi/:id endpoint
    - Validate required fields: santri_id, jenis, tanggal
    - Check if record exists, return 404 if not found
    - Update record in prestasi table
    - Return updated record
    - _Requirements: 3.6, 8.3, 8.7, 8.8_
  
  - [x] 4.4 Create DELETE /api/prestasi/:id endpoint
    - Check if record exists, return 404 if not found
    - Delete record from prestasi table
    - Return success message
    - _Requirements: 3.7, 8.4, 8.7, 8.8_
  
  - [x] 4.5 Create GET /api/prestasi/santri/:santriId endpoint
    - Write SQL query to retrieve all prestasi for specific santri
    - Include JOIN to santri table for santri details
    - Order by tanggal DESC
    - _Requirements: 5.2, 5.3, 8.5, 8.8_

- [x] 5. Checkpoint - Verify prestasi API endpoints
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Add navigation menu item for Pelanggaran & Prestasi
  - Add menu item to sidebar in public/index.html
  - Use existing menu item pattern with data-target attribute
  - Add menu label "Pelanggaran & Prestasi"
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 7. Create main panel structure for Pelanggaran & Prestasi
  - [x] 7.1 Add panel section to public/index.html
    - Create section with id="pelanggaran-prestasi-panel" and class="panel"
    - Add panel header with title and description
    - Create tab bar structure for switching between Pelanggaran and Prestasi
    - Add action buttons area for "Tambah Pelanggaran" and "Tambah Prestasi"
    - _Requirements: 1.1, 3.1, 11.1, 11.2, 11.3, 11.6_
  
  - [x] 7.2 Create table containers for both tabs
    - Add table-card div for Pelanggaran tab with table structure
    - Add table-card div for Prestasi tab with table structure
    - Define table headers for Pelanggaran: NIS, Nama Santri, Jenis, Tanggal, Deskripsi, Sanksi, Aksi
    - Define table headers for Prestasi: NIS, Nama Santri, Jenis, Tanggal, Deskripsi, Penghargaan, Aksi
    - Add empty tbody elements with unique IDs
    - _Requirements: 1.1, 1.8, 3.1, 3.8, 11.3, 11.6_

- [x] 8. Create modal forms for Pelanggaran and Prestasi
  - [x] 8.1 Add Pelanggaran modal to public/index.html
    - Create modal structure with id="modal-pelanggaran"
    - Add form with fields: santri dropdown, jenis (text), tanggal (date), deskripsi (textarea), sanksi (textarea)
    - Mark required fields with asterisk
    - Add modal header with title and close button
    - Add modal actions with Cancel and Submit buttons
    - Use existing modal styling patterns
    - _Requirements: 1.2, 1.4, 11.1, 11.2, 11.4, 11.7_
  
  - [x] 8.2 Add Prestasi modal to public/index.html
    - Create modal structure with id="modal-prestasi"
    - Add form with fields: santri dropdown, jenis (text), tanggal (date), deskripsi (textarea), penghargaan (text)
    - Mark required fields with asterisk
    - Add modal header with title and close button
    - Add modal actions with Cancel and Submit buttons
    - Use existing modal styling patterns
    - _Requirements: 3.2, 3.4, 11.1, 11.2, 11.4, 11.7_

- [x] 9. Implement frontend JavaScript for navigation and tab switching
  - [x] 9.1 Add menu navigation handler in public/script.js
    - Add event listener for "Pelanggaran & Prestasi" menu item
    - Implement showPanel function call to display pelanggaran-prestasi-panel
    - Update active menu state
    - _Requirements: 6.2, 6.3, 6.4_
  
  - [x] 9.2 Implement tab switching functionality
    - Add event listeners for Pelanggaran and Prestasi tab buttons
    - Show/hide appropriate table containers based on active tab
    - Show/hide appropriate action buttons based on active tab
    - Update active tab styling
    - _Requirements: 1.1, 3.1_

- [x] 10. Implement Pelanggaran CRUD operations in frontend
  - [x] 10.1 Implement loadPelanggaran function
    - Fetch data from GET /api/pelanggaran
    - Render table rows with all pelanggaran data
    - Add Edit and Delete buttons to each row
    - Display error message if fetch fails
    - Call function on panel load
    - _Requirements: 1.1, 1.8_
  
  - [x] 10.2 Implement openPelanggaranModal function
    - Fetch santri list from GET /api/santri
    - Populate santri dropdown with NIS and nama
    - Sort santri alphabetically by nama
    - Open modal dialog
    - Clear form for add mode or populate for edit mode
    - _Requirements: 1.2, 1.5, 12.1, 12.2, 12.3, 12.4_
  
  - [x] 10.3 Implement savePelanggaran function
    - Validate required fields on client side
    - Display inline error messages for missing fields
    - Prevent submission if validation fails
    - Call POST /api/pelanggaran for new records
    - Call PUT /api/pelanggaran/:id for updates
    - Display success message on successful save
    - Display error message from API response
    - Close modal and refresh table on success
    - _Requirements: 1.3, 1.4, 1.6, 10.1, 10.2, 10.3, 10.7, 10.8, 11.4, 11.5, 12.5_
  
  - [x] 10.4 Implement deletePelanggaran function
    - Show confirmation dialog before deletion
    - Call DELETE /api/pelanggaran/:id
    - Display success message on successful deletion
    - Display error message if deletion fails
    - Refresh table on success
    - _Requirements: 1.7, 11.5_

- [x] 11. Implement Prestasi CRUD operations in frontend
  - [x] 11.1 Implement loadPrestasi function
    - Fetch data from GET /api/prestasi
    - Render table rows with all prestasi data
    - Add Edit and Delete buttons to each row
    - Display error message if fetch fails
    - Call function on panel load
    - _Requirements: 3.1, 3.8_
  
  - [x] 11.2 Implement openPrestasiModal function
    - Fetch santri list from GET /api/santri
    - Populate santri dropdown with NIS and nama
    - Sort santri alphabetically by nama
    - Open modal dialog
    - Clear form for add mode or populate for edit mode
    - _Requirements: 3.2, 3.5, 12.1, 12.2, 12.3, 12.4_
  
  - [x] 11.3 Implement savePrestasi function
    - Validate required fields on client side
    - Display inline error messages for missing fields
    - Prevent submission if validation fails
    - Call POST /api/prestasi for new records
    - Call PUT /api/prestasi/:id for updates
    - Display success message on successful save
    - Display error message from API response
    - Close modal and refresh table on success
    - _Requirements: 3.3, 3.4, 3.6, 10.4, 10.5, 10.6, 10.7, 10.8, 11.4, 11.5, 12.5_
  
  - [x] 11.4 Implement deletePrestasi function
    - Show confirmation dialog before deletion
    - Call DELETE /api/prestasi/:id
    - Display success message on successful deletion
    - Display error message if deletion fails
    - Refresh table on success
    - _Requirements: 3.7, 11.5_

- [ ] 12. Implement riwayat per santri view (optional enhancement)
  - [ ] 12.1 Create viewSantriRiwayat function
    - Accept santri_id as parameter
    - Fetch pelanggaran from GET /api/pelanggaran/santri/:santriId
    - Fetch prestasi from GET /api/prestasi/santri/:santriId
    - Merge and sort records by tanggal DESC
    - Calculate summary counts
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ] 12.2 Create UI for riwayat display
    - Add modal or panel section for riwayat view
    - Display summary statistics (total pelanggaran, total prestasi)
    - Display timeline of records in chronological order
    - Show message when no records exist
    - _Requirements: 5.3, 5.4, 5.5_

- [x] 13. Add CSS styling for new components (if needed)
  - Review public/styles.css for existing styles
  - Add specific styles for tab switching if not covered by existing patterns
  - Ensure responsive design for mobile viewports
  - Maintain consistency with existing color scheme and typography
  - _Requirements: 11.2, 11.3, 11.6, 11.7_

- [x] 14. Final checkpoint - Integration testing
  - Ensure all tests pass, ask the user if questions arise.
  - Verify menu navigation works correctly
  - Verify tab switching between Pelanggaran and Prestasi
  - Verify CRUD operations for both pelanggaran and prestasi
  - Verify santri dropdown population
  - Verify form validation displays appropriate error messages
  - Verify foreign key constraints prevent santri deletion when records exist
  - Verify responsive design on mobile and desktop
  - Verify UI consistency with existing modules

## Notes

- All tasks reference specific requirements for traceability
- The implementation follows the existing codebase patterns (Express.js, vanilla JavaScript, PostgreSQL)
- Database schema must be created first before API endpoints can function
- Backend API endpoints should be implemented and tested before frontend integration
- Frontend tasks build incrementally: structure → forms → functionality
- Checkpoints ensure validation at key milestones
- Task 12 (riwayat per santri) is an optional enhancement that can be implemented after core functionality
- No property-based tests are included as this is a CRUD application without complex algorithmic properties
