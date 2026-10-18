const db = require('../db');

const STRUKTUR_PESANTREN_DATA = [
  // ── A. DEWAN PENYANTUN ──────────────────────────────────────────
  {
    tipe: 'dewan_penyantun',
    kategori: 'Dewan Penyantun',
    jabatan: 'Pengasuh',
    nama_custom: 'Kyai Imam Sonhaji Bukhori',
    alamat: 'Pondok Pesantren Al-Hamid',
    keterangan: 'Pengasuh Utama',
    no_urut: 1
  },
  {
    tipe: 'dewan_penyantun',
    kategori: 'Dewan Penyantun',
    jabatan: 'Pengasuh',
    nama_custom: 'Umi Hadhonatul Fauzah',
    alamat: 'Pondok Pesantren Al-Hamid',
    keterangan: 'Pengasuh Utama',
    no_urut: 2
  },
  {
    tipe: 'dewan_penyantun',
    kategori: 'Dewan Penyantun',
    jabatan: 'Penasihat',
    nama_custom: 'Bpk. Hasanuddin Erezza',
    alamat: '-',
    keterangan: 'Dewan Penasihat',
    no_urut: 3
  },
  {
    tipe: 'dewan_penyantun',
    kategori: 'Dewan Penyantun',
    jabatan: 'Penasihat',
    nama_custom: 'Bpk. Farid Wajdi',
    alamat: '-',
    keterangan: 'Dewan Penasihat',
    no_urut: 4
  },
  {
    tipe: 'dewan_penyantun',
    kategori: 'Dewan Penyantun',
    jabatan: 'Penasihat',
    nama_custom: 'Ibu Nahdlotul Adzimah',
    alamat: '-',
    keterangan: 'Dewan Penasihat',
    no_urut: 5
  },
  {
    tipe: 'dewan_penyantun',
    kategori: 'Dewan Penyantun',
    jabatan: 'Penasihat',
    nama_custom: 'Ibu Aliful Ma\'rifah',
    alamat: '-',
    keterangan: 'Dewan Penasihat',
    no_urut: 6
  },
  {
    tipe: 'dewan_penyantun',
    kategori: 'Dewan Penyantun',
    jabatan: 'Penasihat',
    nama_custom: 'Ibu Sulistiani',
    alamat: '-',
    keterangan: 'Dewan Penasihat',
    no_urut: 7
  },
  {
    tipe: 'dewan_penyantun',
    kategori: 'Dewan Penyantun',
    jabatan: 'Penasihat',
    nama_custom: 'Ibu Halawati',
    alamat: '-',
    keterangan: 'Dewan Penasihat',
    no_urut: 8
  },
  {
    tipe: 'dewan_penyantun',
    kategori: 'Dewan Penyantun',
    jabatan: 'Pembina Asrama Putra',
    nama_custom: 'Bpk. M. Choirul Wafa',
    alamat: '-',
    keterangan: 'Pembina Asrama Putra',
    no_urut: 9
  },
  {
    tipe: 'dewan_penyantun',
    kategori: 'Dewan Penyantun',
    jabatan: 'Pembina Asrama Putri',
    nama_custom: 'Bpk. Ahmad Hamdan Wahyudin',
    alamat: '-',
    keterangan: 'Pembina Asrama Putri',
    no_urut: 10
  },

  // ── B. DEWAN HARIAN PUTRA ──────────────────────────────────────────
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Harian Putra',
    jabatan: 'Ketua Umum',
    nama_custom: 'Bpk. Indra Pratama',
    alamat: 'Cirebon',
    keterangan: 'Dewan Harian',
    no_urut: 11
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Harian Putra',
    jabatan: 'Ketua Satu',
    nama_custom: 'Bpk. Rifki Ardiansyah Rehan',
    alamat: 'Katibung',
    keterangan: 'Dewan Harian',
    no_urut: 12
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Harian Putra',
    jabatan: 'Sekretaris Umum',
    nama_custom: 'Bpk. Rafa Ardiansyah',
    alamat: 'Way Sulan',
    keterangan: 'Dewan Harian',
    no_urut: 13
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Harian Putra',
    jabatan: 'Sekretaris Satu',
    nama_custom: 'Bpk. Sifaul Huda',
    alamat: 'Way Gelam',
    keterangan: 'Dewan Harian',
    no_urut: 14
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Harian Putra',
    jabatan: 'Bendahara Umum',
    nama_custom: 'Bpk. Wahyudi',
    alamat: 'Way Sulan',
    keterangan: 'Dewan Harian',
    no_urut: 15
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Harian Putra',
    jabatan: 'Bendahara Satu',
    nama_custom: 'Bpk. Yusuf Tama',
    alamat: 'Sidomulyo',
    keterangan: 'Dewan Harian',
    no_urut: 16
  },

  // ── C. DEWAN HARIAN PUTRI ──────────────────────────────────────────
  {
    tipe: 'pondok_putri',
    kategori: 'Dewan Harian Putri',
    jabatan: 'Ketua Umum',
    nama_custom: 'Ibu Elin Mukarromah',
    alamat: 'Banyumas',
    keterangan: 'Dewan Harian',
    no_urut: 17
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Dewan Harian Putri',
    jabatan: 'Ketua Satu',
    nama_custom: 'Ibu Meliya Nia',
    alamat: 'Lampung Utara',
    keterangan: 'Dewan Harian',
    no_urut: 18
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Dewan Harian Putri',
    jabatan: 'Sekretaris Umum',
    nama_custom: 'Ibu Khesi Mesya Afita',
    alamat: 'Batu Liman',
    keterangan: 'Dewan Harian',
    no_urut: 19
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Dewan Harian Putri',
    jabatan: 'Sekretaris Satu',
    nama_custom: 'Ibu Silfa Tasya Syakila',
    alamat: 'Sidomulyo',
    keterangan: 'Dewan Harian',
    no_urut: 20
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Dewan Harian Putri',
    jabatan: 'Bendahara Umum',
    nama_custom: 'Ibu Lulu Septiani',
    alamat: 'Cintamulya',
    keterangan: 'Dewan Harian',
    no_urut: 21
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Dewan Harian Putri',
    jabatan: 'Bendahara Satu',
    nama_custom: 'Ibu Nur Azzizah',
    alamat: 'Cintamulya',
    keterangan: 'Dewan Harian',
    no_urut: 22
  },

  // ── D. DEWAN PLENO PUTRA ──────────────────────────────────────────
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Pleno Putra',
    jabatan: 'Seksi Pendidikan, Jam\'iyyah & Ibadah',
    nama_custom: 'Bpk. Kelvin Kastawa',
    alamat: 'Sidomulyo',
    keterangan: 'Koordinator Seksi',
    no_urut: 23
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Pleno Putra',
    jabatan: 'Seksi Pendidikan, Jam\'iyyah & Ibadah',
    nama_custom: 'Bpk. Boy Sandi',
    alamat: 'Napal',
    keterangan: 'Anggota Seksi',
    no_urut: 24
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Pleno Putra',
    jabatan: 'Seksi Keamanan',
    nama_custom: 'Bpk. Sifaul Huda',
    alamat: 'Way Gelam',
    keterangan: 'Koordinator Seksi',
    no_urut: 25
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Pleno Putra',
    jabatan: 'Seksi Keamanan',
    nama_custom: 'Bpk. Jihan Kusuma',
    alamat: 'Trimomukti',
    keterangan: 'Anggota Seksi',
    no_urut: 26
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Pleno Putra',
    jabatan: 'Seksi Keamanan',
    nama_custom: 'Bpk. Endri Setiawan',
    alamat: 'Sidomulyo',
    keterangan: 'Anggota Seksi',
    no_urut: 27
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Pleno Putra',
    jabatan: 'Seksi Keamanan',
    nama_custom: 'Bpk. Darullah Al Fath',
    alamat: 'Ruguk',
    keterangan: 'Anggota Seksi',
    no_urut: 28
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Pleno Putra',
    jabatan: 'Seksi Keamanan',
    nama_custom: 'Bpk. M. Alfian Agus Pratama',
    alamat: 'Yogyakarta',
    keterangan: 'Anggota Seksi',
    no_urut: 29
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Pleno Putra',
    jabatan: 'Seksi Kebersihan',
    nama_custom: 'Bpk. M. Ferdi Ramadhan',
    alamat: 'Jabung',
    keterangan: 'Koordinator Seksi',
    no_urut: 30
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Pleno Putra',
    jabatan: 'Seksi Kebersihan',
    nama_custom: 'Bpk. Arfai\'is Husniawan',
    alamat: 'Mataram',
    keterangan: 'Anggota Seksi',
    no_urut: 31
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Pleno Putra',
    jabatan: 'Seksi Kesehatan',
    nama_custom: 'Bpk. Raihan Zulfaqih',
    alamat: 'Bandar Lampung',
    keterangan: 'Koordinator Seksi',
    no_urut: 32
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Pleno Putra',
    jabatan: 'Seksi Kesehatan',
    nama_custom: 'Bpk. M. Nabil Farkhan',
    alamat: 'Ulu Selatan',
    keterangan: 'Anggota Seksi',
    no_urut: 33
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Pleno Putra',
    jabatan: 'Seksi PHI',
    nama_custom: 'Bpk. Rizqi Muntaqo',
    alamat: 'Tanggamus',
    keterangan: 'Koordinator Seksi',
    no_urut: 34
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Pleno Putra',
    jabatan: 'Seksi PHI',
    nama_custom: 'Bpk. Habdul Rohim',
    alamat: 'Sidomulyo',
    keterangan: 'Anggota Seksi',
    no_urut: 35
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Pleno Putra',
    jabatan: 'Seksi PHI',
    nama_custom: 'Bpk. Yusuf Tama',
    alamat: 'Sidomulyo',
    keterangan: 'Anggota Seksi',
    no_urut: 36
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Pleno Putra',
    jabatan: 'Seksi Media',
    nama_custom: 'Bpk. A. Hikamillah A.M',
    alamat: 'Cirebon',
    keterangan: 'Koordinator Seksi',
    no_urut: 37
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Pleno Putra',
    jabatan: 'Seksi Media',
    nama_custom: 'Bpk. Farhan Khoirul Abrori',
    alamat: 'Trenggalek',
    keterangan: 'Anggota Seksi',
    no_urut: 38
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Pleno Putra',
    jabatan: 'Seksi Media',
    nama_custom: 'Bpk. Mustakim',
    alamat: 'Purbalingga',
    keterangan: 'Anggota Seksi',
    no_urut: 39
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Pleno Putra',
    jabatan: 'Seksi Media',
    nama_custom: 'Bpk. Dio Andika',
    alamat: 'Way Gelam',
    keterangan: 'Anggota Seksi',
    no_urut: 40
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Pleno Putra',
    jabatan: 'Seksi Media',
    nama_custom: 'Bpk. Ferdi Ramadhan',
    alamat: 'Jabung',
    keterangan: 'Anggota Seksi',
    no_urut: 41
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Dewan Pleno Putra',
    jabatan: 'Seksi Media',
    nama_custom: 'Bpk. Nanda Maulana',
    alamat: 'Sidomulyo',
    keterangan: 'Anggota Seksi',
    no_urut: 42
  },

  // ── E. DEWAN PLENO PUTRI ──────────────────────────────────────────
  {
    tipe: 'pondok_putri',
    kategori: 'Dewan Pleno Putri',
    jabatan: 'Seksi Pendidikan, Jam\'iyyah & Ibadah',
    nama_custom: 'Ibu Fathimatuzzahro',
    alamat: 'Purwodadi',
    keterangan: 'Koordinator Seksi',
    no_urut: 43
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Dewan Pleno Putri',
    jabatan: 'Seksi Pendidikan, Jam\'iyyah & Ibadah',
    nama_custom: 'Ibu Nikmatul Kholidina',
    alamat: 'Sidowaluyo',
    keterangan: 'Anggota Seksi',
    no_urut: 44
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Dewan Pleno Putri',
    jabatan: 'Seksi Pendidikan, Jam\'iyyah & Ibadah',
    nama_custom: 'Ibu Ayska Wulan Nihayati',
    alamat: 'Cintamulya',
    keterangan: 'Anggota Seksi',
    no_urut: 45
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Dewan Pleno Putri',
    jabatan: 'Seksi Keamanan',
    nama_custom: 'Ibu Putri Asifa Al Zahra',
    alamat: 'Katibung',
    keterangan: 'Koordinator Seksi',
    no_urut: 46
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Dewan Pleno Putri',
    jabatan: 'Seksi Keamanan',
    nama_custom: 'Ibu Mar\'atussholihah',
    alamat: 'Katibung',
    keterangan: 'Anggota Seksi',
    no_urut: 47
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Dewan Pleno Putri',
    jabatan: 'Seksi Keamanan',
    nama_custom: 'Ibu Siti Nur Baiti',
    alamat: 'Katibung',
    keterangan: 'Anggota Seksi',
    no_urut: 48
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Dewan Pleno Putri',
    jabatan: 'Seksi Keamanan',
    nama_custom: 'Ibu Miftahul Jannah',
    alamat: 'Tanjung Sari',
    keterangan: 'Anggota Seksi',
    no_urut: 49
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Dewan Pleno Putri',
    jabatan: 'Seksi Kebersihan',
    nama_custom: 'Ibu Nuzulul Rodiyah',
    alamat: 'Way Sulan',
    keterangan: 'Koordinator Seksi',
    no_urut: 50
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Dewan Pleno Putri',
    jabatan: 'Seksi Kebersihan',
    nama_custom: 'Ibu Wardah Habibah',
    alamat: 'Cintamulya',
    keterangan: 'Anggota Seksi',
    no_urut: 51
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Dewan Pleno Putri',
    jabatan: 'Seksi Kesehatan',
    nama_custom: 'Ibu Hilda Fadhilatunnisa',
    alamat: 'Way Sulan',
    keterangan: 'Koordinator Seksi',
    no_urut: 52
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Dewan Pleno Putri',
    jabatan: 'Seksi Kesehatan',
    nama_custom: 'Ibu Fauziyah Inayah Shika',
    alamat: 'Palas',
    keterangan: 'Anggota Seksi',
    no_urut: 53
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Dewan Pleno Putri',
    jabatan: 'Seksi PHI',
    nama_custom: 'Ibu Sri Fuji Rahayu',
    alamat: 'Waway Karya',
    keterangan: 'Koordinator Seksi',
    no_urut: 54
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Dewan Pleno Putri',
    jabatan: 'Seksi PHI',
    nama_custom: 'Ibu Syifa Ainur Fidar',
    alamat: 'Waway Karya',
    keterangan: 'Anggota Seksi',
    no_urut: 55
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Dewan Pleno Putri',
    jabatan: 'Seksi PHI',
    nama_custom: 'Ibu Ainun Safitri',
    alamat: 'Katibung',
    keterangan: 'Anggota Seksi',
    no_urut: 56
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Dewan Pleno Putri',
    jabatan: 'Seksi Media',
    nama_custom: 'Ibu Idah Fitriah',
    alamat: 'Katibung',
    keterangan: 'Koordinator Seksi',
    no_urut: 57
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Dewan Pleno Putri',
    jabatan: 'Seksi Media',
    nama_custom: 'Ibu Ainun Safitri',
    alamat: 'Katibung',
    keterangan: 'Anggota Seksi',
    no_urut: 58
  },

  // ── F. PENANGGUNG JAWAB KAMAR PUTRA (Asatidz) ──────────────────────
  {
    tipe: 'pondok_putra',
    kategori: 'PJ Kamar Putra',
    jabatan: 'PJ Kamar A1',
    nama_custom: 'Bpk. Ahmad Hamdan Wahyudin',
    alamat: '-',
    keterangan: 'Wakil PJ: Bpk. Rifki Ardiansyah Rehan',
    no_urut: 59
  },
  {
    tipe: 'pondok_putra',
    kategori: 'PJ Kamar Putra',
    jabatan: 'PJ Kamar A2',
    nama_custom: 'Bpk. Boy Sandi',
    alamat: '-',
    keterangan: 'Wakil PJ: Bpk. Sifaul Huda',
    no_urut: 60
  },
  {
    tipe: 'pondok_putra',
    kategori: 'PJ Kamar Putra',
    jabatan: 'PJ Kamar A3',
    nama_custom: 'Bpk. Mustakim',
    alamat: '-',
    keterangan: 'Wakil PJ: Bpk. Rafa Ardiansyah',
    no_urut: 61
  },
  {
    tipe: 'pondok_putra',
    kategori: 'PJ Kamar Putra',
    jabatan: 'PJ Kamar B2',
    nama_custom: 'Bpk. Rubi Al Dimas',
    alamat: '-',
    keterangan: 'Wakil PJ: Bpk. Habdul Rohim',
    no_urut: 62
  },
  {
    tipe: 'pondok_putra',
    kategori: 'PJ Kamar Putra',
    jabatan: 'PJ Kamar B3',
    nama_custom: 'Bpk. Abdul Haq',
    alamat: '-',
    keterangan: 'Wakil PJ: Bpk. Dio Andika',
    no_urut: 63
  },
  {
    tipe: 'pondok_putra',
    kategori: 'PJ Kamar Putra',
    jabatan: 'PJ Kamar B4',
    nama_custom: 'Bpk. A. Hikamillah A.M',
    alamat: '-',
    keterangan: 'Wakil PJ: Bpk. Indra Pratama',
    no_urut: 64
  },
  {
    tipe: 'pondok_putra',
    kategori: 'PJ Kamar Putra',
    jabatan: 'PJ Kamar C2',
    nama_custom: 'Bpk. M. Choirul Wafa',
    alamat: '-',
    keterangan: 'Wakil PJ: Bpk. Jihan Kusuma',
    no_urut: 65
  },
  {
    tipe: 'pondok_putra',
    kategori: 'PJ Kamar Putra',
    jabatan: 'PJ Kamar C3',
    nama_custom: 'Bpk. Farhan Khoirul Abrori',
    alamat: '-',
    keterangan: 'Wakil PJ: Bpk. Yusuf Tama',
    no_urut: 66
  },
  {
    tipe: 'pondok_putra',
    kategori: 'PJ Kamar Putra',
    jabatan: 'PJ Kamar C4',
    nama_custom: 'Bpk. Kelvin Kastawa',
    alamat: '-',
    keterangan: 'Wakil PJ: Bpk. Wahyudi',
    no_urut: 67
  },
  {
    tipe: 'pondok_putra',
    kategori: 'PJ Kamar Putra',
    jabatan: 'PJ Kamar TAHFIDZ',
    nama_custom: 'Bpk. M. Alfian Agus Pratama',
    alamat: '-',
    keterangan: 'Penanggung Jawab Kamar Khusus Tahfidz',
    no_urut: 68
  },

  // ── G. PENANGGUNG JAWAB KOMPLEK PUTRI (Ustadzah) ─────────────────
  {
    tipe: 'pondok_putri',
    kategori: 'PJ Komplek Putri',
    jabatan: 'PJ Komplek A',
    nama_custom: 'Ibu Khesi Mesya Afita',
    alamat: 'Batu Liman',
    keterangan: 'Koordinator Komplek A (Anggota: Ibu Miftahul Jannah, Ibu Ainun Safitri, Ibu Elin Mukarromah)',
    no_urut: 69
  },
  {
    tipe: 'pondok_putri',
    kategori: 'PJ Komplek Putri',
    jabatan: 'PJ Komplek B',
    nama_custom: 'Ibu Nuzulul Rodiyah',
    alamat: 'Way Sulan',
    keterangan: 'Koordinator Komplek B (Anggota: Ibu Siti Nur Baiti, Ibu Ayska Wulan Nihayati, Ibu Putri Asifa Al Zahra)',
    no_urut: 70
  },
  {
    tipe: 'pondok_putri',
    kategori: 'PJ Komplek Putri',
    jabatan: 'PJ Komplek C',
    nama_custom: 'Ibu Fauziyah Inayah Chika',
    alamat: 'Palas',
    keterangan: 'Koordinator Komplek C (Anggota: Ibu Mar\'atussholihah, Ibu Nur Azzizah, Ibu Idah Fitriah)',
    no_urut: 71
  },
  {
    tipe: 'pondok_putri',
    kategori: 'PJ Komplek Putri',
    jabatan: 'PJ Komplek D',
    nama_custom: 'Ibu Hilda Fadhilatunnisa',
    alamat: 'Way Sulan',
    keterangan: 'Koordinator Komplek D (Anggota: Ibu Fatimatuzzahro, Ibu Nikmatul Kholidina, Ibu Sri Fuji Rahayu)',
    no_urut: 72
  },
  {
    tipe: 'pondok_putri',
    kategori: 'PJ Komplek Putri',
    jabatan: 'PJ Komplek E',
    nama_custom: 'Ibu Lulu Septiani',
    alamat: 'Cintamulya',
    keterangan: 'Koordinator Komplek E (Anggota: Ibu Silfa Tasya Syakila, Ibu Meliya Nia, Ibu Wardah Habibah, Ibu Syifa Ainur Fidar)',
    no_urut: 73
  },

  // ── H. KETUA KAMAR PUTRA (Santri) ──────────────────────────────────
  {
    tipe: 'pondok_putra',
    kategori: 'Ketua Kamar Putra',
    jabatan: 'Ketua Kamar A1',
    nama_custom: 'Sdr. Bara Alvin Azkia',
    alamat: 'Katibung',
    keterangan: 'Ketua Kamar Putra',
    no_urut: 74
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Ketua Kamar Putra',
    jabatan: 'Ketua Kamar A2',
    nama_custom: 'Sdr. M. Fahmi Ridho',
    alamat: 'Sinar Pasemah',
    keterangan: 'Ketua Kamar Putra',
    no_urut: 75
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Ketua Kamar Putra',
    jabatan: 'Ketua Kamar A3',
    nama_custom: 'Sdr. Miftahul Fadly',
    alamat: 'Cintamulya',
    keterangan: 'Ketua Kamar Putra',
    no_urut: 76
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Ketua Kamar Putra',
    jabatan: 'Ketua Kamar B1',
    nama_custom: 'Sdr. A. Faizul Azam Zami',
    alamat: 'Sidomulyo',
    keterangan: 'Ketua Kamar Putra',
    no_urut: 77
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Ketua Kamar Putra',
    jabatan: 'Ketua Kamar B2',
    nama_custom: 'Sdr. A. Damroni Shodiq',
    alamat: 'Waway Karya',
    keterangan: 'Ketua Kamar Putra',
    no_urut: 78
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Ketua Kamar Putra',
    jabatan: 'Ketua Kamar B3',
    nama_custom: 'Sdr. M. Reyhan',
    alamat: 'Katibung',
    keterangan: 'Ketua Kamar Putra',
    no_urut: 79
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Ketua Kamar Putra',
    jabatan: 'Ketua Kamar C1',
    nama_custom: 'Sdr. Darullah Al Fath',
    alamat: 'Ruguk',
    keterangan: 'Ketua Kamar Putra',
    no_urut: 80
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Ketua Kamar Putra',
    jabatan: 'Ketua Kamar C2',
    nama_custom: 'Sdr. Endri Dwi Setiawan',
    alamat: 'Sidomulyo',
    keterangan: 'Ketua Kamar Putra',
    no_urut: 81
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Ketua Kamar Putra',
    jabatan: 'Ketua Kamar C3',
    nama_custom: 'Sdr. Fahri Junaidi',
    alamat: 'Sidomulyo',
    keterangan: 'Ketua Kamar Putra',
    no_urut: 82
  },
  {
    tipe: 'pondok_putra',
    kategori: 'Ketua Kamar Putra',
    jabatan: 'Ketua Kamar TAHFIDZ',
    nama_custom: 'Sdr. Argo Putra Wahono',
    alamat: 'Beringin Kencana',
    keterangan: 'Ketua Kamar Tahfidz Putra',
    no_urut: 83
  },

  // ── I. KETUA KAMAR PUTRI (Santriwati) ─────────────────────────────
  {
    tipe: 'pondok_putri',
    kategori: 'Ketua Kamar Putri',
    jabatan: 'Ketua Kamar A1',
    nama_custom: 'Sdri. Harnum Sabrina',
    alamat: 'Bumi Jaya',
    keterangan: 'Ketua Kamar Putri',
    no_urut: 84
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Ketua Kamar Putri',
    jabatan: 'Ketua Kamar A2',
    nama_custom: 'Sdri. Syifa Nur Maulida',
    alamat: 'Banyumas',
    keterangan: 'Ketua Kamar Putri',
    no_urut: 85
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Ketua Kamar Putri',
    jabatan: 'Ketua Kamar A3',
    nama_custom: 'Sdri. Alma Triani',
    alamat: 'Bumi Jaya',
    keterangan: 'Ketua Kamar Putri',
    no_urut: 86
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Ketua Kamar Putri',
    jabatan: 'Ketua Kamar B1',
    nama_custom: 'Sdri. Ayska Wulan Nihayati',
    alamat: 'Cintamulya',
    keterangan: 'Ketua Kamar Putri',
    no_urut: 87
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Ketua Kamar Putri',
    jabatan: 'Ketua Kamar B2',
    nama_custom: 'Ibu Putri Asifa Al Zahra',
    alamat: 'Katibung',
    keterangan: 'Ketua Kamar Putri',
    no_urut: 88
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Ketua Kamar Putri',
    jabatan: 'Ketua Kamar B3',
    nama_custom: 'Sdri. Aulia Putri Rahmawati',
    alamat: 'Cintamulya',
    keterangan: 'Ketua Kamar Putri',
    no_urut: 89
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Ketua Kamar Putri',
    jabatan: 'Ketua Kamar C1',
    nama_custom: 'Sdri. Silvia Alayda Yahya',
    alamat: 'Way Sulan',
    keterangan: 'Ketua Kamar Putri',
    no_urut: 90
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Ketua Kamar Putri',
    jabatan: 'Ketua Kamar C2',
    nama_custom: 'Sdri. Aira Suci Meicca',
    alamat: 'Sidomulyo',
    keterangan: 'Ketua Kamar Putri',
    no_urut: 91
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Ketua Kamar Putri',
    jabatan: 'Ketua Kamar C3',
    nama_custom: 'Sdri. Souvia Yulistia',
    alamat: 'Cirebon',
    keterangan: 'Ketua Kamar Putri',
    no_urut: 92
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Ketua Kamar Putri',
    jabatan: 'Ketua Kamar D1',
    nama_custom: 'Sdri. Nailatuzzahro',
    alamat: 'Sinar Pasemah',
    keterangan: 'Ketua Kamar Putri',
    no_urut: 93
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Ketua Kamar Putri',
    jabatan: 'Ketua Kamar D2',
    nama_custom: 'Sdri. Aina Shofiatun Najah',
    alamat: 'Bandar Lampung',
    keterangan: 'Ketua Kamar Putri',
    no_urut: 94
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Ketua Kamar Putri',
    jabatan: 'Ketua Kamar D3',
    nama_custom: 'Ibu Mar\'atussholihah',
    alamat: 'Katibung',
    keterangan: 'Ketua Kamar Putri',
    no_urut: 95
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Ketua Kamar Putri',
    jabatan: 'Ketua Kamar D4',
    nama_custom: 'Sdri. Luthfiah Azmi',
    alamat: 'Beringin Kencana',
    keterangan: 'Ketua Kamar Putri',
    no_urut: 96
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Ketua Kamar Putri',
    jabatan: 'Ketua Kamar E1',
    nama_custom: 'Sdri. Sinta Prabanoto Haryanto',
    alamat: 'Banyumas',
    keterangan: 'Ketua Kamar Putri',
    no_urut: 97
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Ketua Kamar Putri',
    jabatan: 'Ketua Kamar E2',
    nama_custom: 'Sdri. Rara Febrianti',
    alamat: 'Kalianda',
    keterangan: 'Ketua Kamar Putri',
    no_urut: 98
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Ketua Kamar Putri',
    jabatan: 'Ketua Kamar E3',
    nama_custom: 'Sdri. Dinda Monika',
    alamat: 'Banyumas',
    keterangan: 'Ketua Kamar Putri',
    no_urut: 99
  },
  {
    tipe: 'pondok_putri',
    kategori: 'Ketua Kamar Putri',
    jabatan: 'Ketua Kamar E4',
    nama_custom: 'Sdri. Ade Syifaul Riski Hidayah',
    alamat: 'Way Galih',
    keterangan: 'Ketua Kamar Putri',
    no_urut: 100
  },

  // ── J. JAM'IYYAH PUSAT ──────────────────────────────────────────
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Pusat',
    jabatan: 'Ketua Jam\'iyyah Pusat',
    nama_custom: 'Bpk. Sifaul Huda',
    alamat: 'Way Gelam',
    keterangan: 'Ketua Koordinasi Jam\'iyyah Pusat',
    no_urut: 101
  },

  // ── K. JAM'IYYAH PUTRA ──────────────────────────────────────────
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putra',
    jabatan: 'Ketua Umum',
    nama_custom: 'Sdr. Bara Alvin Azkia',
    alamat: 'Katibung',
    keterangan: 'Jam\'iyyah Santri Putra',
    no_urut: 102
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putra',
    jabatan: 'Ketua Satu',
    nama_custom: 'Sdr. M. Farid Ardhani',
    alamat: 'Sidomulyo',
    keterangan: 'Jam\'iyyah Santri Putra',
    no_urut: 103
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putra',
    jabatan: 'Sekretaris Umum',
    nama_custom: 'Sdr. M. Reyhan',
    alamat: 'Katibung',
    keterangan: 'Jam\'iyyah Santri Putra',
    no_urut: 104
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putra',
    jabatan: 'Sekretaris Satu',
    nama_custom: 'Sdr. M. Nabil Farkhan',
    alamat: 'Ulu Selatan',
    keterangan: 'Jam\'iyyah Santri Putra',
    no_urut: 105
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putra',
    jabatan: 'Bendahara Umum',
    nama_custom: 'Sdr. Darullah Al Fath',
    alamat: 'Ruguk',
    keterangan: 'Jam\'iyyah Santri Putra',
    no_urut: 106
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putra',
    jabatan: 'Bendahara Satu',
    nama_custom: 'Sdr. Kevin Raditia',
    alamat: 'Way Sulan',
    keterangan: 'Jam\'iyyah Santri Putra',
    no_urut: 107
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putra',
    jabatan: 'Keamanan',
    nama_custom: 'Sdr. A. Faizul Azam Zami',
    alamat: 'Sidomulyo',
    keterangan: 'Jam\'iyyah Santri Putra',
    no_urut: 108
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putra',
    jabatan: 'Keamanan',
    nama_custom: 'Sdr. Raihan Zulfaqih',
    alamat: 'Bandar Lampung',
    keterangan: 'Jam\'iyyah Santri Putra',
    no_urut: 109
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putra',
    jabatan: 'Keamanan',
    nama_custom: 'Sdr. Arfai\'is Husniawan',
    alamat: 'Mataram',
    keterangan: 'Jam\'iyyah Santri Putra',
    no_urut: 110
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putra',
    jabatan: 'Keamanan',
    nama_custom: 'Sdr. Dimas Dwi Prasetyo',
    alamat: 'Way Panji',
    keterangan: 'Jam\'iyyah Santri Putra',
    no_urut: 111
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putra',
    jabatan: 'Akomodasi',
    nama_custom: 'Sdr. Argo Putra Wahono',
    alamat: 'Beringin Kencana',
    keterangan: 'Jam\'iyyah Santri Putra',
    no_urut: 112
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putra',
    jabatan: 'Akomodasi',
    nama_custom: 'Sdr. Fahri Junaidi',
    alamat: 'Sidomulyo',
    keterangan: 'Jam\'iyyah Santri Putra',
    no_urut: 113
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putra',
    jabatan: 'Akomodasi',
    nama_custom: 'Sdr. Indrawan Prasetyo',
    alamat: 'Sidomulyo',
    keterangan: 'Jam\'iyyah Santri Putra',
    no_urut: 114
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putra',
    jabatan: 'Akomodasi',
    nama_custom: 'Sdr. M. Fauzi Abdillah',
    alamat: 'Sidomulyo',
    keterangan: 'Jam\'iyyah Santri Putra',
    no_urut: 115
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putra',
    jabatan: 'Humasi',
    nama_custom: 'Sdr. A. Damroni Shodiq',
    alamat: 'Waway Karya',
    keterangan: 'Jam\'iyyah Santri Putra',
    no_urut: 116
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putra',
    jabatan: 'Humasi',
    nama_custom: 'Sdr. Subhi Ramdhani',
    alamat: 'Tanggamus',
    keterangan: 'Jam\'iyyah Santri Putra',
    no_urut: 117
  },

  // ── L. JAM'IYYAH PUTRI ──────────────────────────────────────────
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putri',
    jabatan: 'Ketua Umum',
    nama_custom: 'Sdri. Aira Suci Meicca',
    alamat: 'Sidomulyo',
    keterangan: 'Jam\'iyyah Santri Putri',
    no_urut: 118
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putri',
    jabatan: 'Ketua Satu',
    nama_custom: 'Sdri. Silfia Alayda Yahya',
    alamat: 'Way Sulan',
    keterangan: 'Jam\'iyyah Santri Putri',
    no_urut: 119
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putri',
    jabatan: 'Sekretaris Umum',
    nama_custom: 'Sdri. Atharifa',
    alamat: 'Cintamulya',
    keterangan: 'Jam\'iyyah Santri Putri',
    no_urut: 120
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putri',
    jabatan: 'Sekretaris Satu',
    nama_custom: 'Sdri. Retno Dwi Cahyani',
    alamat: 'Waway Karya',
    keterangan: 'Jam\'iyyah Santri Putri',
    no_urut: 121
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putri',
    jabatan: 'Bendahara Umum',
    nama_custom: 'Sdri. Harnum Sabrina',
    alamat: 'Bumi Jaya',
    keterangan: 'Jam\'iyyah Santri Putri',
    no_urut: 122
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putri',
    jabatan: 'Bendahara Satu',
    nama_custom: 'Sdri. Amelia',
    alamat: 'Kalianda',
    keterangan: 'Jam\'iyyah Santri Putri',
    no_urut: 123
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putri',
    jabatan: 'Keamanan',
    nama_custom: 'Sdri. Shinta Prabanoto Haryanto',
    alamat: 'Banyumas',
    keterangan: 'Jam\'iyyah Santri Putri',
    no_urut: 124
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putri',
    jabatan: 'Keamanan',
    nama_custom: 'Sdri. Mawarita Alifia Sa\'adah',
    alamat: 'Kalianda',
    keterangan: 'Jam\'iyyah Santri Putri',
    no_urut: 125
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putri',
    jabatan: 'Keamanan',
    nama_custom: 'Sdri. Syifa Nur Maulida',
    alamat: 'Banyumas',
    keterangan: 'Jam\'iyyah Santri Putri',
    no_urut: 126
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putri',
    jabatan: 'Keamanan',
    nama_custom: 'Sdri. Lutfiah Azmi',
    alamat: 'Beringin Kencana',
    keterangan: 'Jam\'iyyah Santri Putri',
    no_urut: 127
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putri',
    jabatan: 'Akomodasi',
    nama_custom: 'Sdri. Aurela Mutiara',
    alamat: 'Cintamulya',
    keterangan: 'Jam\'iyyah Santri Putri',
    no_urut: 128
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putri',
    jabatan: 'Akomodasi',
    nama_custom: 'Sdri. Husna Amalia',
    alamat: 'Ruguk',
    keterangan: 'Jam\'iyyah Santri Putri',
    no_urut: 129
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putri',
    jabatan: 'Akomodasi',
    nama_custom: 'Sdri. Nailatuzzahro',
    alamat: 'Sinar Pasemah',
    keterangan: 'Jam\'iyyah Santri Putri',
    no_urut: 130
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putri',
    jabatan: 'Akomodasi',
    nama_custom: 'Sdri. Aulia Putri Rahmawati',
    alamat: 'Cintamulya',
    keterangan: 'Jam\'iyyah Santri Putri',
    no_urut: 131
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putri',
    jabatan: 'Humasi',
    nama_custom: 'Sdri. Dwi Fitriani',
    alamat: 'Way Sulan',
    keterangan: 'Jam\'iyyah Santri Putri',
    no_urut: 132
  },
  {
    tipe: 'jamiyyah',
    kategori: 'Jam\'iyyah Putri',
    jabatan: 'Humasi',
    nama_custom: 'Sdri. Najwa Hasnatusyafa',
    alamat: 'Cintamulya',
    keterangan: 'Jam\'iyyah Santri Putri',
    no_urut: 133
  }
];

