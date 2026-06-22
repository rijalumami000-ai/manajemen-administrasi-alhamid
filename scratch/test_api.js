const http = require('http');

http.get('http://localhost:5000/api/my-mustahiq/input-nilai/santri?kelas_id=31&tahun_ajaran_id=10&semester=Genap', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Status:", res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log("Mata Pelajaran:");
      json.mataPelajaran.forEach(m => console.log(m.id, m.nama, m.jenis, m.tipe_input));
    } catch (e) {
      console.log("Parse Error:", e.message);
      console.log(data);
    }
  });
}).on('error', err => console.log("Req Error:", err.message));
