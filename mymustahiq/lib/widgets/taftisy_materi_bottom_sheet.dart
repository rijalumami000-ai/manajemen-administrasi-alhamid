import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';

class TaftisyMateriBottomSheet extends StatefulWidget {
  final int? tahunAjaranId;
  final String? semester;

  const TaftisyMateriBottomSheet({
    super.key,
    this.tahunAjaranId,
    this.semester,
  });

  static void show(BuildContext context, {int? tahunAjaranId, String? semester}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => TaftisyMateriBottomSheet(
        tahunAjaranId: tahunAjaranId,
        semester: semester,
      ),
    );
  }

  @override
  State<TaftisyMateriBottomSheet> createState() => _TaftisyMateriBottomSheetState();
}

class _TaftisyMateriBottomSheetState extends State<TaftisyMateriBottomSheet> {
  final ApiService _apiService = ApiService();
  
  List<dynamic> _tahunAjaranList = [];
  Map<String, dynamic>? _selectedTahunAjaran;
  String _selectedSemester = 'Ganjil';
  bool _loadingFilters = true;

  List<dynamic> _classes = [];
  int? _selectedKelasId;
  bool _loadingClasses = false;
  String? _classError;

  List<dynamic> _taftisyMateri = [];
  bool _loadingMateri = false;
  String? _materiError;

  @override
  void initState() {
    super.initState();
    _loadFiltersAndClasses();
  }