async function migrate() {
  console.log('--- Memulai migrasi struktur pesantren ---');
  try {
    // 1. Tambah kolom kategori dan alamat jika belum ada
    await db.query(`
      ALTER TABLE struktur_organisasi 
      ADD COLUMN IF NOT EXISTS kategori VARCHAR(100),
      ADD COLUMN IF NOT EXISTS alamat VARCHAR(150);
    `);
    console.log('✓ Kolom kategori & alamat berhasil dipastikan.');

    // 2. Perbarui check constraint pada kolom tipe
    await db.query(`
      ALTER TABLE struktur_organisasi 
      DROP CONSTRAINT IF EXISTS struktur_organisasi_tipe_check;
    `);

    await db.query(`
      ALTER TABLE struktur_organisasi 
      ADD CONSTRAINT struktur_organisasi_tipe_check 
      CHECK (tipe IN (
        'madrasah_diniyah', 'panitia_ujian',
        'pmq', 'pondok_putra', 'pondok_putri',
        'panitia_sambangan', 'panitia_haflah', 'panitia_psb',
        'dewan_penyantun', 'jamiyyah', 'pondok_pesantren'
      ));
    `);
    console.log('✓ Check constraint tipe diperluas.');

    // 3. Ambil daftar guru untuk auto-matching
    const gurusRes = await db.query('SELECT id, nama, no_hp, foto_url FROM guru');
    const gurus = gurusRes.rows;

    function findGuruId(namaCustom) {
      if (!namaCustom) return null;
      // bersihkan gelar Bpk., Ibu, Sdr., Sdri., Kyai, Umi
      const cleanName = namaCustom
        .replace(/^(Bpk\.|Ibu\.|Sdr\.|Sdri\.|Kyai|Umi|Ust\.|Usth\.)\s+/i, '')
        .trim().toLowerCase();

      for (const g of gurus) {
        const gName = (g.nama || '').trim().toLowerCase();
        if (gName === cleanName || gName.includes(cleanName) || cleanName.includes(gName)) {
          return g.id;
        }
      }
      return null;
    }

    // 4. Hapus data dummy lama khusus pondok_putra & pondok_putri yang lama jika ada
    await db.query(`
      DELETE FROM struktur_organisasi 
      WHERE tipe IN ('dewan_penyantun', 'jamiyyah') 
         OR (tipe IN ('pondok_putra', 'pondok_putri') AND keterangan LIKE '%Kebijakan Umum%')
         OR (tipe IN ('pondok_putra', 'pondok_putri') AND nama_custom IN ('K.H. Musthofa Bisri', 'Ibu Nyai Hj. Maimunah'));
    `);

    // 5. Masukkan data struktur untuk tahun_ajaran aktif (10) dan tahun_ajaran 11 (2026-2027)
    // Jika tidak ada data spesifik untuk tahun 10 & 11, kita insert
    const targetYears = [10, 11];

    for (const yearId of targetYears) {
      // Cek apakah sudah pernah dimasukkan
      const existing = await db.query(`
        SELECT count(*) FROM struktur_organisasi 
        WHERE tahun_ajaran_id = $1 AND tipe IN ('dewan_penyantun', 'pondok_putra', 'pondok_putri', 'jamiyyah')
      `, [yearId]);

      if (parseInt(existing.rows[0].count) > 20) {
        console.log(`✓ Tahun ajaran ${yearId} sudah memiliki data (${existing.rows[0].count} data). Melewati insert.`);
        continue;
      }

      console.log(`Inserting ${STRUKTUR_PESANTREN_DATA.length} records untuk tahun_ajaran_id = ${yearId}...`);
      for (const item of STRUKTUR_PESANTREN_DATA) {
        const matchedGuruId = findGuruId(item.nama_custom);

        await db.query(`
          INSERT INTO struktur_organisasi 
            (tipe, kategori, jabatan, guru_id, nama_custom, alamat, keterangan, no_urut, tahun_ajaran_id, created_at, updated_at)
          VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        `, [
          item.tipe,
          item.kategori,
          item.jabatan,
          matchedGuruId,
          item.nama_custom,
          item.alamat,
          item.keterangan,
          item.no_urut,
          yearId
        ]);
      }
      console.log(`✓ Selesai insert tahun ajaran ${yearId}`);
    }

    console.log('--- Migrasi Struktur Pesantren Sukses! ---');
    process.exit(0);
  } catch (err) {
    console.error('Error saat migrasi:', err);
    process.exit(1);
  }
}

migrate();
