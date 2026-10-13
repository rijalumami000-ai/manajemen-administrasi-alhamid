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
              _buildFilterSection(isDark),
              const SizedBox(height: 18),

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
                const SizedBox(height: 18),

                // Semester Activity Card
                _buildSemesterActivityCard(summary, total, isDark),
                const SizedBox(height: 20),

                // Breakdown Per Tingkat
                _buildSectionHeader("Distribusi Siswa Per Tingkat", "${perTingkat.length} Tingkat", isDark),
                const SizedBox(height: 12),
                _buildTingkatList(perTingkat, total, isDark),
                const SizedBox(height: 24),

                // Breakdown Per Kelas Diniyah
                _buildSectionHeader("Rincian Jumlah Siswa Per Kelas", "${perKelas.length} Kelas", isDark),
                const SizedBox(height: 12),
                _buildKelasGrid(perKelas, total, isDark),
                const SizedBox(height: 24),

                // Multi-year Trend
                _buildSectionHeader("Tren Antar Tahun Ajaran", "${tren.length} Periode", isDark),
                const SizedBox(height: 12),
                _buildTrenList(tren, isDark),
                const SizedBox(height: 30),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // Filter Section
  Widget _buildFilterSection(bool isDark) {
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
                _buildSemTab('Semua', 'semua', isDark),
                _buildSemTab('Ganjil', 'ganjil', isDark),
                _buildSemTab('Genap', 'genap', isDark),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSemTab(String label, String value, bool isDark) {
    final isSelected = _selectedSemester == value;
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
          padding: const EdgeInsets.symmetric(vertical: 8),
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
          child: Text(
            label,
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
              color: isSelected
                  ? (isDark ? Colors.white : const Color(0xFF064E3B))
                  : (isDark ? Colors.white60 : const Color(0xFF64748B)),
            ),
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

        // Putra vs Putri Cards
        Row(
          children: [
            Expanded(
              child: _buildGenderCard(
                label: "Putra (Banin)",
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
                label: "Putri (Banat)",
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
                child: _buildSemBar("Semester Ganjil", ganjil, total, const Color(0xFF3B82F6), isDark),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: _buildSemBar("Semester Genap", genap, total, const Color(0xFF10B981), isDark),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSemBar(String label, int count, int total, Color color, bool isDark) {
    final pct = total > 0 ? ((count / total) * 100).round() : 0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: GoogleFonts.outfit(fontSize: 11, color: isDark ? Colors.white60 : Colors.black54)),
            Text("$count", style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: total > 0 ? (count / total).clamp(0.0, 1.0) : 0.0,
            backgroundColor: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 6,
          ),
        ),
        const SizedBox(height: 2),
        Align(
          alignment: Alignment.centerRight,
          child: Text("$pct% aktif", style: GoogleFonts.outfit(fontSize: 10, color: isDark ? Colors.white38 : Colors.black38)),
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

  // Kelas Grid
  Widget _buildKelasGrid(List<dynamic> list, int total, bool isDark) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 1.5,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final k = list[index];
        final kTotal = (k['total'] ?? 0) as int;
        final kPutra = (k['putra'] ?? 0) as int;
        final kPutri = (k['putri'] ?? 0) as int;

        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFE2E8F0),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "Kelas ${k['nama_kelas']}",
                    style: GoogleFonts.outfit(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      "$kTotal",
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF10B981),
                      ),
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  Text(
                    "👦 $kPutra",
                    style: GoogleFonts.outfit(fontSize: 11, color: const Color(0xFF3B82F6), fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    "👧 $kPutri",
                    style: GoogleFonts.outfit(fontSize: 11, color: const Color(0xFFEC4899), fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ],
          ),
        );
      },
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
