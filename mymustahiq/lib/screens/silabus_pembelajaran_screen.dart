import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';

class SilabusPembelajaranScreen extends StatefulWidget {
  const SilabusPembelajaranScreen({super.key});

  @override
  State<SilabusPembelajaranScreen> createState() => _SilabusPembelajaranScreenState();
}

class _SilabusPembelajaranScreenState extends State<SilabusPembelajaranScreen> {
  final ApiService _apiService = ApiService();

  // Reference lists
  List<dynamic> _tahunAjaranList = [];
  List<dynamic> _kelasList = [];

  // Selected filters
  Map<String, dynamic>? _selectedTahunAjaran;
  String _selectedSemester = 'Ganjil';
  Map<String, dynamic>? _selectedKelas;

  // Data states
  List<dynamic> _silabusList = [];
  bool _isLoadingFilters = true;
  bool _isLoadingData = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadFilters();
  }

  Future<void> _loadFilters() async {
    setState(() {
      _isLoadingFilters = true;
      _errorMessage = null;
    });
    try {
      // 1. Fetch Tahun Ajaran
      final taResult = await _apiService.getTahunAjaranList();
      final taList = taResult['tahunAjaran'] as List<dynamic>? ?? [];
      final activeTa = taList.firstWhere(
        (ta) => ta['is_active'] == true,
        orElse: () => taList.isNotEmpty ? taList.first : null,
      );

      // 2. Set active semester
      final activeSem = taResult['activeSemester']?.toString() ?? 'Ganjil';

      if (!mounted) return;
      setState(() {
        _tahunAjaranList = taList;
        _selectedTahunAjaran = activeTa;
        _selectedSemester = activeSem;
      });

      // 3. Fetch Classes
      if (activeTa != null) {
        await _loadClasses(activeTa['id']);
      } else {
        setState(() {
          _isLoadingFilters = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoadingFilters = false;
      });
    }
  }

  Future<void> _loadClasses(int tahunAjaranId) async {
    try {
      final res = await _apiService.getTimSoalData(tahunAjaranId: tahunAjaranId);
      final classes = res['classes'] as List<dynamic>? ?? [];
      
      if (!mounted) return;
      setState(() {
        _kelasList = classes;
        _selectedKelas = classes.isNotEmpty ? classes.first : null;
        _isLoadingFilters = false;
      });

      if (_selectedKelas != null) {
        _fetchSilabus();
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoadingFilters = false;
      });
    }
  }

  Future<void> _fetchSilabus() async {
    if (_selectedTahunAjaran == null || _selectedKelas == null) return;
    setState(() {
      _isLoadingData = true;
      _errorMessage = null;
    });
    try {
      final data = await _apiService.getSilabus(
        tahunAjaranId: _selectedTahunAjaran!['id'],
        semester: _selectedSemester,
        kelasId: _selectedKelas!['id'],
      );
      if (!mounted) return;
      setState(() {
        _silabusList = data;
        _isLoadingData = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoadingData = false;
      });
    }
  }

  // Groups list items by Bulan
  Map<String, List<dynamic>> _groupSilabusByBulan() {
    final Map<String, List<dynamic>> grouped = {};
    for (var item in _silabusList) {
      final String bulan = item['bulan']?.toString() ?? 'Lainnya';
      if (!grouped.containsKey(bulan)) {
        grouped[bulan] = [];
      }
      grouped[bulan]!.add(item);
    }
    return grouped;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;
    final headingColor = isDark ? Colors.white : const Color(0xFF0D1527);
    final accentColor = const Color(0xFF10B981);

    final groupedData = _groupSilabusByBulan();
    // Months ordering
    final orderedMonths = _selectedSemester == 'Ganjil'
        ? ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Lainnya']
        : ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Lainnya'];

    final activeMonths = orderedMonths.where((m) => groupedData.containsKey(m)).toList();

    return Scaffold(
      backgroundColor: context.scaffoldBg,
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF0D1527) : Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: headingColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Silabus Pembelajaran',
          style: GoogleFonts.outfit(
            color: headingColor,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: headingColor),
            onPressed: () {
              if (_selectedKelas != null) {
                _fetchSilabus();
              }
            },
          ),
        ],
      ),
      body: _isLoadingFilters
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : Column(
              children: [
                // Top filter panel
                Container(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF0D1527) : Colors.white,
                    borderRadius: const BorderRadius.only(
                      bottomLeft: Radius.circular(20),
                      bottomRight: Radius.circular(20),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          // Tahun Ajaran
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                              decoration: BoxDecoration(
                                color: context.inputBg,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: context.borderColor),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<Map<String, dynamic>>(
                                  value: _selectedTahunAjaran,
                                  isExpanded: true,
                                  dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                                  style: GoogleFonts.outfit(color: context.titleColor, fontSize: 12, fontWeight: FontWeight.w600),
                                  items: _tahunAjaranList.map((ta) {
                                    return DropdownMenuItem<Map<String, dynamic>>(
                                      value: ta as Map<String, dynamic>,
                                      child: Text(ta['kode'] ?? '-'),
                                    );
                                  }).toList(),
                                  onChanged: (val) {
                                    if (val != null) {
                                      setState(() {
                                        _selectedTahunAjaran = val;
                                        _isLoadingFilters = true;
                                      });
                                      _loadClasses(val['id']);
                                    }
                                  },
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          // Semester
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                              decoration: BoxDecoration(
                                color: context.inputBg,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: context.borderColor),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  value: _selectedSemester,
                                  isExpanded: true,
                                  dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                                  style: GoogleFonts.outfit(color: context.titleColor, fontSize: 12, fontWeight: FontWeight.w600),
                                  items: ['Ganjil', 'Genap'].map((sem) {
                                    return DropdownMenuItem<String>(
                                      value: sem,
                                      child: Text('Sem. $sem'),
                                    );
                                  }).toList(),
                                  onChanged: (val) {
                                    if (val != null) {
                                      setState(() => _selectedSemester = val);
                                      _fetchSilabus();
                                    }
                                  },
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      // Kelas Diniyah
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                        decoration: BoxDecoration(
                          color: context.inputBg,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: context.borderColor),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<Map<String, dynamic>>(
                            value: _selectedKelas,
                            isExpanded: true,
                            hint: Text('Pilih Kelas Diniyah', style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 12)),
                            dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                            style: GoogleFonts.outfit(color: context.titleColor, fontSize: 12, fontWeight: FontWeight.w600),
                            items: _kelasList.map((k) {
                              return DropdownMenuItem<Map<String, dynamic>>(
                                value: k as Map<String, dynamic>,
                                child: Text(k['nama'] ?? '-'),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) {
                                setState(() => _selectedKelas = val);
                                _fetchSilabus();
                              }
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Main body content
                Expanded(
                  child: _isLoadingData
                      ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
                      : _errorMessage != null
                          ? Center(
                              child: Padding(
                                padding: const EdgeInsets.all(24),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 48),
                                    const SizedBox(height: 12),
                                    Text(
                                      _errorMessage!,
                                      textAlign: TextAlign.center,
                                      style: GoogleFonts.outfit(color: Colors.redAccent),
                                    ),
                                  ],
                                ),
                              ),
                            )
                          : _silabusList.isEmpty
                              ? Center(
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.menu_book_rounded,
                                        size: 64,
                                        color: context.subTitleColor.withOpacity(0.3),
                                      ),
                                      const SizedBox(height: 16),
                                      Text(
                                        'Belum ada silabus terekam\nuntuk kelas dan semester ini.',
                                        textAlign: TextAlign.center,
                                        style: GoogleFonts.outfit(
                                          color: context.subTitleColor,
                                          fontSize: 14,
                                          height: 1.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                )
                              : ListView.builder(
                                  physics: const BouncingScrollPhysics(),
                                  padding: const EdgeInsets.all(16),
                                  itemCount: activeMonths.length,
                                  itemBuilder: (context, mIdx) {
                                    final month = activeMonths[mIdx];
                                    final items = groupedData[month]!;

                                    return Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Month Header Banner
                                        Padding(
                                          padding: const EdgeInsets.only(top: 8.0, bottom: 12.0, left: 4.0),
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                            decoration: BoxDecoration(
                                              color: accentColor.withOpacity(0.12),
                                              borderRadius: BorderRadius.circular(10),
                                            ),
                                            child: Text(
                                              month.toUpperCase(),
                                              style: GoogleFonts.outfit(
                                                color: accentColor,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 12,
                                                letterSpacing: 0.5,
                                              ),
                                            ),
                                          ),
                                        ),
                                        // Cards
                                        ...items.map((row) => _buildSilabusCard(row, isDark)),
                                        const SizedBox(height: 12),
                                      ],
                                    );
                                  },
                                ),
                ),
              ],
            ),
    );
  }

  Widget _buildSilabusCard(Map<String, dynamic> row, bool isDark) {
    final pelajaran = row['pelajaran']?.toString() ?? '-';
    final pengajar = row['pengajar']?.toString() ?? 'Mustahiq';
    final ketentuan = row['ketentuan']?.toString() ?? '';
    final targetMateri = row['target_materi']?.toString() ?? '-';
    final targetPencapaian = row['target_pencapaian']?.toString() ?? '-';
    final targetMuhafadzoh = row['target_muhafadzoh']?.toString() ?? '';

    final isMustahiq = pengajar == 'Mustahiq';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: context.cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.2 : 0.02),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header info
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    pelajaran,
                    style: GoogleFonts.outfit(
                      color: context.titleColor,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isMustahiq
                        ? const Color(0xFF3B82F6).withOpacity(0.08)
                        : const Color(0xFF10B981).withOpacity(0.08),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    pengajar,
                    style: GoogleFonts.outfit(
                      color: isMustahiq ? const Color(0xFF2563EB) : const Color(0xFF059669),
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const Divider(height: 1, thickness: 1),

          // Detail rows
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Target Materi
                _buildDetailSection('Target Materi', targetMateri, isArabic: true),
                const SizedBox(height: 12),
                
                // Target Pencapaian
                _buildDetailSection('Target Pencapaian', targetPencapaian),
                
                // Ketentuan (if any)
                if (ketentuan.isNotEmpty && ketentuan != '-') ...[
                  const SizedBox(height: 12),
                  Text(
                    'Ketentuan',
                    style: GoogleFonts.outfit(
                      color: context.subTitleColor,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: context.scaffoldBg,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: context.borderColor),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: ketentuan
                          .split('\n')
                          .filter((s) => s.trim().isNotEmpty)
                          .map((bullet) => Padding(
                                padding: const EdgeInsets.only(bottom: 4.0),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('• ', style: GoogleFonts.outfit(color: const Color(0xFF10B981), fontWeight: FontWeight.bold)),
                                    Expanded(
                                      child: Text(
                                        bullet,
                                        style: GoogleFonts.outfit(
                                          color: context.titleColor,
                                          fontSize: 11,
                                          height: 1.4,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ))
                          .toList(),
                    ),
                  ),
                ],

                // Target Muhafadzoh (if any)
                if (targetMuhafadzoh.isNotEmpty && targetMuhafadzoh != '-') ...[
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFBBF24).withOpacity(0.08),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFFBBF24).withOpacity(0.2)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.bookmark_added_rounded, color: Color(0xFFD97706), size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Target Muhafadzoh: $targetMuhafadzoh',
                            style: GoogleFonts.outfit(
                              color: const Color(0xFFD97706),
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailSection(String title, String content, {bool isArabic = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: GoogleFonts.outfit(
            color: context.subTitleColor,
            fontSize: 11,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          content,
          textDirection: isArabic && _containsArabic(content) ? TextDirection.rtl : TextDirection.ltr,
          style: GoogleFonts.outfit(
            color: context.titleColor,
            fontSize: isArabic ? 14 : 12,
            fontWeight: isArabic ? FontWeight.w600 : FontWeight.normal,
            height: 1.4,
          ),
        ),
      ],
    );
  }

  bool _containsArabic(String text) {
    final exp = RegExp(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]');
    return exp.hasMatch(text);
  }
}

// Extension helper for filters
extension IterableFilter<E> on Iterable<E> {
  Iterable<E> filter(bool Function(E element) test) {
    return where(test);
  }
}
