import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/theme_manager.dart';
import 'buku_induk_screen.dart';
import 'santri_explorer_screen.dart';
import 'teacher_list_screen.dart';
import 'alumni_list_screen.dart';
import 'struktur_lembaga_screen.dart';
import 'materi_sidang_screen.dart';

class TabAdministratif extends StatefulWidget {
  const TabAdministratif({super.key});

  @override
  State<TabAdministratif> createState() => _TabAdministratifState();
}

class _TabAdministratifState extends State<TabAdministratif> {
  String _selectedCategory = 'Data Kesiswaan';

  final List<String> _categories = [
    'Data Kesiswaan',
    'Asatidz',
    'Struktur',
    'Mutakhorijin',
    'Materi Sidang',
  ];

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Section
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Layanan Administratif",
                        style: GoogleFonts.outfit(
                          color: context.titleColor,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Manajemen santri, dewan asatidz, kepengurusan, & arsip sidang.",
                        style: GoogleFonts.outfit(
                          color: context.subTitleColor,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF3B82F6).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.admin_panel_settings_rounded, color: Color(0xFF3B82F6), size: 24),
                ),
              ],
            ),
            const SizedBox(height: 18),

            // Quick Filter Chips
            _buildFilterChips(isDark),
            const SizedBox(height: 24),

            // 1. CLUSTER: DATA KESISWAAN
            if (_shouldShowCluster('Data Kesiswaan')) ...[
              _buildSectionHeader(
                title: "Data Kesiswaan & Profil",
                subtitle: "Buku induk pendaftaran, riwayat data santri & filter angkatan",
                badgeText: "2 Menu",
                icon: Icons.badge_rounded,
                color: const Color(0xFF3B82F6),
                isDark: isDark,
              ),
              const SizedBox(height: 14),
              _buildKesiswaanCluster(context, isDark),
              const SizedBox(height: 28),
            ],

            // 2. CLUSTER: ASATIDZ
            if (_shouldShowCluster('Asatidz')) ...[
              _buildSectionHeader(
                title: "Dewan Asatidz & Guru",
                subtitle: "Wali kelas aktif (Mustahiq) dan guru mata pelajaran (Munawib)",
                badgeText: "2 Menu",
                icon: Icons.people_alt_rounded,
                color: const Color(0xFF10B981),
                isDark: isDark,
              ),
              const SizedBox(height: 14),
              _buildAsatidzCluster(context, isDark),
              const SizedBox(height: 28),
            ],

            // 3. CLUSTER: STRUKTUR ORGANISASI
            if (_shouldShowCluster('Struktur')) ...[
              _buildSectionHeader(
                title: "Struktur Lembaga & Kepanitiaan",
                subtitle: "Bagan susunan pengurus Madin, PMQ, Pondok, Sambangan & Haflah",
                badgeText: "5 Struktur",
                icon: Icons.account_tree_rounded,
                color: const Color(0xFF8B5CF6),
                isDark: isDark,
              ),
              const SizedBox(height: 14),
              _buildStrukturCluster(context, isDark),
              const SizedBox(height: 28),
            ],

            // 4. CLUSTER: MUTAKHORIJIN & MUTASI
            if (_shouldShowCluster('Mutakhorijin')) ...[
              _buildSectionHeader(
                title: "Mutakhorijin & Mutasi",
                subtitle: "Arsip kelulusan alumni santri serta data siswa pindahan/mutasi",
                badgeText: "2 Menu",
                icon: Icons.school_rounded,
                color: const Color(0xFFF59E0B),
                isDark: isDark,
              ),
              const SizedBox(height: 14),
              _buildMutakhorijinCluster(context, isDark),
              const SizedBox(height: 28),
            ],

            // 5. CLUSTER: MATERI-MATERI SIDANG (PDF)
            if (_shouldShowCluster('Materi Sidang')) ...[
              _buildSectionHeader(
                title: "Materi & Dokumen Sidang (PDF)",
                subtitle: "Naskah pleno, pedoman kurikulum, SK keputusan & notulensi",
                badgeText: "Dokumen Resmi",
                icon: Icons.picture_as_pdf_rounded,
                color: const Color(0xFFEF4444),
                isDark: isDark,
              ),
              const SizedBox(height: 14),
              _buildMateriSidangCluster(context, isDark),
              const SizedBox(height: 24),
            ],
          ],
        ),
      ),
    );
  }

  bool _shouldShowCluster(String clusterName) {
    return _selectedCategory == clusterName;
  }

  Widget _buildSearchBar(bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131C2E) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.08),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: TextField(
        controller: _searchController,
        onChanged: (val) => setState(() => _searchQuery = val.trim().toLowerCase()),
        style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13),
        decoration: InputDecoration(
          hintText: "Cari menu administrasi (contoh: Santri, Alumni, Sidang)...",
          hintStyle: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 13),
          prefixIcon: Icon(Icons.search_rounded, color: context.subTitleColor, size: 20),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(
                  icon: Icon(Icons.close_rounded, color: context.subTitleColor, size: 18),
                  onPressed: () {
                    _searchController.clear();
                    setState(() => _searchQuery = '');
                  },
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
    );
  }

  Widget _buildFilterChips(bool isDark) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: _categories.map((cat) {
          final isSelected = _selectedCategory == cat;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(cat),
              selected: isSelected,
              onSelected: (val) {
                if (val) setState(() => _selectedCategory = cat);
              },
              selectedColor: const Color(0xFF3B82F6).withOpacity(0.18),
              labelStyle: GoogleFonts.outfit(
                color: isSelected ? const Color(0xFF3B82F6) : context.subTitleColor,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                fontSize: 12,
              ),
              backgroundColor: isDark ? const Color(0xFF131C2E) : Colors.white,
              side: BorderSide(
                color: isSelected
                    ? const Color(0xFF3B82F6)
                    : (isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.08)),
                width: isSelected ? 1.5 : 1.0,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildSectionHeader({
    required String title,
    required String subtitle,
    required String badgeText,
    required IconData icon,
    required Color color,
    required bool isDark,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: color, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    title,
                    style: GoogleFonts.outfit(
                      color: context.titleColor,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      badgeText,
                      style: GoogleFonts.outfit(
                        color: color,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
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
    );
  }

  // ── 1. KESISWAAN CLUSTER ──────────────────────────────────────────────────
  Widget _buildKesiswaanCluster(BuildContext context, bool isDark) {
    final items = [
      {
        'title': 'Profil Santri',
        'desc': 'Cari biodata lengkap, wali, alamat & rekap akademik per santri.',
        'icon': Icons.badge_rounded,
        'badge': 'Explorer',
        'color': const Color(0xFF3B82F6),
        'screen': const SantriExplorerScreen(),
      },
      {
        'title': 'Buku Induk',
        'desc': 'Data induk santri dikelompokkan tahun masuk & gender.',
        'icon': Icons.assignment_ind_rounded,
        'badge': 'Arsip Resmi',
        'color': const Color(0xFFEC4899),
        'screen': const BukuIndukScreen(),
      },
    ];

    final filtered = items.where((it) {
      if (_searchQuery.isEmpty) return true;
      return it['title'].toString().toLowerCase().contains(_searchQuery) ||
          it['desc'].toString().toLowerCase().contains(_searchQuery);
    }).toList();

    if (filtered.isEmpty) return _buildNoMatchText();

    return Row(
      children: filtered.map((it) {
        final Color col = it['color'] as Color;
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 5),
            child: GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => it['screen'] as Widget),
                );
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF131C2E) : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: col.withOpacity(isDark ? 0.35 : 0.2),
                    width: 1.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(isDark ? 0.25 : 0.03),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: col.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Icon(it['icon'] as IconData, color: col, size: 22),
                        ),
                        Icon(Icons.arrow_forward_rounded, size: 16, color: col),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Text(
                      it['title'] as String,
                      style: GoogleFonts.outfit(
                        color: context.titleColor,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      it['desc'] as String,
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 10,
                        height: 1.3,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  // ── 2. ASATIDZ CLUSTER ────────────────────────────────────────────────────
  Widget _buildAsatidzCluster(BuildContext context, bool isDark) {
    final items = [
      {
        'title': 'Daftar Mustahiq',
        'desc': 'Wali kelas Diniyah aktif beserta rincian kelas binaannya.',
        'icon': Icons.workspace_premium_rounded,
        'badge': 'Wali Kelas',
        'color': const Color(0xFF8B5CF6),
        'screen': const TeacherListScreen(isMustahiq: true),
      },
      {
        'title': 'Daftar Munawib',
        'desc': 'Asatidz pengampu mata pelajaran aktif di Madrasah Diniyah.',
        'icon': Icons.people_alt_rounded,
        'badge': 'Guru Mapel',
        'color': const Color(0xFF10B981),
        'screen': const TeacherListScreen(isMustahiq: false),
      },
    ];

    final filtered = items.where((it) {
      if (_searchQuery.isEmpty) return true;
      return it['title'].toString().toLowerCase().contains(_searchQuery) ||
          it['desc'].toString().toLowerCase().contains(_searchQuery);
    }).toList();

    if (filtered.isEmpty) return _buildNoMatchText();

    return Row(
      children: filtered.map((it) {
        final Color col = it['color'] as Color;
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 5),
            child: GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => it['screen'] as Widget),
                );
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF131C2E) : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: col.withOpacity(isDark ? 0.35 : 0.2),
                    width: 1.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(isDark ? 0.25 : 0.03),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: col.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Icon(it['icon'] as IconData, color: col, size: 22),
                        ),
                        Icon(Icons.arrow_forward_rounded, size: 16, color: col),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Text(
                      it['title'] as String,
                      style: GoogleFonts.outfit(
                        color: context.titleColor,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      it['desc'] as String,
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 10,
                        height: 1.3,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  // ── 3. STRUKTUR CLUSTER ───────────────────────────────────────────────────
  Widget _buildStrukturCluster(BuildContext context, bool isDark) {
    final list = [
      {
        'title': 'Struktur Madrasah Diniyah',
        'desc': 'Struktur pimpinan, bagian kurikulum & pengawas KBM Diniyah.',
        'badge': 'Madin',
        'index': 0,
        'color': const Color(0xFF3B82F6),
      },
      {
        'title': 'Struktur PMQ (Madin Al-Qur\'an)',
        'desc': 'Koordinator tahfidz 30 juz, tahsin metode Yanbu\'a & penguji.',
        'badge': 'Al-Qur\'an',
        'index': 1,
        'color': const Color(0xFF10B981),
      },
      {
        'title': 'Struktur Pondok Pesantren',
        'desc': 'Lurah pondok, biro keamanan, biro ubudiyah, sanitasi & ro\'an.',
        'badge': 'Pesantren',
        'index': 2,
        'color': const Color(0xFF8B5CF6),
      },
      {
        'title': 'Struktur Panitia Sambangan',
        'desc': 'Panitia kunjungan wali santri, alur perizinan, pos registrasi & bazar.',
        'badge': 'Sambangan',
        'index': 3,
        'color': const Color(0xFFF59E0B),
      },
      {
        'title': 'Struktur Panitia Haflah',
        'desc': 'Kepanitiaan wisuda akbar santri, dekorasi, publikasi & panggung.',
        'badge': 'Haflah',
        'index': 4,
        'color': const Color(0xFFEC4899),
      },
    ];

    final filtered = list.where((it) {
      if (_searchQuery.isEmpty) return true;
      return it['title'].toString().toLowerCase().contains(_searchQuery) ||
          it['desc'].toString().toLowerCase().contains(_searchQuery);
    }).toList();

    if (filtered.isEmpty) return _buildNoMatchText();

    return Column(
      children: filtered.map((it) {
        final Color col = it['color'] as Color;

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          child: GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => StrukturLembagaScreen(
                    initialTabIndex: it['index'] as int,
                  ),
                ),
              );
            },
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF131C2E) : Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: col.withOpacity(isDark ? 0.3 : 0.2),
                  width: 1.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: col.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(Icons.account_tree_rounded, color: col, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              it['title'] as String,
                              style: GoogleFonts.outfit(
                                color: context.titleColor,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: col.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                it['badge'] as String,
                                style: GoogleFonts.outfit(
                                  color: col,
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 3),
                        Text(
                          it['desc'] as String,
                          style: GoogleFonts.outfit(
                            color: context.subTitleColor,
                            fontSize: 11,
                            height: 1.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(Icons.arrow_forward_ios_rounded, color: col, size: 14),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  // ── 4. MUTAKHORIJIN CLUSTER ───────────────────────────────────────────────
  Widget _buildMutakhorijinCluster(BuildContext context, bool isDark) {
    final items = [
      {
        'title': 'Data Alumni',
        'desc': 'Arsip santri yang telah lulus & menyelesaikan pendidikan.',
        'icon': Icons.school_rounded,
        'badge': 'Lulusan',
        'color': const Color(0xFF10B981),
        'screen': const AlumniListScreen(tipe: 'alumni', title: 'Data Alumni'),
      },
      {
        'title': 'Migrasi / Pindah',
        'desc': 'Arsip mutasi santri pindah keluar atau dipindahkan.',
        'icon': Icons.swap_horiz_rounded,
        'badge': 'Mutasi',
        'color': const Color(0xFFF59E0B),
        'screen': const AlumniListScreen(tipe: 'pindah', title: 'Siswa Pindah / Migrasi'),
      },
    ];

    final filtered = items.where((it) {
      if (_searchQuery.isEmpty) return true;
      return it['title'].toString().toLowerCase().contains(_searchQuery) ||
          it['desc'].toString().toLowerCase().contains(_searchQuery);
    }).toList();

    if (filtered.isEmpty) return _buildNoMatchText();

    return Row(
      children: filtered.map((it) {
        final Color col = it['color'] as Color;
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 5),
            child: GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => it['screen'] as Widget),
                );
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF131C2E) : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: col.withOpacity(isDark ? 0.35 : 0.2),
                    width: 1.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(isDark ? 0.25 : 0.03),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: col.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Icon(it['icon'] as IconData, color: col, size: 22),
                        ),
                        Icon(Icons.arrow_forward_rounded, size: 16, color: col),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Text(
                      it['title'] as String,
                      style: GoogleFonts.outfit(
                        color: context.titleColor,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      it['desc'] as String,
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 10,
                        height: 1.3,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  // ── 5. MATERI SIDANG CLUSTER (PDF) ────────────────────────────────────────
  Widget _buildMateriSidangCluster(BuildContext context, bool isDark) {
    final subSidangs = [
      {'title': 'Sidang Madin', 'badge': 'Kurikulum & KKM', 'index': 0},
      {'title': 'Sidang PMQ', 'badge': 'Tahfidz & Tartil', 'index': 1},
      {'title': 'Sidang Pondok', 'badge': 'Tata Tertib & Qonun', 'index': 2},
      {'title': 'Sidang Haflah', 'badge': 'SK Wisuda & RAB', 'index': 3},
    ];

    return Column(
      children: [
        // Hero Card
        GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const MateriSidangScreen()),
            );
          },
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isDark
                    ? [const Color(0xFF7F1D1D), const Color(0xFF0F172A)]
                    : [const Color(0xFFFEF2F2), const Color(0xFFFEE2E2)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(
                color: const Color(0xFFEF4444).withOpacity(0.4),
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(isDark ? 0.3 : 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white10 : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(
                    Icons.picture_as_pdf_rounded,
                    color: Color(0xFFEF4444),
                    size: 30,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            "Portal Dokumen Sidang",
                            style: GoogleFonts.outfit(
                              color: isDark ? Colors.white : const Color(0xFF991B1B),
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEF4444).withOpacity(0.18),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              "PDF Viewer",
                              style: GoogleFonts.outfit(
                                color: const Color(0xFFEF4444),
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Buka naskah ketetapan, notulensi rapat pleno, dan draf resmi dalam format PDF pembaca digital.",
                        style: GoogleFonts.outfit(
                          color: isDark ? Colors.white70 : const Color(0xFFB91C1C),
                          fontSize: 11,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 6),
                const Icon(Icons.arrow_forward_ios_rounded, color: Color(0xFFEF4444), size: 14),
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),

        // 4 Quick Mini Buttons
        Row(
          children: subSidangs.map((s) {
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => MateriSidangScreen(
                          initialTabIndex: s['index'] as int,
                        ),
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF131C2E) : Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: const Color(0xFFEF4444).withOpacity(isDark ? 0.3 : 0.2),
                      ),
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.description_rounded, color: Color(0xFFEF4444), size: 18),
                        const SizedBox(height: 6),
                        Text(
                          s['title'] as String,
                          style: GoogleFonts.outfit(
                            color: context.titleColor,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildNoMatchText() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Center(
        child: Text(
          "Tidak ada menu yang sesuai dengan kata kunci pencarian.",
          style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 12),
        ),
      ),
    );
  }
}
