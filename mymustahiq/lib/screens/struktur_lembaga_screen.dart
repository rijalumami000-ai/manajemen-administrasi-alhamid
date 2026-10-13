import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/theme_manager.dart';
import '../services/api_service.dart';

class StrukturLembagaScreen extends StatefulWidget {
  final int initialTabIndex;
  const StrukturLembagaScreen({
    super.key,
    this.initialTabIndex = 0,
  });

  @override
  State<StrukturLembagaScreen> createState() => _StrukturLembagaScreenState();
}

class _StrukturLembagaScreenState extends State<StrukturLembagaScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final Map<String, List<Map<String, dynamic>>> _structuresData = {
    'pmq': [
      {
        'jabatan': 'Direktur Eksekutif PMQ',
        'nama': 'K.H. Ahmad Dahlan, Lc',
        'status': 'Pimpinan Lembaga',
        'bidang': 'Kebijakan & Kurikulum Al-Qur\'an',
        'kontak': '+62 812-3456-7891',
        'isHeader': true,
      },
      {
        'jabatan': 'Koordinator Tahfidz 30 Juz',
        'nama': 'Ust. H. Syarif Hidayatullah, Al-Hafidz',
        'status': 'Koordinator Bidang',
        'bidang': 'Bimbingan Mutqin & Tasmi\' Akbar',
        'kontak': '+62 813-2233-4455',
      },
      {
        'jabatan': 'Koordinator Tartil & Tahsin (Metode Yanbu\'a)',
        'nama': 'Ust. Farhan Azis, S.Pd',
        'status': 'Koordinator Bidang',
        'bidang': 'Kenaikan Jilid & Munaqosyah',
        'kontak': '+62 856-7788-9900',
      },
      {
        'jabatan': 'Sie Ujian & Verifikasi Sertifikasi Qur\'an',
        'nama': 'Ust. M. Syukron, M.Ag',
        'status': 'Penguji Lembaga',
        'bidang': 'Standarisasi Tajwid & Ghorib',
        'kontak': '+62 821-9988-7766',
      },
      {
        'jabatan': 'Wali Asrama Khusus Tahfidz Putri',
        'nama': 'Usth. Siti Khodijah, Al-Hafidzah',
        'status': 'Pembina Asrama',
        'bidang': 'Disiplin Waktu & Setoran Harian',
        'kontak': '+62 878-1122-3344',
      },
    ],
    'pondok': [
      {
        'jabatan': 'Pengasuh Utama Pondok Pesantren',
        'nama': 'K.H. Musthofa Bisri',
        'status': 'Majelis Pengasuh',
        'bidang': 'Arah Kebijakan Umum & Tarbiyah',
        'kontak': 'Sekretariat Ndalem',
        'isHeader': true,
      },
      {
        'jabatan': 'Lurah Pondok Putra (Ketua Umum Santri)',
        'nama': 'Ust. Rifqi Maulana, S.Ag',
        'status': 'Pengurus Pusat',
        'bidang': 'Koordinator Seluruh Komplek Asrama',
        'kontak': '+62 812-9988-1122',
      },
      {
        'jabatan': 'Kepala Keamanan & Ketertiban Pusat',
        'nama': 'Ust. Hasan Basri',
        'status': 'Biro Keamanan',
        'bidang': 'Izin Keluar, Jam Malam & Disiplin',
        'kontak': '+62 857-4455-6677',
      },
      {
        'jabatan': 'Ketua Biro Ubudiyah & Kemasjidan',
        'nama': 'Ust. Sholeh Mahmud',
        'status': 'Biro Ibadah',
        'bidang': 'Imam Rawatib, Dzibaiyah, & Rotib',
        'kontak': '+62 822-3344-5566',
      },
      {
        'jabatan': 'Biro Kebersihan Lingkungan & Ro\'an',
        'nama': 'Ust. Danial Ahmad',
        'status': 'Biro Sarpras',
        'bidang': 'Sanitasi, Fasilitas & Ro\'an Akbar',
        'kontak': '+62 819-0011-2233',
      },
    ],
    'sambangan': [
      {
        'jabatan': 'Ketua Panitia Sambangan Santri',
        'nama': 'Ust. Nurul Huda, S.Pd.I',
        'status': 'Ketua Pelaksana',
        'bidang': 'Koordinasi Alur Kunjungan Wali Santri',
        'kontak': '+62 812-7788-9900',
        'isHeader': true,
      },
      {
        'jabatan': 'Koordinator Registrasi & Buku Tamu Digital',
        'nama': 'Ust. Ahmad Wildan',
        'status': 'Divisi Registrasi',
        'bidang': 'Scan QR Kartu Santri & Kartu Kunjungan',
        'kontak': '+62 813-1122-3344',
      },
      {
        'jabatan': 'Koordinator Keamanan & Rekayasa Parkir',
        'nama': 'Ust. Hasan Basri & Tim Banser',
        'status': 'Divisi Keamanan',
        'bidang': 'Ketertiban Jalur Masuk/Keluar Gerbang',
        'kontak': '+62 857-4455-6677',
      },
      {
        'jabatan': 'Koordinator Stan Bazar & Konsumsi Tamu',
        'nama': 'Ust. Farhan Azis & Koperasi Pondok',
        'status': 'Divisi Bazar',
        'bidang': 'Pengaturan Stan UMKM & Kuliner Tamu',
        'kontak': '+62 856-7788-9900',
      },
    ],
    'haflah': [
      {
        'jabatan': 'Ketua Panitia Haflah Akhirussanah 1446 H',
        'nama': 'K.H. Ahmad Dahlan, Lc',
        'status': 'Ketua Panitia',
        'bidang': 'Penanggung Jawab Acara Akbar Haflah',
        'kontak': '+62 812-3456-7891',
        'isHeader': true,
      },
      {
        'jabatan': 'Sie Acara & Protokoler Wisuda Santri',
        'nama': 'Ust. M. Syukron, M.Ag',
        'status': 'Divisi Acara',
        'bidang': 'Rundown, Penobatan Santri & Mau\'idhoh',
        'kontak': '+62 821-9988-7766',
      },
      {
        'jabatan': 'Sie Panggung, Dekorasi & Multimedia',
        'nama': 'Ust. Rifqi Maulana',
        'status': 'Divisi Produksi',
        'bidang': 'Videotron, Tata Suara & Lighting',
        'kontak': '+62 812-9988-1122',
      },
      {
        'jabatan': 'Sie Publikasi & Live Streaming Official',
        'nama': 'Tim Media Santri Al-Hamid',
        'status': 'Divisi Media',
        'bidang': 'YouTube Live, Dokumentasi & Siaran',
        'kontak': '+62 878-9900-1122',
      },
      {
        'jabatan': 'Sie Tamu Undangan Masyayikh & Habaib',
        'nama': 'Ust. Sholeh Mahmud',
        'status': 'Divisi Jam\'iyyah',
        'bidang': 'Penyambutan VIP & Akomodasi Kyai',
        'kontak': '+62 822-3344-5566',
      },
    ],
    'psb': [
      {
        'jabatan': 'Ketua Panitia PSB (Penerimaan Santri Baru)',
        'nama': 'Ust. Ahmad Syukron Rosyid',
        'status': 'Ketua Panitia',
        'bidang': 'Penanggung Jawab Penerimaan Santri Baru',
        'kontak': '+62 812-3344-5566',
        'isHeader': true,
      },
      {
        'jabatan': 'Sekretaris PSB & Verifikasi Berkas',
        'nama': 'Ust. Rijal Umami',
        'status': 'Divisi Sekretariat',
        'bidang': 'Administrasi & Verifikasi Dokumen Pendaftar',
        'kontak': '+62 813-4455-6677',
      },
      {
        'jabatan': 'Bendahara & Administrasi Pendaftaran',
        'nama': 'Ustz. Restu Maharani',
        'status': 'Divisi Keuangan',
        'bidang': 'Pembayaran Formulir & Administrasi',
        'kontak': '+62 856-1122-3344',
      },
      {
        'jabatan': 'Koordinator Tes Seleksi & Wawancara',
        'nama': 'Ust. Nurrohman',
        'status': 'Divisi Penguji',
        'bidang': 'Tes Baca Kitab, Qur\'an & Wawancara Wali',
        'kontak': '+62 821-6677-8899',
      },
      {
        'jabatan': 'Tim Publikasi, Brosur & Media Sosial',
        'nama': 'Tim IT & Media Al-Hamid',
        'status': 'Divisi Publikasi',
        'bidang': 'Informasi Pendaftaran Online & Brosur',
        'kontak': '+62 878-0011-2233',
      },
    ],
  };

  final ApiService _apiService = ApiService();
  final Map<String, List<Map<String, dynamic>>> _liveApiData = {};
  List<dynamic> _tahunAjaranList = [];
  int? _selectedTahunAjaranId;
  bool _isLoadingApi = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 5,
      vsync: this,
      initialIndex: widget.initialTabIndex.clamp(0, 4),
    );
    _initTahunAjaranAndFetch();
  }

  Future<void> _initTahunAjaranAndFetch() async {
    try {
      final taData = await _apiService.getTahunAjaranList();
      if (taData['tahunAjaran'] != null && taData['tahunAjaran'] is List) {
        final list = (taData['tahunAjaran'] as List);
        _tahunAjaranList = list;
        final active = list.firstWhere((t) => t['is_active'] == true, orElse: () => null);
        if (active != null) {
          _selectedTahunAjaranId = active['id'] as int;
        } else if (list.isNotEmpty) {
          _selectedTahunAjaranId = list.first['id'] as int;
        }
      }
    } catch (_) {}
    _fetchLiveStructures();
  }

  Future<void> _fetchLiveStructures() async {
    setState(() => _isLoadingApi = true);
    final keys = ['pmq', 'pondok', 'sambangan', 'haflah', 'psb'];
    for (final k in keys) {
      try {
        final res = await _apiService.getStructure(k, tahunAjaranId: _selectedTahunAjaranId);
        if (res.isNotEmpty) {
          final mapped = res.map<Map<String, dynamic>>((item) {
            final displayName = (item['guru_nama'] ?? item['nama_custom'] ?? '-').toString();
            final isHead = (item['no_urut'] == 1);
            return {
              'jabatan': item['jabatan']?.toString() ?? 'Pengurus',
              'nama': displayName,
              'status': isHead ? 'Pimpinan' : 'Pengurus',
              'bidang': item['keterangan']?.toString() ?? '-',
              'kontak': item['guru_no_hp']?.toString() ?? '-',
              'isHeader': isHead,
            };
          }).toList();
          if (mounted) {
            _liveApiData[k] = mapped;
          }
        }
      } catch (_) {}
    }
    if (mounted) setState(() => _isLoadingApi = false);
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
          "Struktur Kepesantrenan",
          style: GoogleFonts.outfit(
            color: context.titleColor,
            fontWeight: FontWeight.bold,
            fontSize: 17,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: const Color(0xFF3B82F6),
          indicatorWeight: 3,
          labelColor: const Color(0xFF3B82F6),
          unselectedLabelColor: context.subTitleColor,
          labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13),
          unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.w500, fontSize: 13),
          tabs: const [
            Tab(text: "Struktur PMQ"),
            Tab(text: "Struktur Pondok"),
            Tab(text: "Panitia Sambangan"),
            Tab(text: "Panitia Haflah"),
            Tab(text: "Panitia PSB"),
          ],
        ),
      ),
      body: Column(
        children: [
          _buildTahunAjaranFilter(context, isDark),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // 1. PMQ
                _buildStructureList('pmq', 'Pendidikan Madin & Al-Qur\'an (PMQ)', 'Lembaga khusus tahfidz dan tahsin quran pesantren.', isDark),
                // 2. Pondok
                _buildStructureList('pondok', 'Pondok Pesantren Al-Hamid', 'Kepengurusan pusat santri putra dan putri.', isDark),
                // 3. Sambangan
                _buildStructureList('sambangan', 'Panitia Sambangan Santri', 'Kepanitiaan acara kunjungan rutin wali santri bulanan.', isDark),
                // 4. Haflah
                _buildStructureList('haflah', 'Panitia Haflah Akhirussanah', 'Kepanitiaan wisuda santri dan pengajian akbar tahunan.', isDark),
                // 5. PSB
                _buildStructureList('psb', 'Panitia Penerimaan Santri Baru (PSB)', 'Kepanitiaan pendaftaran, seleksi berkas & tes santri baru.', isDark),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTahunAjaranFilter(BuildContext context, bool isDark) {
    if (_tahunAjaranList.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF151F32) : const Color(0xFFF1F5F9),
        border: Border(
          bottom: BorderSide(
            color: isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.06),
          ),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: const Color(0xFF3B82F6).withOpacity(0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.calendar_month_rounded, size: 16, color: Color(0xFF3B82F6)),
          ),
          const SizedBox(width: 10),
          Text(
            "Tahun Ajaran:",
            style: GoogleFonts.outfit(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: context.titleColor,
            ),
          ),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF0F172A) : Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: isDark ? Colors.white12 : Colors.grey.shade300,
              ),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<int?>(
                value: _selectedTahunAjaranId,
                isDense: true,
                icon: Icon(Icons.arrow_drop_down_rounded, color: context.subTitleColor, size: 22),
                style: GoogleFonts.outfit(
                  color: context.titleColor,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
                dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                items: [
                  const DropdownMenuItem<int?>(
                    value: null,
                    child: Text("Semua Tahun"),
                  ),
                  ..._tahunAjaranList.map((t) {
                    final id = t['id'] as int;
                    final kode = t['kode']?.toString() ?? '-';
                    final isActive = t['is_active'] == true;
                    return DropdownMenuItem<int?>(
                      value: id,
                      child: Text(isActive ? "$kode (Aktif)" : kode),
                    );
                  }),
                ],
                onChanged: (val) {
                  setState(() => _selectedTahunAjaranId = val);
                  _fetchLiveStructures();
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStructureList(String key, String title, String subtitle, bool isDark) {
    final list = _liveApiData[key] ?? _structuresData[key] ?? [];

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header info
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF131C2E) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: const Color(0xFF3B82F6).withOpacity(0.25),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF3B82F6).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.account_tree_rounded, color: Color(0xFF3B82F6), size: 24),
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
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        subtitle,
                        style: GoogleFonts.outfit(
                          color: context.subTitleColor,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          Text(
            "SUSUNAN STRUKTUR PENGURUS",
            style: GoogleFonts.outfit(
              color: context.subTitleColor,
              fontSize: 11,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 12),

          ...list.map((item) => _buildPersonCard(item, isDark)),
        ],
      ),
    );
  }

  Widget _buildPersonCard(Map<String, dynamic> item, bool isDark) {
    final bool isHeader = item['isHeader'] == true;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131C2E) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isHeader
              ? const Color(0xFF3B82F6).withOpacity(0.4)
              : (isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.06)),
          width: isHeader ? 1.5 : 1.0,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: isHeader
                ? const Color(0xFF3B82F6).withOpacity(0.18)
                : const Color(0xFF10B981).withOpacity(0.12),
            child: Icon(
              isHeader ? Icons.shield_rounded : Icons.person_rounded,
              color: isHeader ? const Color(0xFF3B82F6) : const Color(0xFF10B981),
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: isHeader
                            ? const Color(0xFF3B82F6).withOpacity(0.15)
                            : (isDark ? Colors.white10 : Colors.black.withOpacity(0.05)),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        item['status'] as String,
                        style: GoogleFonts.outfit(
                          color: isHeader ? const Color(0xFF3B82F6) : context.subTitleColor,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  item['jabatan'] as String,
                  style: GoogleFonts.outfit(
                    color: context.titleColor,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  item['nama'] as String,
                  style: GoogleFonts.outfit(
                    color: isHeader
                        ? const Color(0xFF3B82F6)
                        : (isDark ? const Color(0xFFA5B4FC) : const Color(0xFF4338CA)),
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  "Tugas: ${item['bidang']}",
                  style: GoogleFonts.outfit(
                    color: context.subTitleColor,
                    fontSize: 11,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.phone_in_talk_rounded, size: 12, color: context.subTitleColor),
                    const SizedBox(width: 4),
                    Text(
                      item['kontak'] as String,
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
