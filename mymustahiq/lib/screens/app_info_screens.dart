import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';

// ═════════════════════════════════════════════════════════════════════════════
// 1. PUSAT BANTUAN SCREEN
// ═════════════════════════════════════════════════════════════════════════════
class PusatBantuanScreen extends StatefulWidget {
  const PusatBantuanScreen({super.key});

  @override
  State<PusatBantuanScreen> createState() => _PusatBantuanScreenState();
}

class _PusatBantuanScreenState extends State<PusatBantuanScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _searchController = TextEditingController();
  String _selectedCategory = 'Semua';
  bool _isLoading = true;
  List<dynamic> _items = [];
  final Set<int> _expandedIndices = {};

  final List<String> _categories = [
    'Semua',
    'Navigasi & Beranda',
    'Akademik & Jadwal',
    'Kelasku & Hafalan',
    'Administratif & Keuangan',
    'Akun & Keamanan',
  ];

  // Rich, verified native fallback data
  static const List<Map<String, dynamic>> _fallbackPusatBantuan = [
    {
      'id': 1,
      'category': 'Navigasi & Beranda',
      'title': 'Cara Menggunakan Halaman Beranda (Home)',
      'content': 'Halaman Home merupakan gerbang utama terpadu aplikasi Alhamid One.\n\n'
          '• Bagian Atas (Hero Serene Visual): Memuat penunjuk waktu presisi (jam & tanggal Masehi) serta ornamen geometri islami alami yang dinamis.\n'
          '• Ucapan Salam: Menyesuaikan waktu sholat/keadaan harian Anda.\n'
          '• Shortcut Launcher Glass: Tersedia 6 tombol jalan pintas (Akademik, Kelasku, Administratif, Akun, Chat, Notifikasi) dengan maksimal 4 per baris. Ketuk salah satu shortcut untuk langsung melompat ke modul terkait tanpa harus melalui navigasi manual.',
    },
    {
      'id': 2,
      'category': 'Akademik & Jadwal',
      'title': 'Melihat Jadwal Mengajar & Agenda KBM',
      'content': 'Untuk memeriksa jadwal mengajar:\n\n'
          '1. Buka Tab "Akademik" dari menu bawah atau shortcut Beranda.\n'
          '2. Pada kategori "Jadwal", Anda akan melihat kartu Jadwal Mengajar, Kalender Akademik, dan Silabus Pembelajaran.\n'
          '3. Ketuk "Jadwal Mengajar" untuk melihat daftar malam mengajar, nama kitab, kelas yang diajar, dan jam pelajaran.\n'
          '4. Informasi jadwal disinkronkan langsung dengan database pusat Pondok Pesantren Al-Hamid.',
    },
    {
      'id': 3,
      'category': 'Akademik & Jadwal',
      'title': 'Melakukan Scan Nilai / Kartu Ujian Santri',
      'content': 'Fitur Scan Kartu Ujian mempermudah koreksi dan input nilai otomatis:\n\n'
          '1. Masuk ke Tab "Akademik" lalu pilih menu "Scan Kartu Ujian" (atau melalui menu Ujian).\n'
          '2. Berikan izin kamera perangkat.\n'
          '3. Arahkan kamera ke QR Code / Barcode yang tertera pada lembar ujian santri.\n'
          '4. Sistem akan otomatis mendeteksi identitas santri, kelas, dan mata pelajaran, lalu Anda cukup memasukkan skor perolehan.',
    },
    {
      'id': 4,
      'category': 'Kelasku & Hafalan',
      'title': 'Pencatatan Setoran Hafalan & Muhafadzoh Santri',
      'content': 'Bagi Mustahiq maupun Munawib kelas:\n\n'
          '1. Buka Tab "Kelasku" dan pilih menu "Monitoring Setoran Hafalan".\n'
          '2. Pilih nama santri dari daftar kelas binaan Anda.\n'
          '3. Tentukan jenis materi hafalan (Nadhom Alfiyah, Imrithi, Jurumiyyah, Al-Qur\'an, atau Aqidatul Awam).\n'
          '4. Tuliskan bait/ayat setoran dan berikan predikat kelancaran.\n'
          '5. Riwayat setoran santri akan langsung tersimpan dan dapat dipantau oleh wali santri maupun pengurus pusat.',
    },
    {
      'id': 5,
      'category': 'Kelasku & Hafalan',
      'title': 'Input Nilai Rapor & Presensi Santri',
      'content': 'Pengelolaan nilai semester dan presensi harian santri:\n\n'
          '1. Pada Tab "Kelasku", pilih "Rapor Diniyah" atau "Input Nilai".\n'
          '2. Pilih mata pelajaran dan kelas.\n'
          '3. Masukkan nilai harian, nilai tugas, dan nilai ujian semester.\n'
          '4. Simpan nilai. Anda dapat melihat ringkasan rata-rata kelas dan status kelulusan secara real-time.',
    },
    {
      'id': 6,
      'category': 'Administratif & Keuangan',
      'title': 'Mengecek Pembayaran SPP & Tagihan Santri',
      'content': 'Menu Keuangan kini terintegrasi di dalam Tab "Administratif":\n\n'
          '1. Buka Tab "Administratif" di bilah navigasi bawah.\n'
          '2. Pilih tab segmen "Keuangan & SPP" di bagian atas.\n'
          '3. Anda dapat memantau status pembayaran SPP santri, riwayat transaksi, tagihan yang belum lunas, serta rincian buku kas secara transparan.',
    },
    {
      'id': 7,
      'category': 'Administratif & Keuangan',
      'title': 'Melihat Struktur Organisasi & Panitia Kegiatan',
      'content': 'Untuk memantau jajaran pengurus pesantren dan kepanitiaan:\n\n'
          '1. Buka Tab "Administratif" lalu pilih segmen "Administratif".\n'
          '2. Pada bagian Struktur, pilih organisasi yang ingin ditinjau (Madrasah Diniyah, Pondok Putra, Pondok Putri, Panitia Sambangan, Panitia Haflah, atau Panitia PSB).\n'
          '3. Bagan kepengurusan, nama pengurus, jabatan, dan nomor kontak akan tertata rapi.',
    },
    {
      'id': 8,
      'category': 'Akun & Keamanan',
      'title': 'Mengubah Foto Profil Ustadz / Akun',
      'content': 'Untuk memperbarui foto akun Anda:\n\n'
          '1. Masuk ke Tab "Akun".\n'
          '2. Ketuk ikon kamera kecil pada bingkai foto profil Anda di bagian atas.\n'
          '3. Pilih "Ambil dari Kamera" atau "Pilih dari Galeri".\n'
          '4. Sistem akan otomatis mengompresi dan mengunggah foto ke server. Foto profil Anda akan langsung tersinkronisasi di aplikasi maupun di portal Web Sekolah Info.',
    },
    {
      'id': 9,
      'category': 'Akun & Keamanan',
      'title': 'Mengaktifkan Login Biometrik & Kunci Cepat',
      'content': 'Agar dapat login instan tanpa harus mengetik password berulang kali:\n\n'
          '1. Pastikan Anda telah berhasil login dengan password Anda minimal satu kali.\n'
          '2. Buka Tab "Akun" > Buka kategori "Keamanan & Akses Masuk".\n'
          '3. Aktifkan toggle "Login Biometrik" (Sidik Jari / Face ID).\n'
          '4. Anda juga dapat menyetel opsi tambahan seperti Kunci PIN 6-Digit atau Kunci Pola untuk proteksi ganda.',
    },
  ];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final data = await _apiService.getAppContents(section: 'pusat_bantuan');
      if (mounted) {
        setState(() {
          _items = data.isNotEmpty ? data : _fallbackPusatBantuan;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _items = _fallbackPusatBantuan;
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;
    final query = _searchController.text.trim().toLowerCase();

    final filtered = _items.where((item) {
      final cat = item['category']?.toString() ?? '';
      final title = item['title']?.toString().toLowerCase() ?? '';
      final content = item['content']?.toString().toLowerCase() ?? '';

      final matchesCategory = _selectedCategory == 'Semua' || cat.toLowerCase().contains(_selectedCategory.toLowerCase());
      final matchesSearch = query.isEmpty || title.contains(query) || content.contains(query);
      return matchesCategory && matchesSearch;
    }).toList();

    return Scaffold(
      backgroundColor: context.scaffoldBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.titleColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "Pusat Bantuan",
          style: GoogleFonts.outfit(
            color: context.titleColor,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        onRefresh: _fetchData,
        color: const Color(0xFF10B981),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isDark
                        ? [const Color(0xFF064E3B).withOpacity(0.35), const Color(0xFF0F172A)]
                        : [const Color(0xFFECFDF5), const Color(0xFFF0FDF4)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: const Color(0xFF10B981).withOpacity(isDark ? 0.25 : 0.4),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.18),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.help_center_rounded, color: Color(0xFF10B981), size: 28),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Panduan & Bantuan Resmi",
                            style: GoogleFonts.outfit(
                              color: context.titleColor,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "Dokumentasi lengkap cara kerja & alur penggunaan modul Alhamid One.",
                            style: GoogleFonts.outfit(
                              color: context.subTitleColor,
                              fontSize: 12,
                              height: 1.35,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 18),

              // Search Bar
              Container(
                decoration: BoxDecoration(
                  color: context.cardBg,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: context.borderColor),
                ),
                child: TextField(
                  controller: _searchController,
                  onChanged: (val) => setState(() {}),
                  style: GoogleFonts.outfit(color: context.titleColor, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: "Cari tutorial, fitur, atau panduan...",
                    hintStyle: GoogleFonts.outfit(color: context.subTitleColor.withOpacity(0.6), fontSize: 13),
                    prefixIcon: Icon(Icons.search_rounded, color: context.subTitleColor, size: 22),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear_rounded, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              setState(() {});
                            },
                          )
                        : null,
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
              ),

              const SizedBox(height: 14),

              // Category Filter Pills
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                child: Row(
                  children: _categories.map((cat) {
                    final isSelected = _selectedCategory == cat;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: ChoiceChip(
                        label: Text(cat),
                        selected: isSelected,
                        onSelected: (val) => setState(() => _selectedCategory = cat),
                        labelStyle: GoogleFonts.outfit(
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                          color: isSelected ? Colors.white : context.subTitleColor,
                        ),
                        selectedColor: const Color(0xFF10B981),
                        backgroundColor: context.cardBg,
                        side: BorderSide(
                          color: isSelected ? const Color(0xFF10B981) : context.borderColor,
                        ),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                    );
                  }).toList(),
                ),
              ),

              const SizedBox(height: 18),

              // Content Items List
              if (_isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(40),
                    child: CircularProgressIndicator(color: Color(0xFF10B981)),
                  ),
                )
              else if (filtered.isEmpty)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 48),
                    child: Column(
                      children: [
                        Icon(Icons.search_off_rounded, size: 48, color: context.subTitleColor.withOpacity(0.5)),
                        const SizedBox(height: 12),
                        Text(
                          "Panduan tidak ditemukan",
                          style: GoogleFonts.outfit(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: context.titleColor,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "Coba gunakan kata kunci pencarian yang lain.",
                          style: GoogleFonts.outfit(fontSize: 12, color: context.subTitleColor),
                        ),
                      ],
                    ),
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, idx) {
                    final item = filtered[idx];
                    final isExpanded = _expandedIndices.contains(idx);
                    final catName = item['category']?.toString() ?? 'Umum';

                    return Container(
                      decoration: BoxDecoration(
                        color: context.cardBg,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isExpanded
                              ? const Color(0xFF10B981).withOpacity(0.5)
                              : context.borderColor,
                          width: isExpanded ? 1.4 : 1.0,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          InkWell(
                            borderRadius: BorderRadius.circular(16),
                            onTap: () {
                              setState(() {
                                if (isExpanded) {
                                  _expandedIndices.remove(idx);
                                } else {
                                  _expandedIndices.add(idx);
                                }
                              });
                            },
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF10B981).withOpacity(0.12),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Icon(
                                      Icons.menu_book_rounded,
                                      color: Color(0xFF10B981),
                                      size: 18,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF10B981).withOpacity(0.1),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            catName,
                                            style: GoogleFonts.outfit(
                                              fontSize: 10,
                                              fontWeight: FontWeight.bold,
                                              color: const Color(0xFF10B981),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          item['title'] ?? '-',
                                          style: GoogleFonts.outfit(
                                            fontSize: 14,
                                            fontWeight: FontWeight.bold,
                                            color: context.titleColor,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  AnimatedRotation(
                                    turns: isExpanded ? 0.5 : 0.0,
                                    duration: const Duration(milliseconds: 200),
                                    child: Icon(
                                      Icons.keyboard_arrow_down_rounded,
                                      color: context.subTitleColor,
                                      size: 22,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          if (isExpanded) ...[
                            Divider(color: context.borderColor, height: 1),
                            Padding(
                              padding: const EdgeInsets.fromLTRB(16, 14, 16, 18),
                              child: Text(
                                item['content'] ?? '',
                                style: GoogleFonts.outfit(
                                  fontSize: 13,
                                  color: context.bodyColor,
                                  height: 1.55,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    );
                  },
                ),

              const SizedBox(height: 36),
            ],
          ),
        ),
      ),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. TENTANG SCREEN
// ═════════════════════════════════════════════════════════════════════════════
class TentangScreen extends StatefulWidget {
  const TentangScreen({super.key});

  @override
  State<TentangScreen> createState() => _TentangScreenState();
}

class _TentangScreenState extends State<TentangScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  List<dynamic> _items = [];

  static const List<Map<String, dynamic>> _fallbackTentang = [
    {
      'title': 'Tentang Alhamid One',
      'content': 'Alhamid One adalah platform teknologi terintegrasi resmi Pondok Pesantren Al-Hamid Cinta Mulya. '
          'Platform ini dirancang khusus untuk memadukan seluruh dimensi operasional pesantren: mulai dari manajemen '
          'akademik madrasah diniyah, pembinaan santri, penjadwalan asatidz, pengawasan setoran hafalan, pelaporan KBM, '
          'hingga administrasi kelembagaan dan tata kelola keuangan santri secara modern, transparan, dan amanah.',
    },
    {
      'title': 'Visi & Komitmen',
      'content': 'Menjadikan Pondok Pesantren Al-Hamid sebagai pusat pendidikan salafiyah-modern yang unggul '
          'dalam keilmuan turots (kitab kuning) dan berdaya saing tinggi melalui pemanfaatan teknologi digital terpadu, '
          'guna menghadirkan pelayanan terbaik bagi santri, wali santri, dewan asatidz, dan masyarakat.',
    },
    {
      'title': 'Fitur Unggulan',
      'content': '• Sinkronisasi real-time antara aplikasi mobile guru (Alhamid One) dan portal web administrasi.\n'
          '• Keamanan multi-lapis dengan dukungan Login Biometrik, PIN, Pola, dan enkripsi sesi modern.\n'
          '• Pemantauan hafalan berkesinambungan dan rapor santri digital.\n'
          '• Akses cepat jadwal harian & kepengurusan madrasah.',
    },
  ];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final data = await _apiService.getAppContents(section: 'tentang');
      if (mounted) {
        setState(() {
          _items = data.isNotEmpty ? data : _fallbackTentang;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _items = _fallbackTentang;
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;

    return Scaffold(
      backgroundColor: context.scaffoldBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.titleColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "Tentang Aplikasi",
          style: GoogleFonts.outfit(
            color: context.titleColor,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        onRefresh: _fetchData,
        color: const Color(0xFF10B981),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Logo & App Name Card
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 88,
                      height: 88,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF131B2E) : Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: const Color(0xFF10B981).withOpacity(0.35),
                          width: 1.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF10B981).withOpacity(isDark ? 0.2 : 0.12),
                            blurRadius: 20,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Image.asset(
                        'assets/images/logo.png',
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) =>
                            const Icon(Icons.school_rounded, color: Color(0xFF10B981), size: 40),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      "Alhamid One",
                      style: GoogleFonts.outfit(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: context.titleColor,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        "Versi 1.4.3 (Build 8) • Production",
                        style: GoogleFonts.outfit(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF10B981),
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      "Pondok Pesantren Al-Hamid Cinta Mulya",
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        color: context.subTitleColor,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 28),

              // Content Items
              if (_isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(40),
                    child: CircularProgressIndicator(color: Color(0xFF10B981)),
                  ),
                )
              else
                ..._items.map((item) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: context.cardBg,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: context.borderColor),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item['title'] ?? '-',
                          style: GoogleFonts.outfit(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF10B981),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          item['content'] ?? '',
                          style: GoogleFonts.outfit(
                            fontSize: 13,
                            color: context.bodyColor,
                            height: 1.55,
                          ),
                        ),
                      ],
                    ),
                  );
                }),

              const SizedBox(height: 12),

              // Copyright Footer
              Center(
                child: Text(
                  "© 2026 Pondok Pesantren Al-Hamid.\nSeluruh Hak Cipta Dilindungi.",
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(
                    fontSize: 11,
                    color: context.subTitleColor.withOpacity(0.7),
                    height: 1.4,
                  ),
                ),
              ),

              const SizedBox(height: 36),
            ],
          ),
        ),
      ),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. PENGEMBANG SCREEN (Kata Kunci: Alhamid Studio Code)
