import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/theme_manager.dart';

class WeeklyScheduleScreen extends StatelessWidget {
  final Map<String, List<dynamic>> schedule;
  final bool isMustahiq;
  final String className;

  const WeeklyScheduleScreen({
    super.key,
    required this.schedule,
    required this.isMustahiq,
    required this.className,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          isMustahiq ? "Jadwal Pelajaran $className" : "Jadwal Mengajarku",
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: isDark ? Colors.white : const Color(0xFF1E293B),
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                isMustahiq ? "JADWAL KELAS SEMINGGU" : "JADWAL MENGAJAR SEMINGGU",
                style: GoogleFonts.outfit(
                  color: context.subTitleColor,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 16),
              if (schedule.isEmpty)
                Container(
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: context.cardBg,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: context.borderColor),
                  ),
                  child: Center(
                    child: Text(
                      "Jadwal belum tersedia.",
                      style: GoogleFonts.outfit(color: context.bodyColor, fontSize: 13),
                    ),
                  ),
                )
              else
                ..._buildWeeklySchedule(context, schedule, isMustahiq, isDark),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildWeeklySchedule(
      BuildContext context, Map<String, List<dynamic>> jadwalMingguan, bool isMustahiq, bool isDark) {
    const orderMalam = [
      'Malam Ahad',
      'Malam Senin',
      'Malam Selasa',
      'Malam Rabu',
      'Malam Kamis',
      'Malam Sabtu',
      'Malam Jumat'
    ];

    final malamHariIni = _getMalamHariIni();
    final widgets = <Widget>[];

    for (final malam in orderMalam) {
      final items = jadwalMingguan[malam];
      if (items == null || items.isEmpty) continue;

      final isTonight = malam == malamHariIni;

      widgets.add(
        Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: context.cardBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isTonight
                  ? const Color(0xFF10B981).withOpacity(isDark ? 0.3 : 0.6)
                  : context.borderColor,
              width: isTonight ? 1.5 : 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: isTonight
                      ? const Color(0xFF064E3B).withOpacity(isDark ? 0.2 : 0.08)
                      : context.surfaceBg,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(16),
                    topRight: Radius.circular(16),
                  ),
                ),
                child: Row(
                  children: [
                    Text(
                      malam,
                      style: GoogleFonts.outfit(
                        color: isTonight
                            ? (isDark ? const Color(0xFF34D399) : const Color(0xFF065F46))
                            : context.titleColor,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.6,
                      ),
                    ),
                    if (isTonight) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          "MALAM INI",
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF10B981),
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              ...items.map((item) => Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    child: Row(
                      children: [
                        Container(
                          width: 32,
                          height: 32,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: context.surfaceBg,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            "${item['jam_ke']}",
                            style: GoogleFonts.outfit(
                              color: const Color(0xFFF59E0B),
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item['mata_pelajaran_nama'] ?? '-',
                                style: GoogleFonts.outfit(
                                  color: context.titleColor,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                isMustahiq
                                    ? "Pengampu: ${item['guru_nama'] ?? '-'}"
                                    : "Kelas ${item['kelas_nama'] ?? '-'}",
                                style: GoogleFonts.outfit(
                                  color: context.bodyColor,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  )),
            ],
          ),
        ),
      );
    }

    return widgets;
  }

  String _getMalamHariIni() {
    final now = DateTime.now();
    switch (now.weekday) {
      case 1: return 'Malam Selasa';
      case 2: return 'Malam Rabu';
      case 3: return 'Malam Kamis';
      case 4: return 'Malam Jumat';
      case 5: return 'Malam Sabtu';
      case 6: return 'Malam Ahad';
      case 7: return 'Malam Senin';
      default: return 'Malam Senin';
    }
  }
}
