import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';

class SantriDetailScreen extends StatefulWidget {
  final int santriId;
  final int? tahunAjaranId;
  final String? semester;
  const SantriDetailScreen({
    super.key,
    required this.santriId,
    this.tahunAjaranId,
    this.semester,
  });

  @override
  State<SantriDetailScreen> createState() => _SantriDetailScreenState();
}

class _SantriDetailScreenState extends State<SantriDetailScreen> with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  late TabController _tabController;
  
  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic>? _data;

  List<dynamic> _tahunAjaranList = [];
  Map<String, dynamic>? _selectedTahunAjaran;
  String _selectedSemester = 'Ganjil';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _fetchDetailData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchDetailData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      if (_tahunAjaranList.isEmpty) {
        final taResult = await _apiService.getTahunAjaranList();
        _tahunAjaranList = taResult['tahunAjaran'] ?? [];
        _selectedSemester = widget.semester ?? taResult['activeSemester'] ?? 'Ganjil';
        if (_tahunAjaranList.isNotEmpty) {
          final targetId = widget.tahunAjaranId;
          _selectedTahunAjaran = targetId != null
              ? _tahunAjaranList.firstWhere((ta) => ta['id'] == targetId, orElse: () => null)
              : null;
          _selectedTahunAjaran ??= _tahunAjaranList.firstWhere(
            (ta) => ta['is_active'] == true,
            orElse: () => _tahunAjaranList.first,
          );
        }
      }

      final res = await _apiService.getStudentDetail(
        widget.santriId,
        tahunAjaranId: _selectedTahunAjaran?['id'],
        semester: _selectedSemester,
      );
      setState(() {
        _data = res;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = _data?['profile'];
    final grades = _data?['nilai'] as List<dynamic>? ?? [];
    final achievements = _data?['prestasi'] as List<dynamic>? ?? [];
    final violations = _data?['pelanggaran'] as List<dynamic>? ?? [];
    final rapor = _data?['rapor'] as Map<String, dynamic>?;
    final absensiDetail = _data?['absensi_detail'] as List<dynamic>? ?? [];

    final studentName = profile?['nama'] ?? 'Detail Santri';
    final nis = profile?['nis'] ?? '';
    final kelas = profile?['kelas_diniyah'] ?? '';
    final fotoUrl = profile?['foto_url'];
    final gender = profile?['jenis_kelamin'] ?? '';

    return Scaffold(
      backgroundColor: context.scaffoldBg,
      appBar: AppBar(
        backgroundColor: context.isDarkMode ? const Color(0xFF0D1527) : Colors.white.withOpacity(0.45),
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.titleColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "Profil Santri",
          style: GoogleFonts.outfit(color: context.titleColor, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline_rounded, color: Colors.amber, size: 48),
                        const SizedBox(height: 16),
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.outfit(color: context.titleColor, fontSize: 15),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: _fetchDetailData,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF064E3B),
                          ),
                          child: Text('Coba Lagi', style: GoogleFonts.outfit(color: Colors.white)),
                        ),
                      ],
                    ),
                  ),
                )
              : Column(
                  children: [
                    // Student Header Card
                    Container(
                      padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
                      color: context.cardBg,
                      child: Row(
                        children: [
                          Container(
                            width: 70,
                            height: 70,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.05),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: const Color(0xFF10B981),
                                width: 2,
                              ),
                            ),
                            child: ClipOval(
                              child: fotoUrl != null
                                  ? Image.network(
                                      _apiService.getFullImageUrl(fotoUrl),
                                      fit: BoxFit.cover,
                                      errorBuilder: (context, error, stackTrace) =>
                                          _buildDefaultAvatar(gender),
                                    )
                                  : _buildDefaultAvatar(gender),
                            ),
                          ),
                          const SizedBox(width: 20),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  studentName,
                                  style: GoogleFonts.outfit(
                                    color: context.titleColor,
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  "NIS: $nis",
                                  style: GoogleFonts.outfit(
                                    color: context.bodyColor,
                                    fontSize: 13,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF10B981).withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    "Kelas $kelas",
                                    style: GoogleFonts.outfit(
                                      color: const Color(0xFF10B981),
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1, thickness: 1),

                    // Year & Semester Filter Bar
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
                      color: context.isDarkMode ? const Color(0xFF0D1527) : Colors.white,
                      child: Row(
                        children: [
                          Expanded(
                            child: DropdownButton<Map<String, dynamic>>(
                              dropdownColor: context.isDarkMode ? const Color(0xFF1E293B) : Colors.white,
                              value: _selectedTahunAjaran,
                              isExpanded: true,
                              underline: const SizedBox(),
                              style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13, fontWeight: FontWeight.bold),
                              items: _tahunAjaranList.map<DropdownMenuItem<Map<String, dynamic>>>((ta) {
                                return DropdownMenuItem<Map<String, dynamic>>(
                                  value: ta as Map<String, dynamic>,
                                  child: Text("T.A: ${ta['kode']}"),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) {
                                  setState(() {
                                    _selectedTahunAjaran = val;
                                  });
                                  _fetchDetailData();
                                }
                              },
                            ),
                          ),
                          const SizedBox(width: 24),
                          Expanded(
                            child: DropdownButton<String>(
                              dropdownColor: context.isDarkMode ? const Color(0xFF1E293B) : Colors.white,
                              value: _selectedSemester,
                              isExpanded: true,
                              underline: const SizedBox(),
                              style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13, fontWeight: FontWeight.bold),
                              items: const [
                                DropdownMenuItem(value: "Ganjil", child: Text("Sem: Ganjil")),
                                DropdownMenuItem(value: "Genap", child: Text("Sem: Genap")),
                              ],
                              onChanged: (val) {
                                if (val != null) {
                                  setState(() {
                                    _selectedSemester = val;
                                  });
                                  _fetchDetailData();
                                }
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1, thickness: 1),

                    // Custom Tab Bar
                    Container(
                      color: context.isDarkMode ? const Color(0xFF0D1527) : Colors.white,
                      decoration: context.isDarkMode
                          ? null
                          : BoxDecoration(
                              border: Border(
                                bottom: BorderSide(color: context.borderColor),
                              ),
                            ),
                      child: TabBar(
                        controller: _tabController,
                        indicatorColor: const Color(0xFF10B981),
                        labelColor: const Color(0xFF10B981),
                        unselectedLabelColor: context.subTitleColor,
                        labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14),
                        unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.normal, fontSize: 14),
                        tabs: const [
                          Tab(text: "Profil"),
                          Tab(text: "Akademik"),
                          Tab(text: "Catatan"),
                          Tab(text: "Rapor"),
                        ],
                      ),
                    ),

                    // Tab Views
                    Expanded(
                      child: TabBarView(
                        controller: _tabController,
                        children: [
                          _buildProfilTab(profile),
                          _buildAkademikTab(grades),
                          _buildCatatanTab(achievements, violations),
                          _buildRaporTab(rapor, absensiDetail),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildDefaultAvatar(String gender) {
    final isPutra = gender.toLowerCase() == 'putra' || gender.toLowerCase().startsWith('l');
    return Icon(
      isPutra ? Icons.face_rounded : Icons.face_3_rounded,
      size: 38,
      color: const Color(0xFF10B981),
    );
  }

  // ===== TAB 1: PROFIL =====
  Widget _buildProfilTab(Map<String, dynamic>? profile) {
    if (profile == null) return const SizedBox();
    
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Personal Details
          _buildSectionTitle("BIODATA PRIBADI"),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: context.cardBg,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: context.borderColor),
            ),
            child: Column(
              children: [
                _buildInfoRow("NIK / No. KTP", profile['nik'] ?? '-'),
                _buildDivider(),
                _buildInfoRow("Jenis Kelamin", profile['jenis_kelamin'] ?? '-'),
                _buildDivider(),
                _buildInfoRow("Tempat Lahir", profile['tempat_lahir'] ?? '-'),
                _buildDivider(),
                _buildInfoRow("Tanggal Lahir", profile['tanggal_lahir'] ?? '-'),
                _buildDivider(),
                _buildInfoRow("Kamar Asrama", profile['kamar'] ?? '-'),
                _buildDivider(),
                _buildInfoRow("Sekolah Formal", profile['kelas_sekolah'] ?? '-'),
                _buildDivider(),
                _buildInfoRow("Alamat Lengkap", profile['alamat'] ?? '-'),
              ],
            ),
          ),
          const SizedBox(height: 30),

          // Parents Details
          _buildSectionTitle("DATA ORANG TUA / WALI"),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: context.cardBg,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: context.borderColor),
            ),
            child: Column(
              children: [
                _buildInfoRow("Nama Ayah", profile['orangtua']?['nama_ayah'] ?? '-'),
                _buildDivider(),
                _buildInfoRow("No. HP Ayah", profile['orangtua']?['no_hp_ayah'] ?? '-'),
                _buildDivider(),
                _buildInfoRow("Nama Ibu", profile['orangtua']?['nama_ibu'] ?? '-'),
                _buildDivider(),
                _buildInfoRow("No. HP Ibu", profile['orangtua']?['no_hp_ibu'] ?? '-'),
              ],
            ),
          ),
          const SizedBox(height: 30),
        ],
      ),
    );
  }

  // ===== TAB 2: AKADEMIK (NILAI OPSI A) =====
  Widget _buildAkademikTab(List<dynamic> grades) {
    if (grades.isEmpty) {
      return Center(
        child: Text(
          "Belum ada nilai terinput untuk santri ini.",
          style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 14),
        ),
      );
    }

    // Group grades by type category
    final muhafadzoh = grades.where((g) => g['tipe_kategori'] == 'Muhafadzoh').toList();
    final qiroatul = grades.where((g) => g['tipe_kategori'] == 'Qiroatul Kitab').toList();
    final taftisyul = grades.where((g) => g['tipe_kategori'] == 'Taftisyul Kutub').toList();
    final ujianTulis = grades.where((g) => g['tipe_kategori'] == 'Ujian Tulis').toList();
    final lainnya = grades.where((g) => g['tipe_kategori'] == 'Lainnya').toList();

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Muhafadzoh
          if (muhafadzoh.isNotEmpty) ...[
            _buildSectionTitle("NILAI MUHAFADZOH (HAFALAN)"),
            const SizedBox(height: 12),
            _buildGradesCardList(muhafadzoh, const Color(0xFF10B981)),
            const SizedBox(height: 30),
          ],

          // Qiroatul Kitab
          if (qiroatul.isNotEmpty) ...[
            _buildSectionTitle("NILAI QIROATUL KITAB (BACAAN)"),
            const SizedBox(height: 12),
            _buildGradesCardList(qiroatul, const Color(0xFF3B82F6)),
            const SizedBox(height: 30),
          ],

          // Taftisyul Kutub
          if (taftisyul.isNotEmpty) ...[
            _buildSectionTitle("NILAI TAFTISYUL KUTUB (MAKNA KITAB)"),
            const SizedBox(height: 12),
            _buildGradesCardList(taftisyul, const Color(0xFF8B5CF6)),
            const SizedBox(height: 30),
          ],

          // Ujian Tulis
          if (ujianTulis.isNotEmpty) ...[
            _buildSectionTitle("NILAI UJIAN TULIS SEMESTER"),
            const SizedBox(height: 12),
            _buildGradesCardList(ujianTulis, const Color(0xFFF59E0B)),
            const SizedBox(height: 30),
          ],

          // Lainnya
          if (lainnya.isNotEmpty) ...[
            _buildSectionTitle("NILAI MATA PELAJARAN REGULER LAINNYA"),
            const SizedBox(height: 12),
            _buildGradesCardList(lainnya, const Color(0xFF64748B)),
            const SizedBox(height: 30),
          ],
        ],
      ),
    );
  }

  Widget _buildGradesCardList(List<dynamic> group, Color themeColor) {
    return Container(
      decoration: BoxDecoration(
        color: context.cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.borderColor),
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: group.length,
        separatorBuilder: (context, index) => _buildDivider(),
        itemBuilder: (context, index) {
          final item = group[index];
          final double score = double.tryParse(item['nilai_angka']?.toString() ?? '0') ?? 0.0;
          return Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item['mata_pelajaran'] ?? '-',
                        style: GoogleFonts.outfit(
                          color: context.titleColor,
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "${item['kategori_evaluasi']} • Predikat: ${item['predikat'] ?? '-'}",
                        style: GoogleFonts.outfit(
                          color: context.subTitleColor,
                          fontSize: 12,
                        ),
                      ),
                      if (item['capaian'] != null && item['capaian'].toString().trim().isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          "Catatan: ${item['capaian']}",
                          style: GoogleFonts.inter(
                            color: context.bodyColor,
                            fontSize: 12,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ]
                    ],
                  ),
                ),
                Container(
                  width: 50,
                  height: 50,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: themeColor.withOpacity(0.12),
                    shape: BoxShape.circle,
                    border: Border.all(color: themeColor.withOpacity(0.3), width: 1),
                  ),
                  child: Text(
                    score.toStringAsFixed(score % 1 == 0 ? 0 : 1),
                    style: GoogleFonts.outfit(
                      color: themeColor,
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // ===== TAB 3: CATATAN (PRESTASI & PELANGGARAN) =====
  Widget _buildCatatanTab(List<dynamic> achievements, List<dynamic> violations) {
    if (achievements.isEmpty && violations.isEmpty) {
      return Center(
        child: Text(
          "Tidak ada catatan prestasi atau pelanggaran santri.",
          style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 14),
        ),
      );
    }

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Prestasi (Emerald Theme)
          if (achievements.isNotEmpty) ...[
            _buildSectionTitle("DAFTAR PRESTASI SANTRI"),
            const SizedBox(height: 12),
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: achievements.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final item = achievements[index];
                return Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: context.cardBg,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: const Color(0xFF10B981).withOpacity(context.isDarkMode ? 0.15 : 0.4),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            item['jenis'] ?? 'Prestasi',
                            style: GoogleFonts.outfit(
                              color: const Color(0xFF10B981),
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            item['tanggal'] ?? '',
                            style: GoogleFonts.outfit(
                              color: context.subTitleColor,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        item['deskripsi'] ?? '-',
                        style: GoogleFonts.inter(color: context.bodyColor, fontSize: 13, height: 1.4),
                      ),
                      if (item['penghargaan'] != null) ...[
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            const Icon(Icons.emoji_events_rounded, color: Colors.amber, size: 16),
                            const SizedBox(width: 6),
                            Text(
                              "Penghargaan: ${item['penghargaan']}",
                              style: GoogleFonts.outfit(
                                color: Colors.amber,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 30),
          ],

          // Pelanggaran (Coral/Red Theme)
          if (violations.isNotEmpty) ...[
            _buildSectionTitle("CATATAN PELANGGARAN SANTRI"),
            const SizedBox(height: 12),
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: violations.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final item = violations[index];
                return Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: context.cardBg,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: Colors.redAccent.withOpacity(context.isDarkMode ? 0.15 : 0.4),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            item['jenis'] ?? 'Pelanggaran',
                            style: GoogleFonts.outfit(
                              color: Colors.redAccent,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            item['tanggal'] ?? '',
                            style: GoogleFonts.outfit(
                              color: context.subTitleColor,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        item['deskripsi'] ?? '-',
                        style: GoogleFonts.inter(color: context.bodyColor, fontSize: 13, height: 1.4),
                      ),
                      if (item['sanksi'] != null) ...[
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            const Icon(Icons.gavel_rounded, color: Colors.orangeAccent, size: 16),
                            const SizedBox(width: 6),
                            Text(
                              "Sanksi: ${item['sanksi']}",
                              style: GoogleFonts.outfit(
                                color: Colors.orangeAccent,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 30),
          ],
        ],
      ),
    );
  }

  // ===== CARD STYLING HELPERS =====
  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.outfit(
        color: context.subTitleColor,
        fontSize: 11,
        fontWeight: FontWeight.bold,
        letterSpacing: 1.5,
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: GoogleFonts.outfit(
                color: context.subTitleColor,
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 3,
            child: Text(
              value,
              style: GoogleFonts.outfit(
                color: context.titleColor,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return Divider(
      color: context.borderColor,
      height: 24,
      thickness: 1,
    );
  }

  // ===== TAB 4: RAPOR (ABSENSI, KEPRIBADIAN, CATATAN WALI, KENAIKAN) =====
  Widget _buildRaporTab(Map<String, dynamic>? rapor, List<dynamic> absensiDetail) {
    if (rapor == null) {
      return Center(
        child: Text(
          "Tidak ada data rapor untuk santri ini.",
          style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 14),
        ),
      );
    }

    final totalSakit = rapor['sakit'] ?? 0;
    final totalIzin = rapor['izin'] ?? 0;
    final totalAlpa = rapor['alpa'] ?? 0;

    final akhlaq = rapor['akhlaq'];
    final keaktifan = rapor['keaktifan'];
    final kerapihan = rapor['kerapihan'];
    final catatan = rapor['catatan'] ?? '';
    final keputusanKenaikan = rapor['keputusan_kenaikan'] ?? '';

    final isSemesterGenap = _selectedSemester.toLowerCase() == 'genap';

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. KEHADIRAN / ABSENSI
          _buildSectionTitle("KEHADIRAN / ABSENSI SANTRI"),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: context.cardBg,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: context.borderColor),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Summary Cards row
                Row(
                  children: [
                    Expanded(
                      child: _buildAbsensiSummaryCard(
                        "Sakit",
                        totalSakit,
                        const Color(0xFFF59E0B), // Amber/Orange
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildAbsensiSummaryCard(
                        "Izin",
                        totalIzin,
                        const Color(0xFF3B82F6), // Blue
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildAbsensiSummaryCard(
                        "Alpa",
                        totalAlpa,
                        const Color(0xFFEF4444), // Red
                      ),
                    ),
                  ],
                ),
                if (absensiDetail.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  Text(
                    "Detail Absensi Bulanan:",
                    style: GoogleFonts.outfit(
                      color: context.titleColor,
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 10),
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: absensiDetail.length,
                    separatorBuilder: (context, index) => Divider(
                      color: context.borderColor.withOpacity(0.5),
                      height: 12,
                    ),
                    itemBuilder: (context, index) {
                      final item = absensiDetail[index];
                      final bSakit = item['sakit'] ?? 0;
                      final bIzin = item['izin'] ?? 0;
                      final bAlpa = item['alpa'] ?? 0;
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              item['bulan'] ?? '-',
                              style: GoogleFonts.outfit(
                                color: context.titleColor,
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Row(
                              children: [
                                _buildAbsensiMiniBadge("S", bSakit, const Color(0xFFF59E0B)),
                                const SizedBox(width: 8),
                                _buildAbsensiMiniBadge("I", bIzin, const Color(0xFF3B82F6)),
                                const SizedBox(width: 8),
                                _buildAbsensiMiniBadge("A", bAlpa, const Color(0xFFEF4444)),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 30),

          // 2. NILAI KEPRIBADIAN / SIKAP
          _buildSectionTitle("NILAI KEPRIBADIAN / SIKAP"),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: context.cardBg,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: context.borderColor),
            ),
            child: Column(
              children: [
                _buildKepribadianRow(
                  "Akhlaq / Kelakuan",
                  akhlaq,
                  Icons.favorite_rounded,
                  const Color(0xFF10B981), // Emerald
                ),
                _buildDivider(),
                _buildKepribadianRow(
                  "Keaktifan / Kerajinan",
                  keaktifan,
                  Icons.directions_run_rounded,
                  const Color(0xFF3B82F6), // Blue
                ),
                _buildDivider(),
                _buildKepribadianRow(
                  "Kerapihan / Kebersihan",
                  kerapihan,
                  Icons.checkroom_rounded,
                  const Color(0xFF8B5CF6), // Purple
                ),
              ],
            ),
          ),
          const SizedBox(height: 30),

          // 3. CATATAN WALI KELAS
          _buildSectionTitle("CATATAN WALI KELAS"),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: context.cardBg,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: context.borderColor),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.format_quote_rounded,
                  color: const Color(0xFF10B981).withOpacity(0.6),
                  size: 32,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    catatan.trim().isNotEmpty
                        ? catatan
                        : "Tidak ada catatan dari wali kelas.",
                    style: GoogleFonts.inter(
                      color: catatan.trim().isNotEmpty ? context.titleColor : context.subTitleColor,
                      fontSize: 14,
                      fontStyle: catatan.trim().isNotEmpty ? FontStyle.italic : FontStyle.normal,
                      height: 1.5,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // 4. KEPUTUSAN KENAIKAN KELAS (Semester Genap Only)
          if (isSemesterGenap) ...[
            const SizedBox(height: 30),
            _buildSectionTitle("KEPUTUSAN KENAIKAN KELAS"),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: context.isDarkMode
                      ? [const Color(0xFF064E3B), const Color(0xFF0F172A)]
                      : [const Color(0xFFECFDF5), const Color(0xFFD1FAE5)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: const Color(0xFF10B981).withOpacity(0.3),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.campaign_rounded,
                      color: Color(0xFF10B981),
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Keputusan Semester Akhir",
                          style: GoogleFonts.outfit(
                            color: context.isDarkMode ? Colors.white70 : const Color(0xFF064E3B),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          keputusanKenaikan.trim().isNotEmpty
                              ? keputusanKenaikan
                              : "Belum ditentukan / Masih diproses",
                          style: GoogleFonts.outfit(
                            color: context.titleColor,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 30),
        ],
      ),
    );
  }

  Widget _buildAbsensiSummaryCard(String label, int value, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.2), width: 1),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: GoogleFonts.outfit(
              color: color,
              fontSize: 13,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "$value",
            style: GoogleFonts.outfit(
              color: color,
              fontSize: 22,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            "Hari",
            style: GoogleFonts.outfit(
              color: color.withOpacity(0.8),
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAbsensiMiniBadge(String code, int value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            "$code: ",
            style: GoogleFonts.outfit(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            "$value",
            style: GoogleFonts.outfit(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKepribadianRow(String title, String? val, IconData icon, Color color) {
    String textVal = '-';
    if (val == 'A') textVal = 'Sangat Baik';
    if (val == 'B') textVal = 'Baik';
    if (val == 'C') textVal = 'Cukup';
    if (val == 'D') textVal = 'Kurang';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: color,
              size: 20,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.outfit(
                    color: context.titleColor,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  textVal,
                  style: GoogleFonts.outfit(
                    color: context.subTitleColor,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          if (val != null)
            Container(
              width: 32,
              height: 32,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: color.withOpacity(0.15),
                shape: BoxShape.circle,
                border: Border.all(color: color.withOpacity(0.3)),
              ),
              child: Text(
                val,
                style: GoogleFonts.outfit(
                  color: color,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
