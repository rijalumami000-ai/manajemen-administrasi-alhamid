import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';
import 'santri_detail_screen.dart';

class AlumniDetailScreen extends StatefulWidget {
  final int alumniId;
  final String title;

  const AlumniDetailScreen({
    super.key,
    required this.alumniId,
    required this.title,
  });

  @override
  State<AlumniDetailScreen> createState() => _AlumniDetailScreenState();
}

class _AlumniDetailScreenState extends State<AlumniDetailScreen> with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  late TabController _tabController;

  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic>? _detailData;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchDetail();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchDetail() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final res = await _apiService.getAlumniDetail(widget.alumniId);
      setState(() {
        _detailData = res;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '-';
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd MMMM yyyy', 'id_ID').format(date);
    } catch (_) {
      try {
        final date = DateTime.parse(dateStr);
        return DateFormat('dd-MM-yyyy').format(date);
      } catch (_) {
        return dateStr;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;
    final headingColor = isDark ? Colors.white : const Color(0xFF0D1527);
    final accentColor = const Color(0xFF10B981);

    final alumni = _detailData?['alumni'] as Map<String, dynamic>?;
    final identitas = _detailData?['identitas'] as Map<String, dynamic>?;
    final riwayat = _detailData?['riwayat'] as Map<String, dynamic>?;

    final name = alumni?['nama'] ?? 'Profil';
    final nis = alumni?['nis'] ?? '-';
    final santriId = alumni?['santri_id'];

    return Scaffold(
      backgroundColor: context.scaffoldBg,
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF0D1527) : Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: headingColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.title,
          style: GoogleFonts.outfit(
            color: headingColor,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        actions: [
          if (santriId != null)
            Padding(
              padding: const EdgeInsets.only(right: 8.0),
              child: TextButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => SantriDetailScreen(santriId: santriId),
                    ),
                  );
                },
                icon: const Icon(Icons.school_rounded, color: Color(0xFF10B981), size: 18),
                label: Text(
                  'Rapor Aktif',
                  style: GoogleFonts.outfit(
                    color: const Color(0xFF10B981),
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            color: isDark ? const Color(0xFF0D1527) : Colors.white,
            child: TabBar(
              controller: _tabController,
              labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13),
              unselectedLabelStyle: GoogleFonts.outfit(fontSize: 13),
              labelColor: accentColor,
              unselectedLabelColor: context.subTitleColor,
              indicatorColor: accentColor,
              indicatorWeight: 3,
              tabs: const [
                Tab(text: 'Biodata'),
                Tab(text: 'Riwayat'),
                Tab(text: 'Prestasi & Disiplin'),
              ],
            ),
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 48),
                        const SizedBox(height: 12),
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.outfit(color: Colors.redAccent),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _fetchDetail,
                          icon: const Icon(Icons.refresh_rounded),
                          label: Text('Coba Lagi', style: GoogleFonts.outfit()),
                          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
                        ),
                      ],
                    ),
                  ),
                )
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildBiodataTab(alumni, identitas, isDark),
                    _buildRiwayatTab(riwayat, isDark),
                    _buildPrestasiDisiplinTab(riwayat, isDark),
                  ],
                ),
    );
  }

  Widget _buildBiodataTab(Map<String, dynamic>? alumni, Map<String, dynamic>? identitas, bool isDark) {
    if (alumni == null) return const SizedBox();

    final source = identitas ?? alumni;
    final kelasParts = (alumni['kelas_terakhir']?.toString() ?? '').split('/');
    final kelasDiniyah = source['kelas_diniyah'] ?? source['nama_diniyah'] ?? (kelasParts.isNotEmpty ? kelasParts[0].trim() : '-');
    final kelasSekolah = source['kelas_sekolah'] ?? source['nama_sekolah'] ?? (kelasParts.length > 1 ? kelasParts[1].trim() : '-');
    final kamar = source['kamar'] ?? source['nama_kamar'] ?? '-';

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Profile Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: context.cardBg,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: context.borderColor),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 32,
                  backgroundColor: const Color(0xFF10B981).withOpacity(0.1),
                  child: Text(
                    (alumni['nama']?.toString() ?? 'P')[0].toUpperCase(),
                    style: GoogleFonts.outfit(
                      color: const Color(0xFF10B981),
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 18),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        alumni['nama'] ?? '-',
                        style: GoogleFonts.outfit(
                          color: context.titleColor,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'NIS: ${alumni['nis'] ?? '-'}',
                        style: GoogleFonts.outfit(
                          color: context.subTitleColor,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          alumni['tipe'] == 'pindah' ? 'Siswa Pindah / Migrasi' : 'Alumni',
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF10B981),
                            fontSize: 10,
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
          const SizedBox(height: 24),

          // Detail Section
          _buildSectionTitle('Informasi Akademik'),
          _buildInfoRow('Tahun Masuk', alumni['tahun_masuk']?.toString() ?? '-'),
          _buildInfoRow('Tahun Lulus / Keluar', alumni['tahun_lulus']?.toString() ?? '-'),
          _buildInfoRow('Kelas Diniyah Terakhir', kelasDiniyah),
          _buildInfoRow('Kelas Sekolah Terakhir', kelasSekolah),
          _buildInfoRow('Kamar Terakhir', kamar),
          if (alumni['prestasi_utama'] != null && alumni['prestasi_utama'].toString().isNotEmpty)
            _buildInfoRow('Prestasi Utama', alumni['prestasi_utama']),
          if (alumni['keterangan'] != null && alumni['keterangan'].toString().isNotEmpty)
            _buildInfoRow('Keterangan', alumni['keterangan']),

          const SizedBox(height: 24),
          _buildSectionTitle('Identitas Pribadi'),
          _buildInfoRow('NIK', alumni['nik'] ?? '-'),
          _buildInfoRow('Tempat Lahir', alumni['tempat_lahir'] ?? '-'),
          _buildInfoRow('Tanggal Lahir', _formatDate(alumni['tanggal_lahir'])),
          _buildInfoRow('Email', alumni['email'] ?? '-'),
          _buildInfoRow('No. HP', alumni['no_hp'] ?? '-'),
          _buildInfoRow('Pekerjaan', alumni['pekerjaan'] ?? '-'),
          _buildInfoRow('Instansi', alumni['instansi'] ?? '-'),
          _buildInfoRow('Status Pernikahan', alumni['status_pernikahan'] ?? '-'),
          _buildInfoRow('Alamat Asal', alumni['alamat'] ?? '-'),
          _buildInfoRow('Alamat Sekarang', alumni['alamat_sekarang'] ?? '-'),
        ],
      ),
    );
  }

  Widget _buildRiwayatTab(Map<String, dynamic>? riwayat, bool isDark) {
    final kelasHistory = riwayat?['kelas'] as List<dynamic>? ?? [];
    final kamarHistory = riwayat?['kamar'] as List<dynamic>? ?? [];

    if (kelasHistory.isEmpty && kamarHistory.isEmpty) {
      return Center(
        child: Text(
          'Tidak ada riwayat terekam',
          style: GoogleFonts.outfit(color: context.subTitleColor),
        ),
      );
    }

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (kelasHistory.isNotEmpty) ...[
            _buildSectionTitle('Riwayat Kelas'),
            const SizedBox(height: 10),
            ...kelasHistory.map((item) {
              final ta = item['tahun_ajaran'] ?? '-';
              final diniyah = item['kelas_diniyah'] ?? '-';
              final sekolah = item['kelas_sekolah'] ?? '-';
              return Card(
                color: context.cardBg,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: context.borderColor),
                ),
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  leading: const Icon(Icons.school_rounded, color: Color(0xFF10B981)),
                  title: Text(
                    'Tahun Ajaran: $ta',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, color: context.titleColor),
                  ),
                  subtitle: Text(
                    'Diniyah: $diniyah | Sekolah: $sekolah',
                    style: GoogleFonts.outfit(fontSize: 12, color: context.subTitleColor),
                  ),
                ),
              );
            }),
            const SizedBox(height: 24),
          ],
          if (kamarHistory.isNotEmpty) ...[
            _buildSectionTitle('Riwayat Kamar'),
            const SizedBox(height: 10),
            ...kamarHistory.map((item) {
              final kamar = item['kamar'] ?? '-';
              final gedung = item['gedung'] ?? '-';
              final lantai = item['lantai']?.toString() ?? '-';
              final tgl = _formatDate(item['tanggal_mulai']);
              return Card(
                color: context.cardBg,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: context.borderColor),
                ),
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  leading: const Icon(Icons.bed_rounded, color: Color(0xFF10B981)),
                  title: Text(
                    'Kamar: $kamar ($gedung, Lt. $lantai)',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, color: context.titleColor),
                  ),
                  subtitle: Text(
                    'Mulai: $tgl',
                    style: GoogleFonts.outfit(fontSize: 12, color: context.subTitleColor),
                  ),
                ),
              );
            }),
          ],
        ],
      ),
    );
  }

  Widget _buildPrestasiDisiplinTab(Map<String, dynamic>? riwayat, bool isDark) {
    final prestasi = riwayat?['prestasi'] as List<dynamic>? ?? [];
    final pelanggaran = riwayat?['pelanggaran'] as List<dynamic>? ?? [];

    if (prestasi.isEmpty && pelanggaran.isEmpty) {
      return Center(
        child: Text(
          'Tidak ada data prestasi atau pelanggaran',
          style: GoogleFonts.outfit(color: context.subTitleColor),
        ),
      );
    }

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (prestasi.isNotEmpty) ...[
            _buildSectionTitle('Prestasi'),
            const SizedBox(height: 10),
            ...prestasi.map((item) {
              final tgl = _formatDate(item['tanggal']);
              final nama = item['prestasi'] ?? '-';
              final keg = item['kegiatan'] ?? '-';
              final ket = item['keterangan'] ?? '-';
              return Card(
                color: context.cardBg,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: context.borderColor),
                ),
                margin: const EdgeInsets.only(bottom: 10),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              nama,
                              style: GoogleFonts.outfit(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                                color: const Color(0xFF10B981),
                              ),
                            ),
                          ),
                          Text(
                            tgl,
                            style: GoogleFonts.outfit(fontSize: 11, color: context.subTitleColor),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Kegiatan: $keg',
                        style: GoogleFonts.outfit(fontSize: 12, color: context.titleColor, fontWeight: FontWeight.w500),
                      ),
                      if (ket.isNotEmpty && ket != '-') ...[
                        const SizedBox(height: 4),
                        Text(
                          'Keterangan: $ket',
                          style: GoogleFonts.outfit(fontSize: 11, color: context.subTitleColor),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            }),
            const SizedBox(height: 24),
          ],
          if (pelanggaran.isNotEmpty) ...[
            _buildSectionTitle('Pelanggaran & Disiplin'),
            const SizedBox(height: 10),
            ...pelanggaran.map((item) {
              final tgl = _formatDate(item['tanggal']);
              final nama = item['pelanggaran'] ?? '-';
              final tind = item['tindakan'] ?? '-';
              final ket = item['keterangan'] ?? '-';
              final poin = item['poin']?.toString() ?? '0';
              return Card(
                color: context.cardBg,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: context.borderColor),
                ),
                margin: const EdgeInsets.only(bottom: 10),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              nama,
                              style: GoogleFonts.outfit(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                                color: Colors.redAccent,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.redAccent.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              '$poin Poin',
                              style: GoogleFonts.outfit(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: Colors.redAccent,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Tindakan: $tind',
                        style: GoogleFonts.outfit(fontSize: 12, color: context.titleColor, fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Tanggal: $tgl',
                        style: GoogleFonts.outfit(fontSize: 11, color: context.subTitleColor),
                      ),
                      if (ket.isNotEmpty && ket != '-') ...[
                        const SizedBox(height: 4),
                        Text(
                          'Keterangan: $ket',
                          style: GoogleFonts.outfit(fontSize: 11, color: context.subTitleColor),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            }),
          ],
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: GoogleFonts.outfit(
          color: context.titleColor,
          fontSize: 14,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 140,
            child: Text(
              label,
              style: GoogleFonts.outfit(
                color: context.subTitleColor,
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.outfit(
                color: context.titleColor,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
