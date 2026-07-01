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

class TabAkademik extends StatelessWidget {
  const TabAkademik({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;

    // Featured Item (Laporan Akademik Siswa) - Full Width
    final featuredItem = {
      'title': 'Laporan Akademik Siswa',
      'desc': 'Tampilkan nilai & rapor seluruh santri dalam satu kelas sekaligus: Muhafadzoh, Qiroah, Taftisy, Ujian Tulis, Absensi, Kepribadian, dan Rapor.',
      'icon': Icons.table_chart_rounded,
      'colors': isDark
          ? [const Color(0xFF312E81), const Color(0xFF0F172A)]
          : [const Color(0xFFEEF2FF), const Color(0xFFE0E7FF)],
      'borderColor': isDark
          ? const Color(0xFF818CF8).withOpacity(0.3)
          : const Color(0xFF6366F1).withOpacity(0.4),
      'textColor': isDark ? const Color(0xFFA5B4FC) : const Color(0xFF4338CA),
      'headingColor': isDark ? Colors.white : const Color(0xFF312E81),
      'bodyColor': isDark ? Colors.white.withOpacity(0.6) : const Color(0xFF312E81).withOpacity(0.8),
      'iconColor': isDark ? Colors.white : const Color(0xFF6366F1),
      'screen': const LaporanAkademikScreen(),
    };

    // Jadwal Pelajaran Item - Full Width
    final jadwalItem = {
      'title': 'Jadwal Pelajaran',
      'desc': 'Cari jadwal KBM harian dan mingguan per kelas aktif.',
      'icon': Icons.calendar_today_rounded,
      'colors': isDark
          ? [const Color(0xFF065F46), const Color(0xFF0F172A)]
          : [const Color(0xFFECFDF5), const Color(0xFFD1FAE5)],
      'borderColor': isDark
          ? const Color(0xFF10B981).withOpacity(0.25)
          : const Color(0xFF10B981).withOpacity(0.4),
      'textColor': isDark ? const Color(0xFF34D399) : const Color(0xFF065F46),
      'headingColor': isDark ? Colors.white : const Color(0xFF065F46),
      'bodyColor': isDark ? Colors.white.withOpacity(0.6) : const Color(0xFF064E3B).withOpacity(0.8),
      'iconColor': isDark ? Colors.white : const Color(0xFF10B981),
      'screen': const JadwalPelajaranScreen(),
    };

    // Laporan Absensi Item - Full Width
    final laporanAbsensiItem = {
      'title': 'Laporan Absensi Santri',
      'desc': 'Rekapitulasi absensi santri per kelas, bulan, dan semester.',
      'icon': Icons.assignment_rounded,
      'colors': isDark
          ? [const Color(0xFF1F2937), const Color(0xFF0F172A)]
          : [const Color(0xFFF8FAFC), const Color(0xFFE2E8F0)],
      'borderColor': isDark
          ? const Color(0xFF64748B).withOpacity(0.25)
          : const Color(0xFF64748B).withOpacity(0.4),
      'textColor': isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569),
      'headingColor': isDark ? Colors.white : const Color(0xFF334155),
      'bodyColor': isDark ? Colors.white.withOpacity(0.6) : const Color(0xFF475569).withOpacity(0.8),
      'iconColor': isDark ? Colors.white : const Color(0xFF64748B),
      'screen': const LaporanAbsensiScreen(),
    };

    // Sub Items Row 1 (Tim Soal & Input Nilai)
    final subItemsRow1 = [
      {
        'title': 'Tim Soal',
        'desc': 'Kelola bank soal ujian per kelas & mapel.',
        'icon': Icons.edit_note_rounded,
        'colors': isDark
            ? [const Color(0xFF831843), const Color(0xFF0F172A)]
            : [const Color(0xFFFDF2F8), const Color(0xFFFCE7F3)],
        'borderColor': isDark
            ? const Color(0xFFEC4899).withOpacity(0.25)
            : const Color(0xFFEC4899).withOpacity(0.4),
        'textColor': isDark ? const Color(0xFFF472B6) : const Color(0xFFBE185D),
        'headingColor': isDark ? Colors.white : const Color(0xFFBE185D),
        'bodyColor': isDark ? Colors.white.withOpacity(0.5) : const Color(0xFF831843).withOpacity(0.8),
        'iconColor': isDark ? Colors.white : const Color(0xFFEC4899),
        'password': 'timsoal123',
        'screen': const TimSoalScreen(),
      },
      {
        'title': 'Input Nilai',
        'desc': 'Input nilai Muhafadzoh, Qiroah, Taftisy, & Ujian.',
        'icon': Icons.border_color_rounded,
        'colors': isDark
            ? [const Color(0xFF7C2D12), const Color(0xFF0F172A)]
            : [const Color(0xFFFFF7ED), const Color(0xFFFFEDD5)],
        'borderColor': isDark
            ? const Color(0xFFF97316).withOpacity(0.25)
            : const Color(0xFFF97316).withOpacity(0.4),
        'textColor': isDark ? const Color(0xFFFB923C) : const Color(0xFFC2410C),
        'headingColor': isDark ? Colors.white : const Color(0xFFC2410C),
        'bodyColor': isDark ? Colors.white.withOpacity(0.5) : const Color(0xFF7C2D12).withOpacity(0.8),
        'iconColor': isDark ? Colors.white : const Color(0xFFF97316),
        'password': 'inputnilai123',
        'screen': const InputNilaiScreen(),
      },
    ];

    // Sub Items Row 2 (Scan Kartu Ujian & Input Absensi)
    final subItemsRow2 = [
      {
        'title': 'Scan Kartu Ujian',
        'desc': 'Pindai QR Code atau verifikasi nomor kartu ujian.',
        'icon': Icons.qr_code_scanner_rounded,
        'colors': isDark
            ? [const Color(0xFF1E3A8A), const Color(0xFF0F172A)]
            : [const Color(0xFFEFF6FF), const Color(0xFFDBEAFE)],
        'borderColor': isDark
            ? const Color(0xFF3B82F6).withOpacity(0.25)
            : const Color(0xFF3B82F6).withOpacity(0.4),
        'textColor': isDark ? const Color(0xFF60A5FA) : const Color(0xFF1E40AF),
        'headingColor': isDark ? Colors.white : const Color(0xFF1E40AF),
        'bodyColor': isDark ? Colors.white.withOpacity(0.5) : const Color(0xFF1E3A8A).withOpacity(0.8),
        'iconColor': isDark ? Colors.white : const Color(0xFF3B82F6),
        'screen': const ScanKartuUjianScreen(),
      },
      {
        'title': 'Input Absensi',
        'desc': 'Input data Sakit, Izin, & Alpa bulanan.',
        'icon': Icons.fact_check_rounded,
        'colors': isDark
            ? [const Color(0xFF065F46), const Color(0xFF0F172A)]
            : [const Color(0xFFECFDF5), const Color(0xFFD1FAE5)],
        'borderColor': isDark
            ? const Color(0xFF10B981).withOpacity(0.25)
            : const Color(0xFF10B981).withOpacity(0.4),
        'textColor': isDark ? const Color(0xFF34D399) : const Color(0xFF065F46),
        'headingColor': isDark ? Colors.white : const Color(0xFF065F46),
        'bodyColor': isDark ? Colors.white.withOpacity(0.5) : const Color(0xFF064E3B).withOpacity(0.8),
        'iconColor': isDark ? Colors.white : const Color(0xFF10B981),
        'password': 'absen123',
        'screen': const InputAbsensiScreen(),
      },
    ];

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Section
            Text(
              "Layanan Akademik",
              style: GoogleFonts.outfit(
                color: context.titleColor,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              "Akses portal data santri, jadwal pelajaran, dan ujian.",
              style: GoogleFonts.outfit(
                color: context.subTitleColor,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 24),

            // 1. FEATURED CARD (Laporan Akademik Siswa) - Full Width
            GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => featuredItem['screen'] as Widget),
                );
              },
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: featuredItem['colors'] as List<Color>,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(22),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(isDark ? 0.3 : 0.04),
                      blurRadius: 12,
                      offset: const Offset(0, 5),
                    ),
                  ],
                  border: Border.all(
                    color: featuredItem['borderColor'] as Color,
                    width: 1.5,
                  ),
                ),
                padding: const EdgeInsets.all(22),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withOpacity(0.06) : Colors.white.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(16),
                        border: isDark ? null : Border.all(color: Colors.white, width: 1.5),
                      ),
                      child: Icon(
                        featuredItem['icon'] as IconData,
                        color: featuredItem['iconColor'] as Color,
                        size: 32,
                      ),
                    ),
                    const SizedBox(width: 18),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            featuredItem['title'] as String,
                            style: GoogleFonts.outfit(
                              color: featuredItem['headingColor'] as Color,
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            featuredItem['desc'] as String,
                            style: GoogleFonts.outfit(
                              color: featuredItem['bodyColor'] as Color,
                              fontSize: 11,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Text(
                                "Buka Laporan",
                                style: GoogleFonts.outfit(
                                  color: featuredItem['textColor'] as Color,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Icon(
                                Icons.arrow_forward_rounded,
                                color: featuredItem['textColor'] as Color,
                                size: 13,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // 2. JADWAL PELAJARAN CARD (Full Width)
            GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => jadwalItem['screen'] as Widget),
                );
              },
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: jadwalItem['colors'] as List<Color>,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(22),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(isDark ? 0.3 : 0.04),
                      blurRadius: 12,
                      offset: const Offset(0, 5),
                    ),
                  ],
                  border: Border.all(
                    color: jadwalItem['borderColor'] as Color,
                    width: 1.5,
                  ),
                ),
                padding: const EdgeInsets.all(22),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withOpacity(0.06) : Colors.white.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(16),
                        border: isDark ? null : Border.all(color: Colors.white, width: 1.5),
                      ),
                      child: Icon(
                        jadwalItem['icon'] as IconData,
                        color: jadwalItem['iconColor'] as Color,
                        size: 32,
                      ),
                    ),
                    const SizedBox(width: 18),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            jadwalItem['title'] as String,
                            style: GoogleFonts.outfit(
                              color: jadwalItem['headingColor'] as Color,
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            jadwalItem['desc'] as String,
                            style: GoogleFonts.outfit(
                              color: jadwalItem['bodyColor'] as Color,
                              fontSize: 11,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Text(
                                "Buka Jadwal",
                                style: GoogleFonts.outfit(
                                  color: jadwalItem['textColor'] as Color,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Icon(
                                Icons.arrow_forward_rounded,
                                color: jadwalItem['textColor'] as Color,
                                size: 13,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // 3. LAPORAN ABSENSI CARD (Full Width)
            GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => laporanAbsensiItem['screen'] as Widget),
                );
              },
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: laporanAbsensiItem['colors'] as List<Color>,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(22),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(isDark ? 0.3 : 0.04),
                      blurRadius: 12,
                      offset: const Offset(0, 5),
                    ),
                  ],
                  border: Border.all(
                    color: laporanAbsensiItem['borderColor'] as Color,
                    width: 1.5,
                  ),
                ),
                padding: const EdgeInsets.all(22),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withOpacity(0.06) : Colors.white.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(16),
                        border: isDark ? null : Border.all(color: Colors.white, width: 1.5),
                      ),
                      child: Icon(
                        laporanAbsensiItem['icon'] as IconData,
                        color: laporanAbsensiItem['iconColor'] as Color,
                        size: 32,
                      ),
                    ),
                    const SizedBox(width: 18),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            laporanAbsensiItem['title'] as String,
                            style: GoogleFonts.outfit(
                              color: laporanAbsensiItem['headingColor'] as Color,
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            laporanAbsensiItem['desc'] as String,
                            style: GoogleFonts.outfit(
                              color: laporanAbsensiItem['bodyColor'] as Color,
                              fontSize: 11,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Text(
                                "Buka Absensi",
                                style: GoogleFonts.outfit(
                                  color: laporanAbsensiItem['textColor'] as Color,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Icon(
                                Icons.arrow_forward_rounded,
                                color: laporanAbsensiItem['textColor'] as Color,
                                size: 13,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // 4. SUB ITEMS ROW 1 (Tim Soal & Input Nilai)
            Row(
              children: [
                Expanded(child: _buildSubItem(context, subItemsRow1[0], isDark, isLeft: true)),
                const SizedBox(width: 14),
                Expanded(child: _buildSubItem(context, subItemsRow1[1], isDark, isLeft: false)),
              ],
            ),
            const SizedBox(height: 14),

            // 5. SUB ITEMS ROW 2 (Scan Kartu Ujian & Input Absensi)
            Row(
              children: [
                Expanded(child: _buildSubItem(context, subItemsRow2[0], isDark, isLeft: true)),
                const SizedBox(width: 14),
                Expanded(child: _buildSubItem(context, subItemsRow2[1], isDark, isLeft: false)),
              ],
            ),
            const SizedBox(height: 24),

            Text(
              "INFORMASI UJIAN",
              style: GoogleFonts.outfit(
                color: context.subTitleColor,
                fontSize: 11,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.5,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildInfoBoxItem(
                    context: context,
                    title: 'Ketentuan Muhafadzoh',
                    desc: 'Informasi ketentuan & rentang kriteria nilai Ujian Muhafadzoh.',
                    icon: Icons.info_outline_rounded,
                    colors: isDark
                        ? [const Color(0xFF065F46), const Color(0xFF0F172A)]
                        : [const Color(0xFFE6F4EA), const Color(0xFFCEEAD6)],
                    borderColor: isDark
                        ? const Color(0xFF10B981).withOpacity(0.25)
                        : const Color(0xFF10B981).withOpacity(0.4),
                    textColor: isDark ? const Color(0xFF34D399) : const Color(0xFF065F46),
                    headingColor: isDark ? Colors.white : const Color(0xFF065F46),
                    bodyColor: isDark ? Colors.white.withOpacity(0.6) : const Color(0xFF064E3B).withOpacity(0.8),
                    iconColor: isDark ? Colors.white : const Color(0xFF10B981),
                    isDark: isDark,
                    onTap: () => MuhafadzohInfoBottomSheet.show(context),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildInfoBoxItem(
                    context: context,
                    title: 'Maqro Qiroah',
                    desc: 'Daftar acuan bahan bacaan (Maqro) Ujian Qiroatul Kitab.',
                    icon: Icons.chrome_reader_mode_rounded,
                    colors: isDark
                        ? [const Color(0xFF7C2D12), const Color(0xFF0F172A)]
                        : [const Color(0xFFFFF7ED), const Color(0xFFFFEDD5)],
                    borderColor: isDark
                        ? const Color(0xFFF97316).withOpacity(0.25)
                        : const Color(0xFFF97316).withOpacity(0.4),
                    textColor: isDark ? const Color(0xFFFB923C) : const Color(0xFF7C2D12),
                    headingColor: isDark ? Colors.white : const Color(0xFF7C2D12),
                    bodyColor: isDark ? Colors.white.withOpacity(0.6) : const Color(0xFF7C2D12).withOpacity(0.8),
                    iconColor: isDark ? Colors.white : const Color(0xFFF97316),
                    isDark: isDark,
                    onTap: () => QiroahMaqroBottomSheet.show(context),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildInfoBoxItem(
                    context: context,
                    title: 'Batasan Taftisy',
                    desc: 'Daftar acuan batasan materi dan halaman Ujian Taftisyul Kutub.',
                    icon: Icons.menu_book_rounded,
                    colors: isDark
                        ? [const Color(0xFF5B21B6), const Color(0xFF0F172A)]
                        : [const Color(0xFFF3E8FF), const Color(0xFFE9D5FF)],
                    borderColor: isDark
                        ? const Color(0xFF8B5CF6).withOpacity(0.25)
                        : const Color(0xFF8B5CF6).withOpacity(0.4),
                    textColor: isDark ? const Color(0xFFA78BFA) : const Color(0xFF5B21B6),
                    headingColor: isDark ? Colors.white : const Color(0xFF5B21B6),
                    bodyColor: isDark ? Colors.white.withOpacity(0.6) : const Color(0xFF5B21B6).withOpacity(0.8),
                    iconColor: isDark ? Colors.white : const Color(0xFF8B5CF6),
                    isDark: isDark,
                    onTap: () => TaftisyMateriBottomSheet.show(context),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildInfoBoxItem(
                    context: context,
                    title: 'Materi Ujian Tulis',
                    desc: 'Daftar acuan batasan materi Ujian Tulis reguler per kelas.',
                    icon: Icons.border_color_rounded,
                    colors: isDark
                        ? [const Color(0xFF1E3A8A), const Color(0xFF0F172A)]
                        : [const Color(0xFFEFF6FF), const Color(0xFFDBEAFE)],
                    borderColor: isDark
                        ? const Color(0xFF3B82F6).withOpacity(0.25)
                        : const Color(0xFF3B82F6).withOpacity(0.4),
                    textColor: isDark ? const Color(0xFF60A5FA) : const Color(0xFF1E40AF),
                    headingColor: isDark ? Colors.white : const Color(0xFF1E40AF),
                    bodyColor: isDark ? Colors.white.withOpacity(0.6) : const Color(0xFF1E40AF).withOpacity(0.8),
                    iconColor: isDark ? Colors.white : const Color(0xFF3B82F6),
                    isDark: isDark,
                    onTap: () => UjianTulisMateriBottomSheet.show(context),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Kalender Akademik - Full Width card
            GestureDetector(
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const KalenderAkademikScreen(),
                ),
              ),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isDark
                        ? [const Color(0xFF134E4A), const Color(0xFF0F172A)]
                        : [const Color(0xFFECFDF5), const Color(0xFFF0FDF4)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(
                    color: isDark
                        ? const Color(0xFF10B981).withOpacity(0.25)
                        : const Color(0xFF10B981).withOpacity(0.35),
                    width: 1.5,
                  ),
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
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark
                            ? Colors.white.withOpacity(0.06)
                            : Colors.white.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(14),
                        border: isDark ? null : Border.all(color: Colors.white, width: 1.5),
                      ),
                      child: Icon(
                        Icons.calendar_month_rounded,
                        color: isDark ? Colors.white : const Color(0xFF10B981),
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Kalender Akademik',
                            style: GoogleFonts.outfit(
                              color: isDark ? Colors.white : const Color(0xFF065F46),
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Lihat jadwal & agenda kegiatan akademik semester Ganjil & Genap.',
                            style: GoogleFonts.outfit(
                              color: isDark
                                  ? Colors.white.withOpacity(0.6)
                                  : const Color(0xFF065F46).withOpacity(0.75),
                              fontSize: 11,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Text(
                                'Lihat Kalender',
                                style: GoogleFonts.outfit(
                                  color: isDark
                                      ? const Color(0xFF34D399)
                                      : const Color(0xFF065F46),
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Icon(
                                Icons.arrow_forward_rounded,
                                color: isDark
                                    ? const Color(0xFF34D399)
                                    : const Color(0xFF065F46),
                                size: 12,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Silabus Pembelajaran - Full Width card
            GestureDetector(
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const SilabusPembelajaranScreen(),
                ),
              ),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isDark
                        ? [const Color(0xFF1E3A8A), const Color(0xFF0F172A)]
                        : [const Color(0xFFEFF6FF), const Color(0xFFDBEAFE)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(
                    color: isDark
                        ? const Color(0xFF3B82F6).withOpacity(0.25)
                        : const Color(0xFF3B82F6).withOpacity(0.4),
                    width: 1.5,
                  ),
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
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark
                            ? Colors.white.withOpacity(0.06)
                            : Colors.white.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(14),
                        border: isDark ? null : Border.all(color: Colors.white, width: 1.5),
                      ),
                      child: Icon(
                        Icons.menu_book_rounded,
                        color: isDark ? Colors.white : const Color(0xFF3B82F6),
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Silabus Pembelajaran',
                            style: GoogleFonts.outfit(
                              color: isDark ? Colors.white : const Color(0xFF1E3A8A),
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Lihat rencana & target materi pembelajaran bulanan kelas Diniyyah.',
                            style: GoogleFonts.outfit(
                              color: isDark
                                  ? Colors.white.withOpacity(0.6)
                                  : const Color(0xFF1E3A8A).withOpacity(0.75),
                              fontSize: 11,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Text(
                                'Lihat Silabus',
                                style: GoogleFonts.outfit(
                                  color: isDark
                                      ? const Color(0xFF60A5FA)
                                      : const Color(0xFF1E3A8A),
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Icon(
                                Icons.arrow_forward_rounded,
                                color: isDark
                                    ? const Color(0xFF60A5FA)
                                    : const Color(0xFF1E3A8A),
                                size: 12,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoBoxItem({
    required BuildContext context,
    required String title,
    required String desc,
    required IconData icon,
    required List<Color> colors,
    required Color borderColor,
    required Color textColor,
    required Color headingColor,
    required Color bodyColor,
    required Color iconColor,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 175,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: colors,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(isDark ? 0.25 : 0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
          border: Border.all(
            color: borderColor,
            width: 1.2,
          ),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withOpacity(0.06) : Colors.white.withOpacity(0.6),
                borderRadius: BorderRadius.circular(12),
                border: isDark ? null : Border.all(color: Colors.white, width: 1),
              ),
              child: Icon(
                icon,
                color: iconColor,
                size: 20,
              ),
            ),
            const Spacer(),
            Text(
              title,
              style: GoogleFonts.outfit(
                color: headingColor,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              desc,
              style: GoogleFonts.outfit(
                color: bodyColor,
                fontSize: 10,
                height: 1.3,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Text(
                  "Buka",
                  style: GoogleFonts.outfit(
                    color: textColor,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 4),
                Icon(
                  Icons.arrow_forward_rounded,
                  color: textColor,
                  size: 12,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubItem(BuildContext context, Map<String, dynamic> item, bool isDark, {required bool isLeft}) {
    return GestureDetector(
      onTap: () async {
        if (item.containsKey('password') && item['password'] != null) {
          final isOk = await showDialog<bool>(
            context: context,
            barrierDismissible: false,
            builder: (context) => PasswordGateDialog(
              title: "Akses Terkunci",
              correctPassword: item['password'] as String,
              menuName: item['title'] as String,
            ),
          );
          if (isOk != true) return;
        }

        if (context.mounted) {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => item['screen'] as Widget),
          );
        }
      },
      child: Container(
        height: 175,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: item['colors'] as List<Color>,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(isDark ? 0.25 : 0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
          border: Border.all(
            color: item['borderColor'] as Color,
            width: 1.2,
          ),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withOpacity(0.06) : Colors.white.withOpacity(0.6),
                borderRadius: BorderRadius.circular(12),
                border: isDark ? null : Border.all(color: Colors.white, width: 1),
              ),
              child: Icon(
                item['icon'] as IconData,
                color: item['iconColor'] as Color,
                size: 20,
              ),
            ),
            const Spacer(),
            // Title
            Text(
              item['title'] as String,
              style: GoogleFonts.outfit(
                color: item['headingColor'] as Color,
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            // Desc
            Text(
              item['desc'] as String,
              style: GoogleFonts.outfit(
                color: item['bodyColor'] as Color,
                fontSize: 10,
                height: 1.3,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
            // Button
            Row(
              children: [
                Text(
                  "Buka",
                  style: GoogleFonts.outfit(
                    color: item['textColor'] as Color,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 4),
                Icon(
                  Icons.arrow_forward_rounded,
                  color: item['textColor'] as Color,
                  size: 12,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
