import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/theme_manager.dart';
import 'buku_induk_screen.dart';
import 'struktur_organisasi_screen.dart';
import 'teacher_list_screen.dart';

class TabAdministratif extends StatelessWidget {
  const TabAdministratif({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;

    final items = [
      {
        'title': 'Buku Induk',
        'desc': 'Data induk profil santri lengkap dikelompokkan berdasarkan tahun masuk serta filter jenis kelamin.',
        'icon': Icons.assignment_ind_rounded,
        'colors': isDark
            ? [const Color(0xFF831843), const Color(0xFF0F172A)]
            : [const Color(0xFFFDF2F8), const Color(0xFFFCE7F3)],
        'borderColor': isDark
            ? const Color(0xFFEC4899).withOpacity(0.25)
            : const Color(0xFFEC4899).withOpacity(0.4),
        'textColor': isDark ? const Color(0xFFF472B6) : const Color(0xFFBE185D),
        'headingColor': isDark ? Colors.white : const Color(0xFFBE185D),
        'bodyColor': isDark ? Colors.white.withOpacity(0.6) : const Color(0xFF831843).withOpacity(0.8),
        'iconColor': isDark ? Colors.white : const Color(0xFFEC4899),
        'screen': const BukuIndukScreen(),
      },
      {
        'title': 'Struktur Madrasah',
        'desc': 'Struktur organisasi Madrasah Diniyah dan Panitia Ujian Semester aktif.',
        'icon': Icons.account_tree_rounded,
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
        'screen': const StrukturOrganisasiScreen(),
      },
      {
        'title': 'Daftar Mustahiq',
        'desc': 'Daftar asatidz wali kelas Diniyah aktif beserta kelas binaannya.',
        'icon': Icons.badge_rounded,
        'colors': isDark
            ? [const Color(0xFF3B0764), const Color(0xFF0F172A)]
            : [const Color(0xFFF5F3FF), const Color(0xFFEDE9FE)],
        'borderColor': isDark
            ? const Color(0xFF8B5CF6).withOpacity(0.25)
            : const Color(0xFF8B5CF6).withOpacity(0.4),
        'textColor': isDark ? const Color(0xFFA78BFA) : const Color(0xFF6D28D9),
        'headingColor': isDark ? Colors.white : const Color(0xFF6D28D9),
        'bodyColor': isDark ? Colors.white.withOpacity(0.6) : const Color(0xFF4C1D95).withOpacity(0.8),
        'iconColor': isDark ? Colors.white : const Color(0xFF8B5CF6),
        'screen': const TeacherListScreen(isMustahiq: true),
      },
      {
        'title': 'Daftar Munawib',
        'desc': 'Daftar asatidz guru mata pelajaran aktif di Madrasah Diniyah.',
        'icon': Icons.people_alt_rounded,
        'colors': isDark
            ? [const Color(0xFF064E3B), const Color(0xFF0F172A)]
            : [const Color(0xFFE6F4EA), const Color(0xFFCEEAD6)],
        'borderColor': isDark
            ? const Color(0xFF10B981).withOpacity(0.25)
            : const Color(0xFF10B981).withOpacity(0.4),
        'textColor': isDark ? const Color(0xFF34D399) : const Color(0xFF065F46),
        'headingColor': isDark ? Colors.white : const Color(0xFF065F46),
        'bodyColor': isDark ? Colors.white.withOpacity(0.6) : const Color(0xFF064E3B).withOpacity(0.8),
        'iconColor': isDark ? Colors.white : const Color(0xFF10B981),
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
              "Layanan Administratif",
              style: GoogleFonts.outfit(
                color: context.titleColor,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              "Akses portal administrasi Madrasah Diniyah dan data santri.",
              style: GoogleFonts.outfit(
                color: context.subTitleColor,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 24),

            // Card list
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: items.length,
              itemBuilder: (context, index) {
                final item = items[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => item['screen'] as Widget),
                      );
                    },
                    child: Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: item['colors'] as List<Color>,
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
                          color: item['borderColor'] as Color,
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
                              item['icon'] as IconData,
                              color: item['iconColor'] as Color,
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
                                  item['title'] as String,
                                  style: GoogleFonts.outfit(
                                    color: item['headingColor'] as Color,
                                    fontSize: 17,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  item['desc'] as String,
                                  style: GoogleFonts.outfit(
                                    color: item['bodyColor'] as Color,
                                    fontSize: 11,
                                    height: 1.4,
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  children: [
                                    Text(
                                      "Buka Menu",
                                      style: GoogleFonts.outfit(
                                        color: item['textColor'] as Color,
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Icon(
                                      Icons.arrow_forward_rounded,
                                      color: item['textColor'] as Color,
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
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
