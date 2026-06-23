import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';

class InformasiUjianScreen extends StatefulWidget {
  final Map<String, dynamic> kelasMustahiq;

  const InformasiUjianScreen({
    super.key,
    required this.kelasMustahiq,
  });

  @override
  State<InformasiUjianScreen> createState() => _InformasiUjianScreenState();
}

class _InformasiUjianScreenState extends State<InformasiUjianScreen> with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  late TabController _tabController;

  List<dynamic> _tahunAjaranList = [];
  Map<String, dynamic>? _selectedTahunAjaran;
  String _selectedSemester = 'Ganjil';
  bool _loadingFilters = true;

  // Data states
  List<dynamic> _muhafadzohList = [];
  List<dynamic> _qiroahList = [];
  List<dynamic> _taftisyList = [];
  bool _isLoadingData = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadFiltersAndData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  String _getKelasStringFromTingkat(int tingkat) {
    switch (tingkat) {
      case 0: return 'Sifir';
      case 1: return 'Satu';
      case 2: return 'Dua';
      case 3: return 'Tiga';
      case 4: return 'Empat';
      case 5: return 'Lima';
      case 6: return 'Enam';
      case 99: return 'SP';
      default: return '';
    }
  }

  Future<void> _loadFiltersAndData() async {
    try {
      final taResult = await _apiService.getTahunAjaranList();
      _tahunAjaranList = taResult['tahunAjaran'] ?? [];

      _selectedTahunAjaran = _tahunAjaranList.firstWhere(
        (ta) => ta['is_active'] == true,
        orElse: () => _tahunAjaranList.first,
      );

      _selectedSemester = taResult['activeSemester'] ?? 'Ganjil';

      if (mounted) {
        setState(() {
          _loadingFilters = false;
        });
        _fetchTabsData();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loadingFilters = false;
          _errorMessage = e.toString().replaceFirst('Exception: ', '');
        });
      }
    }
  }

  Future<void> _fetchTabsData() async {
    if (_selectedTahunAjaran == null) return;

    setState(() {
      _isLoadingData = true;
      _errorMessage = null;
    });

    try {
      final taId = _selectedTahunAjaran!['id'] as int;
      final sem = _selectedSemester;
      final kelasId = widget.kelasMustahiq['id'] as int;

      // Fetch all three sources in parallel
      final results = await Future.wait([
        _apiService.getMuhafadzohInfo(tahunAjaranId: taId, semester: sem),
        _apiService.getQiroahMaqro(tahunAjaranId: taId, semester: sem),
        _apiService.getTaftisyMateri(kelasId: kelasId, tahunAjaranId: taId, semester: sem),
      ]);

      if (mounted) {
        setState(() {
          _muhafadzohList = results[0];
          _qiroahList = results[1];
          _taftisyList = results[2];
          _isLoadingData = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceFirst('Exception: ', '');
          _isLoadingData = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;
    final headingColor = isDark ? Colors.white : const Color(0xFF1E293B);
    final borderCol = isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.08);

    final classId = widget.kelasMustahiq['id'];
    final className = widget.kelasMustahiq['nama'] ?? '';
    final classTingkat = widget.kelasMustahiq['tingkat'] ?? 0;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          "Informasi Ujian - $className",
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: isDark ? Colors.white : const Color(0xFF1E293B),
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFF10B981),
          unselectedLabelColor: Colors.grey,
          indicatorColor: const Color(0xFF10B981),
          labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [
            Tab(text: "Muhafadzoh"),
            Tab(text: "Qiroatul Kitab"),
            Tab(text: "Taftisyul Kutub"),
          ],
        ),
      ),
      body: Column(
        children: [
          // Filter Section (Year/Semester)
          if (_loadingFilters)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: Center(child: CircularProgressIndicator(color: Color(0xFF10B981))),
            )
          else if (_tahunAjaranList.isNotEmpty)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: context.cardBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: borderCol),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<int>(
                      value: _selectedTahunAjaran?['id'],
                      decoration: InputDecoration(
                        labelText: "Tahun Ajaran",
                        labelStyle: GoogleFonts.outfit(fontSize: 11, color: isDark ? Colors.white70 : Colors.black87),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: borderCol),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: borderCol),
                        ),
                        filled: true,
                        fillColor: isDark ? const Color(0xFF1F2937) : const Color(0xFFF1F5F9),
                      ),
                      dropdownColor: isDark ? const Color(0xFF1F2937) : Colors.white,
                      items: _tahunAjaranList.map<DropdownMenuItem<int>>((ta) {
                        return DropdownMenuItem<int>(
                          value: ta['id'] as int,
                          child: Text(ta['kode'] ?? '', style: GoogleFonts.outfit(fontSize: 12, color: headingColor)),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _selectedTahunAjaran = _tahunAjaranList.firstWhere((ta) => ta['id'] == val);
                          });
                          _fetchTabsData();
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _selectedSemester,
                      decoration: InputDecoration(
                        labelText: "Semester",
                        labelStyle: GoogleFonts.outfit(fontSize: 11, color: isDark ? Colors.white70 : Colors.black87),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: borderCol),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: borderCol),
                        ),
                        filled: true,
                        fillColor: isDark ? const Color(0xFF1F2937) : const Color(0xFFF1F5F9),
                      ),
                      dropdownColor: isDark ? const Color(0xFF1F2937) : Colors.white,
                      items: const [
                        DropdownMenuItem<String>(value: 'Ganjil', child: Text('Ganjil', style: TextStyle(fontSize: 12))),
                        DropdownMenuItem<String>(value: 'Genap', child: Text('Genap', style: TextStyle(fontSize: 12))),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _selectedSemester = val;
                          });
                          _fetchTabsData();
                        }
                      },
                    ),
                  ),
                ],
              ),
            ),

          // Main Tabs Content
          Expanded(
            child: _isLoadingData
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
                : _errorMessage != null
                    ? _buildErrorWidget()
                    : TabBarView(
                        controller: _tabController,
                        physics: const BouncingScrollPhysics(),
                        children: [
                          _buildMuhafadzohTab(classTingkat, isDark, headingColor, borderCol),
                          _buildQiroahTab(classTingkat, isDark, headingColor, borderCol),
                          _buildTaftisyTab(isDark, headingColor, borderCol),
                        ],
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 48),
            const SizedBox(height: 12),
            Text(
              "Gagal memuat informasi",
              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 4),
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text("Coba Lagi"),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: _fetchTabsData,
            )
          ],
        ),
      ),
    );
  }

  Widget _buildMuhafadzohTab(int tingkat, bool isDark, Color headingColor, Color borderCol) {
    final targetKelasStr = _getKelasStringFromTingkat(tingkat);
    
    // Filter to this class level only
    final filtered = _muhafadzohList.where((item) {
      final itemKelas = item['kelas']?.toString().toLowerCase() ?? '';
      return itemKelas == targetKelasStr.toLowerCase();
    }).toList();

    if (filtered.isEmpty) {
      return _buildEmptyTabWidget("Ketentuan nilai Muhafadzoh belum diatur untuk tingkat $targetKelasStr.");
    }

    final item = filtered.first;
    final String kitab = item['kitab']?.toString() ?? '-';
    final String mumtaz = item['mumtaz']?.toString() ?? '-';
    final String jayyid = item['jayyid']?.toString() ?? '-';
    final String mutawasith = item['mutawasith']?.toString() ?? '-';
    final String rodi = item['rodi']?.toString() ?? '-';

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildInfoBanner("Kriteria & Rentang Nilai Ujian Hafalan (Muhafadzoh)"),
          const SizedBox(height: 16),
          Card(
            color: context.cardBg,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: BorderSide(color: borderCol),
            ),
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.bookmark_added_rounded, color: Color(0xFF10B981), size: 22),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Tingkat: Kelas $targetKelasStr",
                            style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: headingColor),
                          ),
                          Text(
                            "Kitab: $kitab",
                            style: GoogleFonts.outfit(fontSize: 12, color: Colors.grey),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  const Divider(height: 1),
                  const SizedBox(height: 16),
                  _buildKeyValueRow("MUMTAZ (Istimewa)", mumtaz, const Color(0xFF10B981)),
                  const SizedBox(height: 12),
                  _buildKeyValueRow("JAYYID (Baik)", jayyid, const Color(0xFF3B82F6)),
                  const SizedBox(height: 12),
                  _buildKeyValueRow("MUTAWASITH (Cukup)", mutawasith, Colors.orangeAccent),
                  const SizedBox(height: 12),
                  _buildKeyValueRow("RODI' (Kurang)", rodi, Colors.redAccent),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQiroahTab(int tingkat, bool isDark, Color headingColor, Color borderCol) {
    final targetKelasStr = _getKelasStringFromTingkat(tingkat);

    // Filter to this class level only
    final filtered = _qiroahList.where((item) {
      final itemKelas = item['kelas']?.toString().toLowerCase() ?? '';
      return itemKelas == targetKelasStr.toLowerCase();
    }).toList();

    if (filtered.isEmpty) {
      return _buildEmptyTabWidget("Maqro Qiroatul Kitab belum diatur untuk tingkat $targetKelasStr.");
    }

    final item = filtered.first;
    final List<dynamic> maqroList = item['maqro'] ?? [];

    return ListView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        _buildInfoBanner("Daftar acuan bahan bacaan (Maqro) Ujian Qiroatul Kitab"),
        const SizedBox(height: 16),
        Card(
          color: context.cardBg,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(color: borderCol),
          ),
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF97316).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.chrome_reader_mode_rounded, color: Color(0xFFF97316), size: 22),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      "Maqro Kelas $targetKelasStr",
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: headingColor),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(height: 1),
                const SizedBox(height: 12),
                if (maqroList.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Text(
                      "Belum ada maqro yang dikonfigurasi.",
                      style: GoogleFonts.outfit(color: Colors.grey, fontSize: 13, fontStyle: FontStyle.italic),
                    ),
                  )
                else
                  ...maqroList.map<Widget>((maqro) {
                    final text = maqro.toString();
                    final isArabic = RegExp(r'[\u0600-\u06FF]').hasMatch(text);
                    return Container(
                      margin: const EdgeInsets.only(top: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.black26 : Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: borderCol),
                      ),
                      child: Text(
                        text,
                        textAlign: isArabic ? TextAlign.right : TextAlign.left,
                        textDirection: isArabic ? TextDirection.rtl : TextDirection.ltr,
                        style: GoogleFonts.amiri(
                          fontSize: isArabic ? 16 : 13,
                          height: isArabic ? 1.6 : 1.4,
                          fontWeight: isArabic ? FontWeight.bold : FontWeight.normal,
                          color: isDark ? Colors.white70 : Colors.black87,
                        ),
                      ),
                    );
                  }).toList(),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTaftisyTab(bool isDark, Color headingColor, Color borderCol) {
    if (_taftisyList.isEmpty) {
      return _buildEmptyTabWidget("Tidak ada batasan materi Taftisyul Kutub untuk kelas ini.");
    }

    return ListView.builder(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: _taftisyList.length + 1,
      itemBuilder: (context, index) {
        if (index == 0) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: _buildInfoBanner("Daftar batasan materi & halaman Taftisyul Kutub"),
          );
        }

        final item = _taftisyList[index - 1];
        final String pelajaran = item['pelajaran']?.toString() ?? '';
        final String batasAwal = item['batas_awal']?.toString() ?? '';
        final String batasAkhir = item['batas_akhir']?.toString() ?? '';
        final String halaman = item['halaman']?.toString() ?? '';

        final isAllEmpty = batasAwal.isEmpty && batasAkhir.isEmpty && halaman.isEmpty;

        return Card(
          color: context.cardBg,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: borderCol),
          ),
          margin: const EdgeInsets.only(bottom: 10),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        pelajaran,
                        style: GoogleFonts.outfit(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          color: isDark ? const Color(0xFFC7D2FE) : const Color(0xFF312E81),
                        ),
                      ),
                    ),
                    if (isAllEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: Colors.grey.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          "Belum diatur",
                          style: GoogleFonts.outfit(color: Colors.grey, fontSize: 10, fontStyle: FontStyle.italic),
                        ),
                      ),
                  ],
                ),
                if (!isAllEmpty) ...[
                  const SizedBox(height: 12),
                  const Divider(height: 1),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildSubGridCell("Batas Awal", batasAwal, isDark),
                      ),
                      Expanded(
                        child: _buildSubGridCell("Batas Akhir", batasAkhir, isDark),
                      ),
                      Expanded(
                        child: _buildSubGridCell("Halaman", halaman, isDark),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSubGridCell(String label, String val, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.outfit(color: Colors.grey, fontSize: 10),
        ),
        const SizedBox(height: 2),
        Text(
          val.isEmpty ? "-" : val,
          style: GoogleFonts.outfit(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: isDark ? Colors.white70 : Colors.black87,
          ),
        ),
      ],
    );
  }

  Widget _buildKeyValueRow(String label, String value, Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.outfit(color: color, fontWeight: FontWeight.bold, fontSize: 12),
        ),
        Text(
          value,
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14, color: context.titleColor),
        ),
      ],
    );
  }

  Widget _buildInfoBanner(String text) {
    final isDark = context.isDarkMode;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF10B981).withOpacity(isDark ? 0.12 : 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFF10B981).withOpacity(isDark ? 0.25 : 0.2),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline_rounded, color: Color(0xFF10B981), size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: GoogleFonts.outfit(
                fontSize: 11,
                color: isDark ? const Color(0xFFA7F3D0) : const Color(0xFF065F46),
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyTabWidget(String text) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.library_books_rounded, color: Colors.grey.withOpacity(0.5), size: 64),
            const SizedBox(height: 12),
            Text(
              text,
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                color: context.isDarkMode ? Colors.grey[400] : Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
