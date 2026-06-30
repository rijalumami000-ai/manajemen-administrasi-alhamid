import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';

class LaporanAbsensiScreen extends StatefulWidget {
  const LaporanAbsensiScreen({super.key});

  @override
  State<LaporanAbsensiScreen> createState() => _LaporanAbsensiScreenState();
}

class _LaporanAbsensiScreenState extends State<LaporanAbsensiScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoadingClasses = true;
  bool _isLoadingData = false;
  String? _errorMessage;

  List<dynamic> _classList = [];
  Map<String, dynamic>? _selectedClass;

  List<dynamic> _tahunAjaranList = [];
  Map<String, dynamic>? _selectedTahunAjaran;

  String _selectedSemester = 'Ganjil'; // Ganjil or Genap

  Map<String, dynamic>? _reportData;
  List<dynamic> _filteredSantri = [];
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    setState(() {
      _isLoadingClasses = true;
      _errorMessage = null;
    });

    try {
      // 1. Fetch dashboard to get active year and classes
      final dash = await _apiService.getDashboard();
      final activeYear = dash['tahunAjaran'];
      _selectedSemester = activeYear?['semester'] ?? 'Ganjil';

      // 2. Fetch classes
      final classRes = await _apiService.getClasses();
      _classList = classRes['classes'] ?? [];
      _tahunAjaranList = classRes['tahunAjaranList'] ?? [];

      // Find active tahun ajaran from list
      if (activeYear != null && _tahunAjaranList.isNotEmpty) {
        _selectedTahunAjaran = _tahunAjaranList.firstWhere(
          (y) => y['id'] == activeYear['id'],
          orElse: () => _tahunAjaranList.first,
        );
      } else if (_tahunAjaranList.isNotEmpty) {
        _selectedTahunAjaran = _tahunAjaranList.first;
      }

      setState(() {
        _isLoadingClasses = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoadingClasses = false;
      });
    }
  }

  Future<void> _fetchAbsensiReport() async {
    if (_selectedClass == null) return;

    setState(() {
      _isLoadingData = true;
      _errorMessage = null;
      _reportData = null;
    });

    try {
      final res = await _apiService.getAbsensiReport(
        kelasId: _selectedClass!['id'],
        tahunAjaranId: _selectedTahunAjaran?['id'],
        semester: _selectedSemester,
      );

      setState(() {
        _reportData = res;
        _isLoadingData = false;
        _applySearchFilter();
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoadingData = false;
      });
    }
  }

  void _applySearchFilter() {
    if (_reportData == null) return;
    final list = _reportData!['santri'] as List<dynamic>? ?? [];
    final query = _searchController.text.toLowerCase().trim();

    setState(() {
      if (query.isEmpty) {
        _filteredSantri = list;
      } else {
        _filteredSantri = list.where((s) {
          final name = (s['nama'] ?? '').toString().toLowerCase();
          final nis = (s['nis'] ?? '').toString().toLowerCase();
          return name.contains(query) || nis.contains(query);
        }).toList();
      }
    });
  }

  Future<void> _fetchClassesForFilters() async {
    setState(() {
      _isLoadingClasses = true;
      _errorMessage = null;
      _reportData = null;
      _selectedClass = null;
      _searchController.clear();
    });

    try {
      final classRes = await _apiService.getClasses(
        tahunAjaranId: _selectedTahunAjaran?['id'],
        semester: _selectedSemester,
      );
      setState(() {
        _classList = classRes['classes'] ?? [];
        _isLoadingClasses = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoadingClasses = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;
    final headingColor = isDark ? Colors.white : const Color(0xFF0D1527);

    return Scaffold(
      backgroundColor: context.scaffoldBg,
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF0D1527) : Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: headingColor, size: 20),
          onPressed: () {
            if (_selectedClass != null) {
              setState(() {
                _selectedClass = null;
                _reportData = null;
                _searchController.clear();
              });
            } else {
              Navigator.pop(context);
            }
          },
        ),
        title: Text(
          _selectedClass == null
              ? 'Laporan Absensi Santri'
              : 'Absensi Kelas ${_selectedClass!['nama']}',
          style: GoogleFonts.outfit(color: headingColor, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: _isLoadingClasses
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : Column(
              children: [
                _buildFilterBar(isDark),
                const Divider(height: 1),
                Expanded(
                  child: _isLoadingData
                      ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
                      : _errorMessage != null
                          ? Center(
                              child: Padding(
                                padding: const EdgeInsets.all(24.0),
                                child: Text(_errorMessage!, style: GoogleFonts.outfit(color: Colors.redAccent)),
                              ),
                            )
                          : _selectedClass == null
                              ? _buildKelasSelectorGrid(isDark)
                              : _buildReportContent(isDark),
                ),
              ],
            ),
    );
  }

  Widget _buildFilterBar(bool isDark) {
    final titleColor = isDark ? Colors.white : const Color(0xFF0F172A);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: isDark ? const Color(0xFF131C2E) : Colors.white,
      child: Row(
        children: [
          // Tahun Ajaran
          Expanded(
            child: DropdownButtonFormField<Map<String, dynamic>>(
              value: _selectedTahunAjaran,
              dropdownColor: isDark ? const Color(0xFF1F2937) : Colors.white,
              decoration: InputDecoration(
                labelText: "Tahun Ajaran",
                labelStyle: GoogleFonts.outfit(color: titleColor.withOpacity(0.6), fontSize: 11),
                filled: true,
                fillColor: isDark ? const Color(0xFF1F2937) : const Color(0xFFF1F5F9),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              ),
              style: GoogleFonts.outfit(color: titleColor, fontSize: 13),
              items: _tahunAjaranList.map<DropdownMenuItem<Map<String, dynamic>>>((y) {
                return DropdownMenuItem<Map<String, dynamic>>(
                  value: y as Map<String, dynamic>,
                  child: Text(y['kode'] ?? ''),
                );
              }).toList(),
              onChanged: (val) {
                setState(() {
                  _selectedTahunAjaran = val;
                });
                _fetchClassesForFilters();
              },
            ),
          ),
          const SizedBox(width: 12),
          // Semester
          Expanded(
            child: DropdownButtonFormField<String>(
              value: _selectedSemester,
              dropdownColor: isDark ? const Color(0xFF1F2937) : Colors.white,
              decoration: InputDecoration(
                labelText: "Semester",
                labelStyle: GoogleFonts.outfit(color: titleColor.withOpacity(0.6), fontSize: 11),
                filled: true,
                fillColor: isDark ? const Color(0xFF1F2937) : const Color(0xFFF1F5F9),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              ),
              style: GoogleFonts.outfit(color: titleColor, fontSize: 13),
              items: const [
                DropdownMenuItem(value: 'Ganjil', child: Text("Ganjil")),
                DropdownMenuItem(value: 'Genap', child: Text("Genap")),
              ],
              onChanged: (val) {
                if (val != null) {
                  setState(() {
                    _selectedSemester = val;
                  });
                  _fetchClassesForFilters();
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKelasSelectorGrid(bool isDark) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            "PILIH KELAS DINIYAH",
            style: GoogleFonts.outfit(
              color: context.subTitleColor,
              fontSize: 11,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 16),
          _classList.isEmpty
              ? Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: context.cardBg,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: context.borderColor),
                  ),
                  child: Center(
                    child: Text(
                      "Belum ada daftar kelas.",
                      style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 13),
                    ),
                  ),
                )
              : GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.6,
                  ),
                  itemCount: _classList.length,
                  itemBuilder: (context, index) {
                    final c = _classList[index];
                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          _selectedClass = c;
                        });
                        _fetchAbsensiReport();
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: context.borderColor),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
                              blurRadius: 6,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Text(
                          c['nama'] ?? '-',
                          style: GoogleFonts.outfit(
                            color: context.titleColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ],
      ),
    );
  }

  Widget _buildReportContent(bool isDark) {
    return Column(
      children: [
        // Search Bar
        Padding(
          padding: const EdgeInsets.all(12.0),
          child: TextField(
            controller: _searchController,
            onChanged: (_) => _applySearchFilter(),
            style: GoogleFonts.outfit(color: context.titleColor),
            decoration: InputDecoration(
              hintText: "Cari nama / NIS santri...",
              hintStyle: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 13),
              prefixIcon: Icon(Icons.search_rounded, color: context.subTitleColor, size: 20),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear_rounded, size: 18),
                      onPressed: () {
                        _searchController.clear();
                        _applySearchFilter();
                      },
                    )
                  : null,
              filled: true,
              fillColor: isDark ? const Color(0xFF131C2E) : Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: context.borderColor),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: context.borderColor),
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 8),
            ),
          ),
        ),

        // List
        Expanded(
          child: _filteredSantri.isEmpty
              ? Center(
                  child: Text(
                    "Tidak ada data absensi santri.",
                    style: GoogleFonts.outfit(color: context.subTitleColor),
                  ),
                )
              : ListView.separated(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.only(left: 12, right: 12, bottom: 20),
                  itemCount: _filteredSantri.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final s = _filteredSantri[index];
                    final total = s['total'] as Map<String, dynamic>? ?? {'sakit': 0, 'izin': 0, 'alpa': 0};
                    final monthly = s['absensi'] as Map<String, dynamic>? ?? {};

                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: context.cardBg,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: context.borderColor),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                backgroundColor: isDark ? Colors.white10 : Colors.black12,
                                radius: 12,
                                child: Text(
                                  "${index + 1}",
                                  style: GoogleFonts.outfit(color: context.titleColor, fontSize: 10, fontWeight: FontWeight.bold),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      s['nama'] ?? '-',
                                      style: GoogleFonts.outfit(color: context.titleColor, fontWeight: FontWeight.bold, fontSize: 14),
                                    ),
                                    Text(
                                      "NIS: ${s['nis'] ?? '-'}",
                                      style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 11),
                                    ),
                                  ],
                                ),
                              ),
                              // Totals Wrap
                              Row(
                                children: [
                                  _buildTotalBadge('S: ${total['sakit'] ?? 0}', const Color(0xFFF59E0B)),
                                  const SizedBox(width: 4),
                                  _buildTotalBadge('I: ${total['izin'] ?? 0}', const Color(0xFF3B82F6)),
                                  const SizedBox(width: 4),
                                  _buildTotalBadge('A: ${total['alpa'] ?? 0}', const Color(0xFFEF4444)),
                                ],
                              ),
                            ],
                          ),
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 8.0),
                            child: Divider(height: 1),
                          ),
                          // Monthly detail
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: monthly.entries.map<Widget>((entry) {
                              final mName = entry.key;
                              final val = entry.value as Map<String, dynamic>? ?? {'sakit': 0, 'izin': 0, 'alpa': 0};
                              final sCount = val['sakit'] ?? 0;
                              final iCount = val['izin'] ?? 0;
                              final aCount = val['alpa'] ?? 0;

                              final bool hasAbsen = sCount > 0 || iCount > 0 || aCount > 0;

                              return Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                                decoration: BoxDecoration(
                                  color: hasAbsen
                                      ? const Color(0xFF10B981).withOpacity(0.08)
                                      : (isDark ? Colors.white.withOpacity(0.03) : Colors.black.withOpacity(0.02)),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: hasAbsen
                                        ? const Color(0xFF10B981).withOpacity(0.15)
                                        : Colors.transparent,
                                  ),
                                ),
                                child: Text(
                                  "$mName: ${sCount}S, ${iCount}I, ${aCount}A",
                                  style: GoogleFonts.outfit(
                                    color: hasAbsen ? const Color(0xFF10B981) : context.subTitleColor,
                                    fontSize: 10,
                                    fontWeight: hasAbsen ? FontWeight.bold : FontWeight.normal,
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildTotalBadge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: GoogleFonts.outfit(color: color, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }
}
