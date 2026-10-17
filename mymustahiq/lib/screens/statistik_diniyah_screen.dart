import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/theme_manager.dart';
import '../services/api_service.dart';

class StatistikDiniyahScreen extends StatefulWidget {
  const StatistikDiniyahScreen({super.key});

  @override
  State<StatistikDiniyahScreen> createState() => _StatistikDiniyahScreenState();
}

class _StatistikDiniyahScreenState extends State<StatistikDiniyahScreen> {
  final ApiService _apiService = ApiService();

  List<dynamic> _tahunAjaranList = [];
  int? _selectedTahunAjaranId;
  String _selectedTahunAjaranKode = '';
  String _selectedSemester = 'semua'; // 'semua' | 'ganjil' | 'genap'

  Map<String, dynamic>? _data;
  bool _isLoading = true;
  String? _errorMessage;
  bool _showCharts = true;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    try {
      setState(() => _isLoading = true);
      final taList = await _apiService.getTahunAjaran();
      _tahunAjaranList = taList;

      final activeTa = taList.firstWhere(
        (t) => t['is_active'] == true,
        orElse: () => taList.isNotEmpty ? taList.last : null,
      );

      if (activeTa != null) {
        _selectedTahunAjaranId = activeTa['id'];
        _selectedTahunAjaranKode = activeTa['kode'] ?? '';
      }

      await _fetchStatistik();
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _fetchStatistik() async {
    if (_selectedTahunAjaranId == null) return;

    try {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });

      final res = await _apiService.getStatistikDiniyah(
        tahunAjaranId: _selectedTahunAjaranId,
        semester: _selectedSemester,
      );

      if (mounted) {
        setState(() {
          _data = res;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;

    final summary = _data?['summary'] as Map<String, dynamic>? ?? {
      'total': 0,
      'putra': 0,
      'putri': 0,
      'total_ganjil': 0,
      'total_genap': 0,
    };
    final semStatus = (_data?['semester_status'] as Map<String, dynamic>?) ?? {};
    final ganjilStatus = (semStatus['ganjil'] ?? summary['ganjil_status'] ?? 'selesai').toString();
    final genapStatus = (semStatus['genap'] ?? summary['genap_status'] ?? 'selesai').toString();

    final perTingkat = (_data?['per_tingkat'] as List<dynamic>?) ?? [];
    final perKelas = (_data?['per_kelas'] as List<dynamic>?) ?? [];
    final tren = (_data?['tren_tahun_ajaran'] as List<dynamic>?) ?? [];

    final total = (summary['total'] ?? 0) as int;
    final putra = (summary['putra'] ?? 0) as int;
    final putri = (summary['putri'] ?? 0) as int;
    final pctPutra = total > 0 ? ((putra / total) * 100).round() : 0;
    final pctPutri = total > 0 ? ((putri / total) * 100).round() : 0;

    return Scaffold(
      backgroundColor: context.scaffoldBg,
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF0D1527) : Colors.white.withOpacity(0.85),
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: context.titleColor),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "Statistik Siswa Madin",
          style: GoogleFonts.outfit(
            color: context.titleColor,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(
              _showCharts ? Icons.insert_chart_rounded : Icons.insert_chart_outlined_rounded,
              color: _showCharts ? const Color(0xFF10B981) : (isDark ? Colors.white60 : const Color(0xFF64748B)),
              size: 22,
            ),
            tooltip: _showCharts ? "Sembunyikan Grafik" : "Tampilkan Grafik",
            onPressed: () => setState(() => _showCharts = !_showCharts),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchStatistik,
        color: const Color(0xFF10B981),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Filter Card
              _buildFilterSection(ganjilStatus, genapStatus, isDark),
              const SizedBox(height: 14),

              if (_isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 60),
                    child: CircularProgressIndicator(color: Color(0xFF10B981)),
                  ),
                )
              else if (_errorMessage != null)
                _buildErrorView(isDark)
              else ...[
                // Main KPI Grid
                _buildKpiGrid(total, putra, putri, pctPutra, pctPutri, isDark),
                if (_showCharts) ...[
                  const SizedBox(height: 12),
                  _buildGenderRatioChart(putra, putri, total, pctPutra, pctPutri, isDark),
                ],
                const SizedBox(height: 18),

                // Semester Activity Card
                _buildSemesterActivityCard(summary, total, isDark),
                const SizedBox(height: 20),

                // Breakdown Per Tingkat
                _buildSectionHeader("Distribusi Siswa Per Tingkat", "${perTingkat.length} Tingkat", isDark),
                const SizedBox(height: 12),
                _buildTingkatChart(perTingkat, total, isDark),
                const SizedBox(height: 24),

                // Breakdown Per Kelas Diniyah
                _buildSectionHeader("Rincian Jumlah Siswa Per Kelas", "${perKelas.length} Kelas", isDark),
                const SizedBox(height: 12),
                if (_showCharts) ...[
                  _buildKelasChart(perKelas, total, isDark),
                  const SizedBox(height: 14),
                ],
                _buildKelasGrid(perKelas, total, isDark),
                const SizedBox(height: 24),

                // Multi-year Trend
                _buildSectionHeader("Tren Antar Tahun Ajaran", "${tren.length} Periode", isDark),
                const SizedBox(height: 12),
                if (_showCharts) ...[
                  _buildTrenChart(tren, isDark),
                  const SizedBox(height: 14),
                ],
                _buildTrenList(tren, isDark),
                const SizedBox(height: 30),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // Upcoming Alert Card
  Widget _buildUpcomingAlert({required String title, required String description, required bool isDark}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF451A03).withOpacity(0.5) : const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.4)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline_rounded, color: Color(0xFFD97706), size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.outfit(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: isDark ? const Color(0xFFFDE68A) : const Color(0xFF92400E),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  description,
                  style: GoogleFonts.outfit(
                    fontSize: 11,
                    color: isDark ? Colors.white70 : const Color(0xFFB45309),
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Filter Section
  Widget _buildFilterSection(String ganjilStatus, String genapStatus, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        children: [
          // Row Tahun Ajaran Picker
          InkWell(
            onTap: () => _showTahunAjaranPicker(isDark),
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withOpacity(0.05) : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark ? Colors.white.withOpacity(0.08) : const Color(0xFFE2E8F0),
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.calendar_month_rounded, size: 16, color: Color(0xFF10B981)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      "Tahun Ajaran: $_selectedTahunAjaranKode",
                      style: GoogleFonts.outfit(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                  ),
                  Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: isDark ? Colors.white38 : Colors.black38),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Semester Tabs Switcher
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withOpacity(0.05) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                _buildSemTab('Semua', 'semua', null, isDark),
                _buildSemTab('Ganjil', 'ganjil', ganjilStatus, isDark),
                _buildSemTab('Genap', 'genap', genapStatus, isDark),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSemTab(String label, String value, String? status, bool isDark) {
    final isSelected = _selectedSemester == value;
    final isUpcoming = status == 'akan_datang';
    final isRunning = status == 'berjalan';

    return Expanded(
      child: GestureDetector(
        onTap: () {
          if (!isSelected) {
            setState(() => _selectedSemester = value);
            _fetchStatistik();
          }
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isSelected
                ? (isDark ? const Color(0xFF064E3B) : Colors.white)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isSelected
                ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 1))]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                  color: isSelected
                      ? (isDark ? Colors.white : const Color(0xFF064E3B))
                      : (isDark ? Colors.white60 : const Color(0xFF64748B)),
                ),
              ),
              if (isUpcoming) ...[
                const SizedBox(width: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF59E0B),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    "Nanti",
                    style: GoogleFonts.outfit(
                      fontSize: 8,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ] else if (isRunning) ...[
                const SizedBox(width: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    "Aktif",
                    style: GoogleFonts.outfit(
                      fontSize: 8,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // Main KPI Grid
  Widget _buildKpiGrid(int total, int putra, int putri, int pctPutra, int pctPutri, bool isDark) {
    return Column(
      children: [
        // Hero Total Card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF064E3B), Color(0xFF047857), Color(0xFF059669)],
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF064E3B).withOpacity(0.35),
                blurRadius: 18,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.school_rounded, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "TOTAL SISWA DINIYAH",
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                        color: Colors.white70,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      "$total Santri",
                      style: GoogleFonts.outfit(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      "TA $_selectedTahunAjaranKode • ${_selectedSemester.toUpperCase()}",
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        color: Colors.white60,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Putra vs Putri Cards (Tanpa Banin/Banat)
        Row(
          children: [
            Expanded(
              child: _buildGenderCard(
                label: "Putra",
                count: putra,
                pct: pctPutra,
                icon: Icons.face_rounded,
                color: const Color(0xFF3B82F6),
                isDark: isDark,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildGenderCard(
                label: "Putri",
                count: putri,
                pct: pctPutri,
                icon: Icons.face_3_rounded,
                color: const Color(0xFFEC4899),
                isDark: isDark,
              ),
            ),
          ],
        ),
      ],
    );
  }

  // Grafik Proporsi Putra & Putri
  Widget _buildGenderRatioChart(int putra, int putri, int total, int pctPutra, int pctPutri, bool isDark) {
    if (total == 0) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Grafik Rasio Siswa",
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white70 : const Color(0xFF334155),
                ),
              ),
              Row(
                children: [
                  Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFF3B82F6), shape: BoxShape.circle)),
                  const SizedBox(width: 4),
                  Text("Putra $pctPutra%", style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF3B82F6))),
                  const SizedBox(width: 10),
                  Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFFEC4899), shape: BoxShape.circle)),
                  const SizedBox(width: 4),
                  Text("Putri $pctPutri%", style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFFEC4899))),
                ],
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: SizedBox(
              height: 14,
              child: Row(
                children: [
                  if (putra > 0)
                    Expanded(
                      flex: putra,
                      child: Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Color(0xFF2563EB), Color(0xFF60A5FA)],
                          ),
                        ),
                      ),
                    ),
                  if (putra > 0 && putri > 0)
                    Container(width: 2, color: isDark ? const Color(0xFF1E293B) : Colors.white),
                  if (putri > 0)
                    Expanded(
                      flex: putri,
                      child: Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Color(0xFFF472B6), Color(0xFFDB2777)],
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGenderCard({
    required String label,
    required int count,
    required int pct,
    required IconData icon,
    required Color color,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withOpacity(0.25),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, size: 20, color: color),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  "$pct%",
                  style: GoogleFonts.outfit(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            "$count",
            style: GoogleFonts.outfit(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
          ),
          Text(
            label,
            style: GoogleFonts.outfit(
              fontSize: 11,
              color: isDark ? Colors.white60 : const Color(0xFF64748B),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  // Semester Activity Card
  Widget _buildSemesterActivityCard(Map<String, dynamic> summary, int total, bool isDark) {
    final semStatus = (_data?['semester_status'] as Map<String, dynamic>?) ?? {};
    final ganjilStatus = (semStatus['ganjil'] ?? summary['ganjil_status'] ?? 'selesai').toString();
    final genapStatus = (semStatus['genap'] ?? summary['genap_status'] ?? 'selesai').toString();

    final ganjil = (summary['total_ganjil'] ?? 0) as int;
    final genap = (summary['total_genap'] ?? 0) as int;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.verified_user_rounded, size: 16, color: Color(0xFF10B981)),
              const SizedBox(width: 8),
              Text(
                "Keaktifan Siswa Per Semester",
                style: GoogleFonts.outfit(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _buildSemBar(
                  "Semester Ganjil",
                  ganjil,
                  total,
                  const Color(0xFF3B82F6),
                  ganjilStatus,
                  isDark,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: _buildSemBar(
                  "Semester Genap",
                  genap,
                  total,
                  const Color(0xFF10B981),
                  genapStatus,
                  isDark,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSemBar(String label, int count, int total, Color color, String status, bool isDark) {
    final isUpcoming = status == 'akan_datang';
    final isRunning = status == 'berjalan';
    final pct = total > 0 && !isUpcoming ? ((count / total) * 100).round() : 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                label,
                style: GoogleFonts.outfit(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white70 : Colors.black87,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
              decoration: BoxDecoration(
                color: isUpcoming
                    ? const Color(0xFFF59E0B).withOpacity(0.15)
                    : (isRunning ? const Color(0xFF10B981).withOpacity(0.15) : (isDark ? Colors.white12 : const Color(0xFFE2E8F0))),
                borderRadius: BorderRadius.circular(5),
              ),
              child: Text(
                isUpcoming ? "Akan Datang" : (isRunning ? "Aktif" : "Selesai"),
                style: GoogleFonts.outfit(
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  color: isUpcoming
                      ? const Color(0xFFD97706)
                      : (isRunning ? const Color(0xFF10B981) : (isDark ? Colors.white60 : const Color(0xFF64748B))),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          isUpcoming ? "Belum Berjalan" : "$count Santri",
          style: GoogleFonts.outfit(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: isUpcoming ? (isDark ? Colors.white38 : Colors.black38) : color,
          ),
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: total > 0 && !isUpcoming ? (count / total).clamp(0.0, 1.0) : 0.0,
            backgroundColor: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
            valueColor: AlwaysStoppedAnimation<Color>(isUpcoming ? const Color(0xFFF59E0B) : color),
            minHeight: 6,
          ),
        ),
        const SizedBox(height: 3),
        Align(
          alignment: Alignment.centerRight,
          child: Text(
            isUpcoming ? "Menunggu semester" : "$pct% aktif",
            style: GoogleFonts.outfit(fontSize: 10, color: isDark ? Colors.white38 : Colors.black38),
          ),
        ),
      ],
    );
  }

  // Section Header
  Widget _buildSectionHeader(String title, String badge, bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: GoogleFonts.outfit(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withOpacity(0.08) : const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            badge,
            style: GoogleFonts.outfit(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white60 : const Color(0xFF64748B),
            ),
          ),
        ),
      ],
    );
  }

  // Tingkat List
  Widget _buildTingkatList(List<dynamic> list, int total, bool isDark) {
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: list.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final t = list[index];
        final tTotal = (t['total'] ?? 0) as int;
        final tPutra = (t['putra'] ?? 0) as int;
        final tPutri = (t['putri'] ?? 0) as int;
        final tPct = total > 0 ? ((tTotal / total) * 100).round() : 0;

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFE2E8F0),
            ),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    t['nama_tingkat'] ?? 'Tingkat',
                    style: GoogleFonts.outfit(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  Row(
                    children: [
                      Text(
                        "$tTotal Santri ($tPct%)",
                        style: GoogleFonts.outfit(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF10B981),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        "($tPutra L / $tPutri P)",
                        style: GoogleFonts.outfit(
                          fontSize: 11,
                          color: isDark ? Colors.white38 : Colors.black38,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(
                  value: total > 0 ? (tTotal / total).clamp(0.0, 1.0) : 0.0,
                  backgroundColor: isDark ? Colors.white12 : const Color(0xFFF1F5F9),
                  valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF10B981)),
                  minHeight: 6,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // Grafik Distribusi Siswa Per Tingkat
  Widget _buildTingkatChart(List<dynamic> list, int total, bool isDark) {
    if (list.isEmpty || total == 0) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Grafik Distribusi Siswa Per Tingkat",
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white70 : const Color(0xFF334155),
                ),
              ),
              Row(
                children: [
                  Container(width: 7, height: 7, decoration: const BoxDecoration(color: Color(0xFF3B82F6), shape: BoxShape.circle)),
                  const SizedBox(width: 4),
                  Text("L", style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF3B82F6))),
                  const SizedBox(width: 8),
                  Container(width: 7, height: 7, decoration: const BoxDecoration(color: Color(0xFFEC4899), shape: BoxShape.circle)),
                  const SizedBox(width: 4),
                  Text("P", style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFFEC4899))),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...list.map((t) {
            final tTotal = (t['total'] ?? 0) as int;
            final tPutra = (t['putra'] ?? 0) as int;
            final tPutri = (t['putri'] ?? 0) as int;
            final double ratio = total > 0 ? (tTotal / total).clamp(0.0, 1.0) : 0.0;
            final tName = t['nama_tingkat'] ?? 'Tingkat';

            return Padding(
              padding: const EdgeInsets.only(bottom: 9),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        tName,
                        style: GoogleFonts.outfit(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white70 : const Color(0xFF1E293B),
                        ),
                      ),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            "$tTotal Santri (${(ratio * 100).round()}%)",
                            style: GoogleFonts.outfit(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF10B981),
                            ),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            "($tPutra L / $tPutri P)",
                            style: GoogleFonts.outfit(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: isDark ? Colors.white54 : const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 5),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: SizedBox(
                      height: 10,
                      child: Row(
                        children: [
                          if (tTotal > 0)
                            Expanded(
                              flex: (ratio * 1000).round(),
                              child: Row(
                                children: [
                                  if (tPutra > 0)
                                    Expanded(
                                      flex: tPutra,
                                      child: Container(color: const Color(0xFF3B82F6)),
                                    ),
                                  if (tPutri > 0)
                                    Expanded(
                                      flex: tPutri,
                                      child: Container(color: const Color(0xFFEC4899)),
                                    ),
                                ],
                              ),
                            ),
                          if (total - tTotal > 0)
                            Expanded(
                              flex: (((1.0 - ratio)) * 1000).round(),
                              child: Container(
                                color: isDark ? Colors.white12 : const Color(0xFFF1F5F9),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ],
      ),
    );
  }

  // Grafik Perbandingan Kelas Terbesar
  Widget _buildKelasChart(List<dynamic> list, int total, bool isDark) {
    if (list.isEmpty) return const SizedBox.shrink();
    final sorted = List<dynamic>.from(list);
    sorted.sort((a, b) => ((b['total'] ?? 0) as int).compareTo((a['total'] ?? 0) as int));
    final displayClasses = sorted;
    final maxCount = displayClasses.isNotEmpty ? ((displayClasses.first['total'] ?? 0) as int) : 1;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Grafik Perbandingan Kelas",
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white70 : const Color(0xFF334155),
                ),
              ),
              Text(
                "Seluruh Kelas (${displayClasses.length})",
                style: GoogleFonts.outfit(
                  fontSize: 10,
                  color: isDark ? Colors.white38 : Colors.black38,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...displayClasses.map((k) {
            final kTotal = (k['total'] ?? 0) as int;
            final kPutra = (k['putra'] ?? 0) as int;
            final kPutri = (k['putri'] ?? 0) as int;
            final double ratio = maxCount > 0 ? (kTotal / maxCount).clamp(0.0, 1.0) : 0.0;

            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  SizedBox(
                    width: 75,
                    child: Text(
                      "Kelas ${k['nama_kelas']}",
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: isDark ? Colors.white70 : const Color(0xFF1E293B),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(5),
                      child: SizedBox(
                        height: 10,
                        child: Row(
                          children: [
                            if (kTotal > 0)
                              Expanded(
                                flex: (ratio * 1000).round(),
                                child: Row(
                                  children: [
                                    if (kPutra > 0)
                                      Expanded(
                                        flex: kPutra,
                                        child: Container(color: const Color(0xFF3B82F6)),
                                      ),
                                    if (kPutri > 0)
                                      Expanded(
                                        flex: kPutri,
                                        child: Container(color: const Color(0xFFEC4899)),
                                      ),
                                  ],
                                ),
                              ),
                            if (maxCount - kTotal > 0)
                              Expanded(
                                flex: (((1.0 - ratio)) * 1000).round(),
                                child: Container(
                                  color: isDark ? Colors.white12 : const Color(0xFFF1F5F9),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    width: 28,
                    child: Text(
                      "$kTotal",
                      textAlign: TextAlign.end,
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF10B981),
                      ),
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ],
      ),
    );
  }

  // Kelas Grid (Desain Kartu 3 Kolom Modern & Non-AI-Slop)
  Widget _buildKelasGrid(List<dynamic> list, int total, bool isDark) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 0.82,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final k = list[index];
        final kTotal = (k['total'] ?? 0) as int;
        final kPutra = (k['putra'] ?? 0) as int;
        final kPutri = (k['putri'] ?? 0) as int;
        final int? tingkat = k['tingkat'] is int ? k['tingkat'] as int : int.tryParse(k['tingkat']?.toString() ?? '');
        final tingkatLabel = tingkat == 99
            ? 'SP'
            : (tingkat == 0 ? 'Sifir' : (tingkat != null ? 'Tkt $tingkat' : ''));

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF131C2E) : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: const Color(0xFF10B981).withOpacity(isDark ? 0.3 : 0.2),
              width: 1.1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Header Kelas & Badge
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          "Kelas ${k['nama_kelas']}",
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Container(
                        width: 5,
                        height: 5,
                        decoration: const BoxDecoration(
                          color: Color(0xFF10B981),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ],
                  ),
                  if (tingkatLabel.isNotEmpty) ...[
                    const SizedBox(height: 1),
                    Text(
                      tingkatLabel,
                      style: GoogleFonts.outfit(
                        fontSize: 9,
                        fontWeight: FontWeight.w500,
                        color: isDark ? Colors.white54 : const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ],
              ),

              // Angka Total Santri
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    "$kTotal",
                    style: GoogleFonts.outfit(
                      fontSize: 19,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF10B981),
                    ),
                  ),
                  const SizedBox(width: 3),
                  Text(
                    "Santri",
                    style: GoogleFonts.outfit(
                      fontSize: 9.5,
                      fontWeight: FontWeight.w500,
                      color: isDark ? Colors.white54 : const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),

              // Dual-color progress bar
              if (kTotal > 0)
                ClipRRect(
                  borderRadius: BorderRadius.circular(3),
                  child: SizedBox(
                    height: 3.5,
                    child: Row(
                      children: [
                        if (kPutra > 0)
                          Expanded(
                            flex: kPutra,
                            child: Container(color: const Color(0xFF3B82F6)),
                          ),
                        if (kPutri > 0)
                          Expanded(
                            flex: kPutri,
                            child: Container(color: const Color(0xFFEC4899)),
                          ),
                      ],
                    ),
                  ),
                ),

              // Rincian Putra & Putri
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 5,
                        height: 5,
                        decoration: const BoxDecoration(
                          color: Color(0xFF3B82F6),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 3),
                      Text(
                        "$kPutra L",
                        style: GoogleFonts.outfit(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF3B82F6),
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      Container(
                        width: 5,
                        height: 5,
                        decoration: const BoxDecoration(
                          color: Color(0xFFEC4899),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 3),
                      Text(
                        "$kPutri P",
                        style: GoogleFonts.outfit(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFFEC4899),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  // Grafik Tren Antar Tahun Ajaran
  Widget _buildTrenChart(List<dynamic> list, bool isDark) {
    if (list.isEmpty) return const SizedBox.shrink();
    int maxVal = 1;
    for (var it in list) {
      final cnt = (it['total_diniyah'] ?? 0) as int;
      if (cnt > maxVal) maxVal = cnt;
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Grafik Tren Siswa Antar Tahun",
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white70 : const Color(0xFF334155),
                ),
              ),
              Text(
                "Ketuk batang untuk pilih",
                style: GoogleFonts.outfit(
                  fontSize: 10,
                  color: isDark ? Colors.white38 : Colors.black38,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 110,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: list.map((tr) {
                final cnt = (tr['total_diniyah'] ?? 0) as int;
                final isSelected = tr['tahun_ajaran_id'] == _selectedTahunAjaranId;
                final isActive = tr['is_active'] == true;
                final double heightRatio = maxVal > 0 ? (cnt / maxVal).clamp(0.08, 1.0) : 0.08;

                return Expanded(
                  child: GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedTahunAjaranId = tr['tahun_ajaran_id'];
                        _selectedTahunAjaranKode = tr['kode'] ?? '';
                      });
                      _fetchStatistik();
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Text(
                            "$cnt",
                            style: GoogleFonts.outfit(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: isSelected
                                  ? const Color(0xFF10B981)
                                  : (isDark ? Colors.white60 : const Color(0xFF64748B)),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Container(
                            height: 65 * heightRatio,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.bottomCenter,
                                end: Alignment.topCenter,
                                colors: isSelected
                                    ? [const Color(0xFF047857), const Color(0xFF10B981)]
                                    : (isDark
                                        ? [const Color(0xFF334155), const Color(0xFF475569)]
                                        : [const Color(0xFFCBD5E1), const Color(0xFF94A3B8)]),
                              ),
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
                              boxShadow: isSelected
                                  ? [
                                      BoxShadow(
                                        color: const Color(0xFF10B981).withOpacity(0.4),
                                        blurRadius: 6,
                                        offset: const Offset(0, 2),
                                      ),
                                    ]
                                  : null,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            tr['kode']?.toString().split('-').first ?? '-',
                            style: GoogleFonts.outfit(
                              fontSize: 9,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                              color: isSelected
                                  ? const Color(0xFF10B981)
                                  : (isDark ? Colors.white54 : const Color(0xFF64748B)),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (isActive)
                            Container(
                              margin: const EdgeInsets.only(top: 2),
                              width: 4,
                              height: 4,
                              decoration: const BoxDecoration(
                                color: Color(0xFF10B981),
                                shape: BoxShape.circle,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  // Tren List
  Widget _buildTrenList(List<dynamic> list, bool isDark) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: list.map((tr) {
          final isSelected = tr['tahun_ajaran_id'] == _selectedTahunAjaranId;
          return GestureDetector(
            onTap: () {
              setState(() {
                _selectedTahunAjaranId = tr['tahun_ajaran_id'];
                _selectedTahunAjaranKode = tr['kode'] ?? '';
              });
              _fetchStatistik();
            },
            child: Container(
              margin: const EdgeInsets.only(right: 10),
              padding: const EdgeInsets.all(14),
              width: 140,
              decoration: BoxDecoration(
                color: isSelected
                    ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5))
                    : (isDark ? const Color(0xFF1E293B) : Colors.white),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSelected ? const Color(0xFF10B981) : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
                  width: isSelected ? 1.5 : 1,
                ),
              ),
              child: Column(
                children: [
                  Text(
                    tr['kode'] ?? '-',
                    style: GoogleFonts.outfit(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isSelected
                          ? const Color(0xFF10B981)
                          : (isDark ? Colors.white70 : const Color(0xFF475569)),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    "${tr['total_diniyah'] ?? 0}",
                    style: GoogleFonts.outfit(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  Text(
                    "Siswa",
                    style: GoogleFonts.outfit(
                      fontSize: 10,
                      color: isDark ? Colors.white38 : Colors.black38,
                    ),
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  void _showTahunAjaranPicker(bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Pilih Tahun Ajaran",
                  style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.black),
                ),
                const SizedBox(height: 12),
                Flexible(
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: _tahunAjaranList.length,
                    itemBuilder: (context, index) {
                      final ta = _tahunAjaranList[index];
                      final isSelected = ta['id'] == _selectedTahunAjaranId;
                      return ListTile(
                        title: Text(
                          "${ta['kode']} ${ta['is_active'] == true ? '★ (Aktif)' : ''}",
                          style: GoogleFonts.outfit(
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                            color: isSelected ? const Color(0xFF10B981) : (isDark ? Colors.white : Colors.black),
                          ),
                        ),
                        trailing: isSelected ? const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981)) : null,
                        onTap: () {
                          Navigator.pop(context);
                          setState(() {
                            _selectedTahunAjaranId = ta['id'];
                            _selectedTahunAjaranKode = ta['kode'] ?? '';
                          });
                          _fetchStatistik();
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildErrorView(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Column(
          children: [
            const Icon(Icons.error_outline_rounded, size: 40, color: Colors.redAccent),
            const SizedBox(height: 12),
            Text(
              "Gagal memuat statistik",
              style: GoogleFonts.outfit(
                color: isDark ? Colors.white : const Color(0xFF0F172A),
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              _errorMessage ?? '',
              style: GoogleFonts.outfit(color: Colors.redAccent, fontSize: 12),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _fetchStatistik,
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
              child: const Text("Coba Lagi"),
            ),
          ],
        ),
      ),
    );
  }
}
