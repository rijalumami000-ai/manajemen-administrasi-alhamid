import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';

class TimSoalScreen extends StatefulWidget {
  const TimSoalScreen({super.key});

  @override
  State<TimSoalScreen> createState() => _TimSoalScreenState();
}

class _TimSoalScreenState extends State<TimSoalScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;

  List<dynamic> _tahunAjaranList = [];
  Map<String, dynamic>? _selectedTahunAjaran;
  String _selectedSemester = 'Ganjil';

  List<dynamic> _classes = [];
  List<dynamic> _mataPelajaran = [];
  List<dynamic> _soalList = [];

  // Filter: tingkat (level) instead of individual kelas
  int? _filterTingkat;
  // Filter: null = Semua, false = Soal Utama, true = Soal Her
  bool? _filterIsHer;

  // Helper: tingkat names
  String _tingkatLabel(int tingkat) {
    switch (tingkat) {
      case 0:
        return 'Kelas Sifir';
      case 1:
        return 'Kelas 1';
      case 99:
        return 'Kelas SP';
      case 2:
        return 'Kelas 2';
      case 3:
        return 'Kelas 3';
      case 4:
        return 'Kelas 4';
      case 5:
        return 'Kelas 5';
      case 6:
        return 'Kelas 6';
      default:
        return 'Tingkat $tingkat';
    }
  }

  // Get distinct tingkat levels from classes, sorted by order
  List<Map<String, dynamic>> get _distinctTingkatList {
    final seen = <int>{};
    final result = <Map<String, dynamic>>[];
    // Sort classes by tingkat_order if available
    final sorted = List<dynamic>.from(_classes)
      ..sort((a, b) {
        final orderA = a['tingkat_order'] ?? _tingkatOrder(a['tingkat'] ?? 0);
        final orderB = b['tingkat_order'] ?? _tingkatOrder(b['tingkat'] ?? 0);
        return (orderA as int).compareTo(orderB as int);
      });
    for (final c in sorted) {
      final tingkat = c['tingkat'] as int? ?? 0;
      if (!seen.contains(tingkat)) {
        seen.add(tingkat);
        result.add({
          'tingkat': tingkat,
          'label': _tingkatLabel(tingkat),
          'kelas_id': c['id'], // representative class id for this tingkat
        });
      }
    }
    return result;
  }

  int _tingkatOrder(int tingkat) {
    switch (tingkat) {
      case 0: return 1;
      case 1: return 2;
      case 99: return 3;
      case 2: return 4;
      case 3: return 5;
      case 4: return 6;
      case 5: return 7;
      case 6: return 8;
      default: return 9;
    }
  }

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  Future<void> _initializeData() async {
    setState(() => _isLoading = true);
    try {
      // 1. Fetch academic years
      final taResult = await _apiService.getTahunAjaranList();
      _tahunAjaranList = taResult['tahunAjaran'] ?? [];
      _selectedSemester = taResult['activeSemester'] ?? 'Ganjil';

      if (_tahunAjaranList.isNotEmpty) {
        _selectedTahunAjaran = _tahunAjaranList.firstWhere(
          (ta) => ta['is_active'] == true,
          orElse: () => _tahunAjaranList.first,
        );
      }

      await _loadFormDataAndList();
    } catch (e) {
      _showSnackBar(e.toString(), isError: true);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadFormDataAndList() async {
    if (_selectedTahunAjaran == null) return;
    final taId = _selectedTahunAjaran!['id'];

    // 2. Fetch classes & subjects for selected academic year
    final metaData = await _apiService.getTimSoalData(tahunAjaranId: taId);
    _classes = metaData['classes'] ?? [];
    _mataPelajaran = metaData['mataPelajaran'] ?? [];

    // 3. Fetch questions list
    await _loadSoalList();
  }

  Future<void> _loadSoalList() async {
    if (_selectedTahunAjaran == null) return;
    final taId = _selectedTahunAjaran!['id'];

    // Find a representative kelas_id from the selected tingkat
    int? filterKelasId;
    if (_filterTingkat != null) {
      final match = _classes.firstWhere(
        (c) => c['tingkat'] == _filterTingkat,
        orElse: () => null,
      );
      if (match != null) {
        filterKelasId = match['id'] as int?;
      }
    }

    final listData = await _apiService.getTimSoalList(
      kelasId: filterKelasId,
      semester: _selectedSemester,
      tahunAjaranId: taId,
    );

    List<dynamic> allSoal = listData['soal'] ?? [];

    // Client-side filter by is_her
    if (_filterIsHer != null) {
      allSoal = allSoal.where((s) {
        final isHer = s['is_her'] == true;
        return isHer == _filterIsHer;
      }).toList();
    }

    setState(() {
      _soalList = allSoal;
    });
  }

  void _showSnackBar(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: GoogleFonts.outfit()),
        backgroundColor: isError ? Colors.redAccent : const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  void _showAddEditBottomSheet({Map<String, dynamic>? existingSoal}) {
    // For the form, we need a representative kelas_id per tingkat
    // When editing, map existing tingkat to a tingkat value
    int? selectedTingkat;
    int? selectedMapelId;
    bool selectedIsHer = false;

    if (existingSoal != null) {
      // The backend returns tingkat directly in mapped data
      selectedTingkat = existingSoal['tingkat'] as int?;
      selectedMapelId = existingSoal['mapel_id'] as int?;
      selectedIsHer = existingSoal['is_her'] == true;
    }

    final contentController = TextEditingController(text: existingSoal?['konten_soal'] ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        final isDark = context.isDarkMode;
        final panelBg = isDark ? const Color(0xFF1E293B) : Colors.white;
        final textStyle = GoogleFonts.outfit(color: isDark ? Colors.white : Colors.black87);
        final titleColor = isDark ? Colors.white : Colors.black87;
        final primaryColor = isDark ? const Color(0xFFEC4899) : const Color(0xFFBE185D);

        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              decoration: BoxDecoration(
                color: panelBg,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
              ),
              padding: EdgeInsets.only(
                top: 24,
                left: 24,
                right: 24,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          existingSoal == null ? "Tulis Soal Baru" : "Edit Soal Ujian",
                          style: GoogleFonts.outfit(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: titleColor,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Tingkat Dropdown (instead of individual classes)
                    Text(
                      "Pilih Tingkat Kelas",
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, color: isDark ? Colors.white70 : Colors.black54),
                    ),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<int>(
                      dropdownColor: panelBg,
                      value: selectedTingkat,
                      style: textStyle,
                      decoration: _inputDecoration(isDark, Icons.class_rounded, "Pilih Tingkat Kelas"),
                      items: _distinctTingkatList.map<DropdownMenuItem<int>>((t) {
                        return DropdownMenuItem<int>(
                          value: t['tingkat'] as int,
                          child: Text(t['label'] as String),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setModalState(() {
                          selectedTingkat = val;
                        });
                      },
                    ),
                    const SizedBox(height: 16),

                    // Mapel Dropdown
                    Text(
                      "Pilih Mata Pelajaran",
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, color: isDark ? Colors.white70 : Colors.black54),
                    ),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<int>(
                      dropdownColor: panelBg,
                      value: selectedMapelId,
                      style: textStyle,
                      decoration: _inputDecoration(isDark, Icons.book_rounded, "Pilih Mata Pelajaran"),
                      items: _mataPelajaran.map<DropdownMenuItem<int>>((m) {
                        return DropdownMenuItem<int>(
                          value: m['id'] as int,
                          child: Text("${m['nama']} (${m['jenis']})"),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setModalState(() {
                          selectedMapelId = val;
                        });
                      },
                    ),
                    const SizedBox(height: 16),

                    // Soal Utama / Soal Her toggle
                    Text(
                      "Jenis Soal",
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, color: isDark ? Colors.white70 : Colors.black54),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setModalState(() => selectedIsHer = false);
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              decoration: BoxDecoration(
                                color: !selectedIsHer
                                    ? primaryColor.withOpacity(0.15)
                                    : (isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.03)),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: !selectedIsHer ? primaryColor : Colors.transparent,
                                  width: 1.5,
                                ),
                              ),
                              child: Center(
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.assignment_rounded,
                                      size: 16,
                                      color: !selectedIsHer ? primaryColor : (isDark ? Colors.white38 : Colors.black38),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      "Soal Utama",
                                      style: GoogleFonts.outfit(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: !selectedIsHer ? primaryColor : (isDark ? Colors.white38 : Colors.black38),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setModalState(() => selectedIsHer = true);
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              decoration: BoxDecoration(
                                color: selectedIsHer
                                    ? Colors.orange.withOpacity(0.15)
                                    : (isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.03)),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: selectedIsHer ? Colors.orange : Colors.transparent,
                                  width: 1.5,
                                ),
                              ),
                              child: Center(
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.refresh_rounded,
                                      size: 16,
                                      color: selectedIsHer ? Colors.orange : (isDark ? Colors.white38 : Colors.black38),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      "Soal Her",
                                      style: GoogleFonts.outfit(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: selectedIsHer ? Colors.orange : (isDark ? Colors.white38 : Colors.black38),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Konten Soal
                    Text(
                      "Konten/Pertanyaan Soal",
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, color: isDark ? Colors.white70 : Colors.black54),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: contentController,
                      maxLines: 6,
                      style: textStyle,
                      decoration: InputDecoration(
                        hintText: "Tuliskan soal di sini...",
                        hintStyle: GoogleFonts.outfit(color: isDark ? Colors.white30 : Colors.black.withOpacity(0.3)),
                        filled: true,
                        fillColor: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.03),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.all(16),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Action button
                    ElevatedButton(
                      onPressed: () async {
                        if (selectedTingkat == null || selectedMapelId == null || contentController.text.trim().isEmpty) {
                          _showSnackBar("Harap lengkapi semua isian form.", isError: true);
                          return;
                        }

                        // Find a representative kelas_id for the selected tingkat
                        final matchClass = _classes.firstWhere(
                          (c) => c['tingkat'] == selectedTingkat,
                          orElse: () => null,
                        );
                        if (matchClass == null) {
                          _showSnackBar("Kelas untuk tingkat ini tidak ditemukan.", isError: true);
                          return;
                        }
                        final kelasId = matchClass['id'] as int;

                        Navigator.pop(context); // Close bottomsheet
                        setState(() => _isLoading = true);

                        try {
                          final tipeUjian = selectedIsHer ? 'SOAL HER' : 'PENILAIAN AKHIR SEMESTER';
                          await _apiService.saveTimSoal(
                            id: existingSoal?['id'],
                            kelasId: kelasId,
                            mataPelajaranId: selectedMapelId!,
                            tahunAjaranId: _selectedTahunAjaran!['id'],
                            semester: _selectedSemester,
                            tipeUjian: tipeUjian,
                            kontenSoal: contentController.text.trim(),
                          );
                          _showSnackBar("Soal berhasil disimpan!");
                          await _loadSoalList();
                        } catch (e) {
                          _showSnackBar(e.toString(), isError: true);
                        } finally {
                          setState(() => _isLoading = false);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isDark ? const Color(0xFFEC4899) : const Color(0xFFBE185D),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        elevation: 0,
                      ),
                      child: Text(
                        "Simpan Soal",
                        style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  InputDecoration _inputDecoration(bool isDark, IconData icon, String hint) {
    final primaryColor = isDark ? const Color(0xFFEC4899) : const Color(0xFFBE185D);
    return InputDecoration(
      hintText: hint,
      prefixIcon: Icon(icon, color: primaryColor.withOpacity(0.7)),
      filled: true,
      fillColor: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.03),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide.none,
      ),
      contentPadding: const EdgeInsets.symmetric(vertical: 16),
    );
  }

  Future<void> _deleteSoal(int id) async {
    final isConfirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text("Hapus Soal", style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Text("Apakah Anda yakin ingin menghapus soal ini?", style: GoogleFonts.outfit()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text("Batal", style: GoogleFonts.outfit()),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            child: Text("Hapus", style: GoogleFonts.outfit(color: Colors.white)),
          ),
        ],
      ),
    );

    if (isConfirm != true) return;

    setState(() => _isLoading = true);
    try {
      await _apiService.deleteTimSoal(id);
      _showSnackBar("Soal berhasil dihapus.");
      await _loadSoalList();
    } catch (e) {
      _showSnackBar(e.toString(), isError: true);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;
    final primaryBgColor = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final cardBgColor = isDark ? const Color(0xFF1E293B) : Colors.white;
    final headingColor = isDark ? Colors.white : const Color(0xFF1E293B);
    final subColor = isDark ? const Color(0xFFEC4899) : const Color(0xFFBE185D);

    return Scaffold(
      backgroundColor: primaryBgColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: isDark ? Colors.white : Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "Tim Soal",
          style: GoogleFonts.outfit(color: isDark ? Colors.white : Colors.black87, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.pink))
          : Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Filter header
                  Container(
                    decoration: BoxDecoration(
                      color: cardBgColor,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        )
                      ],
                      border: Border.all(
                        color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.05),
                      ),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            // Year dropdown
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    "Tahun Ajaran",
                                    style: GoogleFonts.outfit(fontSize: 11, color: isDark ? Colors.white60 : Colors.black54),
                                  ),
                                  DropdownButton<Map<String, dynamic>>(
                                    dropdownColor: cardBgColor,
                                    value: _selectedTahunAjaran,
                                    isExpanded: true,
                                    underline: const SizedBox(),
                                    style: GoogleFonts.outfit(color: headingColor, fontSize: 14, fontWeight: FontWeight.bold),
                                    items: _tahunAjaranList.map<DropdownMenuItem<Map<String, dynamic>>>((ta) {
                                      return DropdownMenuItem<Map<String, dynamic>>(
                                        value: ta as Map<String, dynamic>,
                                        child: Text(ta['kode'] as String),
                                      );
                                    }).toList(),
                                    onChanged: (val) {
                                      if (val != null) {
                                        setState(() {
                                          _selectedTahunAjaran = val;
                                          _isLoading = true;
                                        });
                                        _loadFormDataAndList().then((_) {
                                          setState(() => _isLoading = false);
                                        });
                                      }
                                    },
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 16),
                            // Semester dropdown
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    "Semester",
                                    style: GoogleFonts.outfit(fontSize: 11, color: isDark ? Colors.white60 : Colors.black54),
                                  ),
                                  DropdownButton<String>(
                                    dropdownColor: cardBgColor,
                                    value: _selectedSemester,
                                    isExpanded: true,
                                    underline: const SizedBox(),
                                    style: GoogleFonts.outfit(color: headingColor, fontSize: 14, fontWeight: FontWeight.bold),
                                    items: const [
                                      DropdownMenuItem(value: "Ganjil", child: Text("Ganjil")),
                                      DropdownMenuItem(value: "Genap", child: Text("Genap")),
                                    ],
                                    onChanged: (val) {
                                      if (val != null) {
                                        setState(() {
                                          _selectedSemester = val;
                                          _isLoading = true;
                                        });
                                        _loadSoalList().then((_) {
                                          setState(() => _isLoading = false);
                                        });
                                      }
                                    },
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const Divider(height: 20),
                        // Tingkat filter dropdown
                        Row(
                          children: [
                            Icon(Icons.filter_list_rounded, size: 16, color: subColor),
                            const SizedBox(width: 8),
                            Text(
                              "Tingkat:",
                              style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: headingColor),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: DropdownButton<int?>(
                                dropdownColor: cardBgColor,
                                value: _filterTingkat,
                                isExpanded: true,
                                underline: const SizedBox(),
                                style: GoogleFonts.outfit(color: headingColor, fontSize: 13),
                                items: [
                                  DropdownMenuItem<int?>(
                                    value: null,
                                    child: Text("Semua Tingkat", style: GoogleFonts.outfit(color: headingColor)),
                                  ),
                                  ..._distinctTingkatList.map<DropdownMenuItem<int?>>((t) {
                                    return DropdownMenuItem<int?>(
                                      value: t['tingkat'] as int,
                                      child: Text(t['label'] as String),
                                    );
                                  }),
                                ],
                                onChanged: (val) {
                                  setState(() {
                                    _filterTingkat = val;
                                    _isLoading = true;
                                  });
                                  _loadSoalList().then((_) {
                                    setState(() => _isLoading = false);
                                  });
                                },
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        // Soal Utama / Her filter
                        Row(
                          children: [
                            Icon(Icons.assignment_rounded, size: 16, color: subColor),
                            const SizedBox(width: 8),
                            Text(
                              "Jenis:",
                              style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: headingColor),
                            ),
                            const SizedBox(width: 8),
                            _buildFilterChip(
                              label: "Semua",
                              isSelected: _filterIsHer == null,
                              onTap: () {
                                setState(() {
                                  _filterIsHer = null;
                                  _isLoading = true;
                                });
                                _loadSoalList().then((_) {
                                  setState(() => _isLoading = false);
                                });
                              },
                              isDark: isDark,
                              activeColor: subColor,
                            ),
                            const SizedBox(width: 6),
                            _buildFilterChip(
                              label: "Soal Utama",
                              isSelected: _filterIsHer == false,
                              onTap: () {
                                setState(() {
                                  _filterIsHer = false;
                                  _isLoading = true;
                                });
                                _loadSoalList().then((_) {
                                  setState(() => _isLoading = false);
                                });
                              },
                              isDark: isDark,
                              activeColor: subColor,
                            ),
                            const SizedBox(width: 6),
                            _buildFilterChip(
                              label: "Soal Her",
                              isSelected: _filterIsHer == true,
                              onTap: () {
                                setState(() {
                                  _filterIsHer = true;
                                  _isLoading = true;
                                });
                                _loadSoalList().then((_) {
                                  setState(() => _isLoading = false);
                                });
                              },
                              isDark: isDark,
                              activeColor: Colors.orange,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Questions List
                  Expanded(
                    child: _soalList.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.note_alt_outlined, size: 64, color: subColor.withOpacity(0.4)),
                                const SizedBox(height: 16),
                                Text(
                                  "Belum ada soal ditulis.",
                                  style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold, color: headingColor),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  "Tulis soal pertama Anda menggunakan tombol + di bawah.",
                                  textAlign: TextAlign.center,
                                  style: GoogleFonts.outfit(fontSize: 12, color: isDark ? Colors.white60 : Colors.black54),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            physics: const BouncingScrollPhysics(),
                            itemCount: _soalList.length,
                            itemBuilder: (context, index) {
                              final soal = _soalList[index];
                              return _buildSoalCard(soal, cardBgColor, isDark, headingColor, subColor);
                            },
                          ),
                  ),
                ],
              ),
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddEditBottomSheet(),
        backgroundColor: subColor,
        child: const Icon(Icons.add_rounded, color: Colors.white, size: 28),
      ),
    );
  }

  Widget _buildFilterChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
    required bool isDark,
    required Color activeColor,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? activeColor.withOpacity(0.15) : (isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.03)),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? activeColor : Colors.transparent,
            width: 1.2,
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.outfit(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: isSelected ? activeColor : (isDark ? Colors.white54 : Colors.black45),
          ),
        ),
      ),
    );
  }

  Widget _buildSoalCard(Map<String, dynamic> soal, Color cardBg, bool isDark, Color headingColor, Color subColor) {
    final isHer = soal['is_her'] == true;
    final tingkat = soal['tingkat'];
    final tingkatLabel = tingkat != null ? _tingkatLabel(tingkat as int) : (soal['kelas_nama'] ?? '-');

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.15 : 0.02),
            blurRadius: 8,
            offset: const Offset(0, 3),
          )
        ],
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.03),
        ),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Badges row
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: subColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  tingkatLabel,
                  style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: subColor),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: (isDark ? Colors.blue.shade400 : Colors.blue.shade600).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  soal['semester'] ?? '-',
                  style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: isDark ? Colors.blue.shade300 : Colors.blue.shade700),
                ),
              ),
              const SizedBox(width: 8),
              // Soal Utama / Her badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isHer ? Colors.orange.withOpacity(0.1) : Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  isHer ? "Soal Her" : "Soal Utama",
                  style: GoogleFonts.outfit(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: isHer ? Colors.orange : Colors.green.shade700,
                  ),
                ),
              ),
              const Spacer(),
              // Action buttons (Edit & Delete)
              IconButton(
                icon: Icon(Icons.edit_rounded, size: 16, color: isDark ? Colors.white70 : Colors.black54),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                onPressed: () => _showAddEditBottomSheet(existingSoal: soal),
              ),
              const SizedBox(width: 12),
              IconButton(
                icon: const Icon(Icons.delete_rounded, size: 16, color: Colors.redAccent),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                onPressed: () => _deleteSoal(soal['id'] as int),
              ),
            ],
          ),
          const SizedBox(height: 10),
          // Subject Title
          Text(
            soal['mapel_nama'] ?? '-',
            style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold, color: headingColor),
          ),
          const SizedBox(height: 8),
          // Question Content
          Text(
            soal['konten_soal'] ?? '',
            maxLines: 4,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.outfit(fontSize: 13, height: 1.4, color: isDark ? Colors.white60 : Colors.black87),
          ),
          const Divider(height: 24),
          // Author & Date
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.person_outline_rounded, size: 12, color: isDark ? Colors.white38 : Colors.black38),
                  const SizedBox(width: 4),
                  Text(
                    soal['dibuat_oleh'] ?? 'Sistem',
                    style: GoogleFonts.outfit(fontSize: 10, color: isDark ? Colors.white38 : Colors.black38),
                  ),
                ],
              ),
              Text(
                soal['created_at'] != null ? soal['created_at'].toString().split('T')[0] : '-',
                style: GoogleFonts.outfit(fontSize: 10, color: isDark ? Colors.white38 : Colors.black38),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
