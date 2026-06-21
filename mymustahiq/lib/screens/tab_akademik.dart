import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/theme_manager.dart';
import 'jadwal_pelajaran_screen.dart';
import 'santri_explorer_screen.dart';
import 'struktur_organisasi_screen.dart';
import 'teacher_list_screen.dart';

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

    // Sub Items for Row 1
    final subItemsRow1 = [
      {
        'title': 'Jadwal Pelajaran',
        'desc': 'Jadwal KBM harian & mingguan per kelas.',
        'icon': Icons.calendar_today_rounded,
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
        'screen': const JadwalPelajaranScreen(),
      },
      {
        'title': 'Struktur Madrasah',
        'desc': 'Pengurus Diniyah & Panitia Semester.',
        'icon': Icons.account_tree_rounded,
        'colors': isDark
            ? [const Color(0xFF78350F), const Color(0xFF0F172A)]
            : [const Color(0xFFFFFBEB), const Color(0xFFFEF3C7)],
        'borderColor': isDark
            ? const Color(0xFFF59E0B).withOpacity(0.25)
            : const Color(0xFFF59E0B).withOpacity(0.4),
        'textColor': isDark ? const Color(0xFFFBBF24) : const Color(0xFFB45309),
        'headingColor': isDark ? Colors.white : const Color(0xFFB45309),
        'bodyColor': isDark ? Colors.white.withOpacity(0.5) : const Color(0xFF78350F).withOpacity(0.8),
        'iconColor': isDark ? Colors.white : const Color(0xFFF59E0B),
        'screen': const StrukturOrganisasiScreen(),
      },
    ];

    // Sub Items for Row 2 (NEW)
    final subItemsRow2 = [
      {
        'title': 'Daftar Mustahiq',
        'desc': 'Daftar asatidz/ustadzah wali kelas Diniyah.',
        'icon': Icons.assignment_ind_rounded,
        'colors': isDark
            ? [const Color(0xFF4C1D95), const Color(0xFF0F172A)]
            : [const Color(0xFFF5F3FF), const Color(0xFFEDE9FE)],
        'borderColor': isDark
            ? const Color(0xFF8B5CF6).withOpacity(0.25)
            : const Color(0xFF8B5CF6).withOpacity(0.4),
        'textColor': isDark ? const Color(0xFFA78BFA) : const Color(0xFF6D28D9),
        'headingColor': isDark ? Colors.white : const Color(0xFF6D28D9),
        'bodyColor': isDark ? Colors.white.withOpacity(0.5) : const Color(0xFF4C1D95).withOpacity(0.8),
        'iconColor': isDark ? Colors.white : const Color(0xFF8B5CF6),
        'screen': const TeacherListScreen(isMustahiq: true),
      },
      {
        'title': 'Daftar Munawib',
        'desc': 'Daftar ustadz pengawas ketertiban santri.',
        'icon': Icons.security_rounded,
        'colors': isDark
            ? [const Color(0xFF115E59), const Color(0xFF0F172A)]
            : [const Color(0xFFF0FDFA), const Color(0xFFCCFBF1)],
        'borderColor': isDark
            ? const Color(0xFF0D9488).withOpacity(0.25)
            : const Color(0xFF0D9488).withOpacity(0.4),
        'textColor': isDark ? const Color(0xFF2DD4BF) : const Color(0xFF0F766E),
        'headingColor': isDark ? Colors.white : const Color(0xFF0F766E),
        'bodyColor': isDark ? Colors.white.withOpacity(0.5) : const Color(0xFF115E59).withOpacity(0.8),
        'iconColor': isDark ? Colors.white : const Color(0xFF0D9488),
        'screen': const TeacherListScreen(isMustahiq: false),
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
              "Akses portal data santri, jadwal pelajaran, dan asatidz pesantren.",
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

            // 2. SUB ITEMS ROW 1 (Jadwal & Struktur)
            Row(
              children: [
                Expanded(child: _buildSubItem(context, subItemsRow1[0], isDark, isLeft: true)),
                const SizedBox(width: 14),
                Expanded(child: _buildSubItem(context, subItemsRow1[1], isDark, isLeft: false)),
              ],
            ),
            const SizedBox(height: 14),

            // 3. SUB ITEMS ROW 2 (Mustahiq & Munawib - NEW)
            Row(
              children: [
                Expanded(child: _buildSubItem(context, subItemsRow2[0], isDark, isLeft: true)),
                const SizedBox(width: 14),
                Expanded(child: _buildSubItem(context, subItemsRow2[1], isDark, isLeft: false)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubItem(BuildContext context, Map<String, dynamic> item, bool isDark, {required bool isLeft}) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => item['screen'] as Widget),
        );
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
