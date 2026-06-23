import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/theme_manager.dart';
import 'jadwal_pelajaran_screen.dart';
import 'santri_explorer_screen.dart';
import 'struktur_organisasi_screen.dart';
import 'teacher_list_screen.dart';
import 'tim_soal_screen.dart';
import 'input_nilai_screen.dart';
import 'password_gate_dialog.dart';
import '../widgets/muhafadzoh_info_bottom_sheet.dart';
import '../widgets/qiroah_maqro_bottom_sheet.dart';

class TabAkademik extends StatelessWidget {
  const TabAkademik({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;

    // Featured Item (Profil & Nilai) - Full Width
    final featuredItem = {
      'title': 'Profil & Nilai Santri',
      'desc': 'Cari data profil lengkap santri, riwayat prestasi, pelanggaran, serta rekapitulasi nilai ujian per mata pelajaran.',
      'icon': Icons.badge_rounded,
      'colors': isDark
          ? [const Color(0xFF1E3A8A), const Color(0xFF0F172A)]
          : [const Color(0xFFEFF6FF), const Color(0xFFDBEAFE)],
      'borderColor': isDark
          ? const Color(0xFF3B82F6).withOpacity(0.3)
          : const Color(0xFF3B82F6).withOpacity(0.4),
      'textColor': isDark ? const Color(0xFF60A5FA) : const Color(0xFF1E40AF),
      'headingColor': isDark ? Colors.white : const Color(0xFF1E3A8A),
      'bodyColor': isDark ? Colors.white.withOpacity(0.6) : const Color(0xFF1E3A8A).withOpacity(0.8),
      'iconColor': isDark ? Colors.white : const Color(0xFF3B82F6),
      'screen': const SantriExplorerScreen(),
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

    // Sub Items (Tim Soal & Input Nilai)
    final subItems = [
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

            // 1. FEATURED CARD (Full Width)
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
                    // Icon
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
                    // Texts
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
                                "Buka Profil",
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
                    // Icon
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
                    // Texts
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

            // 3. SUB ITEMS ROW (Tim Soal & Input Nilai)
            Row(
              children: [
                Expanded(child: _buildSubItem(context, subItems[0], isDark, isLeft: true)),
                const SizedBox(width: 14),
                Expanded(child: _buildSubItem(context, subItems[1], isDark, isLeft: false)),
              ],
            ),
            const SizedBox(height: 16),
            
            // 4. KETENTUAN NILAI MUHAFADZOH CARD (Full Width)
            GestureDetector(
              onTap: () {
                MuhafadzohInfoBottomSheet.show(context);
              },
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isDark
                        ? [const Color(0xFF065F46), const Color(0xFF0F172A)]
                        : [const Color(0xFFE6F4EA), const Color(0xFFCEEAD6)],
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
                    color: isDark
                        ? const Color(0xFF10B981).withOpacity(0.25)
                        : const Color(0xFF10B981).withOpacity(0.4),
                    width: 1.5,
                  ),
                ),
                padding: const EdgeInsets.all(22),
                child: Row(
                  children: [
                    // Icon
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withOpacity(0.06) : Colors.white.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(16),
                        border: isDark ? null : Border.all(color: Colors.white, width: 1.5),
                      ),
                      child: Icon(
                        Icons.info_outline_rounded,
                        color: isDark ? Colors.white : const Color(0xFF10B981),
                        size: 32,
                      ),
                    ),
                    const SizedBox(width: 18),
                    // Texts
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Ketentuan Nilai Muhafadzoh',
                            style: GoogleFonts.outfit(
                              color: isDark ? Colors.white : const Color(0xFF065F46),
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Informasi acuan ketentuan & rentang kriteria nilai Ujian Muhafadzoh per jenjang kelas.',
                            style: GoogleFonts.outfit(
                              color: isDark ? Colors.white.withOpacity(0.6) : const Color(0xFF064E3B).withOpacity(0.8),
                              fontSize: 11,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Text(
                                "Lihat Ketentuan",
                                style: GoogleFonts.outfit(
                                  color: isDark ? const Color(0xFF34D399) : const Color(0xFF065F46),
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Icon(
                                Icons.arrow_forward_rounded,
                                color: isDark ? const Color(0xFF34D399) : const Color(0xFF065F46),
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
            // 5. MAQRO QIROATUL KITAB CARD (Full Width)
            GestureDetector(
              onTap: () {
                QiroahMaqroBottomSheet.show(context);
              },
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isDark
                        ? [const Color(0xFF7C2D12), const Color(0xFF0F172A)]
                        : [const Color(0xFFFFF7ED), const Color(0xFFFFEDD5)],
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
                    color: isDark
                        ? const Color(0xFFF97316).withOpacity(0.25)
                        : const Color(0xFFF97316).withOpacity(0.4),
                    width: 1.5,
                  ),
                ),
                padding: const EdgeInsets.all(22),
                child: Row(
                  children: [
                    // Icon
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withOpacity(0.06) : Colors.white.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(16),
                        border: isDark ? null : Border.all(color: Colors.white, width: 1.5),
                      ),
                      child: Icon(
                        Icons.chrome_reader_mode_rounded,
                        color: isDark ? Colors.white : const Color(0xFFF97316),
                        size: 32,
                      ),
                    ),
                    const SizedBox(width: 18),
                    // Texts
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Maqro Qiroatul Kitab',
                            style: GoogleFonts.outfit(
                              color: isDark ? Colors.white : const Color(0xFF7C2D12),
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Daftar acuan bahan bacaan (Maqro) Ujian Qiroatul Kitab per jenjang kelas.',
                            style: GoogleFonts.outfit(
                              color: isDark ? Colors.white.withOpacity(0.6) : const Color(0xFF7C2D12).withOpacity(0.8),
                              fontSize: 11,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Text(
                                "Lihat Maqro",
                                style: GoogleFonts.outfit(
                                  color: isDark ? const Color(0xFFFB923C) : const Color(0xFF7C2D12),
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Icon(
                                Icons.arrow_forward_rounded,
                                color: isDark ? const Color(0xFFFB923C) : const Color(0xFF7C2D12),
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
