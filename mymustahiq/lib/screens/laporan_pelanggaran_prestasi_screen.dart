import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/theme_manager.dart';

class LaporanPelanggaranPrestasiScreen extends StatefulWidget {
  final int initialTabIndex; // 0 for Pelanggaran, 1 for Prestasi
  const LaporanPelanggaranPrestasiScreen({
    super.key,
    this.initialTabIndex = 0,
  });

  @override
  State<LaporanPelanggaranPrestasiScreen> createState() => _LaporanPelanggaranPrestasiScreenState();
}

class _LaporanPelanggaranPrestasiScreenState extends State<LaporanPelanggaranPrestasiScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _searchQuery = '';
  String _selectedKategoriPelanggaran = 'Semua';
  String _selectedTingkatPrestasi = 'Semua';

  final List<Map<String, dynamic>> _pelanggaranList = [
    {
      'id': 'PLG-001',
      'nama': 'Ahmad Fauzi Ridwan',
      'kelas': '3D',
      'kategori': 'Ubudiyah',
      'tingkat': 'Ringan',
      'poin': 5,
      'deskripsi': 'Terlambat mengikuti sholat Shubuh berjamaah di Masjid Utama.',
      'tanggal': '12 Okt 2026',
      'takzir': 'Membersihkan shof depan masjid & tilawah 1 juz',
      'status': 'Selesai',
      'mustahiq': 'Ust. Nurul Huda, S.Pd.I',
    },
    {
      'id': 'PLG-002',
      'nama': 'M. Wildan Al-Farisi',
      'kelas': '2B',
      'kategori': 'Kedisiplinan',
      'tingkat': 'Sedang',
      'poin': 10,
      'deskripsi': 'Tidak mengikuti pengajian weton kitab Fathul Qorib tanpa keterangan.',
      'tanggal': '10 Okt 2026',
      'takzir': 'Menulis mufrodat bab Thoharoh 10 lembar',
      'status': 'Dalam Pembinaan',
      'mustahiq': 'Ust. M. Syukron, M.Ag',
    },
    {
      'id': 'PLG-003',
      'nama': 'Bagus Prasetyo',
      'kelas': 'Sifir A',
      'kategori': 'Ketertiban',
      'tingkat': 'Ringan',
      'poin': 3,
      'deskripsi': 'Tidak merapikan lemari asrama saat inspeksi kebersihan kamar.',
      'tanggal': '09 Okt 2026',
      'takzir': 'Piket ro\'an kebersihan teras asrama Al-Barokah',
      'status': 'Selesai',
      'mustahiq': 'Ust. Farhan Azis',
    },
    {
      'id': 'PLG-004',
      'nama': 'Rifqi Pratama',
      'kelas': '1C',
      'kategori': 'Ubudiyah',
      'tingkat': 'Ringan',
      'poin': 5,
      'deskripsi': 'Mengantuk dan tidak membawa kitab saat pengajian bandongan.',
      'tanggal': '07 Okt 2026',
      'takzir': 'Hafalan Nadzom Aqidatul Awwam bait 1-15',
      'status': 'Selesai',
      'mustahiq': 'Ust. Sholeh Mahmud',
    },
    {
      'id': 'PLG-005',
      'nama': 'Muhammad Zaki',
      'kelas': '4A',
      'kategori': 'Etika / Adab',
      'tingkat': 'Sedang',
      'poin': 12,
      'deskripsi': 'Menggunakan sandal milik santri lain tanpa izin (Ghosob).',
      'tanggal': '04 Okt 2026',
      'takzir': 'Meminta maaf langsung & taubat di hadapan lurah pondok',
      'status': 'Selesai',
      'mustahiq': 'Ust. Hasan Basri',
    },
  ];

  final List<Map<String, dynamic>> _prestasiList = [
    {
      'id': 'PRS-001',
      'nama': 'Muhammad Zidni Ilman',
      'kelas': '3D',
      'kategori': 'Musabaqoh Qiroatil Kutub',
      'tingkat': 'Provinsi',
      'juara': 'Juara 1',
      'kejuaraan': 'MQK Tingkat Provinsi Jawa Timur Bidang Fiqih (Fathul Mu\'in)',
      'penyelenggara': 'Kanwil Kemenag Prov. Jatim',
      'tanggal': '28 Sep 2026',
      'pembimbing': 'K.H. Musthofa Bisri & Ust. Syukron',
    },
    {
      'id': 'PRS-002',
      'nama': 'Fajar Nur Romadhon',
      'kelas': '2A',
      'kategori': 'Hifdzil Nadzom Alfiyah',
      'tingkat': 'Kabupaten',
      'juara': 'Juara 1',
      'kejuaraan': 'Lomba Hifdzil Nadzom Alfiyah Ibnu Malik 500 Bait',
      'penyelenggara': 'FKDT & RMI PBNU Kab. Jombang',
      'tanggal': '15 Agu 2026',
      'pembimbing': 'Ust. Nurul Huda, S.Pd.I',
    },
    {
      'id': 'PRS-003',
      'nama': 'Danial Haidar',
      'kelas': '4B',
      'kategori': 'Khitobah Bahasa Arab',
      'tingkat': 'Nasional',
      'juara': 'Juara 2',
      'kejuaraan': 'Festival Kebudayaan Islam Nusantara - Pidato B. Arab',
      'penyelenggara': 'Universitas Islam Negeri Sunan Ampel',
      'tanggal': '20 Jul 2026',
      'pembimbing': 'Ust. Farhan Azis',
    },
    {
      'id': 'PRS-004',
      'nama': 'Ilham Khoirul Anam',
      'kelas': '1B',
      'kategori': 'Muhafadzoh Imrithi',
      'tingkat': 'Internal Pesantren',
      'juara': 'Santri Teladan',
      'kejuaraan': 'Wisuda Muhafadzoh Imrithi Cepat (Khatam Mutqin 254 Bait)',
      'penyelenggara': 'Madrasah Diniyah Al-Hamid',
      'tanggal': '10 Jun 2026',
      'pembimbing': 'Ust. Sholeh Mahmud',
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 2,
      vsync: this,
      initialIndex: widget.initialTabIndex,
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
          "Laporan Kedisiplinan & Prestasi",
          style: GoogleFonts.outfit(
            color: context.titleColor,
            fontWeight: FontWeight.bold,
            fontSize: 17,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF10B981),
          indicatorWeight: 3,
          labelColor: const Color(0xFF10B981),
          unselectedLabelColor: context.subTitleColor,
          labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14),
          unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.w500, fontSize: 14),
          tabs: const [
            Tab(
              icon: Icon(Icons.warning_amber_rounded, size: 18),
              text: "Pelanggaran Santri",
            ),
            Tab(
              icon: Icon(Icons.emoji_events_rounded, size: 18),
              text: "Prestasi Santri",
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildPelanggaranTab(context, isDark),
          _buildPrestasiTab(context, isDark),
        ],
      ),
    );
  }

  Widget _buildPelanggaranTab(BuildContext context, bool isDark) {
    final filtered = _pelanggaranList.where((p) {
      final matchQuery = p['nama'].toString().toLowerCase().contains(_searchQuery.toLowerCase()) ||
          p['kelas'].toString().toLowerCase().contains(_searchQuery.toLowerCase()) ||
          p['kategori'].toString().toLowerCase().contains(_searchQuery.toLowerCase());
      final matchKategori = _selectedKategoriPelanggaran == 'Semua' ||
          p['kategori'] == _selectedKategoriPelanggaran;
      return matchQuery && matchKategori;
    }).toList();

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stat Cards
          Row(
            children: [
              Expanded(
                child: _buildSummaryCard(
                  title: 'Total Pelanggaran',
                  value: '${_pelanggaranList.length}',
                  subtitle: 'Tahun Ajaran Aktif',
                  icon: Icons.assignment_late_rounded,
                  color: const Color(0xFFEF4444),
                  isDark: isDark,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSummaryCard(
                  title: 'Terselesaikan',
                  value: '95%',
                  subtitle: 'Telah Ditakzir',
                  icon: Icons.check_circle_rounded,
                  color: const Color(0xFF10B981),
                  isDark: isDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // Search & Filter
          _buildSearchBar(
            hint: 'Cari santri, kelas, atau jenis pelanggaran...',
            isDark: isDark,
          ),
          const SizedBox(height: 12),

          // Filter chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                'Semua',
                'Ubudiyah',
                'Kedisiplinan',
                'Ketertiban',
                'Etika / Adab'
              ].map((kat) {
                final isSelected = _selectedKategoriPelanggaran == kat;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(kat, style: GoogleFonts.outfit(fontSize: 12)),
                    selected: isSelected,
                    onSelected: (val) => setState(() => _selectedKategoriPelanggaran = kat),
                    selectedColor: const Color(0xFFEF4444).withOpacity(0.18),
                    labelStyle: GoogleFonts.outfit(
                      color: isSelected ? const Color(0xFFEF4444) : context.subTitleColor,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                    backgroundColor: isDark ? const Color(0xFF131C2E) : Colors.white,
                    side: BorderSide(
                      color: isSelected
                          ? const Color(0xFFEF4444)
                          : (isDark ? Colors.white12 : Colors.black12),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 18),

          // List Pelanggaran
          if (filtered.isEmpty)
            _buildEmptyState('Tidak ada data catatan pelanggaran yang cocok.')
          else
            ...filtered.map((item) => _buildPelanggaranCard(item, isDark)),
        ],
      ),
    );
  }

  Widget _buildPrestasiTab(BuildContext context, bool isDark) {
    final filtered = _prestasiList.where((p) {
      final matchQuery = p['nama'].toString().toLowerCase().contains(_searchQuery.toLowerCase()) ||
          p['kelas'].toString().toLowerCase().contains(_searchQuery.toLowerCase()) ||
          p['kejuaraan'].toString().toLowerCase().contains(_searchQuery.toLowerCase());
      final matchTingkat = _selectedTingkatPrestasi == 'Semua' ||
          p['tingkat'] == _selectedTingkatPrestasi;
      return matchQuery && matchTingkat;
    }).toList();

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stat Cards
          Row(
            children: [
              Expanded(
                child: _buildSummaryCard(
                  title: 'Penghargaan Juara',
                  value: '${_prestasiList.length}',
                  subtitle: 'Tingkat Daerah s/d Nasional',
                  icon: Icons.emoji_events_rounded,
                  color: const Color(0xFFF59E0B),
                  isDark: isDark,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSummaryCard(
                  title: 'Santri Berprestasi',
                  value: '100%',
                  subtitle: 'Diverifikasi Pembimbing',
                  icon: Icons.workspace_premium_rounded,
                  color: const Color(0xFF3B82F6),
                  isDark: isDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // Search & Filter
          _buildSearchBar(
            hint: 'Cari santri, bidang lomba, atau juara...',
            isDark: isDark,
          ),
          const SizedBox(height: 12),

          // Filter chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                'Semua',
                'Internal Pesantren',
                'Kabupaten',
                'Provinsi',
                'Nasional'
              ].map((tingkat) {
                final isSelected = _selectedTingkatPrestasi == tingkat;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(tingkat, style: GoogleFonts.outfit(fontSize: 12)),
                    selected: isSelected,
                    onSelected: (val) => setState(() => _selectedTingkatPrestasi = tingkat),
                    selectedColor: const Color(0xFFF59E0B).withOpacity(0.18),
                    labelStyle: GoogleFonts.outfit(
                      color: isSelected ? const Color(0xFFF59E0B) : context.subTitleColor,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                    backgroundColor: isDark ? const Color(0xFF131C2E) : Colors.white,
                    side: BorderSide(
                      color: isSelected
                          ? const Color(0xFFF59E0B)
                          : (isDark ? Colors.white12 : Colors.black12),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 18),

          // List Prestasi
          if (filtered.isEmpty)
            _buildEmptyState('Tidak ada data prestasi yang cocok.')
          else
            ...filtered.map((item) => _buildPrestasiCard(item, isDark)),
        ],
      ),
    );
  }

  Widget _buildSummaryCard({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color color,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131C2E) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: color.withOpacity(isDark ? 0.3 : 0.2),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: context.titleColor,
                  ),
                ),
                Text(
                  title,
                  style: GoogleFonts.outfit(
                    fontSize: 11,
                    color: context.subTitleColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar({required String hint, required bool isDark}) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131C2E) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isDark ? Colors.white10 : Colors.black12),
      ),
      child: TextField(
        onChanged: (val) => setState(() => _searchQuery = val),
        style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 13),
          prefixIcon: Icon(Icons.search_rounded, color: context.subTitleColor, size: 20),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
    );
  }

  Widget _buildPelanggaranCard(Map<String, dynamic> item, bool isDark) {
    final isSelesai = item['status'] == 'Selesai';
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131C2E) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.06),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: const Color(0xFFEF4444).withOpacity(0.12),
                child: Text(
                  item['kelas'],
                  style: GoogleFonts.outfit(
                    color: const Color(0xFFEF4444),
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item['nama'],
                      style: GoogleFonts.outfit(
                        color: context.titleColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      "${item['kategori']} • ${item['tanggal']}",
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isSelesai
                      ? const Color(0xFF10B981).withOpacity(0.12)
                      : const Color(0xFFF59E0B).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  item['status'],
                  style: GoogleFonts.outfit(
                    color: isSelesai ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                    fontWeight: FontWeight.bold,
                    fontSize: 10,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            item['deskripsi'],
            style: GoogleFonts.outfit(
              color: context.bodyColor,
              fontSize: 12,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withOpacity(0.03) : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: isDark ? Colors.white10 : Colors.black12),
            ),
            child: Row(
              children: [
                const Icon(Icons.gavel_rounded, color: Color(0xFFEF4444), size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    "Takzir: ${item['takzir']}",
                    style: GoogleFonts.outfit(
                      color: isDark ? const Color(0xFFFCA5A5) : const Color(0xFF991B1B),
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    "+${item['poin']} Poin",
                    style: GoogleFonts.outfit(
                      color: const Color(0xFFEF4444),
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
    );
  }

  Widget _buildPrestasiCard(Map<String, dynamic> item, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131C2E) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.06),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.emoji_events_rounded, color: Color(0xFFF59E0B), size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          item['nama'],
                          style: GoogleFonts.outfit(
                            color: context.titleColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF3B82F6).withOpacity(0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            item['kelas'],
                            style: GoogleFonts.outfit(
                              color: const Color(0xFF3B82F6),
                              fontWeight: FontWeight.bold,
                              fontSize: 10,
                            ),
                          ),
                        ),
                      ],
                    ),
                    Text(
                      "${item['tingkat']} • ${item['tanggal']}",
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  item['juara'],
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            item['kejuaraan'],
            style: GoogleFonts.outfit(
              color: context.titleColor,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Icon(Icons.business_rounded, color: context.subTitleColor, size: 14),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  "Penyelenggara: ${item['penyelenggara']}",
                  style: GoogleFonts.outfit(
                    color: context.subTitleColor,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(Icons.person_pin_rounded, color: context.subTitleColor, size: 14),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  "Pembimbing: ${item['pembimbing']}",
                  style: GoogleFonts.outfit(
                    color: context.subTitleColor,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Center(
        child: Column(
        children: [
          Icon(Icons.folder_off_rounded, size: 48, color: context.subTitleColor.withOpacity(0.5)),
          const SizedBox(height: 12),
          Text(
            text,
            textAlign: TextAlign.center,
            style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 13),
          ),
        ],
      ),
    ),
  );
}
}
