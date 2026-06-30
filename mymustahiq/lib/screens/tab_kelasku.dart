import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';
import '../services/network_service.dart';
import '../widgets/offline_widget.dart';
import 'santri_explorer_screen.dart';
import 'weekly_schedule_screen.dart';
import 'informasi_ujian_screen.dart';
import 'kelasku_rapor_input_screen.dart';

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

    if (!NetworkService().isOnline) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'NO_INTERNET';
      });
      return;
    }

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
      if (_errorMessage == 'NO_INTERNET') {
        return OfflineWidget(onRetry: _fetchDashboardData);
      }
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline_rounded, color: Colors.amber, size: 48),
              const SizedBox(height: 16),
              Text(_errorMessage!, textAlign: TextAlign.center, style: GoogleFonts.outfit(color: context.titleColor, fontSize: 15)),
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
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: const Color(0xFF10B981).withOpacity(0.3),
                              width: 1.5,
                            ),
                          ),
                          child: ClipOval(
                            child: (_data?['guruInfo']?['foto_url'] != null && _data!['guruInfo']['foto_url'].toString().isNotEmpty)
                                ? Image.network(
                                    _apiService.getFullImageUrl(_data!['guruInfo']['foto_url']),
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) =>
                                        const Icon(Icons.class_rounded, color: Color(0xFF10B981), size: 24),
                                  )
                                : const Icon(Icons.class_rounded, color: Color(0xFF10B981), size: 24),
                          ),
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
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => KelaskuRaporInputScreen(
                          kelasId: kelasMustahiq['id'],
                          kelasNama: kelasMustahiq['nama'],
                        ),
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                    decoration: BoxDecoration(
                      color: context.cardBg,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: const Color(0xFF10B981).withOpacity(0.3),
                        width: 1.2,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withOpacity(0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.rate_review_rounded, color: Color(0xFF10B981), size: 20),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                "Kelola Rapor Kelas Binaan",
                                style: GoogleFonts.outfit(
                                  color: context.titleColor,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                "Input kepribadian, catatan wali kelas, kustom peringkat, & kenaikan kelas.",
                                style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 10),
                              ),
                            ],
                          ),
                        ),
                        Icon(Icons.arrow_forward_ios_rounded, color: context.subTitleColor, size: 14),
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

              // ===== LAYANAN KELAS =====
              Text(
                "LAYANAN KELAS",
                style: GoogleFonts.outfit(
                  color: context.subTitleColor,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 10),

              if (isMustahiq)
                Row(
                  children: [
                    Expanded(
                      child: _buildClassMenuCard(
                        context: context,
                        title: "Jadwal Pelajaran",
                        desc: "Jadwal KBM kelas seminggu penuh.",
                        icon: Icons.calendar_month_rounded,
                        color: const Color(0xFF10B981),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => WeeklyScheduleScreen(
                                schedule: scheduleToRender,
                                isMustahiq: true,
                                className: kelasMustahiq['nama'] ?? '',
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildClassMenuCard(
                        context: context,
                        title: "Informasi Ujian",
                        desc: "Ketentuan nilai & batasan materi ujian.",
                        icon: Icons.assignment_rounded,
                        color: const Color(0xFF8B5CF6),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => InformasiUjianScreen(
                                kelasMustahiq: kelasMustahiq,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                )
              else
                _buildClassMenuCard(
                  context: context,
                  title: "Jadwal Mengajarku",
                  desc: "Jadwal mengajar Anda seminggu penuh.",
                  icon: Icons.calendar_month_rounded,
                  color: const Color(0xFF10B981),
                  isFullWidth: true,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => WeeklyScheduleScreen(
                          schedule: scheduleToRender,
                          isMustahiq: false,
                          className: '',
                        ),
                      ),
                    );
                  },
                ),

              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildClassMenuCard({
    required BuildContext context,
    required String title,
    required String desc,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
    bool isFullWidth = false,
  }) {
    final isDark = context.isDarkMode;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: isFullWidth ? 100 : 160,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.cardBg,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: context.borderColor),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(isDark ? 0.25 : 0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: isFullWidth
            ? Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(icon, color: color, size: 26),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          title,
                          style: GoogleFonts.outfit(
                            color: context.titleColor,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          desc,
                          style: GoogleFonts.outfit(
                            color: context.bodyColor,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(Icons.chevron_right_rounded, color: context.bodyColor),
                ],
              )
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, color: color, size: 22),
                  ),
                  const Spacer(),
                  Text(
                    title,
                    style: GoogleFonts.outfit(
                      color: context.titleColor,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    desc,
                    style: GoogleFonts.outfit(
                      color: context.bodyColor,
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
  }
}

