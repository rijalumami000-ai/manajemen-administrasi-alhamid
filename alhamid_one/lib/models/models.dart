class User {
  final int id;
  final String username;
  final String fullName;
  final String role;

  User({required this.id, required this.username, required this.fullName, required this.role});

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? 0,
      username: json['username'] ?? '',
      fullName: json['full_name'] ?? '',
      role: json['role'] ?? '',
    );
  }
}

class Guru {
  final int id;
  final String? nip;
  final String nama;
  final String noHp;
  final String status;
  final String? fotoUrl;
  final String jabatan;
  final String? alamat;
  final String? kelasBinaan;

  Guru({
    required this.id,
    this.nip,
    required this.nama,
    required this.noHp,
    required this.status,
    this.fotoUrl,
    required this.jabatan,
    this.alamat,
    this.kelasBinaan,
  });

  factory Guru.fromJson(Map<String, dynamic> json) {
    return Guru(
      id: json['id'] ?? 0,
      nip: json['nip'],
      nama: json['nama'] ?? '',
      noHp: json['no_hp'] ?? '',
      status: json['status'] ?? '',
      fotoUrl: json['foto_url'],
      jabatan: json['jabatan'] ?? 'Guru',
      alamat: json['alamat'],
      kelasBinaan: json['kelas_binaan'],
    );
  }
}

class Kelas {
  final int id;
  final String nama;

  Kelas({required this.id, required this.nama});

  factory Kelas.fromJson(Map<String, dynamic> json) {
    return Kelas(
      id: json['id'] ?? 0,
      nama: json['nama'] ?? '',
    );
  }
}

class Student {
  final int id;
  final String nis;
  final String nama;
  final String jenisKelamin;
  final String? fotoUrl;
  final String kamarNama;

  Student({
    required this.id,
    required this.nis,
    required this.nama,
    required this.jenisKelamin,
    this.fotoUrl,
    required this.kamarNama,
  });

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: json['id'] ?? 0,
      nis: json['nis'] ?? '',
      nama: json['nama'] ?? '',
      jenisKelamin: json['jenis_kelamin'] ?? '',
      fotoUrl: json['foto_url'],
      kamarNama: json['kamar_nama'] ?? '-',
    );
  }
}

class Grade {
  final int id;
  final String mataPelajaran;
  final String kategoriEvaluasi;
  final double nilaiAngka;
  final String predikat;
  final String capaian;
  final String tipeKategori; // Muhafadzoh, Qiroatul Kitab, Taftisyul Kutub, Ujian Tulis, Lainnya

  Grade({
    required this.id,
    required this.mataPelajaran,
    required this.kategoriEvaluasi,
    required this.nilaiAngka,
    required this.predikat,
    required this.capaian,
    required this.tipeKategori,
  });

  factory Grade.fromJson(Map<String, dynamic> json) {
    return Grade(
      id: json['id'] ?? 0,
      mataPelajaran: json['mata_pelajaran'] ?? '',
      kategoriEvaluasi: json['kategori_evaluasi'] ?? '',
      nilaiAngka: double.tryParse(json['nilai_angka']?.toString() ?? '0') ?? 0.0,
      predikat: json['predikat'] ?? '-',
      capaian: json['capaian'] ?? '',
      tipeKategori: json['tipe_kategori'] ?? 'Lainnya',
    );
  }
}

class Achievement {
  final int id;
  final String jenis;
  final String tanggal;
  final String deskripsi;
  final String penghargaan;

  Achievement({
    required this.id,
    required this.jenis,
    required this.tanggal,
    required this.deskripsi,
    required this.penghargaan,
  });

  factory Achievement.fromJson(Map<String, dynamic> json) {
    return Achievement(
      id: json['id'] ?? 0,
      jenis: json['jenis'] ?? '',
      tanggal: json['tanggal'] ?? '',
      deskripsi: json['deskripsi'] ?? '',
      penghargaan: json['penghargaan'] ?? '',
    );
  }
}

class Violation {
  final int id;
  final String jenis;
  final String tanggal;
  final String deskripsi;
  final String sanksi;

  Violation({
    required this.id,
    required this.jenis,
    required this.tanggal,
    required this.deskripsi,
    required this.sanksi,
  });

  factory Violation.fromJson(Map<String, dynamic> json) {
    return Violation(
      id: json['id'] ?? 0,
      jenis: json['jenis'] ?? '',
      tanggal: json['tanggal'] ?? '',
      deskripsi: json['deskripsi'] ?? '',
      sanksi: json['sanksi'] ?? '',
    );
  }
}

class Schedule {
  final int id;
  final String malam;
  final int jamKe;
  final String mataPelajaranNama;
  final String guruNama;

  Schedule({
    required this.id,
    required this.malam,
    required this.jamKe,
    required this.mataPelajaranNama,
    required this.guruNama,
  });

  factory Schedule.fromJson(Map<String, dynamic> json) {
    return Schedule(
      id: json['id'] ?? 0,
      malam: json['malam'] ?? '',
      jamKe: json['jam_ke'] ?? 1,
      mataPelajaranNama: json['mata_pelajaran_nama'] ?? '-',
      guruNama: json['guru_nama'] ?? '-',
    );
  }
}
