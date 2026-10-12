import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/theme_manager.dart';

class MateriSidangScreen extends StatefulWidget {
  final int initialTabIndex;
  const MateriSidangScreen({
    super.key,
    this.initialTabIndex = 0,
  });

  @override
  State<MateriSidangScreen> createState() => _MateriSidangScreenState();
}

class _MateriSidangScreenState extends State<MateriSidangScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedTahunAjaran = '1446-1447 H / 2025-2026 M';

  final List<String> _tahunAjaranOptions = [
    '1446-1447 H / 2025-2026 M',
    '1445-1446 H / 2024-2025 M',
    '1444-1445 H / 2023-2024 M',
  ];

  final Map<String, List<Map<String, dynamic>>> _sidangData = {
    'madin': [
      {
        'id': 'DOC-MD-01',
        'title': 'Pedoman Standarisasi Kurikulum & Kitab Kuning',
        'noSurat': 'SK-01/DIR-MD/AH/1446',
        'tanggal': '15 Juli 2026',
        'halaman': 18,
        'ukuran': '2.4 MB',
        'status': 'Disahkan & Resmi',
        'pengesah': 'Direktur Madrasah Diniyah',
        'ringkasan': 'Pedoman silabus, batasan juz amma, fan fiqih fathul qorib, nahwu imrithi, dan target muhafadzoh santri tahun ajaran aktif.',
      },
      {
        'id': 'DOC-MD-02',
        'title': 'Tata Tertib Sidang Pleno Asatidz Madin 1446 H',
        'noSurat': 'TAP-02/PLN-MD/AH/1446',
        'tanggal': '12 Juli 2026',
        'halaman': 8,
        'ukuran': '920 KB',
        'status': 'Ketetapan Pleno',
        'pengesah': 'Pimpinan Sidang Pleno',
        'ringkasan': 'Aturan kehadiran, hak suara guru, mekanisme evaluasi kbm, dan pembagian tugas korektor ujian semester.',
      },
      {
        'id': 'DOC-MD-03',
        'title': 'Ketetapan Nilai Kelulusan & Standar KKM Santri',
        'noSurat': 'SK-03/DIR-MD/AH/1446',
        'tanggal': '20 Juli 2026',
        'halaman': 12,
        'ukuran': '1.5 MB',
        'status': 'Disahkan & Resmi',
        'pengesah': 'Dewan Pengawas Akademik',
        'ringkasan': 'Rentang kriteria nilai Muhafadzoh (Jayyid Jiddan, Jayyid, Maqbul), Qiroatul Kitab, dan Taftisyul Kutub per tingkatan.',
      },
      {
        'id': 'DOC-MD-04',
        'title': 'Notulensi Sidang Pleno Evaluasi KBM Semester Gasal',
        'noSurat': 'NTL-04/DIR-MD/AH/1446',
        'tanggal': '02 Oktober 2026',
        'halaman': 14,
        'ukuran': '1.8 MB',
        'status': 'Arsip Notulensi',
        'pengesah': 'Sekretaris Sidang',
        'ringkasan': 'Catatan evaluasi ketercapaian target mutabaah, evaluasi kehadiran asatidz munawib, serta persiapan ujian tulis.',
      },
    ],
    'pmq': [
      {
        'id': 'DOC-PMQ-01',
        'title': 'Ketetapan Target Tahfidz 30 Juz & Mutqin PMQ',
        'noSurat': 'SK-01/PMQ-AH/1446',
        'tanggal': '10 Juli 2026',
        'halaman': 16,
        'ukuran': '2.1 MB',
        'status': 'Disahkan & Resmi',
        'pengesah': 'Direktur PMQ Al-Hamid',
        'ringkasan': 'Target minimal setoran 1 juz per bulan, jadwal tasmi bil-ghoib per 5 juz di hadapan penguji, serta kriteria wisuda tahfidz.',
      },
      {
        'id': 'DOC-PMQ-02',
        'title': 'Standarisasi Munaqosyah Metode Yanbu\'a & Tajwid',
        'noSurat': 'SK-02/PMQ-AH/1446',
        'tanggal': '14 Juli 2026',
        'halaman': 22,
        'ukuran': '3.2 MB',
        'status': 'Pedoman Munaqosyah',
        'pengesah': 'Tim Penguji Pusat Yanbu\'a',
        'ringkasan': 'Panduan kenaikan jilid 1-7, tes fashohah, ghoribul qur\'an, dan materi ujian sanad tajwid Jazariyyah.',
      },
      {
        'id': 'DOC-PMQ-03',
        'title': 'Rundown & Tata Laksana Tasmi\' Akbar 30 Juz',
        'noSurat': 'DOC-03/PMQ-AH/1446',
        'tanggal': '25 Agustus 2026',
        'halaman': 9,
        'ukuran': '1.1 MB',
        'status': 'Panduan Acara',
        'pengesah': 'Koordinator Tahfidz',
        'ringkasan': 'Jadwal sima\'an bil-ghoib satu hari satu malam di Masjid Jami\', pembagian halaqoh, dan penyediaan tim mustami\'.',
      },
    ],
    'pondok': [
      {
        'id': 'DOC-PP-01',
        'title': 'Qonun Asasi & Tata Tertib Santri Ponpes Al-Hamid',
        'noSurat': 'SK-01/PP-AH/1446',
        'tanggal': '01 Juli 2026',
        'halaman': 28,
        'ukuran': '4.1 MB',
        'status': 'Ketetapan Tertinggi',
        'pengesah': 'Majelis Pengasuh Pondok',
        'ringkasan': 'Aturan lengkap jam wajib asrama, disiplin ubudiyah, tata cara sambangan, izin pesiar/pulang, dan larangan barang elektronik.',
      },
      {
        'id': 'DOC-PP-02',
        'title': 'Pedoman Takzir Edukatif & Kode Etik Mahasantri',
        'noSurat': 'SK-02/KMN-AH/1446',
        'tanggal': '05 Juli 2026',
        'halaman': 12,
        'ukuran': '1.6 MB',
        'status': 'Pedoman Keamanan',
        'pengesah': 'Biro Keamanan & Ketertiban',
        'ringkasan': 'Tabel klasifikasi takzir ringan, sedang, berat serta bentuk sanksi yang berorientasi tarbiyah dan ro\'an lingkungan.',
      },
      {
        'id': 'DOC-PP-03',
        'title': 'Notulensi Musyawarah Kerja Pengurus Pusat 1446 H',
        'noSurat': 'NTL-03/PP-AH/1446',
        'tanggal': '18 September 2026',
        'halaman': 15,
        'ukuran': '2.0 MB',
        'status': 'Arsip Notulensi',
        'pengesah': 'Lurah Pondok Putra & Putri',
        'ringkasan': 'Rencana pengadaan fasilitas asrama baru, revitalisasi sanitasi komplek barat, dan program santri entrepreneur.',
      },
    ],
    'haflah': [
      {
        'id': 'DOC-HFL-01',
        'title': 'SK Kepanitiaan Haflah Akhirussanah & Wisuda 1446 H',
        'noSurat': 'SK-01/HFL-AH/1446',
        'tanggal': '10 Agustus 2026',
        'halaman': 10,
        'ukuran': '1.3 MB',
        'status': 'SK Kepanitiaan',
        'pengesah': 'Pengasuh Pondok Pesantren',
        'ringkasan': 'Daftar lengkap ketua pelaksana, sekretaris, bendahara, serta seluruh koordinator divisi acara akbar haflah.',
      },
      {
        'id': 'DOC-HFL-02',
        'title': 'Rundown Acara & Tata Tertib Wisuda Akbar Santri',
        'noSurat': 'TAP-02/HFL-AH/1446',
        'tanggal': '15 September 2026',
        'halaman': 14,
        'ukuran': '1.9 MB',
        'status': 'Buku Panduan',
        'pengesah': 'Divisi Acara & Protokoler',
        'ringkasan': 'Rundown prosesi wisuda sanad quran, wisuda alfiyah & imrithi, tata tertib tamu undangan, serta jadwal mauidhoh hasanah.',
      },
      {
        'id': 'DOC-HFL-03',
        'title': 'Rancangan Anggaran Biaya (RAB) Haflah 1446 H',
        'noSurat': 'RAB-03/HFL-AH/1446',
        'tanggal': '20 September 2026',
        'halaman': 18,
        'ukuran': '2.5 MB',
        'status': 'Laporan Finansial',
        'pengesah': 'Bendahara Umum Panitia',
        'ringkasan': 'Rincian anggaran panggung megah, videotron, konsumsi 5.000 wali santri, seragam wisudawan, dan cenderamata alumni.',
      },
    ],
  };

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 4,
      vsync: this,
      initialIndex: widget.initialTabIndex.clamp(0, 3),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;

    return Scaffold(
      backgroundColor: context.scaffoldBg,
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF0D1527) : Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.titleColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "Materi & Berkas Sidang (PDF)",
          style: GoogleFonts.outfit(
            color: context.titleColor,
            fontWeight: FontWeight.bold,
            fontSize: 17,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 14),
            child: Icon(Icons.picture_as_pdf_rounded, color: const Color(0xFFEF4444), size: 24),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: const Color(0xFFEF4444),
          indicatorWeight: 3,
          labelColor: const Color(0xFFEF4444),
          unselectedLabelColor: context.subTitleColor,
          labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13),
          unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.w500, fontSize: 13),
          tabs: const [
            Tab(text: "Sidang Madin"),
            Tab(text: "Sidang PMQ"),
            Tab(text: "Sidang Pondok"),
            Tab(text: "Sidang Haflah"),
          ],
        ),
      ),
      body: Column(
        children: [
          // Filter Tahun Ajaran
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF131C2E) : Colors.white,
              border: Border(
                bottom: BorderSide(color: isDark ? Colors.white10 : Colors.black12),
              ),
            ),
            child: Row(
              children: [
                Icon(Icons.calendar_today_rounded, size: 16, color: const Color(0xFFEF4444)),
                const SizedBox(width: 10),
                Text(
                  "Tahun Ajaran:",
                  style: GoogleFonts.outfit(
                    color: context.subTitleColor,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF0D1527) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: isDark ? Colors.white12 : Colors.black12),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _selectedTahunAjaran,
                        isExpanded: true,
                        dropdownColor: isDark ? const Color(0xFF131C2E) : Colors.white,
                        icon: Icon(Icons.arrow_drop_down_rounded, color: context.subTitleColor),
                        style: GoogleFonts.outfit(
                          color: context.titleColor,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                        items: _tahunAjaranOptions.map((ta) {
                          return DropdownMenuItem(value: ta, child: Text(ta));
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedTahunAjaran = val);
                        },
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Content Tabs
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildDocumentList('madin', 'Sidang Madrasah Diniyah', isDark),
                _buildDocumentList('pmq', 'Sidang Pleno PMQ (Al-Qur\'an)', isDark),
                _buildDocumentList('pondok', 'Sidang Umum Pondok Pesantren', isDark),
                _buildDocumentList('haflah', 'Sidang Panitia Haflah Akhirussanah', isDark),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDocumentList(String categoryKey, String categoryTitle, bool isDark) {
    final docs = _sidangData[categoryKey] ?? [];

    return ListView.builder(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      itemCount: docs.length,
      itemBuilder: (context, index) {
        final doc = docs[index];
        return _buildDocCard(doc, isDark);
      },
    );
  }

  Widget _buildDocCard(Map<String, dynamic> doc, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131C2E) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.06),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // PDF Icon Badge
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.picture_as_pdf_rounded,
                  color: Color(0xFFEF4444),
                  size: 26,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEF4444).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        doc['status'] as String,
                        style: GoogleFonts.outfit(
                          color: const Color(0xFFEF4444),
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      doc['title'] as String,
                      style: GoogleFonts.outfit(
                        color: context.titleColor,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      doc['noSurat'] as String,
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            doc['ringkasan'] as String,
            style: GoogleFonts.outfit(
              color: context.bodyColor,
              fontSize: 11,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 14),
          const Divider(height: 1),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.layers_rounded, size: 13, color: context.subTitleColor),
              const SizedBox(width: 4),
              Text(
                "${doc['halaman']} Halaman • ${doc['ukuran']}",
                style: GoogleFonts.outfit(fontSize: 11, color: context.subTitleColor),
              ),
              const Spacer(),
              ElevatedButton.icon(
                onPressed: () => _openPdfViewer(doc),
                icon: const Icon(Icons.visibility_rounded, size: 14),
                label: const Text("Buka Dokumen PDF"),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFEF4444),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  textStyle: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.bold),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _openPdfViewer(Map<String, dynamic> doc) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PdfDocumentViewerScreen(
          docTitle: doc['title'] as String,
          noSurat: doc['noSurat'] as String,
          tanggal: doc['tanggal'] as String,
          pengesah: doc['pengesah'] as String,
          totalHalaman: doc['halaman'] as int,
          ringkasan: doc['ringkasan'] as String,
          tahunAjaran: _selectedTahunAjaran,
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF Interactive Viewer Screen
// ─────────────────────────────────────────────────────────────────────────────
class PdfDocumentViewerScreen extends StatefulWidget {
  final String docTitle;
  final String noSurat;
  final String tanggal;
  final String pengesah;
  final int totalHalaman;
  final String ringkasan;
  final String tahunAjaran;

  const PdfDocumentViewerScreen({
    super.key,
    required this.docTitle,
    required this.noSurat,
    required this.tanggal,
    required this.pengesah,
    required this.totalHalaman,
    required this.ringkasan,
    required this.tahunAjaran,
  });

  @override
  State<PdfDocumentViewerScreen> createState() => _PdfDocumentViewerScreenState();
}

class _PdfDocumentViewerScreenState extends State<PdfDocumentViewerScreen> {
  int _currentPage = 1;
  double _zoomScale = 1.0;

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF070B13) : const Color(0xFFE2E8F0),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF0D1527) : Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.close_rounded, color: context.titleColor),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.docTitle,
              style: GoogleFonts.outfit(
                color: context.titleColor,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            Text(
              "${widget.noSurat} • Hal $_currentPage dari ${widget.totalHalaman}",
              style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 11),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: "Zoom Out",
            icon: Icon(Icons.zoom_out_rounded, color: context.titleColor, size: 20),
            onPressed: () {
              if (_zoomScale > 0.8) setState(() => _zoomScale -= 0.15);
            },
          ),
          IconButton(
            tooltip: "Zoom In",
            icon: Icon(Icons.zoom_in_rounded, color: context.titleColor, size: 20),
            onPressed: () {
              if (_zoomScale < 1.5) setState(() => _zoomScale += 0.15);
            },
          ),
          IconButton(
            tooltip: "Bagikan Dokumen",
            icon: Icon(Icons.share_rounded, color: const Color(0xFFEF4444), size: 20),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text("Menyiapkan tautan berkas resmi: ${widget.docTitle}"),
                  backgroundColor: const Color(0xFF10B981),
                  duration: const Duration(seconds: 2),
                ),
              );
            },
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF0D1527) : Colors.white,
          border: Border(top: BorderSide(color: isDark ? Colors.white10 : Colors.black12)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            ElevatedButton.icon(
              onPressed: _currentPage > 1 ? () => setState(() => _currentPage--) : null,
              icon: const Icon(Icons.arrow_back_rounded, size: 16),
              label: const Text("Hal Sebelumnya"),
              style: ElevatedButton.styleFrom(
                elevation: 0,
                backgroundColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                foregroundColor: context.titleColor,
                textStyle: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444).withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                "$_currentPage / ${widget.totalHalaman}",
                style: GoogleFonts.outfit(
                  color: const Color(0xFFEF4444),
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ),
            ElevatedButton.icon(
              onPressed: _currentPage < widget.totalHalaman ? () => setState(() => _currentPage++) : null,
              icon: const Icon(Icons.arrow_forward_rounded, size: 16),
              label: const Text("Hal Berikutnya"),
              style: ElevatedButton.styleFrom(
                elevation: 0,
                backgroundColor: const Color(0xFFEF4444),
                foregroundColor: Colors.white,
                textStyle: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
      ),
      body: Center(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.all(18),
          child: Transform.scale(
            scale: _zoomScale,
            child: _buildPdfPageCanvas(context, isDark),
          ),
        ),
      ),
    );
  }

  Widget _buildPdfPageCanvas(BuildContext context, bool isDark) {
    return Container(
      width: 380,
      constraints: const BoxConstraints(minHeight: 520),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
          BoxShadow(color: Colors.black26, blurRadius: 18, offset: Offset(0, 8)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Kop Surat Dokumen Resmi
          Center(
            child: Column(
              children: [
                Text(
                  "مَعْهَدُ اَلْحَمِيْدِ لِلتَّعْلِيْمِ الْإِسْلَامِيّ",
                  style: GoogleFonts.amiri(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF1E3A8A),
                  ),
                ),
                Text(
                  "PONDOK PESANTREN AL-HAMID CINTA MULYA",
                  style: GoogleFonts.outfit(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF0F172A),
                    letterSpacing: 0.8,
                  ),
                ),
                Text(
                  "Kec. Candipuro, Kab. Lampung Selatan • Dokumen Resmi Terverifikasi",
                  style: GoogleFonts.outfit(fontSize: 9, color: Colors.grey.shade600),
                ),
                const SizedBox(height: 8),
                const Divider(thickness: 2, color: Colors.black87),
                const Divider(thickness: 0.8, height: 2, color: Colors.black87),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // Judul Surat & Nomor
          Center(
            child: Column(
              children: [
                Text(
                  widget.docTitle.toUpperCase(),
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                    decoration: TextDecoration.underline,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  "Nomor: ${widget.noSurat}",
                  style: GoogleFonts.outfit(fontSize: 10, color: Colors.grey.shade700, fontWeight: FontWeight.w600),
                ),
                Text(
                  "Tahun Ajaran: ${widget.tahunAjaran}",
                  style: GoogleFonts.outfit(fontSize: 10, color: Colors.grey.shade700),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Isi Dokumen Halaman Ini
          Text(
            "BAB / PASAL KETETAPAN (HALAMAN $_currentPage):",
            style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black87),
          ),
          const SizedBox(height: 8),
          Text(
            "1. Menimbang kelancaran serta keteraturan seluruh kegiatan dan standarisasi proses belajar mengajar santri di lingkungan Pesantren Al-Hamid Cinta Mulya.",
            textAlign: TextAlign.justify,
            style: GoogleFonts.outfit(fontSize: 11, height: 1.5, color: Colors.black87),
          ),
          const SizedBox(height: 8),
          Text(
            "2. Mengingat hasil musyawarah mufakat dewan pimpinan, tim pengasuh, dan asatidz pada tanggal ${widget.tanggal} berkenaan dengan: ${widget.ringkasan}",
            textAlign: TextAlign.justify,
            style: GoogleFonts.outfit(fontSize: 11, height: 1.5, color: Colors.black87),
          ),
          const SizedBox(height: 8),
          Text(
            "3. Memutuskan bahwa segala aturan, silabus, dan pedoman yang tercantum dalam naskah ini berlaku mengikat untuk seluruh santri, ustadz, dan jajaran kepengurusan madrasah.",
            textAlign: TextAlign.justify,
            style: GoogleFonts.outfit(fontSize: 11, height: 1.5, color: Colors.black87),
          ),
          const SizedBox(height: 24),

          // Tanda Tangan & Stempel Resmi
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text("Ditetapkan di: Al-Hamid", style: GoogleFonts.outfit(fontSize: 9, color: Colors.black87)),
                  Text("Pada tanggal: ${widget.tanggal}", style: GoogleFonts.outfit(fontSize: 9, color: Colors.black87)),
                  const SizedBox(height: 4),
                  Text(widget.pengesah, style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black87)),
                  const SizedBox(height: 8),
                  // Stempel visual
                  Container(
                    width: 70,
                    height: 40,
                    decoration: BoxDecoration(
                      border: Border.all(color: const Color(0xFF1E40AF), width: 1.5),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      "TERVERIFIKASI\nPONDOK AL-HAMID",
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(
                        fontSize: 6,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF1E40AF),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text("( _______________________ )", style: GoogleFonts.outfit(fontSize: 10, color: Colors.black87)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 18),

          // Watermark footer
          Center(
            child: Text(
              "- Halaman $_currentPage dari ${widget.totalHalaman} • Berkas Digital Resmi Al-Hamid -",
              style: GoogleFonts.outfit(fontSize: 9, color: Colors.grey.shade500),
            ),
          ),
        ],
      ),
    );
  }
}
