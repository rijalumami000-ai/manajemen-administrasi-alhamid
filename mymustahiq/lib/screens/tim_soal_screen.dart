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

  int? _filterKelasId;

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
        // Default to active year, or first one
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

    final listData = await _apiService.getTimSoalList(
      kelasId: _filterKelasId,
      semester: _selectedSemester,
      tahunAjaranId: taId,
    );
    setState(() {
      _soalList = listData['soal'] ?? [];
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
    int? selectedKelasId = existingSoal != null ? existingSoal['kelas_id'] as int? : null;
    int? selectedMapelId = existingSoal != null ? existingSoal['mapel_id'] as int? : null;
    String selectedTipeUjian = existingSoal?['tipe_ujian'] ?? 'Ujian Semester';
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

                    // Kelas Dropdown
                    Text(
                      "Pilih Kelas",
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, color: isDark ? Colors.white70 : Colors.black54),
                    ),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<int>(
                      dropdownColor: panelBg,
                      initialValue: selectedKelasId,
                      style: textStyle,
                      decoration: _inputDecoration(isDark, Icons.class_rounded, "Pilih Kelas"),
                      items: _classes.map<DropdownMenuItem<int>>((c) {
                        return DropdownMenuItem<int>(
                          value: c['id'] as int,
                          child: Text(c['nama'] as String),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setModalState(() {
                          selectedKelasId = val;
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
                      initialValue: selectedMapelId,
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

                    // Tipe Ujian
                    Text(
                      "Tipe Ujian",
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, color: isDark ? Colors.white70 : Colors.black54),
                    ),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      dropdownColor: panelBg,
                      initialValue: selectedTipeUjian,
                      style: textStyle,
                      decoration: _inputDecoration(isDark, Icons.assignment_rounded, "Tipe Ujian"),
                      items: const [
                        DropdownMenuItem(value: "Ujian Semester", child: Text("Ujian Semester (Reguler)")),
                        DropdownMenuItem(value: "PTS", child: Text("PTS (Penilaian Tengah Semester)")),
                        DropdownMenuItem(value: "PAS", child: Text("PAS (Penilaian Akhir Semester)")),
                        DropdownMenuItem(value: "Ujian Praktik", child: Text("Ujian Praktik")),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          setModalState(() {
                            selectedTipeUjian = val;
                          });
                        }
                      },
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

                    // Action buttons
                    ElevatedButton(
                      onPressed: () async {
                        if (selectedKelasId == null || selectedMapelId == null || contentController.text.trim().isEmpty) {
                          _showSnackBar("Harap lengkapi semua isian form.", isError: true);
                          return;
                        }
                        Navigator.pop(context); // Close bottomsheet
                        setState(() => _isLoading = true);

                        try {
                          await _apiService.saveTimSoal(
                            id: existingSoal?['id'],
                            kelasId: selectedKelasId!,
                            mataPelajaranId: selectedMapelId!,
                            tahunAjaranId: _selectedTahunAjaran!['id'],
                            semester: _selectedSemester,
                            tipeUjian: selectedTipeUjian,
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
                        // Class filter dropdown
                        Row(
                          children: [
                            Icon(Icons.filter_list_rounded, size: 16, color: subColor),
                            const SizedBox(width: 8),
                            Text(
                              "Filter Kelas:",
                              style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: headingColor),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: DropdownButton<int?>(
                                dropdownColor: cardBgColor,
                                value: _filterKelasId,
                                isExpanded: true,
                                underline: const SizedBox(),
                                style: GoogleFonts.outfit(color: headingColor, fontSize: 13),
                                items: [
                                  DropdownMenuItem<int?>(
                                    value: null,
                                    child: Text("Semua Kelas", style: GoogleFonts.outfit(color: headingColor)),
                                  ),
                                  ..._classes.map<DropdownMenuItem<int?>>((c) {
                                    return DropdownMenuItem<int?>(
                                      value: c['id'] as int,
                                      child: Text(c['nama'] as String),
                                    );
                                  }),
                                ],
                                onChanged: (val) {
                                  setState(() {
                                    _filterKelasId = val;
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

  Widget _buildSoalCard(Map<String, dynamic> soal, Color cardBg, bool isDark, Color headingColor, Color subColor) {
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
                  soal['kelas_nama'] ?? '-',
                  style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: subColor),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  soal['tipe_ujian'] ?? 'Ujian Semester',
                  style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.bold, color: isDark ? Colors.white70 : Colors.black54),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
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