  Future<void> _loadFiltersAndClasses() async {
    try {
      final taResult = await _apiService.getTahunAjaranList();
      _tahunAjaranList = taResult['tahunAjaran'] ?? [];

      if (widget.tahunAjaranId != null) {
        _selectedTahunAjaran = _tahunAjaranList.firstWhere(
          (ta) => ta['id'] == widget.tahunAjaranId,
          orElse: () => _tahunAjaranList.firstWhere((ta) => ta['is_active'] == true, orElse: () => _tahunAjaranList.first),
        );
      } else {
        _selectedTahunAjaran = _tahunAjaranList.firstWhere(
          (ta) => ta['is_active'] == true,
          orElse: () => _tahunAjaranList.first,
        );
      }

      _selectedSemester = widget.semester ?? taResult['activeSemester'] ?? 'Ganjil';

      if (mounted) {
        setState(() {
          _loadingFilters = false;
        });
        await _loadClasses();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loadingFilters = false;
        });
        await _loadClasses();
      }
    }
  }

  Future<void> _loadClasses() async {
    if (_selectedTahunAjaran == null) return;
    
    setState(() {
      _loadingClasses = true;
      _classError = null;
      _classes = [];
      _selectedKelasId = null;
      _taftisyMateri = [];
    });

    try {
      final classesData = await _apiService.getClasses(
        tahunAjaranId: _selectedTahunAjaran?['id'],
        semester: _selectedSemester,
      );
      if (mounted) {
        setState(() {
          _classes = classesData['classes'] ?? [];
          _loadingClasses = false;
          if (_classes.isNotEmpty) {
            _selectedKelasId = _classes.first['id'] as int;
          }
        });

        if (_selectedKelasId != null) {
          _loadMateri(_selectedKelasId!);
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _classError = e.toString().replaceFirst('Exception: ', '');
          _loadingClasses = false;
        });
      }
    }
  }

  Future<void> _loadMateri(int kelasId) async {
    setState(() {
      _loadingMateri = true;
      _materiError = null;
    });

    try {
      final data = await _apiService.getTaftisyMateri(
        kelasId: kelasId,
        tahunAjaranId: _selectedTahunAjaran?['id'],
        semester: _selectedSemester,
      );
      if (mounted) {
        setState(() {
          _taftisyMateri = data;
          _loadingMateri = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _materiError = e.toString().replaceFirst('Exception: ', '');
          _loadingMateri = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;
    final bottomSheetBg = isDark ? const Color(0xFF111827) : Colors.white;
    final headingColor = isDark ? Colors.white : const Color(0xFF1E293B);
    final borderCol = isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.08);

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: BoxDecoration(
        color: bottomSheetBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag Handle & Title
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.black12,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "Batasan Taftisyul Kutub",
                  style: GoogleFonts.outfit(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: headingColor,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Informational Warning Banner
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF8B5CF6).withOpacity(isDark ? 0.12 : 0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: const Color(0xFF8B5CF6).withOpacity(isDark ? 0.25 : 0.2),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.menu_book_rounded, color: Color(0xFF8B5CF6), size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    "Tabel ini merupakan acuan batasan materi (Batas Awal, Batas Akhir, dan Halaman) Ujian Taftisyul Kutub (Makna Kitab) per kelas Diniyah yang berlaku di Ponpes Al-Hamid.",
                    style: GoogleFonts.outfit(
                      fontSize: 11,
                      color: isDark ? const Color(0xFFDDD6FE) : const Color(0xFF5B21B6),
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Year and Semester dropdown selectors
          if (_loadingFilters)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Center(child: LinearProgressIndicator(color: Color(0xFF8B5CF6))),
            )
          else if (_tahunAjaranList.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<int>(
                      value: _selectedTahunAjaran?['id'],
                      decoration: InputDecoration(
                        labelText: "Tahun Ajaran",
                        labelStyle: GoogleFonts.outfit(fontSize: 12, color: isDark ? Colors.white70 : Colors.black87),
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
                        fillColor: isDark ? const Color(0xFF1F2937) : const Color(0xFFF8FAFC),
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
                          _loadClasses();
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
                        labelStyle: GoogleFonts.outfit(fontSize: 12, color: isDark ? Colors.white70 : Colors.black87),
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
                        fillColor: isDark ? const Color(0xFF1F2937) : const Color(0xFFF8FAFC),
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
                          _loadClasses();
                        }
                      },
                    ),
                  ),
                ],
              ),
            ),

          const SizedBox(height: 8),

          // Class Selection Dropdown
          if (_loadingClasses)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Center(child: LinearProgressIndicator(color: Color(0xFF8B5CF6))),
            )
          else if (_classError != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Text(
                "Gagal memuat kelas: $_classError",
                style: GoogleFonts.outfit(color: Colors.redAccent, fontSize: 13),
              ),
            )
          else if (_classes.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: DropdownButtonFormField<int>(
                value: _selectedKelasId,
                decoration: InputDecoration(
                  labelText: "Pilih Kelas Diniyah",
                  labelStyle: GoogleFonts.outfit(color: isDark ? Colors.white70 : Colors.black87),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: borderCol),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: borderCol),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF8B5CF6), width: 1.5),
                  ),
                  filled: true,
                  fillColor: isDark ? const Color(0xFF1F2937) : const Color(0xFFF8FAFC),
                ),
                dropdownColor: isDark ? const Color(0xFF1F2937) : Colors.white,
                items: _classes.map<DropdownMenuItem<int>>((c) {
                  return DropdownMenuItem<int>(
                    value: c['id'] as int,
                    child: Text(
                      c['nama']?.toString() ?? '',
                      style: GoogleFonts.outfit(color: headingColor, fontWeight: FontWeight.w500),
                    ),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) {
                    setState(() {
                      _selectedKelasId = val;
                    });
                    _loadMateri(val);
                  }
                },
              ),
            ),

          const SizedBox(height: 12),

          // Content List
          Expanded(
            child: _buildMateriContent(isDark, headingColor, borderCol),
          ),
        ],
      ),
    );
  }

  Widget _buildMateriContent(bool isDark, Color headingColor, Color borderCol) {
    if (_loadingMateri) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF8B5CF6)));
    }

    if (_materiError != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 48),
              const SizedBox(height: 12),
              Text(
                "Gagal memuat data materi",
                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: headingColor),
              ),
              const SizedBox(height: 4),
              Text(
                _materiError!,
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text("Coba Lagi"),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF8B5CF6),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                onPressed: () {
                  if (_selectedKelasId != null) {
                    _loadMateri(_selectedKelasId!);
                  }
                },
              )
            ],
          ),
        ),
      );
    }

    if (_taftisyMateri.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.library_books_rounded, color: Colors.grey.withOpacity(0.5), size: 64),
            const SizedBox(height: 12),
            Text(
              "Tidak ada data batasan materi.",
              style: GoogleFonts.outfit(
                color: isDark ? Colors.grey[400] : Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              "Jadwal reguler mungkin belum dikonfigurasi.",
              style: GoogleFonts.outfit(color: Colors.grey, fontSize: 12),
            ),
          ],
        ),
      );
    }

    final selectedClass = _classes.firstWhere(
      (c) => c['id'] == _selectedKelasId,
      orElse: () => null,
    );
    final kelasNama = selectedClass != null ? selectedClass['nama']?.toString() ?? '' : '';

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 24, left: 16, right: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (kelasNama.isNotEmpty) ...[
            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E3A8A).withOpacity(0.15) : const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isDark ? const Color(0xFF3B82F6).withOpacity(0.3) : const Color(0xFFBFDBFE),
                    width: 1,
                  ),
                ),
                child: Text(
                  "BATASAN MATERI UJIAN TULIS ${kelasNama.toUpperCase()}",
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: isDark ? const Color(0xFF93C5FD) : const Color(0xFF1E40AF),
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: borderCol),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                child: DataTable(
                  headingRowColor: MaterialStateProperty.all(
                    isDark ? const Color(0xFF1E3A8A).withOpacity(0.3) : const Color(0xFFDBEAFE),
                  ),
                  columnSpacing: 24,
                  horizontalMargin: 16,
                  columns: [
                    DataColumn(
                      label: Text('No', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: headingColor)),
                    ),
                    DataColumn(
                      label: Text('Batas Akhir', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: headingColor)),
                    ),
                    DataColumn(
                      label: Text('Batas Awal', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: headingColor)),
                    ),
                    DataColumn(
                      label: Text('Halaman', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: headingColor)),
                    ),
                    DataColumn(
                      label: Text('Pelajaran', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: headingColor)),
                    ),
                  ],
                  rows: List<DataRow>.generate(_taftisyMateri.length, (index) {
                    final item = _taftisyMateri[index];
                    final String pelajaran = item['pelajaran']?.toString() ?? '';
                    final String batasAwal = item['batas_awal']?.toString() ?? '';
                    final String batasAkhir = item['batas_akhir']?.toString() ?? '';
                    final String halaman = item['halaman']?.toString() ?? '';

                    Widget buildTextCell(String text, {bool isPelajaran = false}) {
                      if (text.isEmpty) {
                        return Text(
                          "-",
                          style: GoogleFonts.outfit(color: Colors.grey),
                        );
                      }
                      return Text(
                        text,
                        style: GoogleFonts.outfit(
                          fontWeight: isPelajaran ? FontWeight.w600 : FontWeight.normal,
                          color: isPelajaran
                              ? (isDark ? const Color(0xFF93C5FD) : const Color(0xFF1E40AF))
                              : (isDark ? Colors.white70 : Colors.black87),
                          fontSize: 13,
                        ),
                      );
                    }

                    return DataRow(
                      cells: [
                        DataCell(Text((index + 1).toString(), style: GoogleFonts.outfit(color: Colors.grey))),
                        DataCell(buildTextCell(batasAkhir)),
                        DataCell(buildTextCell(batasAwal)),
                        DataCell(buildTextCell(halaman)),
                        DataCell(buildTextCell(pelajaran, isPelajaran: true)),
                      ],
                    );
                  }),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
