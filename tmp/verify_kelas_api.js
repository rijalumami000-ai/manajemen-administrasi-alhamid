require('dotenv').config();

(async () => {
  try {
    const getBefore = await fetch('http://localhost:3000/api/kelas');
    const beforeJson = await getBefore.json();
    console.log('GET before', getBefore.status, Array.isArray(beforeJson) ? beforeJson.length : beforeJson);

    const postResponse = await fetch('http://localhost:3000/api/kelas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jenis: 'Diniyah', nama: 'Ula 2' }),
    });
    const postJson = await postResponse.json();
    console.log('POST', postResponse.status, postJson);

    const getAfter = await fetch('http://localhost:3000/api/kelas');
    const afterJson = await getAfter.json();
    console.log('GET after', getAfter.status, Array.isArray(afterJson) ? afterJson.length : afterJson);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
})();
