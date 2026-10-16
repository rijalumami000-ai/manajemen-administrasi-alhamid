import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';

class StatistikPesantrenScreen extends StatefulWidget {
  const StatistikPesantrenScreen({super.key});

  @override
  State<StatistikPesantrenScreen> createState() => _StatistikPesantrenScreenState();
}

class _StatistikPesantrenScreenState extends State<StatistikPesantrenScreen> {
  final ApiService _apiService = ApiService();

  bool _isLoading = true;
  String? _errorMessage;

  Map<String, dynamic>? _summary;
  List<dynamic> _angkatanList = [];
  List<dynamic> _kamarList = [];
  int? _selectedYear;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await _apiService.getStatistikPesantren();
      if (mounted) {
        setState(() {
          _summary = res['summary'];
          _angkatanList = res['angkatan'] ?? [];
          _kamarList = res['kamarTop'] ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;

    return Scaffold(
      backgroundColor: context.scaffoldBg,
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.titleColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Statistik Pesantren",
              style: GoogleFonts.outfit(
                color: context.titleColor,
                fontWeight: FontWeight.bold,
                fontSize: 16.5,
              ),
            ),
            Text(
              "Data Kuantitatif Santri & Angkatan",
              style: GoogleFonts.outfit(
                color: context.subTitleColor,
                fontSize: 11,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            color: context.titleColor,
            onPressed: _loadData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.cloud_off_rounded, size: 48, color: Colors.grey[400]),
                        const SizedBox(height: 12),
                        Text(_errorMessage!, textAlign: TextAlign.center, style: GoogleFonts.outfit(color: Colors.grey)),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _loadData,
                          icon: const Icon(Icons.refresh_rounded, size: 18),
                          label: const Text("Coba Lagi"),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadData,
                  color: const Color(0xFF10B981),
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // 1. KPI SUMMARY CARDS
                        _buildKpiGrid(context, isDark),

                        const SizedBox(height: 20),

                        // 2. DEMOGRAFI BANIN & BANAT RATIO
                        _buildGenderRatioCard(context, isDark),

                        const SizedBox(height: 22),

                        // 3. GRAFIK PERKEMBANGAN KUANTITATIF PER TAHUN MASUK
                        _buildPerkembanganChartCard(context, isDark),

                        const SizedBox(height: 22),

                        // 4. RINCIAN PER ANGKATAN
                        _buildAngkatanBreakdown(context, isDark),

                        const SizedBox(height: 22),

                        // 5. TOP KAMAR / ASRAMA DISTRIBUTION
                        if (_kamarList.isNotEmpty) _buildTopKamarCard(context, isDark),

                        const SizedBox(height: 30),
                      ],
                    ),
                  ),
                ),
    );
  }

  // ── 1. KPI SUMMARY GRID ───────────────────────────────────────────────────
  Widget _buildKpiGrid(BuildContext context, bool isDark) {
    final total = _summary?['total_santri'] ?? 0;
    final putra = _summary?['total_putra'] ?? 0;
    final putri = _summary?['total_putri'] ?? 0;
    final angkatan = _summary?['total_angkatan'] ?? 0;

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                title: "Total Santri",
                value: "$total",
                subtitle: "Buku Induk Aktif",
                icon: Icons.groups_rounded,
                color: const Color(0xFF10B981),
                isDark: isDark,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildMetricCard(
                title: "Total Angkatan",
                value: "$angkatan",
                subtitle: "2020 s/d 2025",
                icon: Icons.calendar_view_month_rounded,
                color: const Color(0xFF8B5CF6),
                isDark: isDark,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                title: "Santri Putra (Banin)",
                value: "$putra",
                subtitle: total > 0 ? "${((putra / total) * 100).toStringAsFixed(1)}% Komposisi" : "-",
                icon: Icons.male_rounded,
                color: const Color(0xFF3B82F6),
                isDark: isDark,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildMetricCard(
                title: "Santri Putri (Banat)",
                value: "$putri",
                subtitle: total > 0 ? "${((putri / total) * 100).toStringAsFixed(1)}% Komposisi" : "-",
                icon: Icons.female_rounded,
                color: const Color(0xFFEC4899),
                isDark: isDark,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color color,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131D2E) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? const Color(0xFF334155).withOpacity(0.5) : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              const Spacer(),
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(color: color, shape: BoxShape.circle),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: context.titleColor,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: context.titleColor,
            ),
          ),
          Text(
            subtitle,
            style: GoogleFonts.outfit(
              fontSize: 10.5,
              fontWeight: FontWeight.w500,
              color: context.subTitleColor,
            ),
          ),
        ],
      ),
    );
  }

  // ── 2. DEMOGRAFI BANIN & BANAT RATIO CARD ────────────────────────────────
  Widget _buildGenderRatioCard(BuildContext context, bool isDark) {
    final total = (_summary?['total_santri'] ?? 0) as int;
    final putra = (_summary?['total_putra'] ?? 0) as int;
    final putri = (_summary?['total_putri'] ?? 0) as int;

    final pctPutra = total > 0 ? (putra / total) * 100 : 50.0;
    final pctPutri = total > 0 ? (putri / total) * 100 : 50.0;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131D2E) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF334155).withOpacity(0.5) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.pie_chart_rounded, size: 18, color: Color(0xFF10B981)),
              const SizedBox(width: 8),
              Text(
                "Rasio Demografi Santri",
                style: GoogleFonts.outfit(
                  fontSize: 14.5,
                  fontWeight: FontWeight.bold,
                  color: context.titleColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Two-tone progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: SizedBox(
              height: 16,
              child: Row(
                children: [
                  Expanded(
                    flex: (pctPutra * 10).round(),
                    child: Container(color: const Color(0xFF3B82F6)),
                  ),
                  const SizedBox(width: 2),
                  Expanded(
                    flex: (pctPutri * 10).round(),
                    child: Container(color: const Color(0xFFEC4899)),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 14),

          // Legend
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(width: 10, height: 10, decoration: const BoxDecoration(color: Color(0xFF3B82F6), shape: BoxShape.circle)),
                  const SizedBox(width: 6),
                  Text(
                    "Putra: $putra (${pctPutra.toStringAsFixed(1)}%)",
                    style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600, color: context.titleColor),
                  ),
                ],
              ),
              Row(
                children: [
                  Container(width: 10, height: 10, decoration: const BoxDecoration(color: Color(0xFFEC4899), shape: BoxShape.circle)),
                  const SizedBox(width: 6),
                  Text(
                    "Putri: $putri (${pctPutri.toStringAsFixed(1)}%)",
                    style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600, color: context.titleColor),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── 3. GRAFIK PERKEMBANGAN KUANTITATIF PER ANGKATAN ───────────────────────
  Widget _buildPerkembanganChartCard(BuildContext context, bool isDark) {
    if (_angkatanList.isEmpty) return const SizedBox.shrink();

    final maxVal = _angkatanList.map((e) => (e['total'] ?? 0) as int).reduce(math.max);
    final chartHeight = 160.0;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131D2E) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF334155).withOpacity(0.5) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Grafik Perkembangan Santri",
                    style: GoogleFonts.outfit(
                      fontSize: 14.5,
                      fontWeight: FontWeight.bold,
                      color: context.titleColor,
                    ),
                  ),
                  Text(
                    "Kuantitas santri baru per tahun masuk",
                    style: GoogleFonts.outfit(fontSize: 11, color: context.subTitleColor),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  "6 Periode",
                  style: GoogleFonts.outfit(
                    fontSize: 10.5,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF10B981),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Bar Chart Canvas
          SizedBox(
            height: chartHeight,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: _angkatanList.map((item) {
                final tahun = item['tahun']?.toString() ?? '-';
                final total = (item['total'] ?? 0) as int;
                final putra = (item['putra'] ?? 0) as int;
                final putri = (item['putri'] ?? 0) as int;
                final growth = item['growthPercent'];

                final barHeight = maxVal > 0 ? (total / maxVal) * (chartHeight - 40) : 10.0;
                final isSelected = _selectedYear != null && _selectedYear.toString() == tahun;

                return GestureDetector(
                  onTap: () {
                    setState(() {
                      if (_selectedYear?.toString() == tahun) {
                        _selectedYear = null;
                      } else {
                        _selectedYear = int.tryParse(tahun);
                      }
                    });
                  },
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      // Total count above bar
                      Text(
                        "$total",
                        style: GoogleFonts.outfit(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          color: isSelected ? const Color(0xFF10B981) : context.titleColor,
                        ),
                      ),
                      const SizedBox(height: 4),

                      // Stacked bar (Putra Blue, Putri Pink)
                      Container(
                        width: 32,
                        height: math.max(barHeight, 8),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          border: isSelected
                              ? Border.all(color: const Color(0xFF10B981), width: 2)
                              : null,
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: Column(
                            children: [
                              // Putri on top
                              Expanded(
                                flex: putri,
                                child: Container(color: const Color(0xFFEC4899)),
                              ),
                              // Putra on bottom
                              Expanded(
                                flex: putra,
                                child: Container(color: const Color(0xFF3B82F6)),
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 8),

                      // Year label
                      Text(
                        tahun,
                        style: GoogleFonts.outfit(
                          fontSize: 11,
                          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                          color: isSelected ? const Color(0xFF10B981) : context.subTitleColor,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),

          const SizedBox(height: 14),

          // Legend
          Center(
            child: Wrap(
              spacing: 16,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFF3B82F6), shape: BoxShape.circle)),
                    const SizedBox(width: 6),
                    Text("Putra", style: GoogleFonts.outfit(fontSize: 11, color: context.subTitleColor)),
                  ],
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFFEC4899), shape: BoxShape.circle)),
                    const SizedBox(width: 6),
                    Text("Putri", style: GoogleFonts.outfit(fontSize: 11, color: context.subTitleColor)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── 4. RINCIAN PER ANGKATAN (LIST DETAIL) ──────────────────────────────────
  Widget _buildAngkatanBreakdown(BuildContext context, bool isDark) {
    final filtered = _selectedYear == null
        ? _angkatanList
        : _angkatanList.where((a) => a['tahun'] == _selectedYear).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              "Rincian Per Angkatan",
              style: GoogleFonts.outfit(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: context.titleColor,
              ),
            ),
            if (_selectedYear != null)
              GestureDetector(
                onTap: () => setState(() => _selectedYear = null),
                child: Text(
                  "Tampilkan Semua",
                  style: GoogleFonts.outfit(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF10B981),
                  ),
                ),
              ),
          ],
        ),

        const SizedBox(height: 12),

        ...filtered.map((item) {
          final tahun = item['tahun']?.toString() ?? '-';
          final total = (item['total'] ?? 0) as int;
          final putra = (item['putra'] ?? 0) as int;
          final putri = (item['putri'] ?? 0) as int;
          final growth = item['growthPercent'];

          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF131D2E) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? const Color(0xFF334155).withOpacity(0.5) : const Color(0xFFE2E8F0),
              ),
            ),
            child: Row(
              children: [
                // Year Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    tahun,
                    style: GoogleFonts.outfit(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF10B981),
                    ),
                  ),
                ),

                const SizedBox(width: 14),

                // Counts
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            "$total Santri",
                            style: GoogleFonts.outfit(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: context.titleColor,
                            ),
                          ),
                          if (growth != null) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                              decoration: BoxDecoration(
                                color: (growth as num) >= 0
                                    ? const Color(0xFF10B981).withOpacity(0.15)
                                    : Colors.redAccent.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                "${growth >= 0 ? '+' : ''}$growth%",
                                style: GoogleFonts.outfit(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: growth >= 0 ? const Color(0xFF10B981) : Colors.redAccent,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                        "Putra: $putra • Putri: $putri",
                        style: GoogleFonts.outfit(
                          fontSize: 11.5,
                          color: context.subTitleColor,
                        ),
                      ),
                    ],
                  ),
                ),

                // Icon indicator
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 14,
                  color: context.subTitleColor.withOpacity(0.5),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  // ── 5. TOP KAMAR ASRAMA ───────────────────────────────────────────────────
  Widget _buildTopKamarCard(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131D2E) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF334155).withOpacity(0.5) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.meeting_room_rounded, size: 18, color: Color(0xFF8B5CF6)),
              const SizedBox(width: 8),
              Text(
                "Distribusi Asrama Terbanyak",
                style: GoogleFonts.outfit(
                  fontSize: 14.5,
                  fontWeight: FontWeight.bold,
                  color: context.titleColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ..._kamarList.take(5).map((km) {
            final nama = km['kamar'] ?? '-';
            final total = km['total'] ?? 0;
            final l = km['putra'] ?? 0;
            final p = km['putri'] ?? 0;

            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      nama,
                      style: GoogleFonts.outfit(fontSize: 12.5, fontWeight: FontWeight.w600, color: context.titleColor),
                    ),
                  ),
                  Text(
                    "$total Santri",
                    style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF8B5CF6)),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    "($l L / $p P)",
                    style: GoogleFonts.outfit(fontSize: 10.5, color: context.subTitleColor),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
