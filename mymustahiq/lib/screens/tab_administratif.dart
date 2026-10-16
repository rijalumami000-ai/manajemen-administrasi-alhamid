import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/theme_manager.dart';
import 'buku_induk_screen.dart';
import 'santri_explorer_screen.dart';
import 'teacher_list_screen.dart';
import 'alumni_list_screen.dart';
import 'struktur_lembaga_screen.dart';
import 'struktur_organisasi_screen.dart';
import 'materi_sidang_screen.dart';
import 'inventaris_screen.dart';
import 'statistik_diniyah_screen.dart';
import 'statistik_pesantren_screen.dart';
import 'tab_keuangan.dart';

class TabAdministratif extends StatefulWidget {
  const TabAdministratif({super.key});

  @override
  State<TabAdministratif> createState() => _TabAdministratifState();
}

class _TabAdministratifState extends State<TabAdministratif> {
  String _mainTab = 'admin'; // 'admin' | 'keuangan'
  String _selectedCategory = 'Data Kesiswaan';

  final List<String> _categories = [
    'Data Kesiswaan',
    'Asatidz',
    'Struktur',
    'Mutakhorijin',
    'Materi Sidang',
    'Inventaris',
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
      body: Column(
        children: [
          // Segmented Tab Switch: Administratif vs Keuangan & SPP
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 6),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: context.isDarkMode ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.04),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: context.isDarkMode ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.06),
                  width: 1,
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _mainTab = 'admin'),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(vertical: 9),
                        decoration: BoxDecoration(
                          color: _mainTab == 'admin'
                              ? (context.isDarkMode ? const Color(0xFF1E293B) : Colors.white)
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: _mainTab == 'admin'
                              ? [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.08),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ]
                              : null,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.admin_panel_settings_rounded,
                              size: 16,
                              color: _mainTab == 'admin' ? const Color(0xFF3B82F6) : context.subTitleColor,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              "Administratif",
                              style: GoogleFonts.outfit(
                                fontSize: 13,
                                fontWeight: _mainTab == 'admin' ? FontWeight.bold : FontWeight.w500,
                                color: _mainTab == 'admin' ? context.titleColor : context.subTitleColor,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _mainTab = 'keuangan'),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(vertical: 9),
                        decoration: BoxDecoration(
                          color: _mainTab == 'keuangan'
                              ? (context.isDarkMode ? const Color(0xFF1E293B) : Colors.white)
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: _mainTab == 'keuangan'
                              ? [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.08),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ]
                              : null,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.account_balance_wallet_rounded,
                              size: 16,
                              color: _mainTab == 'keuangan' ? const Color(0xFF10B981) : context.subTitleColor,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              "Keuangan & SPP",
                              style: GoogleFonts.outfit(
                                fontSize: 13,
                                fontWeight: _mainTab == 'keuangan' ? FontWeight.bold : FontWeight.w500,
                                color: _mainTab == 'keuangan' ? context.titleColor : context.subTitleColor,
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
          ),
          Expanded(
            child: _mainTab == 'keuangan'
                ? const TabKeuangan()
                : SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
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
                            icon: Icons.picture_as_pdf_rounded,
                            color: const Color(0xFFEF4444),
                            isDark: isDark,
                          ),
                          const SizedBox(height: 14),
                          _buildMateriSidangCluster(context, isDark),
                          const SizedBox(height: 24),
                        ],

                        // 6. CLUSTER: INVENTARIS PESANTREN
                        if (_shouldShowCluster('Inventaris')) ...[
                          _buildSectionHeader(
                            title: "Inventaris Sarana & Prasarana",
                            subtitle: "Pencatatan aset Pondok, Madrasah Diniyah, dan PMQ",
                            icon: Icons.inventory_2_rounded,
                            color: const Color(0xFFF59E0B),
                            isDark: isDark,
                          ),
                          const SizedBox(height: 14),
                          _buildInventarisCluster(context, isDark),
                          const SizedBox(height: 24),
                        ],
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  bool _shouldShowCluster(String clusterName) {
    return _selectedCategory == clusterName;
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
              Text(
                title,
                style: GoogleFonts.outfit(
                  color: context.titleColor,
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                ),
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

    final filtered = items;

    return Column(
      children: [
        Row(
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
        ),
        const SizedBox(height: 10),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 5),
          child: GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const StatistikDiniyahScreen()),
              );
            },
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF131C2E) : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: const Color(0xFF10B981).withOpacity(isDark ? 0.35 : 0.25),
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
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(Icons.bar_chart_rounded, color: Color(0xFF10B981), size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              "Statistik Siswa Madin",
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
                                color: const Color(0xFF10B981).withOpacity(0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                "Demografi",
                                style: GoogleFonts.outfit(
                                  color: const Color(0xFF10B981),
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "Rekapitulasi jumlah santri per semester, tingkat, & perbandingan tahun ajaran.",
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
                  const Icon(Icons.arrow_forward_rounded, size: 16, color: Color(0xFF10B981)),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 5),
          child: GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const StatistikPesantrenScreen()),
              );
            },
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF131C2E) : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: const Color(0xFF3B82F6).withOpacity(isDark ? 0.35 : 0.25),
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
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF3B82F6).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(Icons.insights_rounded, color: Color(0xFF3B82F6), size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              "Statistik & Grafik Pesantren",
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
                                color: const Color(0xFF3B82F6).withOpacity(0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                "Buku Induk",
                                style: GoogleFonts.outfit(
                                  color: const Color(0xFF3B82F6),
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "Perkembangan kuantitatif santri per angkatan/tahun masuk, rasio putra/putri, & sebaran asrama.",
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
                  const Icon(Icons.arrow_forward_rounded, size: 16, color: Color(0xFF3B82F6)),
                ],
              ),
            ),
          ),
        ),
      ],
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

    final filtered = items;

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
        'title': 'Struktur Madrasah Diniyah & Panitia',
        'desc': 'Struktur pimpinan, bagian kurikulum & panitia semester Madin.',
        'isMadin': true,
        'color': const Color(0xFF3B82F6),
      },
      {
        'title': 'Struktur PMQ',
        'desc': 'Pendidikan Murottilil Qur\'an - Koordinator tahfidz 30 juz, metode Yanbu\'a & penguji.',
        'index': 0,
        'color': const Color(0xFF10B981),
      },
      {
        'title': 'Struktur Pondok Pesantren',
        'desc': 'Lurah pondok, biro keamanan, biro ubudiyah, sanitasi & ro\'an.',
        'index': 1,
        'color': const Color(0xFF8B5CF6),
      },
      {
        'title': 'Struktur Panitia Sambangan',
        'desc': 'Panitia kunjungan wali santri, alur perizinan, pos registrasi & bazar.',
        'index': 2,
        'color': const Color(0xFFF59E0B),
      },
      {
        'title': 'Struktur Panitia Haflah',
        'desc': 'Kepanitiaan wisuda akbar santri, dekorasi, publikasi & panggung.',
        'index': 3,
        'color': const Color(0xFFEC4899),
      },
      {
        'title': 'Struktur Panitia PSB',
        'desc': 'Panitia penerimaan santri baru, tes baca kitab & administrasi pendaftaran.',
        'index': 4,
        'color': const Color(0xFF06B6D4),
      },
    ];

    final filtered = list;

    if (filtered.isEmpty) return _buildNoMatchText();

    return Column(
      children: filtered.map((it) {
        final Color col = it['color'] as Color;

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          child: GestureDetector(
            onTap: () {
              if (it['isMadin'] == true) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const StrukturOrganisasiScreen(),
                  ),
                );
              } else {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => StrukturLembagaScreen(
                      initialTabIndex: it['index'] as int,
                    ),
                  ),
                );
              }
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
                        Text(
                          it['title'] as String,
                          style: GoogleFonts.outfit(
                            color: context.titleColor,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
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

    final filtered = items;

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
                      Text(
                        "Portal Dokumen Sidang",
                        style: GoogleFonts.outfit(
                          color: isDark ? Colors.white : const Color(0xFF991B1B),
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
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

  // ── 6. INVENTARIS CLUSTER ──────────────────────────────────────────────────
  Widget _buildInventarisCluster(BuildContext context, bool isDark) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const InventarisScreen()),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF131C2E) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: const Color(0xFFF59E0B).withOpacity(isDark ? 0.4 : 0.3),
            width: 1.2,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFF59E0B).withOpacity(0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF59E0B).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(Icons.inventory_2_rounded, color: Color(0xFFF59E0B), size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            "Inventaris Pesantren",
                            style: GoogleFonts.outfit(
                              color: context.titleColor,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF59E0B).withOpacity(0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              "3 Divisi",
                              style: GoogleFonts.outfit(
                                color: const Color(0xFFF59E0B),
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Pencatatan sarana & prasarana Pondok, Madrasah Diniyah, dan PMQ.",
                        style: GoogleFonts.outfit(
                          color: context.subTitleColor,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Color(0xFFF59E0B)),
              ],
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withOpacity(0.04) : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Text(
                    "🏛️ Pondok",
                    style: GoogleFonts.outfit(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white70 : const Color(0xFF475569),
                    ),
                  ),
                  Text(
                    "📚 Madin",
                    style: GoogleFonts.outfit(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white70 : const Color(0xFF475569),
                    ),
                  ),
                  Text(
                    "📖 PMQ",
                    style: GoogleFonts.outfit(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white70 : const Color(0xFF475569),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
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
