import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
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

  final ApiService _apiService = ApiService();
  final Map<String, List<Map<String, dynamic>>> _liveApiData = {};
  List<dynamic> _tahunAjaranList = [];
  int? _selectedTahunAjaranId;
  bool _isLoadingApi = false;

  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  // Tab State Handlers
  String _selectedPondokGender = 'Putra'; // 'Putra' | 'Putri'
  final Map<String, String> _activeSubCategoryPerTab = {};
  String _selectedPanitiaSemester = 'Ganjil'; // 'Ganjil' | 'Genap'

  @override
  void initState() {
    super.initState();
    // 8 Main Tabs:
    // 0: Pondok (Putra, Dewan Penyantun, Putri), 1: Madin, 2: PMQ, 3: Jam'iyyah, 4: Panitia Semester, 5: Sambangan, 6: Haflah, 7: PSB
    _tabController = TabController(
      length: 8,
      vsync: this,
      initialIndex: widget.initialTabIndex.clamp(0, 7),
    );
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {
          _searchController.clear();
          _searchQuery = '';
        });
      }
    });
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
    if (!mounted) return;
    setState(() => _isLoadingApi = true);

    final keys = [
      'pondok_putra',
      'pondok_putri',
      'jamiyyah',
      'pmq',
      'madrasah_diniyah',
      'panitia_ujian_ganjil',
      'panitia_ujian_genap',
      'sambangan',
      'haflah',
      'psb',
      'dewan_penyantun'
    ];

    for (final k in keys) {
      try {
        String reqType = k;
        String? sem;

        if (k == 'panitia_ujian_ganjil') {
          reqType = 'panitia_ujian';
          sem = 'Ganjil';
        } else if (k == 'panitia_ujian_genap') {
          reqType = 'panitia_ujian';
          sem = 'Genap';
        }

        final res = await _apiService.getStructure(
          reqType,
          tahunAjaranId: _selectedTahunAjaranId,
          semester: sem,
        );

        if (res.isNotEmpty) {
          final mapped = res.map<Map<String, dynamic>>((item) {
            final displayName = (item['guru_nama'] ?? item['santri_nama'] ?? item['nama_custom'] ?? '-').toString();
            final isHead = (item['no_urut'] == 1);
            final foto = item['guru_foto_url'] ?? item['santri_foto_url'] ?? item['foto_url'] ?? item['foto'];
            final alamat = item['alamat'] ?? item['santri_alamat'] ?? '';

            return {
              'id': item['id'],
              'jabatan': item['jabatan']?.toString() ?? 'Pengurus',
              'nama': displayName,
              'kategori': item['kategori']?.toString() ?? '',
              'alamat': alamat.toString(),
              'bidang': item['keterangan']?.toString() ?? '-',
              'kontak': item['guru_no_hp']?.toString() ?? '-',
              'foto_url': foto?.toString(),
              'no_urut': item['no_urut'] ?? 999,
              'isHeader': isHead,
            };
          }).toList();

          if (mounted) {
            _liveApiData[k] = mapped;
          }
        } else {
          if (mounted) {
            _liveApiData[k] = [];
          }
        }
      } catch (_) {}
    }

    if (mounted) setState(() => _isLoadingApi = false);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _launchWhatsApp(String phone) async {
    final cleanPhone = phone.replaceAll(RegExp(r'\D'), '');
    if (cleanPhone.isEmpty) return;
    final url = Uri.parse("https://wa.me/$cleanPhone");
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
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
          "Struktur Lembaga & Kepengurusan",
          style: GoogleFonts.outfit(
            color: context.titleColor,
            fontWeight: FontWeight.bold,
            fontSize: 16.5,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: context.titleColor, size: 20),
            onPressed: _fetchLiveStructures,
            tooltip: "Muat Ulang Data",
          ),
        ],
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
            Tab(text: "Struktur Pondok"),
            Tab(text: "Madrasah Diniyah"),
            Tab(text: "Struktur PMQ"),
            Tab(text: "Jam'iyyah Santri"),
            Tab(text: "Panitia Semester"),
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
            child: _isLoadingApi
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(
                          width: 28,
                          height: 28,
                          child: CircularProgressIndicator(strokeWidth: 2.5, color: Color(0xFF3B82F6)),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          "Memuat susunan struktur...",
                          style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 13),
                        ),
                      ],
                    ),
                  )
                : TabBarView(
                    controller: _tabController,
                    children: [
                      // 0. Pondok (Separated Putra, Dewan Penyantun, & Putri)
                      _buildPondokScreen(isDark),

                      // 1. Madrasah Diniyah
                      _buildStandardTabScreen(
                        key: 'madrasah_diniyah',
                        title: "Madrasah Diniyah Al-Hamid",
                        subtitle: "Pimpinan madrasah, bagian kurikulum, tata usaha, & asatidz.",
                        isDark: isDark,
                      ),

                      // 2. PMQ
                      _buildStandardTabScreen(
                        key: 'pmq',
                        title: "Pendidikan Murottilil Qur'an (PMQ)",
                        subtitle: "Koordinator tahfidz 30 juz, metode Yanbu'a, & keamanan.",
                        isDark: isDark,
                      ),

                      // 3. Jam'iyyah Santri (Top-level tab)
                      _buildStandardTabScreen(
                        key: 'jamiyyah',
                        title: "Jam'iyyah Santri Al-Hamid",
                        subtitle: "Jam'iyyah Pusat, Jam'iyyah Putra, dan Jam'iyyah Putri.",
                        isDark: isDark,
                      ),

                      // 4. Panitia Ujian Semester (Top-level tab with Ganjil/Genap)
                      _buildPanitiaSemesterScreen(isDark),

                      // 5. Sambangan (No Putra/Putri concept)
                      _buildStandardTabScreen(
                        key: 'sambangan',
                        title: "Panitia Sambangan Santri",
                        subtitle: "Kunjungan wali santri, alur perizinan, registrasi & bazar.",
                        isDark: isDark,
                      ),

                      // 6. Haflah
                      _buildStandardTabScreen(
                        key: 'haflah',
                        title: "Panitia Haflah Akhirussanah",
                        subtitle: "Wisuda akbar santri, dekorasi panggung & siaran live streaming.",
                        isDark: isDark,
                      ),

                      // 7. PSB
                      _buildStandardTabScreen(
                        key: 'psb',
                        title: "Panitia Penerimaan Santri Baru (PSB)",
                        subtitle: "Pendaftaran online, tes baca kitab, administrasi & seleksi berkas.",
                        isDark: isDark,
                      ),
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
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(Icons.calendar_today_rounded, size: 14, color: context.subTitleColor),
              const SizedBox(width: 8),
              Text(
                "Tahun Ajaran:",
                style: GoogleFonts.outfit(
                  color: context.subTitleColor,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.08),
              ),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<int?>(
                value: _selectedTahunAjaranId,
                isDense: true,
                dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                style: GoogleFonts.outfit(
                  color: context.titleColor,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
                items: _tahunAjaranList.map<DropdownMenuItem<int?>>((ta) {
                  final active = (ta['is_active'] == true);
                  return DropdownMenuItem<int?>(
                    value: ta['id'] as int?,
                    child: Text("${ta['kode'] ?? ta['nama'] ?? '-'}${active ? ' (Aktif)' : ''}"),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null && val != _selectedTahunAjaranId) {
                    setState(() => _selectedTahunAjaranId = val);
                    _fetchLiveStructures();
                  }
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── 0. PONDOK SCREEN (Putra & Putri Split) ──────────────────────────────
  Widget _buildPondokScreen(bool isDark) {
    String currentKey;
    if (_selectedPondokGender == 'Dewan Penyantun') {
      currentKey = 'dewan_penyantun';
    } else if (_selectedPondokGender == 'Putri') {
      currentKey = 'pondok_putri';
    } else {
      currentKey = 'pondok_putra';
    }
    final rawList = _liveApiData[currentKey] ?? [];

    // Distinct categories (e.g. Dewan Harian, Dewan Pleno, Ketua Kamar, PJ Kamar)
    final categories = <String>[];
    for (final item in rawList) {
      final kat = item['kategori']?.toString().trim() ?? '';
      if (kat.isNotEmpty && !categories.contains(kat)) {
        categories.add(kat);
      }
    }

    // Default to first category if none or invalid selected (NO "Semua" tab!)
    final activeCatKey = 'pondok_${_selectedPondokGender}';
    if (!_activeSubCategoryPerTab.containsKey(activeCatKey) ||
        !categories.contains(_activeSubCategoryPerTab[activeCatKey])) {
      if (categories.isNotEmpty) {
        _activeSubCategoryPerTab[activeCatKey] = categories.first;
      }
    }
    final selectedCat = _activeSubCategoryPerTab[activeCatKey] ?? '';

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Sub-Tab Segmented Switch (Putra | Dewan Penyantun | Putri)
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF131C2E) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.06),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                )
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedPondokGender = 'Putra'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: _selectedPondokGender == 'Putra'
                            ? const Color(0xFF3B82F6)
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.man_rounded,
                            size: 17,
                            color: _selectedPondokGender == 'Putra' ? Colors.white : context.subTitleColor,
                          ),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              "Pengurus Putra",
                              style: GoogleFonts.outfit(
                                fontWeight: FontWeight.bold,
                                fontSize: 11.5,
                                color: _selectedPondokGender == 'Putra' ? Colors.white : context.subTitleColor,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedPondokGender = 'Dewan Penyantun'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: _selectedPondokGender == 'Dewan Penyantun'
                            ? const Color(0xFF10B981)
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.verified_user_rounded,
                            size: 15,
                            color: _selectedPondokGender == 'Dewan Penyantun' ? Colors.white : context.subTitleColor,
                          ),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              "Dewan Penyantun",
                              style: GoogleFonts.outfit(
                                fontWeight: FontWeight.bold,
                                fontSize: 11.5,
                                color: _selectedPondokGender == 'Dewan Penyantun' ? Colors.white : context.subTitleColor,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedPondokGender = 'Putri'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: _selectedPondokGender == 'Putri'
                            ? const Color(0xFF8B5CF6)
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.woman_rounded,
                            size: 17,
                            color: _selectedPondokGender == 'Putri' ? Colors.white : context.subTitleColor,
                          ),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              "Pengurus Putri",
                              style: GoogleFonts.outfit(
                                fontWeight: FontWeight.bold,
                                fontSize: 11.5,
                                color: _selectedPondokGender == 'Putri' ? Colors.white : context.subTitleColor,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Search Box
          _buildSearchBox(context, isDark),

          // Sub-Tab Chips (NO "Semua" chip! Defaults to first sub-tab!)
          if (categories.isNotEmpty) ...[
            const SizedBox(height: 12),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              child: Row(
                children: categories.map((cat) {
                  final isSelected = (selectedCat == cat);
                  final count = rawList.where((i) => i['kategori'] == cat).length;
                  return _buildSubTabChip(
                    label: "$cat ($count)",
                    isSelected: isSelected,
                    onTap: () {
                      setState(() {
                        _activeSubCategoryPerTab[activeCatKey] = cat;
                      });
                    },
                    isDark: isDark,
                  );
                }).toList(),
              ),
            ),
          ],

          const SizedBox(height: 16),

          // Render List Grouped with Koordinator & Anggota
          _renderGroupedStructureContent(
            rawList: rawList,
            selectedCategory: selectedCat,
            isDark: isDark,
          ),
        ],
      ),
    );
  }

  // ── 4. PANITIA SEMESTER SCREEN (Top-level with Ganjil/Genap sub-tabs) ───
  Widget _buildPanitiaSemesterScreen(bool isDark) {
    final currentKey = _selectedPanitiaSemester == 'Ganjil'
        ? 'panitia_ujian_ganjil'
        : 'panitia_ujian_genap';
    final rawList = _liveApiData[currentKey] ?? [];

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Ganjil vs Genap Sub-Tabs
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF131C2E) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.06),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedPanitiaSemester = 'Ganjil'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: _selectedPanitiaSemester == 'Ganjil'
                            ? const Color(0xFF3B82F6)
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Text(
                          "Semester Ganjil",
                          style: GoogleFonts.outfit(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                            color: _selectedPanitiaSemester == 'Ganjil' ? Colors.white : context.subTitleColor,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedPanitiaSemester = 'Genap'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: _selectedPanitiaSemester == 'Genap'
                            ? const Color(0xFF8B5CF6)
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Text(
                          "Semester Genap",
                          style: GoogleFonts.outfit(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                            color: _selectedPanitiaSemester == 'Genap' ? Colors.white : context.subTitleColor,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Search Box
          _buildSearchBox(context, isDark),
          const SizedBox(height: 16),

          // Render List Grouped with Koordinator & Anggota
          _renderGroupedStructureContent(
            rawList: rawList,
            selectedCategory: '',
            isDark: isDark,
          ),
        ],
      ),
    );
  }

  // ── STANDARD TAB SCREEN (Jam'iyyah, PMQ, Madin, Sambangan, Haflah, PSB, Dewan Penyantun)
  Widget _buildStandardTabScreen({
    required String key,
    required String title,
    required String subtitle,
    required bool isDark,
  }) {
    final rawList = _liveApiData[key] ?? [];

    // Distinct categories (Sub-tabs)
    final categories = <String>[];
    for (final item in rawList) {
      final kat = item['kategori']?.toString().trim() ?? '';
      if (kat.isNotEmpty && !categories.contains(kat)) {
        categories.add(kat);
      }
    }

    // Default to first category if not selected (NO "Semua" tab!)
    if (!_activeSubCategoryPerTab.containsKey(key) ||
        !categories.contains(_activeSubCategoryPerTab[key])) {
      if (categories.isNotEmpty) {
        _activeSubCategoryPerTab[key] = categories.first;
      }
    }
    final selectedCat = _activeSubCategoryPerTab[key] ?? '';

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Banner info
          _buildInfoBanner(title, subtitle, isDark),
          const SizedBox(height: 14),

          // Search Box
          _buildSearchBox(context, isDark),

          // Sub-Tab Chips (NO "Semua" chip! Defaults to first sub-tab!)
          if (categories.isNotEmpty) ...[
            const SizedBox(height: 12),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              child: Row(
                children: categories.map((cat) {
                  final isSelected = (selectedCat == cat);
                  final count = rawList.where((i) => i['kategori'] == cat).length;
                  return _buildSubTabChip(
                    label: "$cat ($count)",
                    isSelected: isSelected,
                    onTap: () {
                      setState(() {
                        _activeSubCategoryPerTab[key] = cat;
                      });
                    },
                    isDark: isDark,
                  );
                }).toList(),
              ),
            ),
          ],

          const SizedBox(height: 16),

          // Render List Grouped with Koordinator & Anggota
          _renderGroupedStructureContent(
            rawList: rawList,
            selectedCategory: selectedCat,
            isDark: isDark,
          ),
        ],
      ),
    );
  }

  // ── SEARCH BOX ───────────────────────────────────────────────────────────
  Widget _buildSearchBox(BuildContext context, bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131C2E) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.08),
        ),
      ),
      child: TextField(
        controller: _searchController,
        onChanged: (val) => setState(() => _searchQuery = val),
        style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13),
        decoration: InputDecoration(
          hintText: "Cari nama pengurus, jabatan, daerah asal...",
          hintStyle: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 12),
          prefixIcon: Icon(Icons.search_rounded, color: context.subTitleColor, size: 20),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.close_rounded, size: 16),
                  onPressed: () {
                    _searchController.clear();
                    setState(() => _searchQuery = '');
                  },
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        ),
      ),
    );
  }

  // ── SUB-TAB CHIP WIDGET ──────────────────────────────────────────────────
  Widget _buildSubTabChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF3B82F6)
              : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF3B82F6)
                : (isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.08)),
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFF3B82F6).withOpacity(0.3),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  )
                ]
              : null,
        ),
        child: Text(
          label,
          style: GoogleFonts.outfit(
            color: isSelected
                ? Colors.white
                : (isDark ? Colors.white70 : const Color(0xFF475569)),
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ),
    );
  }

  // ── RENDER GROUPED CONTENT (Koordinator & Anggota in One Card) ───────────
  Widget _renderGroupedStructureContent({
    required List<Map<String, dynamic>> rawList,
    required String selectedCategory,
    required bool isDark,
  }) {
    // 1. Filter by category if category is specified
    List<Map<String, dynamic>> filteredList = rawList;
    if (selectedCategory.isNotEmpty) {
      filteredList = filteredList.where((item) => item['kategori'] == selectedCategory).toList();
    }

    // 2. Filter by search query
    if (_searchQuery.trim().isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      filteredList = filteredList.where((item) {
        final nama = (item['nama'] ?? '').toString().toLowerCase();
        final jabatan = (item['jabatan'] ?? '').toString().toLowerCase();
        final alamat = (item['alamat'] ?? '').toString().toLowerCase();
        final bidang = (item['bidang'] ?? '').toString().toLowerCase();
        return nama.contains(q) || jabatan.contains(q) || alamat.contains(q) || bidang.contains(q);
      }).toList();
    }

    if (filteredList.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 40),
          child: Column(
            children: [
              Icon(Icons.people_outline_rounded, size: 48, color: context.subTitleColor.withOpacity(0.5)),
              const SizedBox(height: 12),
              Text(
                "Tidak ada data pengurus di sub-tab ini",
                style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 13),
              ),
            ],
          ),
        ),
      );
    }

    // 3. Group by section (Koordinator & Anggota unified)
    final List<Widget> cards = [];
    final Map<String, List<Map<String, dynamic>>> sectionMap = {};
    final List<Map<String, dynamic>> standaloneList = [];

    for (final item in filteredList) {
      final jab = (item['jabatan'] ?? '').toString();
      final bidang = (item['bidang'] ?? '').toString().toLowerCase();
      final isSeksi = jab.toLowerCase().startsWith('seksi ') ||
          jab.toLowerCase().contains('seksi') ||
          bidang.contains('koordinator') ||
          bidang.contains('anggota');

      if (isSeksi) {
        sectionMap.putIfAbsent(jab, () => []).add(item);
      } else {
        standaloneList.add(item);
      }
    }

    // Standalone cards first (e.g. Lurah, Pimpinan, etc.)
    for (final item in standaloneList) {
      cards.add(_buildPersonCard(item, isDark));
    }

    // Unified Section Cards
    sectionMap.forEach((jabatanTitle, members) {
      // Find Koordinator if any
      Map<String, dynamic>? koordinator;
      final List<Map<String, dynamic>> anggota = [];

      for (final m in members) {
        final bidang = (m['bidang'] ?? '').toString().toLowerCase();
        final isKoor = bidang.contains('koordinator') || (m['jabatan'] ?? '').toString().toLowerCase().contains('koordinator');
        if (isKoor && koordinator == null) {
          koordinator = m;
        } else {
          anggota.add(m);
        }
      }

      cards.add(
        _buildUnifiedSectionCard(
          title: jabatanTitle,
          koordinator: koordinator,
          anggota: anggota,
          isDark: isDark,
        ),
      );
    });

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              "SUSUNAN STRUKTUR PENGURUS",
              style: GoogleFonts.outfit(
                color: context.subTitleColor,
                fontSize: 11,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.2,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFF3B82F6).withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                "${filteredList.length} Personel",
                style: GoogleFonts.outfit(
                  color: const Color(0xFF3B82F6),
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...cards,
      ],
    );
  }

  // ── UNIFIED SECTION CARD (Koordinator + Anggota in ONE Container) ────────
  Widget _buildUnifiedSectionCard({
    required String title,
    required Map<String, dynamic>? koordinator,
    required List<Map<String, dynamic>> anggota,
    required bool isDark,
  }) {
    final totalCount = (koordinator != null ? 1 : 0) + anggota.length;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131C2E) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: const Color(0xFF3B82F6).withOpacity(isDark ? 0.25 : 0.18),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
            blurRadius: 8,
            offset: const Offset(0, 3),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Card Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(17)),
              border: Border(
                bottom: BorderSide(
                  color: isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.05),
                ),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 4,
                      height: 14,
                      decoration: BoxDecoration(
                        color: const Color(0xFF3B82F6),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      title,
                      style: GoogleFonts.outfit(
                        color: context.titleColor,
                        fontSize: 13.5,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFF3B82F6).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    "$totalCount Personel",
                    style: GoogleFonts.outfit(
                      color: const Color(0xFF3B82F6),
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Highlighted Koordinator
                if (koordinator != null) ...[
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withOpacity(isDark ? 0.12 : 0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: const Color(0xFFF59E0B).withOpacity(0.3),
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildCircularAvatar(
                          fotoUrl: koordinator['foto_url']?.toString(),
                          name: koordinator['nama']?.toString() ?? '',
                          size: 42,
                          isKoor: true,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF59E0B).withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(5),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.star_rounded, size: 12, color: Color(0xFFD97706)),
                                    const SizedBox(width: 3),
                                    Text(
                                      koordinator['bidang']?.toString().isNotEmpty == true && koordinator['bidang'] != '-'
                                          ? koordinator['bidang'].toString()
                                          : 'Koordinator Seksi',
                                      style: GoogleFonts.outfit(
                                        color: const Color(0xFFD97706),
                                        fontSize: 9.5,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                koordinator['nama']?.toString() ?? '-',
                                style: GoogleFonts.outfit(
                                  color: context.titleColor,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                              if (koordinator['alamat']?.toString().isNotEmpty == true) ...[
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    Icon(Icons.location_on_outlined, size: 11, color: context.subTitleColor),
                                    const SizedBox(width: 3),
                                    Expanded(
                                      child: Text(
                                        koordinator['alamat'].toString(),
                                        style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 10.5),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                        if (koordinator['kontak'] != null && koordinator['kontak'] != '-' && koordinator['kontak'].toString().trim().isNotEmpty)
                          IconButton(
                            icon: const Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFF10B981), size: 18),
                            onPressed: () => _launchWhatsApp(koordinator!['kontak'].toString()),
                            tooltip: "Hubungi via WA",
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                          ),
                      ],
                    ),
                  ),
                  if (anggota.isNotEmpty) const SizedBox(height: 10),
                ],

                // Anggota Section inside the same card
                if (anggota.isNotEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.only(left: 4, bottom: 6),
                    child: Text(
                      "ANGGOTA SEKSI (${anggota.length})",
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 9.5,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),
                  ...anggota.map((ang) {
                    final nama = ang['nama']?.toString() ?? '-';
                    final alamat = ang['alamat']?.toString() ?? '';
                    final kontak = ang['kontak']?.toString() ?? '-';
                    final hasKontak = kontak != '-' && kontak.trim().isNotEmpty;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B).withOpacity(0.5) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isDark ? Colors.white.withOpacity(0.04) : Colors.black.withOpacity(0.04),
                        ),
                      ),
                      child: Row(
                        children: [
                          _buildCircularAvatar(
                            fotoUrl: ang['foto_url']?.toString(),
                            name: nama,
                            size: 32,
                            isKoor: false,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  nama,
                                  style: GoogleFonts.outfit(
                                    color: context.titleColor,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 12,
                                  ),
                                ),
                                if (alamat.isNotEmpty)
                                  Text(
                                    alamat,
                                    style: GoogleFonts.outfit(
                                      color: context.subTitleColor,
                                      fontSize: 10,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                              ],
                            ),
                          ),
                          if (hasKontak)
                            IconButton(
                              icon: const Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFF10B981), size: 16),
                              onPressed: () => _launchWhatsApp(kontak),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                            ),
                        ],
                      ),
                    );
                  }),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── STANDALONE PERSON CARD (For single leaders / individuals) ─────────────
  Widget _buildPersonCard(Map<String, dynamic> item, bool isDark) {
    final bool isHeader = item['isHeader'] == true;
    final String nama = item['nama']?.toString() ?? '-';
    final String jabatan = item['jabatan']?.toString() ?? '-';
    final String alamat = item['alamat']?.toString() ?? '';
    final String bidang = item['bidang']?.toString() ?? '-';
    final String kontak = item['kontak']?.toString() ?? '-';
    final String? fotoUrl = item['foto_url']?.toString();
    final bool hasValidContact = kontak != '-' && kontak.trim().isNotEmpty;
    final bool isKoordinator = bidang.toLowerCase().contains('koordinator');

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131C2E) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isKoordinator
              ? const Color(0xFFF59E0B).withOpacity(0.4)
              : (isHeader
                  ? const Color(0xFF3B82F6).withOpacity(0.4)
                  : (isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.06))),
          width: (isHeader || isKoordinator) ? 1.4 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.2 : 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          )
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Circular Avatar (Round like usual)
          _buildCircularAvatar(
            fotoUrl: fotoUrl,
            name: nama,
            size: 42,
            isKoor: isKoordinator || isHeader,
          ),
          const SizedBox(width: 12),

          // Main Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: isKoordinator
                        ? const Color(0xFFF59E0B).withOpacity(0.15)
                        : (isHeader
                            ? const Color(0xFF3B82F6).withOpacity(0.15)
                            : const Color(0xFF6366F1).withOpacity(0.1)),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    jabatan,
                    style: GoogleFonts.outfit(
                      color: isKoordinator
                          ? const Color(0xFFD97706)
                          : (isHeader ? const Color(0xFF3B82F6) : const Color(0xFF6366F1)),
                      fontSize: 10.5,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  nama,
                  style: GoogleFonts.outfit(
                    color: context.titleColor,
                    fontSize: 13.5,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (alamat.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Icon(Icons.location_on_outlined, size: 12, color: context.subTitleColor),
                      const SizedBox(width: 3),
                      Expanded(
                        child: Text(
                          alamat,
                          style: GoogleFonts.outfit(
                            color: context.subTitleColor,
                            fontSize: 11,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
                if (bidang != '-' && bidang.isNotEmpty && !bidang.toLowerCase().contains('koordinator')) ...[
                  const SizedBox(height: 2),
                  Text(
                    "Tugas: $bidang",
                    style: GoogleFonts.outfit(
                      color: context.subTitleColor.withOpacity(0.8),
                      fontSize: 10.5,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ],
            ),
          ),

          if (hasValidContact)
            IconButton(
              icon: const Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFF10B981), size: 18),
              onPressed: () => _launchWhatsApp(kontak),
              tooltip: "Hubungi via WA",
            ),
        ],
      ),
    );
  }

  // ── CIRCULAR AVATAR BUILDER (Every person gets a round photo avatar) ─────
  Widget _buildCircularAvatar({
    required String? fotoUrl,
    required String name,
    required double size,
    required bool isKoor,
  }) {
    if (fotoUrl != null && fotoUrl.trim().isNotEmpty) {
      final fullUrl = _apiService.getFullImageUrl(fotoUrl.trim());
      return ClipOval(
        child: Image.network(
          fullUrl,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _buildFallbackCircle(name, size, isKoor),
        ),
      );
    }
    return _buildFallbackCircle(name, size, isKoor);
  }

  Widget _buildFallbackCircle(String name, double size, bool isKoor) {
    final initial = name.trim().isNotEmpty ? name.trim()[0].toUpperCase() : '?';
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: isKoor
              ? [const Color(0xFFF59E0B), const Color(0xFFD97706)]
              : [const Color(0xFF3B82F6), const Color(0xFF6366F1)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Text(
          initial,
          style: GoogleFonts.outfit(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: size * 0.42,
          ),
        ),
      ),
    );
  }

  Widget _buildInfoBanner(String title, String subtitle, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131C2E) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF3B82F6).withOpacity(0.25),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(9),
            decoration: BoxDecoration(
              color: const Color(0xFF3B82F6).withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.account_tree_rounded, color: Color(0xFF3B82F6), size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.outfit(
                    color: context.titleColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 14.5,
                  ),
                ),
                const SizedBox(height: 2),
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
    );
  }
}
