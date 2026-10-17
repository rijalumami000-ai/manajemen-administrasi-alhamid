import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/theme_manager.dart';
import 'scan_kartu_ujian_screen.dart';
import 'jadwal_pelajaran_screen.dart';
import 'tim_soal_screen.dart';
import 'input_nilai_screen.dart';
import 'laporan_akademik_screen.dart';
import 'input_absensi_screen.dart';
import 'laporan_absensi_screen.dart';
import 'password_gate_dialog.dart';
import '../widgets/muhafadzoh_info_bottom_sheet.dart';
import '../widgets/qiroah_maqro_bottom_sheet.dart';
import '../widgets/taftisy_materi_bottom_sheet.dart';
import '../widgets/ujian_tulis_materi_bottom_sheet.dart';
import 'kalender_akademik_screen.dart';
import 'silabus_pembelajaran_screen.dart';
import 'laporan_pelanggaran_prestasi_screen.dart';
import 'input_pelanggaran_prestasi_screen.dart';
import 'jadwal_khusus_screen.dart';

class TabAkademik extends StatefulWidget {
  const TabAkademik({super.key});

  @override
  State<TabAkademik> createState() => _TabAkademikState();
}

class _TabAkademikState extends State<TabAkademik> {
  String _selectedCategory = 'Jadwal';

