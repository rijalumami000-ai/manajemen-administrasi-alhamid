import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';
import '../services/network_service.dart';
import 'offline_widget.dart';

class QiroahMaqroBottomSheet extends StatefulWidget {
  final int? tahunAjaranId;
  final String? semester;

  const QiroahMaqroBottomSheet({
    super.key,
    this.tahunAjaranId,
    this.semester,
  });

  static void show(BuildContext context, {int? tahunAjaranId, String? semester}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => QiroahMaqroBottomSheet(
        tahunAjaranId: tahunAjaranId,
        semester: semester,
      ),
    );
  }

  @override
  State<QiroahMaqroBottomSheet> createState() => _QiroahMaqroBottomSheetState();
}

class _QiroahMaqroBottomSheetState extends State<QiroahMaqroBottomSheet> {
  final ApiService _apiService = ApiService();
  Future<List<dynamic>>? _maqroFuture;

  List<dynamic> _tahunAjaranList = [];
  Map<String, dynamic>? _selectedTahunAjaran;
  String _selectedSemester = 'Ganjil';
  bool _loadingFilters = true;

  @override
  void initState() {
    super.initState();
    _loadFiltersAndData();
  }

  Future<void> _loadFiltersAndData() async {
    if (!NetworkService().isOnline) {
      if (mounted) {
        setState(() {
          _loadingFilters = false;
          _maqroFuture = Future.error('NO_INTERNET');
        });
      }
      return;
    }
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
        _loadData();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loadingFilters = false;
        });
        _loadData();
      }
    }
  }

  void _loadData() {
    if (!NetworkService().isOnline) {
      setState(() {
        _maqroFuture = Future.error('NO_INTERNET');
      });
      return;
    }
    setState(() {
      _maqroFuture = _apiService.getQiroahMaqro(
        tahunAjaranId: _selectedTahunAjaran?['id'],
        semester: _selectedSemester,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;
    final bottomSheetBg = isDark ? const Color(0xFF111827) : Colors.white;
    final headingColor = isDark ? Colors.white : const Color(0xFF1E293B);
    final borderCol = isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.08);
    final cardColor = isDark ? const Color(0xFF1F2937) : const Color(0xFFF8FAFC);

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
                  "Maqro Qiroatul Kitab",
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
              color: Colors.orange.withOpacity(isDark ? 0.12 : 0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.orange.withOpacity(isDark ? 0.25 : 0.2),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.warning_amber_rounded, color: Colors.orangeAccent, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    "Tabel ini merupakan acuan daftar bahan bacaan (Maqro) Ujian Qiroatul Kitab yang berlaku di Ponpes Al-Hamid. Data ini hanya bersifat informatif / administratif sebagai panduan pengujian.",
                    style: GoogleFonts.outfit(
                      fontSize: 11,
                      color: isDark ? Colors.orange[200] : Colors.orange[900],
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
              child: Center(child: LinearProgressIndicator(color: Colors.orange)),
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
                          _loadData();
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
                          _loadData();
                        }
                      },
                    ),
                  ),
                ],
              ),
            ),

          const SizedBox(height: 12),

          // Content List
          Expanded(
            child: _maqroFuture == null
                ? const Center(child: CircularProgressIndicator(color: Colors.orange))
                : FutureBuilder<List<dynamic>>(
                    future: _maqroFuture,
                    builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator(color: Colors.orange));
                }
                if (snapshot.hasError) {
                  if (snapshot.error.toString() == 'NO_INTERNET') {
                    return OfflineWidget(onRetry: _loadFiltersAndData);
                  }
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 48),
                          const SizedBox(height: 12),
                          Text(
                            "Gagal memuat data",
                            style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: headingColor),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            snapshot.error.toString(),
                            textAlign: TextAlign.center,
                            style: GoogleFonts.outfit(fontSize: 12, color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                final list = snapshot.data ?? [];
                if (list.isEmpty) {
                  return const Center(child: Text("Tidak ada data Maqro Qiroatul Kitab."));
                }

                return ListView.builder(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.only(bottom: 24, left: 16, right: 16),
                  itemCount: list.length,
                  itemBuilder: (context, index) {
                    final item = list[index];
                    final String kelas = item['kelas']?.toString() ?? '';
                    final List<dynamic> maqroList = item['maqro'] ?? [];

                    return Card(
                      color: cardColor,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(color: borderCol),
                      ),
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 4,
                                  height: 20,
                                  decoration: BoxDecoration(
                                    color: Colors.orangeAccent,
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  "Kelas $kelas",
                                  style: GoogleFonts.outfit(
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                    color: headingColor,
                                  ),
                                ),
                              ],
                            ),
                            if (maqroList.isNotEmpty) ...[
                              const SizedBox(height: 12),
                              const Divider(height: 1),
                              const SizedBox(height: 8),
                              ...maqroList.map<Widget>((maqro) {
                                final text = maqro.toString();
                                final isArabic = RegExp(r'[\u0600-\u06FF]').hasMatch(text);
                                return Container(
                                  margin: const EdgeInsets.only(top: 6, bottom: 6),
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: isDark ? Colors.black26 : Colors.white,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: isDark ? Colors.white.withOpacity(0.04) : Colors.black.withOpacity(0.04),
                                    ),
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
                            ] else ...[
                              const SizedBox(height: 8),
                              Text(
                                "Belum ada maqro yang dikonfigurasi.",
                                style: GoogleFonts.outfit(
                                  fontSize: 12,
                                  color: Colors.grey,
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ]
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
