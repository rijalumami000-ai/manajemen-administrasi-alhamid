import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';
import '../services/network_service.dart';
import '../widgets/offline_widget.dart';
import 'santri_explorer_screen.dart';
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
              // Premium Animated Card Welcome Banner
              PremiumAnimatedCard(
                name: guruName,
                activeYear: activeYear,
                semester: semester,
                isMustahiq: isMustahiq,
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
                  ...jadwalMalamIni.map((item) {
                    final isDark = context.isDarkMode;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: isDark
                              ? [
                                  const Color(0xFF064E3B).withOpacity(0.38),
                                  const Color(0xFF0F172A),
                                ]
                              : [
                                  const Color(0xFFECFDF5),
                                  Colors.white,
                                ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: const Color(0xFF10B981).withOpacity(isDark ? 0.35 : 0.5),
                          width: 1.2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF10B981).withOpacity(isDark ? 0.08 : 0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF10B981), Color(0xFF059669)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF10B981).withOpacity(0.3),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  "JAM",
                                  style: GoogleFonts.outfit(
                                    color: Colors.white.withOpacity(0.85),
                                    fontSize: 8,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                Text(
                                  "${item['jam_ke']}",
                                  style: GoogleFonts.outfit(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    height: 1.1,
                                  ),
                                ),
                              ],
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
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFF10B981).withOpacity(isDark ? 0.2 : 0.12),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: const Color(0xFF10B981).withOpacity(0.3),
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 6,
                                  height: 6,
                                  decoration: const BoxDecoration(
                                    color: Color(0xFF10B981),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 5),
                                Text(
                                  "Malam Ini",
                                  style: GoogleFonts.outfit(
                                    color: const Color(0xFF10B981),
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
              ],

              // ===== PEMBATAS JELAS DENGAN JADWAL MINGGUAN =====
              Padding(
                padding: const EdgeInsets.only(top: 20, bottom: 16),
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: 1,
                        color: context.borderColor,
                      ),
                    ),
                    Container(
                      margin: const EdgeInsets.symmetric(horizontal: 12),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                      decoration: BoxDecoration(
                        color: context.isDarkMode
                            ? const Color(0xFF1E293B)
                            : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: context.borderColor),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.date_range_rounded, size: 13, color: Color(0xFF3B82F6)),
                          const SizedBox(width: 6),
                          Text(
                            isMustahiq ? "JADWAL KELAS LENGKAP (SEMINGGU)" : "JADWAL MENGAJAR (SEMINGGU)",
                            style: GoogleFonts.outfit(
                              color: context.titleColor,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Container(
                        height: 1,
                        color: context.borderColor,
                      ),
                    ),
                  ],
                ),
              ),

              // ===== SAJIAN LANGSUNG JADWAL PELAJARAN SEMINGGU =====
              _buildWeeklyScheduleList(
                context: context,
                schedule: scheduleToRender,
                isMustahiq: isMustahiq,
              ),

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
              const SizedBox(height: 12),

              // 1. Informasi Ujian (memanjang seperti Kelola Rapor, diatas Kelola Rapor)
              _buildElongatedActionCard(
                context: context,
                title: "Informasi Ujian",
                desc: "Ketentuan nilai & batasan materi ujian semester.",
                icon: Icons.assignment_rounded,
                color: const Color(0xFF8B5CF6),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => InformasiUjianScreen(
                        kelasMustahiq: kelasMustahiq ?? {},
                      ),
                    ),
                  );
                },
              ),

              // 2. Kelola Rapor Kelas Binaan (paling bawah)
              if (isMustahiq) ...[
                const SizedBox(height: 12),
                _buildElongatedActionCard(
                  context: context,
                  title: "Kelola Rapor Kelas Binaan",
                  desc: "Input kepribadian, catatan wali kelas, kustom peringkat, & kenaikan kelas.",
                  icon: Icons.rate_review_rounded,
                  color: const Color(0xFF10B981),
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
                ),
              ],

              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWeeklyScheduleList({
    required BuildContext context,
    required Map<String, List<dynamic>> schedule,
    required bool isMustahiq,
  }) {
    const orderMalam = [
      'Malam Ahad',
      'Malam Senin',
      'Malam Selasa',
      'Malam Rabu',
      'Malam Kamis',
      'Malam Sabtu',
      'Malam Jumat',
    ];

    final malamHariIni = _getMalamHariIni();
    final isDark = context.isDarkMode;

    final hasAnySchedule = schedule.values.any((list) => list.isNotEmpty);

    if (!hasAnySchedule) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: context.cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: context.borderColor),
        ),
        child: Center(
          child: Text(
            isMustahiq
                ? "Belum ada data jadwal pelajaran kelas seminggu."
                : "Belum ada data jadwal mengajar seminggu.",
            textAlign: TextAlign.center,
            style: GoogleFonts.outfit(color: context.bodyColor, fontSize: 13),
          ),
        ),
      );
    }

    final List<Widget> dayWidgets = [];

    for (final malam in orderMalam) {
      final items = schedule[malam];
      if (items == null || items.isEmpty) continue;

      final isTonight = malam == malamHariIni;

      dayWidgets.add(
        Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: context.cardBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isTonight
                  ? const Color(0xFF10B981).withOpacity(isDark ? 0.35 : 0.5)
                  : context.borderColor,
              width: isTonight ? 1.2 : 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: isTonight
                      ? const Color(0xFF10B981).withOpacity(isDark ? 0.15 : 0.08)
                      : context.surfaceBg,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(15),
                    topRight: Radius.circular(15),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.calendar_today_rounded,
                      size: 13,
                      color: isTonight ? const Color(0xFF10B981) : context.subTitleColor,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      malam,
                      style: GoogleFonts.outfit(
                        color: isTonight ? const Color(0xFF10B981) : context.titleColor,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Spacer(),
                    if (isTonight)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          "HARI INI",
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF10B981),
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              ...items.map((item) => Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    child: Row(
                      children: [
                        Container(
                          width: 30,
                          height: 30,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: context.surfaceBg,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: context.borderColor),
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

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: dayWidgets,
    );
  }

  Widget _buildElongatedActionCard({
    required BuildContext context,
    required String title,
    required String desc,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    final isDark = context.isDarkMode;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        decoration: BoxDecoration(
          color: context.cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: color.withOpacity(isDark ? 0.35 : 0.25),
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
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.outfit(
                      color: context.titleColor,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    desc,
                    style: GoogleFonts.outfit(
                      color: context.subTitleColor,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios_rounded, color: context.subTitleColor, size: 14),
          ],
        ),
      ),
    );
  }
}

class PremiumAnimatedCard extends StatefulWidget {
  final String name;
  final String activeYear;
  final String semester;
  final bool isMustahiq;

  const PremiumAnimatedCard({
    super.key,
    required this.name,
    required this.activeYear,
    required this.semester,
    required this.isMustahiq,
  });

  @override
  State<PremiumAnimatedCard> createState() => _PremiumAnimatedCardState();
}

class _PremiumAnimatedCardState extends State<PremiumAnimatedCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    )..repeat(reverse: true);

    _scaleAnimation = Tween<double>(begin: 0.98, end: 1.02).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    _glowAnimation = Tween<double>(begin: 4.0, end: 14.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;

    final List<Color> gradientColors = isDark
        ? [
            const Color(0xFF065F46), // Emerald
            const Color(0xFF0F766E), // Teal
            const Color(0xFF1E293B), // Slate
          ]
        : [
            const Color(0xFF10B981), // Emerald
            const Color(0xFF0D9488), // Teal
            const Color(0xFF3B82F6), // Royal Blue
          ];

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return ScaleTransition(
          scale: _scaleAnimation,
          child: Container(
            height: 140,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: (isDark ? const Color(0xFF10B981) : const Color(0xFF0D9488))
                      .withOpacity(isDark ? 0.2 : 0.15),
                  blurRadius: _glowAnimation.value,
                  spreadRadius: 1,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Stack(
                children: [
                  // Animated Gradient Background
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: gradientColors,
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        transform: GradientRotation(_controller.value * 2 * 3.14159),
                      ),
                    ),
                  ),
                  
                  // Floating glassmorphic bubble 1
                  Positioned(
                    top: -20 + (10 * _scaleAnimation.value),
                    right: -20 + (5 * _scaleAnimation.value),
                    child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withOpacity(0.08),
                      ),
                    ),
                  ),
                  
                  // Floating glassmorphic bubble 2
                  Positioned(
                    bottom: -20 - (5 * _scaleAnimation.value),
                    left: 20 + (10 * _scaleAnimation.value),
                    child: Container(
                      width: 70,
                      height: 70,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withOpacity(0.05),
                      ),
                    ),
                  ),
                  
                  // Content padding
                  Padding(
                    padding: const EdgeInsets.all(18.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(
                                      color: Colors.white.withOpacity(0.3),
                                      width: 1,
                                    ),
                                  ),
                                  child: const Icon(
                                    Icons.mosque_rounded,
                                    color: Colors.white,
                                    size: 18,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      "Assalamu'alaikum,",
                                      style: GoogleFonts.outfit(
                                        color: Colors.white.withOpacity(0.85),
                                        fontSize: 11,
                                      ),
                                    ),
                                    Text(
                                      widget.name,
                                      style: GoogleFonts.outfit(
                                        color: Colors.white,
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            
                            // Role Badge
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: Colors.white.withOpacity(0.3),
                                  width: 1,
                                ),
                              ),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.workspace_premium_rounded,
                                    color: Colors.white,
                                    size: 12,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    widget.isMustahiq ? "MUSTAHIQ" : "GURU MAPEL",
                                    style: GoogleFonts.outfit(
                                      color: Colors.white,
                                      fontSize: 9,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        
                        // Academic Year
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: Colors.white.withOpacity(0.15),
                              width: 1,
                            ),
                          ),
                          child: Text(
                            "Tahun Ajaran ${widget.activeYear} (${widget.semester})",
                            style: GoogleFonts.outfit(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
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
    );
  }
}

