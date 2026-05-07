async function test() {
  try {
    const payload = {
        tingkat: 1,
        jenis_mapel: 'Muhafadzoh',
        tipe_input: 'Angka',
        konfigurasi: {
          "Mumtaz": { "min": 95, "max": 40 },
          "Jayyid": { "min": 21, "max": 30 },
          "Mutawassith": { "min": 11, "max": 20 },
          "Rodi'": { "min": 0, "max": 10 }
        }
      };
    console.log("Saving...");
    const res = await fetch('http://localhost:3000/api/nilai/kriteria', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log(await res.json());
    
    console.log("Fetching...");
    const getRes = await fetch('http://localhost:3000/api/nilai/kriteria/1/9');
    console.log(await getRes.json());
  } catch (err) {
    console.error(err);
  }
}

test();
