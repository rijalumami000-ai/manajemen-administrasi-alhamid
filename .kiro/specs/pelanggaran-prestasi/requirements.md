# Requirements Document: Pelanggaran & Prestasi

## Introduction

Fitur "Pelanggaran & Prestasi" adalah modul baru dalam aplikasi SI Internal Pesantren yang memungkinkan pengelolaan catatan pelanggaran dan prestasi santri. Fitur ini dirancang untuk membantu pengurus pesantren dalam mendokumentasikan perilaku santri, baik yang bersifat negatif (pelanggaran) maupun positif (prestasi), sehingga dapat digunakan sebagai dasar evaluasi dan pembinaan santri.

## Glossary

- **System**: Aplikasi SI Internal Pesantren
- **Pelanggaran_Module**: Modul yang mengelola data pelanggaran santri
- **Prestasi_Module**: Modul yang mengelola data prestasi santri
- **Pelanggaran_Record**: Catatan pelanggaran yang dilakukan oleh santri
- **Prestasi_Record**: Catatan prestasi yang diraih oleh santri
- **Santri**: Siswa yang terdaftar di pesantren
- **User**: Pengguna aplikasi (pengurus pesantren)
- **Database**: PostgreSQL database yang menyimpan data aplikasi
- **API**: RESTful API backend yang dibangun dengan Node.js/Express
- **UI**: User interface frontend yang dibangun dengan vanilla JavaScript

## Requirements

### Requirement 1: Mengelola Data Pelanggaran

**User Story:** As a pengurus pesantren, I want to manage violation records for students, so that I can track and document student misconduct.

#### Acceptance Criteria

1. THE Pelanggaran_Module SHALL provide a user interface to display all violation records
2. WHEN the User clicks the add violation button, THE Pelanggaran_Module SHALL display a form to input violation details
3. WHEN the User submits a valid violation form, THE Pelanggaran_Module SHALL save the violation record to the Database
4. WHEN the User submits a violation form with missing required fields, THE Pelanggaran_Module SHALL display an error message indicating which fields are required
5. WHEN the User clicks the edit button on a violation record, THE Pelanggaran_Module SHALL populate the form with existing violation data
6. WHEN the User submits an edited violation form, THE Pelanggaran_Module SHALL update the violation record in the Database
7. WHEN the User clicks the delete button on a violation record, THE Pelanggaran_Module SHALL remove the violation record from the Database
8. THE Pelanggaran_Module SHALL display violation records in a table or card layout with sortable columns

### Requirement 2: Struktur Data Pelanggaran

**User Story:** As a pengurus pesantren, I want violation records to contain comprehensive information, so that I can understand the context and severity of each violation.

#### Acceptance Criteria

1. THE Pelanggaran_Record SHALL contain a reference to the Santri who committed the violation
2. THE Pelanggaran_Record SHALL contain the violation type as a text field
3. THE Pelanggaran_Record SHALL contain the violation date
4. THE Pelanggaran_Record SHALL contain a description of the violation
5. THE Pelanggaran_Record SHALL contain the sanction or punishment applied
6. THE Pelanggaran_Record SHALL contain a timestamp indicating when the record was created
7. WHEN a Santri is deleted from the Database, THE System SHALL prevent deletion if the Santri has associated violation records

### Requirement 3: Mengelola Data Prestasi

**User Story:** As a pengurus pesantren, I want to manage achievement records for students, so that I can track and document student accomplishments.

#### Acceptance Criteria

1. THE Prestasi_Module SHALL provide a user interface to display all achievement records
2. WHEN the User clicks the add achievement button, THE Prestasi_Module SHALL display a form to input achievement details
3. WHEN the User submits a valid achievement form, THE Prestasi_Module SHALL save the achievement record to the Database
4. WHEN the User submits an achievement form with missing required fields, THE Prestasi_Module SHALL display an error message indicating which fields are required
5. WHEN the User clicks the edit button on an achievement record, THE Prestasi_Module SHALL populate the form with existing achievement data
6. WHEN the User submits an edited achievement form, THE Prestasi_Module SHALL update the achievement record in the Database
7. WHEN the User clicks the delete button on an achievement record, THE Prestasi_Module SHALL remove the achievement record from the Database
8. THE Prestasi_Module SHALL display achievement records in a table or card layout with sortable columns

### Requirement 4: Struktur Data Prestasi

**User Story:** As a pengurus pesantren, I want achievement records to contain comprehensive information, so that I can understand the nature and significance of each achievement.

#### Acceptance Criteria

1. THE Prestasi_Record SHALL contain a reference to the Santri who achieved the accomplishment
2. THE Prestasi_Record SHALL contain the achievement type as a text field
3. THE Prestasi_Record SHALL contain the achievement date
4. THE Prestasi_Record SHALL contain a description of the achievement
5. THE Prestasi_Record SHALL contain the award or recognition received
6. THE Prestasi_Record SHALL contain a timestamp indicating when the record was created
7. WHEN a Santri is deleted from the Database, THE System SHALL prevent deletion if the Santri has associated achievement records

### Requirement 5: Melihat Riwayat Per Santri

**User Story:** As a pengurus pesantren, I want to view all violations and achievements for a specific student, so that I can evaluate their overall behavior and performance.

#### Acceptance Criteria

1. WHEN the User selects a Santri, THE System SHALL display all violation records associated with that Santri
2. WHEN the User selects a Santri, THE System SHALL display all achievement records associated with that Santri
3. THE System SHALL display violation and achievement records in chronological order with the most recent first
4. THE System SHALL display a summary count of total violations and achievements for the selected Santri
5. WHEN a Santri has no violation or achievement records, THE System SHALL display a message indicating no records exist

