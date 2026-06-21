import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';
import 'santri_explorer_screen.dart';

class TabKelasku extends StatefulWidget {
  const TabKelasku({super.key});

  @override
  State<TabKelasku> createState() => _TabKelaskuState();
}

class _TabKelaskuState extends State<TabKelasku> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic>? _data;
  Map<String, List<dynamic>> _weeklyClassSchedule = {};

  @override
  void initState() {
    super.initState();
    _fetchDashboardData();
  }

  Future<void> _fetchDashboardData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _weeklyClassSchedule = {};
    });

    try {
      final res = await _apiService.getDashboard();
      final kelasMustahiq = res['kelasMustahiq'];
      Map<String, List<dynamic>> weeklyClassSchedule = {};
      
      if (kelasMustahiq != null) {
        try {
          final scheduleRes = await _apiService.getSchedule(kelasMustahiq['id']);
          final list = scheduleRes['jadwal'] as List<dynamic>? ?? [];
          for (var item in list) {
            final String malam = item['malam'] ?? 'Lainnya';
            if (!weeklyClassSchedule.containsKey(malam)) {
              weeklyClassSchedule[malam] = [];
            }
            weeklyClassSchedule[malam]!.add(item);
          }
          weeklyClassSchedule.forEach((key, val) {
            val.sort((a, b) => (a['jam_ke'] ?? 1).compareTo(b['jam_ke'] ?? 1));
          });
        } catch (_) {
          // Fallback to ignoring class schedule failure and just showing personal dashboard
        }
      }

      setState(() {
        _data = res;
        _weeklyClassSchedule = weeklyClassSchedule;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  /// Get the "Malam" name for tonight based on the current date.
  /// Rule: 
  /// - Senin (weekday=1) → Malam Selasa
  /// - Selasa (weekday=2) → Malam Rabu
  /// - ... etc.
  /// - Kamis (weekday=4) → Malam Jumat (special: Mujahadah, no schedule)
  /// - Transition at 00:00 midnight
  String _getMalamHariIni() {
    final now = DateTime.now();
    // DateTime weekday: 1=Monday, 7=Sunday
    // Map weekday to the "malam" name (tonight)
    switch (now.weekday) {
      case 1: return 'Malam Selasa';
      case 2: return 'Malam Rabu';
      case 3: return 'Malam Kamis';
      case 4: return 'Malam Jumat'; // Special
      case 5: return 'Malam Sabtu';
      case 6: return 'Malam Ahad';
      case 7: return 'Malam Senin';
      default: return 'Malam Senin';
    }
  }

  bool _isMalamJumat() {
    return DateTime.now().weekday == 4; // Thursday → Malam Jumat
  }

  String _getGreetingMalam() {
    final days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    final now = DateTime.now();
    final todayName = days[now.weekday % 7];
    final malamName = _getMalamHariIni();
    return "$todayName → $malamName";
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Center(child: CircularProgressIndicator(color: const Color(0xFF10B981)));
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.wifi_off_rounded, color: Colors.amber, size: 48),
              const SizedBox(height: 16),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(color: context.titleColor, fontSize: 15),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _fetchDashboardData,
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF064E3B)),
                child: Text('Coba Lagi', style: GoogleFonts.outfit(color: Colors.white)),
              ),
            ],
          ),
        ),
      );
    }

    final guruName = _data?['guruInfo']?['nama'] ?? 'Ustadz';
    final kelasMustahiq = _data?['kelasMustahiq'];
    final totalSantri = _data?['totalSantriKelas'] ?? 0;
    final listJadwal = _data?['jadwalMengajar'] as List<dynamic>? ?? [];
    final activeYear = _data?['tahunAjaran']?['kode'] ?? '-';
    final semester = _data?['tahunAjaran']?['semester'] ?? 'Ganjil';
    
    final isMustahiq = kelasMustahiq != null;
    final malamHariIni = _getMalamHariIni();

    // Filter jadwal for tonight
    final List<dynamic> jadwalMalamIni = isMustahiq
        ? (_weeklyClassSchedule[malamHariIni] ?? [])
        : listJadwal.where((j) => j['malam'] == malamHariIni).toList();

    // Group weekly schedules
    final Map<String, List<dynamic>> scheduleToRender = isMustahiq
        ? _weeklyClassSchedule
        : () {
            final Map<String, List<dynamic>> grouped = {};
            for (var j in listJadwal) {
              final m = j['malam'] ?? '';
              grouped.putIfAbsent(m, () => []);
              grouped[m]!.add(j);
            }
            return grouped;
          }();

    return RefreshIndicator(
      onRefresh: _fetchDashboardData,
      color: const Color(0xFF10B981),
      backgroundColor: context.cardBg,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Welcome Banner
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: context.isDarkMode
                        ? [
                            const Color(0xFF064E3B).withOpacity(0.2),
                            const Color(0xFF131B2E),
                          ]
                        : [
                            const Color(0xFF10B981).withOpacity(0.08),
                            context.cardBg,
                          ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: const Color(0xFF10B981).withOpacity(context.isDarkMode ? 0.15 : 0.3),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(Icons.mosque_rounded, color: Color(0xFF10B981), size: 24),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                "Assalamu'alaikum,",
                                style: GoogleFonts.outfit(color: context.bodyColor, fontSize: 12),
                              ),
                              Text(
                                guruName,
                                style: GoogleFonts.outfit(
                                  color: context.titleColor,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        "T.A $activeYear ($semester)",
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF10B981),
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // ===== KELAS BINAAN =====
              if (kelasMustahiq != null) ...[
                Text(
                  "KELAS BINAAN",
                  style: GoogleFonts.outfit(
                    color: context.subTitleColor,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5,
                  ),
                ),
                const SizedBox(height: 10),
                GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => SantriExplorerScreen(kelasId: kelasMustahiq['id']),
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: context.cardBg,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: context.borderColor),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(Icons.class_rounded, color: Color(0xFF10B981), size: 26),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                "Kelas ${kelasMustahiq['nama']}",
                                style: GoogleFonts.outfit(
                                  color: context.titleColor,
                                  fontSize: 17,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                "Ketuk untuk lihat daftar santri",
                                style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              "$totalSantri",
                              style: GoogleFonts.outfit(
                                color: const Color(0xFFD97706),
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            Text(
                              "Santri",
                              style: GoogleFonts.outfit(color: context.bodyColor, fontSize: 10),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ] else ...[
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: context.cardBg,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: context.borderColor),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.info_outline_rounded, color: Color(0xFF64748B), size: 40),
                      const SizedBox(height: 12),
                      Text(
                        "Anda belum diamanahkan sebagai mustahiq kelas manapun di tahun ajaran saat ini.",
                        textAlign: TextAlign.center,
                        style: GoogleFonts.outfit(color: context.bodyColor, fontSize: 13),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],

              // ===== JADWAL MALAM INI =====
              Row(
                children: [
                  Text(
                    _isMalamJumat()
                        ? "MALAM JUM'AT"
                        : (isMustahiq ? "JADWAL KELAS MALAM INI" : "JADWAL MENGAJAR MALAM INI"),
                    style: GoogleFonts.outfit(
                      color: context.subTitleColor,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: _isMalamJumat()
                          ? const Color(0xFFD97706).withOpacity(0.15)
                          : const Color(0xFF10B981).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      _getGreetingMalam(),
                      style: GoogleFonts.outfit(
                        color: _isMalamJumat() ? const Color(0xFFD97706) : const Color(0xFF10B981),
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              if (_isMalamJumat()) ...[
                // Special Malam Jumat card
                Container(
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: context.isDarkMode
                          ? [
                              const Color(0xFFD97706).withOpacity(0.1),
                              context.cardBg,
                            ]
                          : [
                              const Color(0xFFFFFBEB),
                              context.cardBg,
                            ],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: const Color(0xFFD97706).withOpacity(context.isDarkMode ? 0.2 : 0.5),
                    ),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.auto_awesome_rounded, color: Color(0xFFF59E0B), size: 40),
                      const SizedBox(height: 14),
                      Text(
                        "Malam Jum'at Mujahadah",
                        textAlign: TextAlign.center,
                        style: GoogleFonts.outfit(
                          color: const Color(0xFFD97706),
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        "Tidak ada jadwal KBM malam ini.\nSemoga malam ini penuh berkah. 🤲",
                        textAlign: TextAlign.center,
                        style: GoogleFonts.outfit(
                          color: context.bodyColor,
                          fontSize: 13,
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ] else ...[
                // Tonight's schedule
                if (jadwalMalamIni.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: context.cardBg,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: context.borderColor),
                    ),
                    child: Center(
                      child: Text(
                        isMustahiq
                            ? "Tidak ada jadwal KBM kelas malam ini."
                            : "Tidak ada jadwal mengajar malam ini.",
                        textAlign: TextAlign.center,
                        style: GoogleFonts.outfit(color: context.bodyColor, fontSize: 13),
                      ),
                    ),
                  )
                else
                  ...jadwalMalamIni.map((item) => Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                        decoration: BoxDecoration(
                          color: context.cardBg,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: context.borderColor),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 38,
                              height: 38,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: const Color(0xFF10B981).withOpacity(0.12),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                "${item['jam_ke']}",
                                style: GoogleFonts.outfit(
                                  color: const Color(0xFF10B981),
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),
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
                                  const SizedBox(height: 2),
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
              const SizedBox(height: 24),

              // ===== JADWAL SEMINGGU =====
              Text(
                isMustahiq ? "JADWAL KELAS SEMINGGU" : "JADWAL MENGAJAR SEMINGGU",
                style: GoogleFonts.outfit(
                  color: context.subTitleColor,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 10),

              if (scheduleToRender.isEmpty)
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: context.cardBg,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: context.borderColor),
                  ),
                  child: Center(
                    child: Text(
                      isMustahiq
                          ? "Jadwal kelas belum tersedia."
                          : "Tidak ada jadwal mengajar di semester ini.",
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(color: context.bodyColor, fontSize: 13),
                    ),
                  ),
                )
              else
                ..._buildWeeklySchedule(context, scheduleToRender, isMustahiq),

              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildWeeklySchedule(
      BuildContext context, Map<String, List<dynamic>> jadwalMingguan, bool isMustahiq) {
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
                  ? const Color(0xFF10B981).withOpacity(context.isDarkMode ? 0.3 : 0.6)
                  : context.borderColor,
              width: isTonight ? 1.5 : 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: isTonight
                      ? const Color(0xFF064E3B).withOpacity(context.isDarkMode ? 0.2 : 0.08)
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
                            ? (context.isDarkMode ? const Color(0xFF34D399) : const Color(0xFF065F46))
                            : context.titleColor,
                        fontSize: 12,
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
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    child: Row(
                      children: [
                        Container(
                          width: 28,
                          height: 28,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: context.surfaceBg,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            "${item['jam_ke']}",
                            style: GoogleFonts.outfit(
                              color: const Color(0xFFF59E0B),
                              fontSize: 12,
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
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                isMustahiq
                                    ? "Pengampu: ${item['guru_nama'] ?? '-'}"
                                    : "Kelas ${item['kelas_nama'] ?? '-'}",
                                style: GoogleFonts.outfit(
                                  color: context.bodyColor,
                                  fontSize: 11,
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
}
