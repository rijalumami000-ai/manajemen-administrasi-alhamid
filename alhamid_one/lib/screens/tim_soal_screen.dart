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
  bool _isSaving = false;

  List<dynamic> _tahunAjaranList = [];
  Map<String, dynamic>? _selectedTahunAjaran;
  String _selectedSemester = 'Ganjil';

  List<dynamic> _classes = [];
  Map<String, dynamic> _mapelPerTingkat = {};
  List<dynamic> _soalList = [];

  // Selected filters
  int? _filterTingkat;
  bool _filterIsHer = false; // false = Soal Utama, true = Soal Her
  int? _selectedMapelId;
  Map<String, dynamic>? _existingSoal;

  // 10 Question slots controllers
  final List<TextEditingController> _teksControllers = List.generate(10, (_) => TextEditingController());
  final List<TextEditingController> _jawabanControllers = List.generate(10, (_) => TextEditingController());

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  @override
  void dispose() {
    for (final c in _teksControllers) {
      c.dispose();
    }
    for (final c in _jawabanControllers) {
      c.dispose();
    }
    super.dispose();
  }

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

  List<Map<String, dynamic>> get _distinctTingkatList {
    final seen = <int>{};
    final result = <Map<String, dynamic>>[];
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
          'kelas_id': c['id'],
        });
      }
    }
    return result;
  }

  List<Map<String, dynamic>> _getSubjectsForTingkat(int? tingkat) {
    if (tingkat == null) return [];
    final key = tingkat.toString();
    final mapelList = _mapelPerTingkat[key];
    if (mapelList == null || mapelList is! List) return [];
    return mapelList.map<Map<String, dynamic>>((m) => Map<String, dynamic>.from(m as Map)).toList();
  }

  Future<void> _initializeData() async {
    setState(() => _isLoading = true);
    try {
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
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _loadFormDataAndList() async {
    if (_selectedTahunAjaran == null) return;
    final taId = _selectedTahunAjaran!['id'];

    final metaData = await _apiService.getTimSoalData(tahunAjaranId: taId);
    _classes = metaData['classes'] ?? [];
    _mapelPerTingkat = Map<String, dynamic>.from(metaData['mapelPerTingkat'] ?? {});

    if (_filterTingkat == null && _distinctTingkatList.isNotEmpty) {
      _filterTingkat = _distinctTingkatList.first['tingkat'] as int;
    }

    await _loadSoalList();
  }

  Future<void> _loadSoalList() async {
    if (_selectedTahunAjaran == null) return;
    final taId = _selectedTahunAjaran!['id'];

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

    allSoal = allSoal.where((s) {
      final isHer = s['is_her'] == true;
      return isHer == _filterIsHer;
    }).toList();

    if (mounted) {
      setState(() {
        _soalList = allSoal;
        _syncFormWithSelection();
      });
    }
  }

  void _syncFormWithSelection() {
    if (_selectedMapelId == null || _filterTingkat == null) {
      _existingSoal = null;
      for (int i = 0; i < 10; i++) {
        _teksControllers[i].clear();
        _jawabanControllers[i].clear();
      }
      return;
    }

    final match = _soalList.firstWhere(
      (s) =>
          s['tingkat'] == _filterTingkat &&
          s['mapel_id'] == _selectedMapelId &&
          s['is_her'] == _filterIsHer,
      orElse: () => null,
    );

    _existingSoal = match;

    for (int i = 0; i < 10; i++) {
      _teksControllers[i].clear();
      _jawabanControllers[i].clear();
    }

    if (match != null && match['soal_array'] is List) {
      final list = match['soal_array'] as List;
      for (int i = 0; i < list.length && i < 10; i++) {
        final item = list[i];
        if (item is Map) {
          _teksControllers[i].text = (item['teks'] ?? '').toString();
          _jawabanControllers[i].text = (item['jawaban'] ?? '').toString();
        }
      }
    }
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

  Future<void> _saveLembarSoal() async {
    if (_filterTingkat == null || _selectedMapelId == null) {
      _showSnackBar("Harap pilih Kelas dan Mata Pelajaran terlebih dahulu.", isError: true);
      return;
    }

    final List<Map<String, dynamic>> finalSoalArray = [];
    for (int i = 0; i < 10; i++) {
      final teks = _teksControllers[i].text.trim();
      final jawaban = _jawabanControllers[i].text.trim();
      if (teks.isNotEmpty) {
        finalSoalArray.add({'teks': teks, 'jawaban': jawaban});
      }
    }

    if (finalSoalArray.isEmpty) {
      _showSnackBar("Harap tuliskan minimal 1 pertanyaan soal sebelum menyimpan.", isError: true);
      return;
    }

    final matchClass = _classes.firstWhere(
      (c) => c['tingkat'] == _filterTingkat,
      orElse: () => null,
    );
    if (matchClass == null) {
      _showSnackBar("Kelas untuk tingkat ini tidak ditemukan.", isError: true);
      return;
    }
    final kelasId = matchClass['id'] as int;

    setState(() => _isSaving = true);
    try {
      final tipeUjian = _filterIsHer ? 'SOAL HER' : 'PENILAIAN AKHIR SEMESTER';
      final combinedKontenSoal = finalSoalArray.asMap().entries.map((e) => "${e.key + 1}. ${e.value['teks']}").join('\n');

      await _apiService.saveTimSoal(
        id: _existingSoal?['id'],
        kelasId: kelasId,
        mataPelajaranId: _selectedMapelId!,
        tahunAjaranId: _selectedTahunAjaran!['id'],
        semester: _selectedSemester,
        tipeUjian: tipeUjian,
        kontenSoal: combinedKontenSoal,
        soalArray: finalSoalArray,
      );

      _showSnackBar("Lembar soal (${finalSoalArray.length} butir) berhasil disimpan dan tersinkron ke Web!");
      await _loadSoalList();
    } catch (e) {
      _showSnackBar(e.toString(), isError: true);
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _deleteLembarSoal() async {
    if (_existingSoal == null || _existingSoal!['id'] == null) return;
    final int id = _existingSoal!['id'];

    final isConfirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text("Hapus Lembar Soal", style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Text("Apakah Anda yakin ingin menghapus seluruh soal untuk mata pelajaran ini?", style: GoogleFonts.outfit()),
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

    setState(() => _isSaving = true);
    try {
      await _apiService.deleteTimSoal(id);
      _showSnackBar("Lembar soal berhasil dihapus.");
      await _loadSoalList();
    } catch (e) {
      _showSnackBar(e.toString(), isError: true);
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;
    final primaryBgColor = context.scaffoldBg;
    final cardBgColor = context.cardBg;
    final headingColor = isDark ? Colors.white : const Color(0xFF1E293B);
    final accentColor = const Color(0xFFEC4899);

    final currentSubjects = _getSubjectsForTingkat(_filterTingkat);

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
          "Penyusunan Lembar Soal",
          style: GoogleFonts.outfit(
            color: isDark ? Colors.white : Colors.black87,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.pink))
          : GestureDetector(
              onTap: () => FocusScope.of(context).unfocus(),
              child: ListView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                children: [
                  // 1. Selector Container (Kelas > Jenis Soal > Mapel)
                  Container(
                    decoration: BoxDecoration(
                      color: cardBgColor,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(isDark ? 0.25 : 0.04),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                      border: Border.all(
                        color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.06),
                      ),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Tahun Ajaran & Semester
                        Row(
                          children: [
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
                                    style: GoogleFonts.outfit(color: headingColor, fontSize: 13, fontWeight: FontWeight.bold),
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
                                          if (mounted) setState(() => _isLoading = false);
                                        });
                                      }
                                    },
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 16),
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
                                    style: GoogleFonts.outfit(color: headingColor, fontSize: 13, fontWeight: FontWeight.bold),
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
                                          if (mounted) setState(() => _isLoading = false);
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

                        // 1. Pilih Kelas (Tingkat)
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: accentColor.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(Icons.school_rounded, size: 16, color: accentColor),
                            ),
                            const SizedBox(width: 10),
                            Text(
                              "1. Pilih Kelas:",
                              style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold, color: headingColor),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10),
                                decoration: BoxDecoration(
                                  color: isDark ? Colors.white.withOpacity(0.04) : Colors.black.withOpacity(0.03),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: DropdownButton<int?>(
                                  dropdownColor: cardBgColor,
                                  value: _filterTingkat,
                                  isExpanded: true,
                                  underline: const SizedBox(),
                                  style: GoogleFonts.outfit(color: headingColor, fontSize: 13, fontWeight: FontWeight.w600),
                                  items: _distinctTingkatList.map<DropdownMenuItem<int?>>((t) {
                                    return DropdownMenuItem<int?>(
                                      value: t['tingkat'] as int,
                                      child: Text(t['label'] as String),
                                    );
                                  }).toList(),
                                  onChanged: (val) {
                                    setState(() {
                                      _filterTingkat = val;
                                      _selectedMapelId = null;
                                      _isLoading = true;
                                    });
                                    _loadSoalList().then((_) {
                                      if (mounted) setState(() => _isLoading = false);
                                    });
                                  },
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 12),

                        // 2. Pilih Jenis Soal (Soal Utama / Her)
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF97316).withOpacity(0.12),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.category_rounded, size: 16, color: Color(0xFFF97316)),
                            ),
                            const SizedBox(width: 10),
                            Text(
                              "2. Jenis Soal:",
                              style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold, color: headingColor),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Row(
                                children: [
                                  Expanded(
                                    child: GestureDetector(
                                      onTap: () {
                                        setState(() {
                                          _filterIsHer = false;
                                          _isLoading = true;
                                        });
                                        _loadSoalList().then((_) {
                                          if (mounted) setState(() => _isLoading = false);
                                        });
                                      },
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(vertical: 8),
                                        decoration: BoxDecoration(
                                          color: !_filterIsHer ? accentColor : (isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.04)),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: Center(
                                          child: Text(
                                            "Soal Utama",
                                            style: GoogleFonts.outfit(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: !_filterIsHer ? Colors.white : context.subTitleColor,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: GestureDetector(
                                      onTap: () {
                                        setState(() {
                                          _filterIsHer = true;
                                          _isLoading = true;
                                        });
                                        _loadSoalList().then((_) {
                                          if (mounted) setState(() => _isLoading = false);
                                        });
                                      },
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(vertical: 8),
                                        decoration: BoxDecoration(
                                          color: _filterIsHer ? Colors.orange : (isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.04)),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: Center(
                                          child: Text(
                                            "Soal Her",
                                            style: GoogleFonts.outfit(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: _filterIsHer ? Colors.white : context.subTitleColor,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 12),

                        // 3. Pilih Mata Pelajaran
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: const Color(0xFF10B981).withOpacity(0.12),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.menu_book_rounded, size: 16, color: Color(0xFF10B981)),
                            ),
                            const SizedBox(width: 10),
                            Text(
                              "3. Pelajaran:",
                              style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold, color: headingColor),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10),
                                decoration: BoxDecoration(
                                  color: isDark ? Colors.white.withOpacity(0.04) : Colors.black.withOpacity(0.03),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: _selectedMapelId != null ? const Color(0xFF10B981).withOpacity(0.4) : Colors.transparent,
                                  ),
                                ),
                                child: DropdownButton<int?>(
                                  dropdownColor: cardBgColor,
                                  value: _selectedMapelId,
                                  hint: Text(
                                    "Pilih Mata Pelajaran...",
                                    style: GoogleFonts.outfit(fontSize: 12.5, color: context.subTitleColor),
                                  ),
                                  isExpanded: true,
                                  underline: const SizedBox(),
                                  style: GoogleFonts.outfit(color: headingColor, fontSize: 13, fontWeight: FontWeight.bold),
                                  items: currentSubjects.map<DropdownMenuItem<int?>>((m) {
                                    final mId = m['id'] as int;
                                    final hasSoal = _soalList.any((s) => s['mapel_id'] == mId);
                                    return DropdownMenuItem<int?>(
                                      value: mId,
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              m['nama'] as String,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          if (hasSoal)
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFF10B981).withOpacity(0.15),
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: Text(
                                                "Ada Soal",
                                                style: GoogleFonts.outfit(
                                                  color: const Color(0xFF10B981),
                                                  fontSize: 9,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                        ],
                                      ),
                                    );
                                  }).toList(),
                                  onChanged: (val) {
                                    setState(() {
                                      _selectedMapelId = val;
                                      _syncFormWithSelection();
                                    });
                                  },
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // 2. Editor Section: 10 Soal Slots OR Placeholder
                  if (_selectedMapelId == null)
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
                      decoration: BoxDecoration(
                        color: cardBgColor,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.04),
                        ),
                      ),
                      child: Column(
                        children: [
                          Icon(Icons.touch_app_rounded, size: 54, color: accentColor.withOpacity(0.4)),
                          const SizedBox(height: 14),
                          Text(
                            "Pilih Mata Pelajaran Di Atas",
                            style: GoogleFonts.outfit(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: headingColor,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            "Setelah memilih mata pelajaran, 10 kolom pertanyaan dan kunci jawaban akan langsung tersaji untuk Anda tulis dan simpan.",
                            textAlign: TextAlign.center,
                            style: GoogleFonts.outfit(
                              fontSize: 12.5,
                              color: context.subTitleColor,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    )
                  else ...[
                    // Header Banner of Active Subject
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: _existingSoal != null
                            ? const Color(0xFF10B981).withOpacity(0.12)
                            : accentColor.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: _existingSoal != null
                              ? const Color(0xFF10B981).withOpacity(0.3)
                              : accentColor.withOpacity(0.3),
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            _existingSoal != null ? Icons.check_circle_outline_rounded : Icons.edit_note_rounded,
                            size: 18,
                            color: _existingSoal != null ? const Color(0xFF10B981) : accentColor,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _existingSoal != null
                                  ? "Mode Edit: Lembar soal sudah tersimpan di database."
                                  : "Mode Baru: Tulis butir soal (maksimal 10 nomor).",
                              style: GoogleFonts.outfit(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: _existingSoal != null ? const Color(0xFF10B981) : accentColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 14),

                    // 10 Question Cards
                    ...List.generate(10, (index) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: cardBgColor,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.06),
                            width: 1.1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(isDark ? 0.15 : 0.02),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Nomor Badge & Clear button
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 10),
                                  decoration: BoxDecoration(
                                    color: accentColor.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    "Nomor ${index + 1}",
                                    style: GoogleFonts.outfit(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                      color: accentColor,
                                    ),
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.clear_rounded, size: 18, color: Colors.grey),
                                  tooltip: "Kosongkan nomor ini",
                                  constraints: const BoxConstraints(),
                                  padding: EdgeInsets.zero,
                                  onPressed: () {
                                    setState(() {
                                      _teksControllers[index].clear();
                                      _jawabanControllers[index].clear();
                                    });
                                  },
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),

                            // Pertanyaan Soal
                            Text(
                              "Pertanyaan Soal",
                              style: GoogleFonts.outfit(
                                fontWeight: FontWeight.bold,
                                fontSize: 11.5,
                                color: isDark ? Colors.white70 : Colors.black87,
                              ),
                            ),
                            const SizedBox(height: 4),
                            TextField(
                              controller: _teksControllers[index],
                              maxLines: 3,
                              style: GoogleFonts.outfit(color: headingColor, fontSize: 13),
                              decoration: InputDecoration(
                                hintText: "Tulis pertanyaan soal nomor ${index + 1}...",
                                hintStyle: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 12.5),
                                filled: true,
                                fillColor: isDark ? Colors.white.withOpacity(0.04) : Colors.black.withOpacity(0.02),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  borderSide: BorderSide.none,
                                ),
                                contentPadding: const EdgeInsets.all(10),
                              ),
                            ),
                            const SizedBox(height: 8),

                            // Kunci Jawaban
                            Text(
                              "Kunci Jawaban",
                              style: GoogleFonts.outfit(
                                fontWeight: FontWeight.bold,
                                fontSize: 11.5,
                                color: isDark ? Colors.white70 : Colors.black87,
                              ),
                            ),
                            const SizedBox(height: 4),
                            TextField(
                              controller: _jawabanControllers[index],
                              maxLines: 2,
                              style: GoogleFonts.outfit(color: headingColor, fontSize: 13),
                              decoration: InputDecoration(
                                hintText: "Tulis kunci jawaban nomor ${index + 1} (opsional)...",
                                hintStyle: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 12.5),
                                filled: true,
                                fillColor: isDark ? Colors.white.withOpacity(0.04) : Colors.black.withOpacity(0.02),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  borderSide: BorderSide.none,
                                ),
                                contentPadding: const EdgeInsets.all(10),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),

                    const SizedBox(height: 8),

                    // Actions: Simpan & Hapus
                    ElevatedButton.icon(
                      onPressed: _isSaving ? null : _saveLembarSoal,
                      icon: _isSaving
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Icon(Icons.cloud_upload_rounded, color: Colors.white),
                      label: Text(
                        _isSaving ? "Menyimpan..." : "Simpan Lembar Soal",
                        style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: accentColor,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        elevation: 0,
                      ),
                    ),

                    if (_existingSoal != null) ...[
                      const SizedBox(height: 10),
                      OutlinedButton.icon(
                        onPressed: _isSaving ? null : _deleteLembarSoal,
                        icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 18),
                        label: Text(
                          "Hapus Lembar Soal Ini",
                          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.redAccent),
                        ),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.redAccent, width: 1.2),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ],

                    const SizedBox(height: 32),
                  ],
                ],
              ),
            ),
    );
  }
}