### Requirement 6: Menu Navigasi

**User Story:** As a pengurus pesantren, I want to access the violations and achievements module from the main navigation menu, so that I can easily navigate to this feature.

#### Acceptance Criteria

1. THE System SHALL add a menu item labeled "Pelanggaran & Prestasi" to the sidebar navigation
2. WHEN the User clicks the "Pelanggaran & Prestasi" menu item, THE System SHALL display the violations and achievements panel
3. THE System SHALL highlight the active menu item when the violations and achievements panel is displayed
4. THE System SHALL maintain consistent navigation behavior with existing menu items

### Requirement 7: API Endpoints untuk Pelanggaran

**User Story:** As a developer, I want RESTful API endpoints for violations, so that the frontend can perform CRUD operations on violation data.

#### Acceptance Criteria

1. THE API SHALL provide a GET endpoint at /api/pelanggaran to retrieve all violation records
2. THE API SHALL provide a POST endpoint at /api/pelanggaran to create a new violation record
3. THE API SHALL provide a PUT endpoint at /api/pelanggaran/:id to update an existing violation record
4. THE API SHALL provide a DELETE endpoint at /api/pelanggaran/:id to delete a violation record
5. THE API SHALL provide a GET endpoint at /api/pelanggaran/santri/:santriId to retrieve all violations for a specific Santri
6. WHEN the API receives a request with invalid data, THE API SHALL return an HTTP 400 status code with an error message
7. WHEN the API receives a request for a non-existent record, THE API SHALL return an HTTP 404 status code with an error message
8. WHEN the API successfully processes a request, THE API SHALL return the appropriate HTTP status code and response data

### Requirement 8: API Endpoints untuk Prestasi

**User Story:** As a developer, I want RESTful API endpoints for achievements, so that the frontend can perform CRUD operations on achievement data.

#### Acceptance Criteria

1. THE API SHALL provide a GET endpoint at /api/prestasi to retrieve all achievement records
2. THE API SHALL provide a POST endpoint at /api/prestasi to create a new achievement record
3. THE API SHALL provide a PUT endpoint at /api/prestasi/:id to update an existing achievement record
4. THE API SHALL provide a DELETE endpoint at /api/prestasi/:id to delete an achievement record
5. THE API SHALL provide a GET endpoint at /api/prestasi/santri/:santriId to retrieve all achievements for a specific Santri
6. WHEN the API receives a request with invalid data, THE API SHALL return an HTTP 400 status code with an error message
7. WHEN the API receives a request for a non-existent record, THE API SHALL return an HTTP 404 status code with an error message
8. WHEN the API successfully processes a request, THE API SHALL return the appropriate HTTP status code and response data

### Requirement 9: Database Schema

**User Story:** As a developer, I want database tables for violations and achievements, so that the data can be persisted and queried efficiently.

#### Acceptance Criteria

1. THE Database SHALL contain a table named "pelanggaran" with columns: id, santri_id, jenis, tanggal, deskripsi, sanksi, created_at
2. THE Database SHALL contain a table named "prestasi" with columns: id, santri_id, jenis, tanggal, deskripsi, penghargaan, created_at
3. THE Database SHALL enforce a foreign key constraint from pelanggaran.santri_id to santri.id
4. THE Database SHALL enforce a foreign key constraint from prestasi.santri_id to santri.id
5. THE Database SHALL set the id column as the primary key with auto-increment for both tables
6. THE Database SHALL set santri_id, jenis, tanggal as NOT NULL for both tables
7. THE Database SHALL set created_at with a default value of the current timestamp for both tables

### Requirement 10: Validasi Input

**User Story:** As a pengurus pesantren, I want the system to validate my input, so that I cannot submit incomplete or invalid data.

#### Acceptance Criteria

1. WHEN the User submits a violation form without selecting a Santri, THE System SHALL display an error message
2. WHEN the User submits a violation form without entering a violation type, THE System SHALL display an error message
3. WHEN the User submits a violation form without selecting a date, THE System SHALL display an error message
4. WHEN the User submits an achievement form without selecting a Santri, THE System SHALL display an error message
5. WHEN the User submits an achievement form without entering an achievement type, THE System SHALL display an error message
6. WHEN the User submits an achievement form without selecting a date, THE System SHALL display an error message
7. THE System SHALL trim whitespace from text inputs before validation
8. THE System SHALL prevent form submission until all required fields are filled

### Requirement 11: UI Consistency

**User Story:** As a pengurus pesantren, I want the violations and achievements interface to match the existing application design, so that I have a consistent user experience.

#### Acceptance Criteria

1. THE UI SHALL use the same modal dialog pattern for add and edit forms as existing modules
2. THE UI SHALL use the same button styles and colors as existing modules
3. THE UI SHALL use the same table or card layout styles as existing modules
4. THE UI SHALL use the same form field styles and validation messages as existing modules
5. THE UI SHALL use the same success and error message display patterns as existing modules
6. THE UI SHALL maintain responsive design for mobile and desktop viewports
7. THE UI SHALL use the same font family and typography as existing modules

### Requirement 12: Integrasi dengan Data Santri

**User Story:** As a pengurus pesantren, I want to select students from the existing student database when creating violation or achievement records, so that I can ensure data consistency.

#### Acceptance Criteria

1. WHEN the User opens the violation form, THE System SHALL populate a dropdown with all active Santri names
2. WHEN the User opens the achievement form, THE System SHALL populate a dropdown with all active Santri names
3. THE System SHALL display Santri names in alphabetical order in the dropdown
4. THE System SHALL include the Santri NIS along with the name in the dropdown for identification
5. WHEN the User selects a Santri from the dropdown, THE System SHALL store the Santri ID in the violation or achievement record
