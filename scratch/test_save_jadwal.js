const db = require('../db');
const NilaiService = require('../src/services/nilaiService');

async function run() {
  try {
    console.log('Trying to save mapel tingkat...');
    // Use valid IDs
    const result = await NilaiService.saveMapelTingkat(1, [20], 1, 1);
    console.log('Result:', result);
    process.exit(0);
  } catch (error) {
    console.error('Failed to save:', error);
    process.exit(1);
  }
}

run();