  final List<String> _categories = [
    'Jadwal',
    'Laporan',
    'Info Ujian & Target',
    'Master Input',
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
                        "Layanan Akademik",
                        style: GoogleFonts.outfit(
                          color: context.titleColor,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Portal terpadu penilaian, penjadwalan, laporan, & target kurikulum.",
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
                    color: const Color(0xFF10B981).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.school_rounded, color: Color(0xFF10B981), size: 24),
                ),
              ],
            ),
            const SizedBox(height: 18),

            // Quick Filter Chips
            _buildFilterChips(isDark),
            const SizedBox(height: 24),

            // 1. CLUSTER: JADWAL-JADWAL
            if (_shouldShowCluster('Jadwal')) ...[
              _buildSectionHeader(
                title: "Jadwal & Agenda Kegiatan",
                subtitle: "Jadwal pelajaran KBM, kajian Romadhon & imam tarawih",
                icon: Icons.calendar_month_rounded,
                color: const Color(0xFF10B981),
                isDark: isDark,
              ),
              const SizedBox(height: 14),
              _buildJadwalCluster(context, isDark),
              const SizedBox(height: 28),
            ],

            // 2. CLUSTER: LAPORAN-LAPORAN
            if (_shouldShowCluster('Laporan')) ...[
              _buildSectionHeader(
                title: "Laporan & Rekapitulasi",
                subtitle: "Hasil evaluasi belajar, kehadiran, pelanggaran & prestasi",
                icon: Icons.analytics_rounded,
                color: const Color(0xFF6366F1),
                isDark: isDark,
              ),
              const SizedBox(height: 14),
              _buildLaporanCluster(context, isDark),
              const SizedBox(height: 28),
            ],

            // 3. CLUSTER: INFORMASI UJIAN & TARGET AKADEMIK
            if (_shouldShowCluster('Info Ujian & Target')) ...[
              _buildSectionHeader(
                title: "Informasi Ujian & Target Akademik",
                subtitle: "Standarisasi materi, silabus, maqro, dan kalender",
                icon: Icons.auto_stories_rounded,
                color: const Color(0xFF8B5CF6),
                isDark: isDark,
              ),
              const SizedBox(height: 4),
              _buildInfoUjianCluster(context, isDark),
              const SizedBox(height: 24),
            ],

            // 4. CLUSTER: MASTER INPUT
            if (_shouldShowCluster('Master Input')) ...[
              _buildSectionHeader(
                title: "Master Input Nilai & Absensi",
                subtitle: "Entri harian ujian, absensi santri & verifikasi kartu",
                icon: Icons.border_color_rounded,
                color: const Color(0xFFF97316),
                isDark: isDark,
              ),
              const SizedBox(height: 4),
              _buildMasterInputGrid(context, isDark),
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
              selectedColor: const Color(0xFF10B981).withOpacity(0.18),
              labelStyle: GoogleFonts.outfit(
                color: isSelected ? const Color(0xFF10B981) : context.subTitleColor,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                fontSize: 12,
              ),
              backgroundColor: isDark ? const Color(0xFF131C2E) : Colors.white,
              side: BorderSide(
                color: isSelected
                    ? const Color(0xFF10B981)
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

  // ── 1. MASTER INPUT GRID ──────────────────────────────────────────────────
  Widget _buildMasterInputGrid(BuildContext context, bool isDark) {
    final items = [
      {
        'title': 'Tim Soal',
        'desc': 'Kelola bank soal ujian per kelas & mapel.',
        'icon': Icons.edit_note_rounded,
        'badge': 'Protected',
        'color': const Color(0xFFEC4899),
        'password': 'timsoal123',
        'screen': const TimSoalScreen(),
      },
      {
        'title': 'Input Nilai',
        'desc': 'Input nilai Muhafadzoh, Qiroah, Taftisy, Ujian.',
        'icon': Icons.border_color_rounded,
        'badge': 'Protected',
        'color': const Color(0xFFF97316),
        'password': 'inputnilai123',
        'screen': const InputNilaiScreen(),
      },
      {
        'title': 'Input Absensi',
        'desc': 'Rekapitulasi Sakit, Izin, & Alpa bulanan.',
        'icon': Icons.fact_check_rounded,
        'badge': 'Protected',
        'color': const Color(0xFF10B981),
        'password': 'absen123',
        'screen': const InputAbsensiScreen(),
      },
      {
        'title': 'Pelanggaran & Prestasi',
        'desc': 'Catat kedisiplinan & piagam prestasi santri.',
        'icon': Icons.gavel_rounded,
        'badge': 'Protected',
        'color': const Color(0xFFE11D48),
        'password': 'pelanggaran123',
        'screen': const InputPelanggaranPrestasiScreen(),
      },
      {
        'title': 'Scan Kartu Ujian',
        'desc': 'Pindai QR Code atau verifikasi nomor kartu.',
        'icon': Icons.qr_code_scanner_rounded,
        'badge': 'QR Scanner',
        'color': const Color(0xFF3B82F6),
        'screen': const ScanKartuUjianScreen(),
      },
    ];

    final filtered = items;

    if (filtered.isEmpty) {
      return _buildNoMatchText();
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      itemCount: filtered.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 14,
        crossAxisSpacing: 14,
        childAspectRatio: 0.95,
      ),
      itemBuilder: (context, index) {
        final it = filtered[index];
        final Color col = it['color'] as Color;
        final hasPw = it.containsKey('password');

        return GestureDetector(
          onTap: () async {
            if (hasPw) {
              final auth = await showDialog<bool>(
                context: context,
                builder: (context) => PasswordGateDialog(
                  title: "Verifikasi Sandi",
                  correctPassword: it['password'] as String,
                  menuName: it['title'] as String,
                ),
              );
              if (auth == true && context.mounted) {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => it['screen'] as Widget),
                );
              }
            } else {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => it['screen'] as Widget),
              );
            }
          },
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF131C2E) : Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: col.withOpacity(isDark ? 0.32 : 0.22),
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
                      padding: const EdgeInsets.all(9),
                      decoration: BoxDecoration(
                        color: col.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(it['icon'] as IconData, color: col, size: 20),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        color: col.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            hasPw ? Icons.lock_rounded : Icons.qr_code_scanner_rounded,
                            size: 11,
                            color: col,
                          ),
                          const SizedBox(width: 3),
                          Text(
                            hasPw ? "PIN" : "QR",
                            style: GoogleFonts.outfit(
                              fontSize: 9.5,
                              fontWeight: FontWeight.bold,
                              color: col,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const Spacer(),
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
                    fontSize: 10,
                    height: 1.3,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ── 2. LAPORAN CLUSTER ────────────────────────────────────────────────────
  Widget _buildLaporanCluster(BuildContext context, bool isDark) {
    final list = [
      {
        'title': 'Laporan Akademik Siswa',
        'desc': 'Rekapitulasi lengkap nilai Muhafadzoh, Qiroah, Taftisy, Ujian Tulis, dan Rapor per kelas.',
        'icon': Icons.table_chart_rounded,
        'badge': 'Rapor Lengkap',
        'isHero': true,
        'color': const Color(0xFF6366F1),
        'screen': const LaporanAkademikScreen(),
      },
      {
        'title': 'Laporan Absensi Santri',
        'desc': 'Rekapitulasi kehadiran Sakit, Izin, dan Alpa santri per kelas & semester.',
        'icon': Icons.assignment_rounded,
        'badge': 'Presensi',
        'color': const Color(0xFF0EA5E9),
        'screen': const LaporanAbsensiScreen(),
      },
      {
        'title': 'Laporan Pelanggaran Santri',
        'desc': 'Catatan poin ketertiban, disiplin ubudiyah, serta takzir edukatif.',
        'icon': Icons.warning_amber_rounded,
        'badge': 'Kedisiplinan',
        'color': const Color(0xFFEF4444),
        'screen': const LaporanPelanggaranPrestasiScreen(initialTabIndex: 0),
      },
      {
        'title': 'Laporan Prestasi Santri',
        'desc': 'Rekap prestasi santri dalam kejuaraan MQK, Tahfidz, pidato & wisuda.',
        'icon': Icons.emoji_events_rounded,
        'badge': 'Juara & Piagam',
        'color': const Color(0xFFF59E0B),
        'screen': const LaporanPelanggaranPrestasiScreen(initialTabIndex: 1),
      },
    ];

    final filtered = list;

    if (filtered.isEmpty) {
      return _buildNoMatchText();
    }

    return Column(
      children: filtered.map((it) {
        final bool isHero = it['isHero'] == true;
        final Color col = it['color'] as Color;

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          child: GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => it['screen'] as Widget),
              );
            },
            child: Container(
              padding: EdgeInsets.all(isHero ? 18 : 16),
              decoration: BoxDecoration(
                gradient: isHero
                    ? LinearGradient(
                        colors: isDark
                            ? [const Color(0xFF312E81), const Color(0xFF0F172A)]
                            : [const Color(0xFFEEF2FF), const Color(0xFFE0E7FF)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                color: isHero ? null : (isDark ? const Color(0xFF131C2E) : Colors.white),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: col.withOpacity(isHero ? 0.5 : (isDark ? 0.25 : 0.15)),
                  width: isHero ? 1.5 : 1.0,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(isDark ? 0.25 : 0.03),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isHero
                          ? (isDark ? Colors.white10 : Colors.white)
                          : col.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(it['icon'] as IconData, color: col, size: 24),
                  ),
                  const SizedBox(width: 16),
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
                        const SizedBox(height: 4),
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

  // ── 3. JADWAL CLUSTER ─────────────────────────────────────────────────────
  Widget _buildJadwalCluster(BuildContext context, bool isDark) {
    final list = [
      {
        'title': 'Jadwal Pelajaran Diniyah',
        'desc': 'Jadwal KBM aktif mingguan, guru pengampu & ruang kelas santri.',
        'icon': Icons.calendar_today_rounded,
        'badge': 'KBM Reguler',
        'color': const Color(0xFF10B981),
        'screen': const JadwalPelajaranScreen(),
      },
      {
        'title': 'Jadwal Kajian Balagh Romadhon',
        'desc': 'Khataman Kitab Kuning Kilatan Ramadhan bersama Masyayikh & Asatidz.',
        'icon': Icons.menu_book_rounded,
        'badge': 'Kajian Romadhon',
        'color': const Color(0xFF059669),
        'screen': const JadwalKhususScreen(initialTabIndex: 0),
      },
      {
        'title': 'Jadwal Imam Tarawih & Bilal',
        'desc': 'Daftar imam sholat Isya\', Tarawih, Bilal, dan juz tilawah per malam.',
        'icon': Icons.mosque_rounded,
        'badge': 'Sholat Tarawih',
        'color': const Color(0xFF0D9488),
        'screen': const JadwalKhususScreen(initialTabIndex: 1),
      },
    ];

    final filtered = list;

    if (filtered.isEmpty) {
      return _buildNoMatchText();
    }

    return Column(
      children: filtered.map((it) {
        final Color col = it['color'] as Color;

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
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
                  color: col.withOpacity(isDark ? 0.3 : 0.2),
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
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: col.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(it['icon'] as IconData, color: col, size: 24),
                  ),
                  const SizedBox(width: 16),
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
                        const SizedBox(height: 4),
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

  // ── 4. INFORMASI UJIAN & TARGET AKADEMIK ──────────────────────────────────
  Widget _buildInfoUjianCluster(BuildContext context, bool isDark) {
    final list = [
      {
        'title': 'Ketentuan Muhafadzoh',
        'desc': 'Pedoman kriteria & rentang nilai hafalan bait.',
        'icon': Icons.menu_book_rounded,
        'color': const Color(0xFF10B981),
        'onTap': () => MuhafadzohInfoBottomSheet.show(context),
      },
      {
        'title': 'Maqro Qiroah',
        'desc': 'Bahan acuan bacaan Ujian Qiroatul Kitab.',
        'icon': Icons.chrome_reader_mode_rounded,
        'color': const Color(0xFFF97316),
        'onTap': () => QiroahMaqroBottomSheet.show(context),
      },
      {
        'title': 'Batasan Taftisy',
        'desc': 'Batasan materi & halaman Ujian Taftisyul Kutub.',
        'icon': Icons.library_books_rounded,
        'color': const Color(0xFF8B5CF6),
        'onTap': () => TaftisyMateriBottomSheet.show(context),
      },
      {
        'title': 'Materi Ujian Tulis',
        'desc': 'Batasan materi Ujian Tulis per tingkatan kelas.',
        'icon': Icons.border_color_rounded,
        'color': const Color(0xFF3B82F6),
        'onTap': () => UjianTulisMateriBottomSheet.show(context),
      },
      {
        'title': 'Kalender Akademik',
        'desc': 'Jadwal agenda kegiatan, libur, dan pekan ujian.',
        'icon': Icons.calendar_month_rounded,
        'color': const Color(0xFF14B8A6),
        'onTap': () => Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const KalenderAkademikScreen()),
        ),
      },
      {
        'title': 'Silabus Pembelajaran',
        'desc': 'Dokumen silabus kurikulum santri per fan mapel.',
        'icon': Icons.import_contacts_rounded,
        'color': const Color(0xFFEC4899),
        'onTap': () => Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const SilabusPembelajaranScreen()),
        ),
      },
    ];

    final filtered = list;

    if (filtered.isEmpty) {
      return _buildNoMatchText();
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      itemCount: filtered.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 14,
        crossAxisSpacing: 14,
        childAspectRatio: 1.05,
      ),
      itemBuilder: (context, index) {
        final it = filtered[index];
        final Color col = it['color'] as Color;

        return GestureDetector(
          onTap: it['onTap'] as VoidCallback,
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF131C2E) : Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: col.withOpacity(isDark ? 0.32 : 0.22),
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
                      padding: const EdgeInsets.all(9),
                      decoration: BoxDecoration(
                        color: col.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(it['icon'] as IconData, color: col, size: 20),
                    ),
                    Icon(
                      Icons.arrow_forward_rounded,
                      color: col.withOpacity(0.8),
                      size: 14,
                    ),
                  ],
                ),
                const Spacer(),
                Text(
                  it['title'] as String,
                  style: GoogleFonts.outfit(
                    color: context.titleColor,
                    fontSize: 13.5,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 3),
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
        );
      },
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