// ═════════════════════════════════════════════════════════════════════════════
class PengembangScreen extends StatefulWidget {
  const PengembangScreen({super.key});

  @override
  State<PengembangScreen> createState() => _PengembangScreenState();
}

class _PengembangScreenState extends State<PengembangScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  List<dynamic> _items = [];

  static const List<Map<String, dynamic>> _fallbackPengembang = [
    {
      'title': 'Tim Pengembang Alhamid Studio Code',
      'content': 'Alhamid One dikembangkan dan dikelola secara mandiri oleh tim pengembang rekayasa perangkat lunak '
          'pesantren: "Alhamid Studio Code".\n\n'
          'Alhamid Studio Code berdedikasi menciptakan inovasi teknologi modern berbasis open-standard dan arsitektur '
          'cloud berkinerja tinggi untuk menunjang ekosistem digital Pondok Pesantren Al-Hamid secara berkelanjutan.',
    },
    {
      'title': 'Standar Teknologi & Keamanan',
      'content': '• Frontend Mobile: Flutter Framework (Multiplatform Native UI/UX)\n'
          '• Backend Platform: Node.js, Express RESTful Engine\n'
          '• Database Core: PostgreSQL Relational Database\n'
          '• Web Administration: React, Vite, SCSS Design System\n'
          '• Security & Auth: JWT Bearer Tokens, Bcrypt Hashing, Local Biometric Hardware Authentication',
    },
    {
      'title': 'Kontribusi & Hubungi Pengembang',
      'content': 'Untuk koordinasi teknis, pelaporan anomali sistem, atau pengembangan fitur lanjutan, '
          'dapat menghubungi dewan pengembang internal Alhamid Studio Code melalui saluran resmi Sekretariat Pondok Pesantren Al-Hamid.',
    },
  ];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final data = await _apiService.getAppContents(section: 'pengembang');
      if (mounted) {
        setState(() {
          _items = data.isNotEmpty ? data : _fallbackPengembang;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _items = _fallbackPengembang;
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;

    return Scaffold(
      backgroundColor: context.scaffoldBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.titleColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "Pengembang",
          style: GoogleFonts.outfit(
            color: context.titleColor,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        onRefresh: _fetchData,
        color: const Color(0xFF10B981),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Developer Emblem Banner
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isDark
                        ? [const Color(0xFF1E1B4B), const Color(0xFF0F172A)]
                        : [const Color(0xFFEEF2FF), const Color(0xFFF8FAFC)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: const Color(0xFF6366F1).withOpacity(isDark ? 0.35 : 0.45),
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF6366F1).withOpacity(isDark ? 0.2 : 0.08),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF6366F1).withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.code_rounded,
                        color: Color(0xFF6366F1),
                        size: 36,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      "Alhamid Studio Code",
                      style: GoogleFonts.outfit(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: context.titleColor,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "Software Engineering & Pesantren Digital Labs",
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        color: const Color(0xFF6366F1),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      "Membangun perangkat lunak islami berdaya cipta tinggi untuk kemaslahatan santri & umat.",
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        color: context.subTitleColor,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Content Items
              if (_isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(40),
                    child: CircularProgressIndicator(color: Color(0xFF6366F1)),
                  ),
                )
              else
                ..._items.map((item) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: context.cardBg,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: context.borderColor),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.terminal_rounded, size: 18, color: Color(0xFF6366F1)),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                item['title'] ?? '-',
                                style: GoogleFonts.outfit(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: context.titleColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          item['content'] ?? '',
                          style: GoogleFonts.outfit(
                            fontSize: 13,
                            color: context.bodyColor,
                            height: 1.55,
                          ),
                        ),
                      ],
                    ),
                  );
                }),

              const SizedBox(height: 36),
            ],
          ),
        ),
      ),
    );
  }
}
