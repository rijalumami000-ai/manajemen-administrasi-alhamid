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
        'title': 'Mustahiq',
        'desc': 'Wali kelas Diniyah aktif & kelas binaan.',
        'icon': Icons.workspace_premium_rounded,
        'badge': 'Wali Kelas',
        'color': const Color(0xFF8B5CF6),
        'screen': const TeacherListScreen(isMustahiq: true),
      },
      {
        'title': 'Munawib',
        'desc': 'Asatidz pengampu mapel Madrasah Diniyah.',
        'icon': Icons.people_alt_rounded,
        'badge': 'Guru Mapel',
        'color': const Color(0xFF10B981),
        'screen': const TeacherListScreen(isMustahiq: false),
      },
      {
        'title': 'Seluruh Asatidz',
        'desc': 'Daftar seluruh dewan asatidz aktif.',
        'icon': Icons.groups_rounded,
        'badge': 'Semua Asatidz',
        'color': const Color(0xFF3B82F6),
        'screen': const TeacherListScreen(isMustahiq: false, isAll: true),
      },
    ];

    final filtered = items;

    if (filtered.isEmpty) return _buildNoMatchText();

    return Row(
      children: filtered.map((it) {
        final Color col = it['color'] as Color;
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => it['screen'] as Widget),
                );
              },
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF131C2E) : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: col.withOpacity(isDark ? 0.35 : 0.22),
                    width: 1.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(isDark ? 0.25 : 0.03),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
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
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: col.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(it['icon'] as IconData, color: col, size: 18),
                        ),
                        Icon(Icons.arrow_forward_rounded, size: 13, color: col),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      it['title'] as String,
                      style: GoogleFonts.outfit(
                        color: context.titleColor,
                        fontSize: 12.5,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      it['desc'] as String,
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 9.5,
                        height: 1.25,
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
        'title': 'Struktur Pondok Pesantren',
        'desc': 'Lurah pondok, dewan pleno, keamanan, ubudiyah (Putra & Putri terpisah).',
        'index': 0,
        'color': const Color(0xFF8B5CF6),
      },
      {
        'title': "Jam'iyyah Santri",
        'desc': "Jam'iyyah Pusat, Jam'iyyah Putra & Jam'iyyah Putri.",
        'index': 1,
        'color': const Color(0xFF059669),
      },
      {
        'title': 'Struktur PMQ',
        'desc': 'Pendidikan Murottilil Qur\'an - Koordinator tahfidz 30 juz, metode Yanbu\'a & penguji.',
        'index': 2,
        'color': const Color(0xFF10B981),
      },
      {
        'title': 'Struktur Madrasah Diniyah',
        'desc': 'Pimpinan madrasah, bidang kurikulum, kesiswaan & tata usaha.',
        'index': 3,
        'color': const Color(0xFF3B82F6),
      },
      {
        'title': 'Panitia Ujian Semester',
        'desc': 'Kepanitiaan ujian semester ganjil dan semester genap.',
        'index': 4,
        'color': const Color(0xFF6366F1),
      },
      {
        'title': 'Struktur Panitia Sambangan',
        'desc': 'Panitia kunjungan wali santri, alur perizinan, pos registrasi & bazar.',
        'index': 5,
        'color': const Color(0xFFF59E0B),
      },
      {
        'title': 'Struktur Panitia Haflah',
        'desc': 'Kepanitiaan wisuda akbar santri, dekorasi, publikasi & panggung.',
        'index': 6,
        'color': const Color(0xFFEC4899),
      },
      {
        'title': 'Struktur Panitia PSB',
        'desc': 'Panitia penerimaan santri baru, tes baca kitab & administrasi pendaftaran.',
        'index': 7,
        'color': const Color(0xFF06B6D4),
      },
      {
        'title': 'Dewan Penyantun & Penasihat',
        'desc': 'Pengasuh Ndalem, Dewan Penasihat & Pembina Asrama.',
        'index': 8,
        'color': const Color(0xFFD97706),
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

  // ── 4. MUTAKHORIJIN & KELULUSAN CLUSTER ───────────────────────────────────
  Widget _buildMutakhorijinCluster(BuildContext context, bool isDark) {
    final items = [
      {
        'title': 'Alumni Diniyah',
        'desc': 'Arsip santri lulus Madrasah Diniyah (Kelas 6 / Mutakhorijin).',
        'icon': Icons.school_rounded,
        'badge': 'Alumni Madin',
        'color': const Color(0xFF10B981),
        'screen': const AlumniListScreen(tipe: 'alumni', title: 'Alumni Diniyah'),
      },
      {
        'title': 'Lulusan MTs',
        'desc': 'Arsip siswa lulus pendidikan formal jenjang MTs (Kelas 3 MTs).',
        'icon': Icons.menu_book_rounded,
        'badge': 'Formal MTs',
        'color': const Color(0xFF0284C7),
        'screen': const AlumniListScreen(tipe: 'lulus_mts', title: 'Lulusan MTs'),
      },
      {
        'title': 'Lulusan Aliyah',
        'desc': 'Arsip siswa lulus pendidikan formal jenjang MA (Kelas 3 Aliyah).',
        'icon': Icons.workspace_premium_rounded,
        'badge': 'Formal MA',
        'color': const Color(0xFF8B5CF6),
        'screen': const AlumniListScreen(tipe: 'lulus_aliyah', title: 'Lulusan Aliyah'),
      },
      {
        'title': 'Siswa Pindah',
        'desc': 'Arsip mutasi santri pindah sekolah / pesantren keluar.',
        'icon': Icons.swap_horiz_rounded,
        'badge': 'Mutasi',
        'color': const Color(0xFFF59E0B),
        'screen': const AlumniListScreen(tipe: 'pindah', title: 'Siswa Pindah / Mutasi'),
      },
    ];

    final filtered = items;

    if (filtered.isEmpty) return _buildNoMatchText();

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: filtered.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 1.15,
      ),
      itemBuilder: (context, idx) {
        final it = filtered[idx];
        final Color col = it['color'] as Color;
        return GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => it['screen'] as Widget),
            );
          },
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF131C2E) : Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: col.withOpacity(isDark ? 0.35 : 0.2),
                width: 1.2,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(isDark ? 0.25 : 0.03),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: col.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(it['icon'] as IconData, color: col, size: 20),
                    ),
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
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      it['title'] as String,
                      style: GoogleFonts.outfit(
                        color: context.titleColor,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      it['desc'] as String,
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 9.5,
                        height: 1.2,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ── 5. MATERI SIDANG CLUSTER (PDF) ────────────────────────────────────────
  Widget _buildMateriSidangCluster(BuildContext context, bool isDark) {
    final subSidangs = [
      {
        'title': 'Sidang Madin',
        'desc': 'Kurikulum & KKM',
        'icon': Icons.menu_book_rounded,
        'color': const Color(0xFF3B82F6),
        'index': 0,
      },
      {
        'title': 'Sidang PMQ',
        'desc': 'Tahfidz & Tartil',
        'icon': Icons.auto_stories_rounded,
        'color': const Color(0xFF10B981),
        'index': 1,
      },
      {
        'title': 'Sidang Pondok',
        'desc': 'Tata Tertib & Qonun',
        'icon': Icons.account_balance_rounded,
        'color': const Color(0xFFF59E0B),
        'index': 2,
      },
      {
        'title': 'Sidang Haflah',
        'desc': 'SK Wisuda & RAB',
        'icon': Icons.celebration_rounded,
        'color': const Color(0xFFEC4899),
        'index': 3,
      },
    ];

    Widget buildCard(Map<String, dynamic> item) {
      final Color col = item['color'] as Color;
      return Expanded(
        child: GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => MateriSidangScreen(
                  initialTabIndex: item['index'] as int,
                ),
              ),
            );
          },
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF131C2E) : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: col.withOpacity(isDark ? 0.35 : 0.22),
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
                      child: Icon(item['icon'] as IconData, color: col, size: 22),
                    ),
                    Icon(Icons.arrow_forward_rounded, size: 16, color: col),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  item['title'] as String,
                  style: GoogleFonts.outfit(
                    color: context.titleColor,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  item['desc'] as String,
                  style: GoogleFonts.outfit(
                    color: context.subTitleColor,
                    fontSize: 10.5,
                    height: 1.3,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Column(
      children: [
        Row(
          children: [
            buildCard(subSidangs[0]),
            const SizedBox(width: 10),
            buildCard(subSidangs[1]),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            buildCard(subSidangs[2]),
            const SizedBox(width: 10),
            buildCard(subSidangs[3]),
          ],
        ),
      ],
    );
  }

  // ── 6. INVENTARIS CLUSTER ──────────────────────────────────────────────────
  Widget _buildInventarisCluster(BuildContext context, bool isDark) {
    final items = [
      {
        'title': 'Inventaris Pesantren',
        'desc': 'Aset & sarana prasarana umum Pondok Pesantren.',
        'icon': Icons.domain_rounded,
        'badge': 'Pondok',
        'color': const Color(0xFFF59E0B),
        'index': 0,
      },
      {
        'title': 'Inventaris Madin',
        'desc': 'Fasilitas pembelajaran & kelas Madrasah Diniyah.',
        'icon': Icons.school_rounded,
        'badge': 'Madin',
        'color': const Color(0xFF10B981),
        'index': 1,
      },
      {
        'title': 'Inventaris PMQ',
        'desc': 'Sarana pendidikan & mushaf Al-Qur\'an PMQ.',
        'icon': Icons.menu_book_rounded,
        'badge': 'PMQ',
        'color': const Color(0xFF3B82F6),
        'index': 2,
      },
    ];

    return Row(
      children: items.map((it) {
        final Color col = it['color'] as Color;
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => InventarisScreen(initialIndex: it['index'] as int),
                  ),
                );
              },
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF131C2E) : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: col.withOpacity(isDark ? 0.35 : 0.22),
                    width: 1.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(isDark ? 0.25 : 0.03),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
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
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: col.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(it['icon'] as IconData, color: col, size: 18),
                        ),
                        Icon(Icons.arrow_forward_rounded, size: 13, color: col),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      it['title'] as String,
                      style: GoogleFonts.outfit(
                        color: context.titleColor,
                        fontSize: 12.5,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      it['desc'] as String,
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 9.5,
                        height: 1.25,
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
