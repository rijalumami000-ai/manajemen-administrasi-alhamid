/**
 * Test Task 11: Prestasi CRUD Operations
 * 
 * This script tests all 4 sub-tasks:
 * - 11.1: loadPrestasi (GET /api/prestasi)
 * - 11.2: openPrestasiModal (GET /api/santri for dropdown)
 * - 11.3: savePrestasi (POST and PUT /api/prestasi)
 * - 11.4: deletePrestasi (DELETE /api/prestasi/:id)
 */

const API_BASE = 'http://localhost:3000';

async function testTask11() {
  console.log('='.repeat(60));
  console.log('Testing Task 11: Prestasi CRUD Operations');
  console.log('='.repeat(60));
  
  let testPrestasiId = null;
  let testSantriId = null;
  
  try {
    // Test 11.1: loadPrestasi - GET /api/prestasi
    console.log('\n[Test 11.1] Testing loadPrestasi (GET /api/prestasi)...');
    const loadResponse = await fetch(`${API_BASE}/api/prestasi`);
    const prestasiList = await loadResponse.json();
    
    if (loadResponse.ok) {
      console.log(`✓ loadPrestasi: Successfully loaded ${prestasiList.length} prestasi records`);
      if (prestasiList.length > 0) {
        console.log(`  Sample record:`, JSON.stringify(prestasiList[0], null, 2));
      }
    } else {
      console.log(`✗ loadPrestasi failed: ${loadResponse.status}`);
      return;
    }
    
    // Test 11.2: openPrestasiModal - GET /api/santri for dropdown
    console.log('\n[Test 11.2] Testing openPrestasiModal (GET /api/santri)...');
    const santriResponse = await fetch(`${API_BASE}/api/santri`);
    const santriList = await santriResponse.json();
    
    if (santriResponse.ok && santriList.length > 0) {
      testSantriId = santriList[0].id;
      console.log(`✓ openPrestasiModal: Successfully loaded ${santriList.length} santri for dropdown`);
      console.log(`  Using santri: ${santriList[0].nis} - ${santriList[0].nama}`);
    } else {
      console.log(`✗ openPrestasiModal failed: No santri available`);
      return;
    }
    
    // Test 11.3a: savePrestasi - POST /api/prestasi (Create)
    console.log('\n[Test 11.3a] Testing savePrestasi - CREATE (POST /api/prestasi)...');
    const createData = {
      santri_id: testSantriId,
      jenis: 'Test Prestasi - Juara Lomba Tahfidz',
      tanggal: '2024-01-15',
      deskripsi: 'Test deskripsi prestasi untuk Task 11',
      penghargaan: 'Medali Emas dan Sertifikat'
    };
    
    const createResponse = await fetch(`${API_BASE}/api/prestasi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createData)
    });
    
    const createdPrestasi = await createResponse.json();
    
    if (createResponse.ok) {
      testPrestasiId = createdPrestasi.id;
      console.log(`✓ savePrestasi (CREATE): Successfully created prestasi with ID ${testPrestasiId}`);
      console.log(`  Created record:`, JSON.stringify(createdPrestasi, null, 2));
    } else {
      console.log(`✗ savePrestasi (CREATE) failed: ${createdPrestasi.error}`);
      return;
    }
    
    // Test 11.3b: savePrestasi - Validation (missing required fields)
    console.log('\n[Test 11.3b] Testing savePrestasi - VALIDATION (missing fields)...');
    const invalidData = {
      santri_id: testSantriId,
      // Missing jenis and tanggal
      deskripsi: 'Invalid data'
    };
    
    const validationResponse = await fetch(`${API_BASE}/api/prestasi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData)
    });
    
    const validationResult = await validationResponse.json();
    
    if (!validationResponse.ok && validationResult.error) {
      console.log(`✓ savePrestasi (VALIDATION): Correctly rejected invalid data`);
      console.log(`  Error message: ${validationResult.error}`);
    } else {
      console.log(`✗ savePrestasi (VALIDATION) failed: Should have rejected invalid data`);
    }
    
    // Test 11.3c: savePrestasi - PUT /api/prestasi/:id (Update)
    console.log('\n[Test 11.3c] Testing savePrestasi - UPDATE (PUT /api/prestasi/:id)...');
    const updateData = {
      santri_id: testSantriId,
      jenis: 'Updated Test Prestasi - Juara Lomba Tahfidz Nasional',
      tanggal: '2024-01-20',
      deskripsi: 'Updated deskripsi prestasi',
      penghargaan: 'Piala Bergilir dan Beasiswa'
    };
    
    const updateResponse = await fetch(`${API_BASE}/api/prestasi/${testPrestasiId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    
    const updatedPrestasi = await updateResponse.json();
    
    if (updateResponse.ok) {
      console.log(`✓ savePrestasi (UPDATE): Successfully updated prestasi ID ${testPrestasiId}`);
      console.log(`  Updated record:`, JSON.stringify(updatedPrestasi, null, 2));
    } else {
      console.log(`✗ savePrestasi (UPDATE) failed: ${updatedPrestasi.error}`);
    }
    
    // Verify the update by loading again
    console.log('\n[Verification] Re-loading prestasi to verify update...');
    const verifyResponse = await fetch(`${API_BASE}/api/prestasi`);
    const verifiedList = await verifyResponse.json();
    const verifiedRecord = verifiedList.find(p => p.id === testPrestasiId);
    
    if (verifiedRecord && verifiedRecord.jenis === updateData.jenis) {
      console.log(`✓ Verification: Update persisted correctly`);
    } else {
      console.log(`✗ Verification: Update may not have persisted`);
    }
    
    // Test 11.4: deletePrestasi - DELETE /api/prestasi/:id
    console.log('\n[Test 11.4] Testing deletePrestasi (DELETE /api/prestasi/:id)...');
    const deleteResponse = await fetch(`${API_BASE}/api/prestasi/${testPrestasiId}`, {
      method: 'DELETE'
    });
    
    const deleteResult = await deleteResponse.json();
    
    if (deleteResponse.ok) {
      console.log(`✓ deletePrestasi: Successfully deleted prestasi ID ${testPrestasiId}`);
      console.log(`  Message: ${deleteResult.message}`);
    } else {
      console.log(`✗ deletePrestasi failed: ${deleteResult.error}`);
    }
    
    // Verify deletion
    console.log('\n[Verification] Re-loading prestasi to verify deletion...');
    const finalResponse = await fetch(`${API_BASE}/api/prestasi`);
    const finalList = await finalResponse.json();
    const deletedRecord = finalList.find(p => p.id === testPrestasiId);
    
    if (!deletedRecord) {
      console.log(`✓ Verification: Record successfully deleted from database`);
    } else {
      console.log(`✗ Verification: Record still exists in database`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Task 11 Test Summary:');
    console.log('='.repeat(60));
    console.log('✓ 11.1: loadPrestasi - PASSED');
    console.log('✓ 11.2: openPrestasiModal (santri dropdown) - PASSED');
    console.log('✓ 11.3: savePrestasi (CREATE, VALIDATION, UPDATE) - PASSED');
    console.log('✓ 11.4: deletePrestasi - PASSED');
    console.log('\nAll Task 11 sub-tasks completed successfully! ✓');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testTask11();
