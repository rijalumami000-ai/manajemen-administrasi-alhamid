import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';
import '../widgets/muhafadzoh_info_bottom_sheet.dart';
import '../widgets/qiroah_maqro_bottom_sheet.dart';

class InputNilaiScreen extends StatefulWidget {
  const InputNilaiScreen({super.key});

  @override
  State<InputNilaiScreen> createState() => _InputNilaiScreenState();
}

class _InputNilaiScreenState extends State<InputNilaiScreen> with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  bool _isDataLoading = false;
  bool _isSavingAll = false;

  List<dynamic> _tahunAjaranList = [];
  Map<String, dynamic>? _selectedTahunAjaran;
  String _selectedSemester = 'Ganjil';

  List<dynamic> _classes = [];
  int? _selectedKelasId;

  // Grade form data from API
  Map<String, dynamic>? _classDetail;
  int? _kategoriEvaluasiId;
  int? _muhafadzohMapelId;
  int? _qiroatulMapelId;
  List<dynamic> _students = [];
  List<dynamic> _mataPelajaran = [];
  Map<String, dynamic> _nilaiExisting = {};

  // Active subject selection for tabs with multiple subjects
  int? _selectedRegulerMapelId;
  int? _selectedTaftisyMapelId;

  // Grade inputs state: key is "${santriId}_${mapelId}"
  final Map<String, TextEditingController> _scoreControllers = {};
  final Map<String, String?> _teksValues = {};
  final Map<String, String?> _predikatValues = {};
  final Map<String, bool> _savingStudentMap = {};

  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _initializeFilters();
  }

  @override
  void dispose() {
    _tabController.dispose();
    for (final c in _scoreControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  TextEditingController _getScoreController(int santriId, int mapelId, {String defaultVal = ''}) {
    final key = '${santriId}_$mapelId';
    if (!_scoreControllers.containsKey(key)) {
      _scoreControllers[key] = TextEditingController(text: defaultVal);
    }
    return _scoreControllers[key]!;
  }

  Future<void> _initializeFilters() async {
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

      if (_selectedTahunAjaran != null) {
        final classesData = await _apiService.getClasses(
          tahunAjaranId: _selectedTahunAjaran!['id'],
          semester: _selectedSemester,
        );
        _classes = classesData['classes'] ?? [];
        if (_classes.isNotEmpty) {
          _selectedKelasId = _classes.first['id'] as int;
        }
      }

      await _loadGradeEntryForm();
    } catch (e) {
      _showSnackBar(e.toString(), isError: true);
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _loadGradeEntryForm() async {
    if (_selectedKelasId == null || _selectedTahunAjaran == null) return;

    setState(() => _isDataLoading = true);
    try {
      final data = await _apiService.getInputNilaiSantri(
        kelasId: _selectedKelasId!,
        tahunAjaranId: _selectedTahunAjaran!['id'],
        semester: _selectedSemester,
      );

      _classDetail = data['kelas'];
      _kategoriEvaluasiId = data['kategoriEvaluasiId'];
      _muhafadzohMapelId = data['muhafadzohMapelId'];
      _qiroatulMapelId = data['qiroatulMapelId'];
      _students = data['santri'] ?? [];
      _mataPelajaran = data['mataPelajaran'] ?? [];
      _nilaiExisting = Map<String, dynamic>.from(data['nilaiExisting'] ?? {});

      // Ensure default selections for sub-tabs
      final regList = _regulerMapels;
      if (regList.isNotEmpty) {
        if (_selectedRegulerMapelId == null || !regList.any((m) => m['id'] == _selectedRegulerMapelId)) {
          _selectedRegulerMapelId = regList.first['id'] as int;
        }
      } else {
        _selectedRegulerMapelId = null;
      }

      final tafList = _taftisyMapels;
      if (tafList.isNotEmpty) {
        if (_selectedTaftisyMapelId == null || !tafList.any((m) => m['id'] == _selectedTaftisyMapelId)) {
          _selectedTaftisyMapelId = tafList.first['id'] as int;
        }
      } else {
        _selectedTaftisyMapelId = null;
      }

      _syncControllersWithExistingGrades();
    } catch (e) {
      _showSnackBar(e.toString(), isError: true);
    } finally {
      if (mounted) {
        setState(() => _isDataLoading = false);
      }
    }
  }

  void _syncControllersWithExistingGrades() {
    for (final santri in _students) {
      final santriId = santri['id'] as int;
      final sIdStr = santriId.toString();
      final studentGrades = _nilaiExisting[sIdStr] as Map<String, dynamic>? ?? {};

      for (final mapel in _mataPelajaran) {
        final mapelId = mapel['id'] as int;
        final mIdStr = mapelId.toString();
        final existing = studentGrades[mIdStr];
        final key = '${santriId}_$mapelId';
        final tipeInput = mapel['tipe_input']?.toString() ?? 'Angka';

        if (tipeInput == 'Teks') {
          final parsed = _parseStoredCapaian(existing);
          _teksValues[key] = parsed['bab'];
          _predikatValues[key] = existing?['predikat']?.toString() ?? '';
        } else {
          final scoreVal = existing?['nilai'] != null ? _formatNilai(existing['nilai']) : '';
          if (!_scoreControllers.containsKey(key)) {
            _scoreControllers[key] = TextEditingController(text: scoreVal);
          } else {
            _scoreControllers[key]!.text = scoreVal;
          }
          final double? score = double.tryParse(scoreVal);
          _predikatValues[key] = score != null
              ? _calculatePredikat(score, mapel['konfigurasi'])
              : (existing?['predikat']?.toString() ?? '');
        }
      }
    }
  }

  Map<String, String> _parseStoredCapaian(dynamic existingGrade) {
    if (existingGrade == null || existingGrade['capaian'] == null) {
      return {'bab': '', 'desc': ''};
    }
    final String saved = existingGrade['capaian'].toString();
    final int idx = saved.indexOf(' - ');
    if (idx != -1) {
      return {
        'bab': saved.substring(0, idx).trim(),
        'desc': saved.substring(idx + 3).trim(),
      };
    }
    return {'bab': saved.trim(), 'desc': ''};
  }

  String _formatNilai(dynamic nilai) {
    if (nilai == null) return '';
    final d = double.tryParse(nilai.toString());
    if (d != null) {
      if (d == d.toInt()) {
        return d.toInt().toString();
      }
      return d.toString();
    }
    return nilai.toString();
  }

  String _calculatePredikat(double? score, dynamic konfigurasi) {
    if (score == null) return '';

    if (konfigurasi != null && konfigurasi is Map) {
      for (var entry in konfigurasi.entries) {
        var pred = entry.key.toString();
        var limits = entry.value;
        if (limits is Map) {
          var min = limits['min'];
          var max = limits['max'];
          if (min != null && max != null) {
            double minVal = double.tryParse(min.toString()) ?? 0;
            double maxVal = double.tryParse(max.toString()) ?? 100;
            if (score >= minVal && score <= maxVal) {
              return pred;
            }
          }
        }
      }
      return '';
    }

    if (score >= 90) return 'Mumtaz';
    if (score >= 80) return 'Jayyid';
    if (score >= 70) return 'Mutawassith';
    if (score >= 60) return "Rodi'";
    return "Rodi'";
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

  // ── MATA PELAJARAN CATEGORY HELPERS ───────────────────────────────────────
  Map<String, dynamic>? get _muhafadzohMapel {
    if (_muhafadzohMapelId != null) {
      for (final m in _mataPelajaran) {
        if (m['id'] == _muhafadzohMapelId) return Map<String, dynamic>.from(m);
      }
    }
    for (final m in _mataPelajaran) {
      final n = (m['nama'] ?? '').toString().toLowerCase();
      final j = (m['jenis'] ?? '').toString().toLowerCase();
      if (j == 'muhafadzoh' || n.contains('muhafadzoh')) {
        return Map<String, dynamic>.from(m);
      }
    }
    return null;
  }

  Map<String, dynamic>? get _qiroatulMapel {
    if (_qiroatulMapelId != null) {
      for (final m in _mataPelajaran) {
        if (m['id'] == _qiroatulMapelId) return Map<String, dynamic>.from(m);
      }
    }
    for (final m in _mataPelajaran) {
      final n = (m['nama'] ?? '').toString().toLowerCase();
      final j = (m['jenis'] ?? '').toString().toLowerCase();
      if (j == 'qiroah' || n.contains('qiroah')) {
        return Map<String, dynamic>.from(m);
      }
    }
    return null;
  }

  List<Map<String, dynamic>> get _taftisyMapels {
    return _mataPelajaran.where((m) {
      final mId = m['id'];
      if (mId == _muhafadzohMapelId || mId == _qiroatulMapelId) return false;
      final j = (m['jenis'] ?? '').toString().toLowerCase();
      final n = (m['nama'] ?? '').toString().toLowerCase();
      return j.contains('taftisy') || n.contains('taftisy');
    }).map((m) => Map<String, dynamic>.from(m)).toList();
  }

  List<Map<String, dynamic>> get _regulerMapels {
    return _mataPelajaran.where((m) {
      final mId = m['id'];
      if (mId == _muhafadzohMapelId || mId == _qiroatulMapelId) return false;
      final j = (m['jenis'] ?? '').toString().toLowerCase();
      final n = (m['nama'] ?? '').toString().toLowerCase();
      if (j.contains('taftisy') || n.contains('taftisy')) return false;
      if (j.contains('muhafadzoh') || n.contains('muhafadzoh')) return false;
      if (j.contains('qiroah') || n.contains('qiroah')) return false;
      return true;
    }).map((m) => Map<String, dynamic>.from(m)).toList();
  }

  String get _selectedKelasName {
    if (_selectedKelasId == null || _classes.isEmpty) return "Pilih Kelas";
    final cls = _classes.firstWhere(
      (c) => c['id'] == _selectedKelasId,
      orElse: () => null,
    );
    return cls != null ? (cls['nama']?.toString() ?? 'Pilih Kelas') : "Pilih Kelas";
  }

  // ── SAVE SINGLE STUDENT GRADE ─────────────────────────────────────────────
  Future<void> _saveSingleStudentGrade(Map<String, dynamic> santri, Map<String, dynamic> mapel) async {
    final santriId = santri['id'] as int;
    final mapelId = mapel['id'] as int;
    final key = '${santriId}_$mapelId';
    final tipeInput = mapel['tipe_input']?.toString() ?? 'Angka';

    setState(() => _savingStudentMap[key] = true);
    try {
      double? nilaiAngka;
      String? predikat;
      String? capaian;

      if (tipeInput == 'Teks') {
        final selectedBab = _teksValues[key];
        if (selectedBab != null && selectedBab.isNotEmpty && selectedBab != '__KOSONG__') {
          capaian = selectedBab;
          predikat = _predikatValues[key];
        }
      } else {
        final text = _getScoreController(santriId, mapelId).text.trim();
        if (text.isNotEmpty) {
          nilaiAngka = double.tryParse(text);
          predikat = _predikatValues[key] ?? _calculatePredikat(nilaiAngka, mapel['konfigurasi']);
        }
      }

      final payloadItem = {
        'santri_id': santriId,
        'mata_pelajaran_id': mapelId,
        'nilai_angka': nilaiAngka,
        'predikat': predikat,
        'capaian': capaian,
      };

      await _apiService.saveInputNilai(
        tahunAjaranId: _selectedTahunAjaran!['id'],
        kategoriEvaluasiId: _kategoriEvaluasiId!,
        data: [payloadItem],
      );

      final sIdStr = santriId.toString();
      final mIdStr = mapelId.toString();
      if (!_nilaiExisting.containsKey(sIdStr)) _nilaiExisting[sIdStr] = {};
      _nilaiExisting[sIdStr][mIdStr] = {
        'nilai': nilaiAngka,
        'predikat': predikat,
        'capaian': capaian,
      };

      _showSnackBar("Nilai ${santri['nama']} berhasil disimpan!");
    } catch (e) {
      _showSnackBar(e.toString(), isError: true);
    } finally {
      if (mounted) {
        setState(() => _savingStudentMap[key] = false);
      }
    }
  }

  // ── SAVE ALL STUDENTS FOR A MAPEL IN TAB ──────────────────────────────────
  Future<void> _saveAllStudentsInTab(Map<String, dynamic> mapel) async {
    final mapelId = mapel['id'] as int;
    final tipeInput = mapel['tipe_input']?.toString() ?? 'Angka';

    setState(() => _isSavingAll = true);
    try {
      final List<Map<String, dynamic>> items = [];
      for (final santri in _students) {
        final santriId = santri['id'] as int;
        final key = '${santriId}_$mapelId';

        double? nilaiAngka;
        String? predikat;
        String? capaian;

        if (tipeInput == 'Teks') {
          final selectedBab = _teksValues[key];
          if (selectedBab != null && selectedBab.isNotEmpty && selectedBab != '__KOSONG__') {
            capaian = selectedBab;
            predikat = _predikatValues[key];
          }
        } else {
          final text = _getScoreController(santriId, mapelId).text.trim();
          if (text.isNotEmpty) {
            nilaiAngka = double.tryParse(text);
            predikat = _predikatValues[key] ?? _calculatePredikat(nilaiAngka, mapel['konfigurasi']);
          }
        }

        items.add({
          'santri_id': santriId,
          'mata_pelajaran_id': mapelId,
          'nilai_angka': nilaiAngka,
          'predikat': predikat,
          'capaian': capaian,
        });
      }

      await _apiService.saveInputNilai(
        tahunAjaranId: _selectedTahunAjaran!['id'],
        kategoriEvaluasiId: _kategoriEvaluasiId!,
        data: items,
      );

      for (final item in items) {
        final sIdStr = item['santri_id'].toString();
        final mIdStr = item['mata_pelajaran_id'].toString();
        if (!_nilaiExisting.containsKey(sIdStr)) _nilaiExisting[sIdStr] = {};
        _nilaiExisting[sIdStr][mIdStr] = {
          'nilai': item['nilai_angka'],
          'predikat': item['predikat'],
          'capaian': item['capaian'],
        };
      }

      _showSnackBar("Semua nilai untuk ${mapel['nama']} berhasil disimpan!");
    } catch (e) {
      _showSnackBar(e.toString(), isError: true);
    } finally {
      if (mounted) {
        setState(() => _isSavingAll = false);
      }
    }
  }

  // ── POPUP DIALOG GRID MINI KELAS (4 BARIS KESAMPING) ──────────────────────
  void _showClassSelectionDialog(BuildContext context) {
    final isDark = context.isDarkMode;
    final dialogBg = isDark ? const Color(0xFF0F172A) : Colors.white;

    showDialog(
      context: context,
      builder: (ctx) {
        return Dialog(
          backgroundColor: dialogBg,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          insetPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 24),
          child: Container(
            padding: const EdgeInsets.all(20),
            constraints: const BoxConstraints(maxWidth: 440),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF97316).withOpacity(0.14),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.grid_view_rounded, size: 20, color: Color(0xFFF97316)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Pilih Kelas",
                            style: GoogleFonts.outfit(
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                              color: context.titleColor,
                            ),
                          ),
                          Text(
                            "Pilih kelas santri untuk input nilai",
                            style: GoogleFonts.outfit(fontSize: 12, color: context.subTitleColor),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.close_rounded, color: context.subTitleColor),
                      onPressed: () => Navigator.pop(ctx),
                      constraints: const BoxConstraints(),
                      padding: EdgeInsets.zero,
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (_classes.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Center(
                      child: Text(
                        "Tidak ada kelas tersedia.",
                        style: GoogleFonts.outfit(color: context.subTitleColor),
                      ),
                    ),
                  )
                else
                  ConstrainedBox(
                    constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.55),
                    child: SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      child: GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 4,
                          crossAxisSpacing: 8,
                          mainAxisSpacing: 8,
                          childAspectRatio: 1.25,
                        ),
                        itemCount: _classes.length,
                        itemBuilder: (c, idx) {
                          final cls = _classes[idx];
                          final id = cls['id'] as int;
                          final nama = cls['nama']?.toString() ?? '-';
                          final isSelected = id == _selectedKelasId;

                          return GestureDetector(
                            onTap: () {
                              Navigator.pop(ctx);
                              if (id != _selectedKelasId) {
                                setState(() {
                                  _selectedKelasId = id;
                                });
                                _loadGradeEntryForm();
                              }
                            },
                            child: Container(
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? const Color(0xFFF97316)
                                    : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected
                                      ? const Color(0xFFF97316)
                                      : (isDark ? Colors.white12 : Colors.black12),
                                  width: isSelected ? 1.5 : 1,
                                ),
                                boxShadow: isSelected
                                    ? [
                                        BoxShadow(
                                          color: const Color(0xFFF97316).withOpacity(0.35),
                                          blurRadius: 6,
                                          offset: const Offset(0, 2),
                                        )
                                      ]
                                    : null,
                              ),
                              alignment: Alignment.center,
                              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
                              child: Text(
                                nama,
                                textAlign: TextAlign.center,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.outfit(
                                  fontSize: 12,
                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                                  color: isSelected ? Colors.white : context.titleColor,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ── BUILD INDIVIDUAL STUDENT CARD IN TAB ──────────────────────────────────
  Widget _buildStudentCard(Map<String, dynamic> santri, Map<String, dynamic> mapel, bool isDark) {
    final santriId = santri['id'] as int;
    final mapelId = mapel['id'] as int;
    final key = '${santriId}_$mapelId';
    final tipeInput = mapel['tipe_input']?.toString() ?? 'Angka';
    final isSaving = _savingStudentMap[key] == true;

    final sIdStr = santriId.toString();
    final mIdStr = mapelId.toString();
    final existingGrade = _nilaiExisting[sIdStr]?[mIdStr];
    final bool hasExisting = existingGrade != null &&
        ((existingGrade['nilai'] != null && existingGrade['nilai'].toString().isNotEmpty) ||
            (existingGrade['capaian'] != null && existingGrade['capaian'].toString().isNotEmpty));

    final predikatText = _predikatValues[key] ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131D2E) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF334155).withOpacity(0.5) : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Row: Avatar, Name, NIS, Saved Indicator
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: const Color(0xFFF97316).withOpacity(0.12),
                backgroundImage: santri['foto_url'] != null && santri['foto_url'].toString().trim().isNotEmpty
                    ? NetworkImage(_apiService.getFullImageUrl(santri['foto_url'] as String))
                    : null,
                child: (santri['foto_url'] == null || santri['foto_url'].toString().trim().isEmpty)
                    ? Icon(
                        santri['jenis_kelamin'] == 'P' ? Icons.female_rounded : Icons.male_rounded,
                        color: const Color(0xFFF97316),
                        size: 20,
                      )
                    : null,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      santri['nama'] ?? '-',
                      style: GoogleFonts.outfit(
                        fontSize: 13.5,
                        fontWeight: FontWeight.bold,
                        color: context.titleColor,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      "NIS: ${santri['nis'] ?? '-'}",
                      style: GoogleFonts.outfit(fontSize: 11, color: context.subTitleColor),
                    ),
                  ],
                ),
              ),
              if (hasExisting)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.check_circle_rounded, size: 12, color: Color(0xFF10B981)),
                      const SizedBox(width: 4),
                      Text(
                        "Tersimpan",
                        style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFF10B981)),
                      ),
                    ],
                  ),
                ),
            ],
          ),

          const SizedBox(height: 12),

          // Input Row: Field Input + Live Predikat + Simpan Button
          Row(
            children: [
              // Field Input: Dropdown if Teks, TextField if Angka
              Expanded(
                child: tipeInput == 'Teks'
                    ? Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isDark ? Colors.white12 : Colors.black12,
                          ),
                        ),
                        child: DropdownButton<String>(
                          value: _teksValues[key] == null || _teksValues[key]!.isEmpty ? null : _teksValues[key],
                          isExpanded: true,
                          underline: const SizedBox(),
                          dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                          style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13, fontWeight: FontWeight.w600),
                          hint: Text("Pilih Capaian...", style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 12)),
                          items: [
                            DropdownMenuItem<String>(
                              value: '__KOSONG__',
                              child: Text(
                                '-- Kosongkan --',
                                style: GoogleFonts.outfit(color: context.subTitleColor, fontStyle: FontStyle.italic, fontSize: 12),
                              ),
                            ),
                            ...(mapel['konfigurasi'] as List<dynamic>? ?? []).map<DropdownMenuItem<String>>((c) {
                              final bab = c['bab'].toString();
                              return DropdownMenuItem<String>(
                                value: bab,
                                child: Text(bab, style: GoogleFonts.outfit(fontSize: 12.5)),
                              );
                            }),
                          ],
                          onChanged: (val) {
                            setState(() {
                              if (val == null || val == '__KOSONG__') {
                                _teksValues[key] = '';
                                _predikatValues[key] = '';
                              } else {
                                _teksValues[key] = val;
                                final cfg = (mapel['konfigurasi'] as List<dynamic>?)?.firstWhere(
                                  (c) => c['bab'].toString() == val,
                                  orElse: () => null,
                                );
                                _predikatValues[key] = cfg != null ? (cfg['predikat']?.toString() ?? '') : '';
                              }
                            });
                          },
                        ),
                      )
                    : TextField(
                        controller: _getScoreController(santriId, mapelId),
                        keyboardType: TextInputType.number,
                        style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13, fontWeight: FontWeight.bold),
                        decoration: InputDecoration(
                          hintText: "Nilai (0-100)",
                          hintStyle: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 12),
                          filled: true,
                          fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        ),
                        onChanged: (val) {
                          final double? score = double.tryParse(val);
                          setState(() {
                            _predikatValues[key] = score != null ? _calculatePredikat(score, mapel['konfigurasi']) : '';
                          });
                        },
                      ),
              ),

              // Optional Predikat Badge
              if (predikatText.isNotEmpty) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF97316).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFF97316).withOpacity(0.3)),
                  ),
                  child: Text(
                    predikatText,
                    style: GoogleFonts.outfit(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFFF97316),
                    ),
                  ),
                ),
              ],

              const SizedBox(width: 8),

              // Button Simpan Per Card
              ElevatedButton(
                onPressed: isSaving ? null : () => _saveSingleStudentGrade(santri, mapel),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF97316),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: isSaving
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text(
                        "Simpan",
                        style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 12.5),
                      ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── BUILD TAB CONTENT WITH STUDENTS LIST ──────────────────────────────────
  Widget _buildTabContent(Map<String, dynamic>? mapel, bool isDark, {Widget? subHeader}) {
    if (_isDataLoading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFFF97316)));
    }

    if (_students.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.people_alt_outlined, size: 54, color: const Color(0xFFF97316).withOpacity(0.4)),
              const SizedBox(height: 14),
              Text(
                "Tidak ada santri aktif di kelas ini.",
                style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: context.titleColor),
              ),
              const SizedBox(height: 4),
              Text(
                "Pilih kelas lain atau periksa data kesiswaan di kelas ini.",
                style: GoogleFonts.outfit(fontSize: 12, color: context.subTitleColor),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    if (mapel == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.menu_book_rounded, size: 54, color: context.subTitleColor.withOpacity(0.4)),
              const SizedBox(height: 14),
              Text(
                "Mata pelajaran belum tersedia.",
                style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: context.titleColor),
              ),
              const SizedBox(height: 4),
              Text(
                "Mata pelajaran untuk kategori ini tidak dikonfigurasi pada kelas atau tingkat ini.",
                style: GoogleFonts.outfit(fontSize: 12, color: context.subTitleColor),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    final tipeInput = mapel['tipe_input']?.toString() ?? 'Angka';

    return Column(
      children: [
        if (subHeader != null) subHeader,

        // Tab Top Action Bar: Mapel Info & Bulk Save Button
        Container(
          margin: const EdgeInsets.only(left: 18, right: 18, bottom: 10),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF131D2E) : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDark ? const Color(0xFF334155).withOpacity(0.5) : const Color(0xFFE2E8F0),
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      mapel['nama'] ?? '-',
                      style: GoogleFonts.outfit(fontSize: 13.5, fontWeight: FontWeight.bold, color: context.titleColor),
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      "Format: ${tipeInput == 'Teks' ? 'Pilihan Capaian / Teks' : 'Nilai Angka (0-100)'} • ${_students.length} Santri",
                      style: GoogleFonts.outfit(fontSize: 11, color: context.subTitleColor),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton.icon(
                onPressed: _isSavingAll ? null : () => _saveAllStudentsInTab(mapel),
                icon: _isSavingAll
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.done_all_rounded, size: 16),
                label: Text(
                  "Simpan Semua",
                  style: GoogleFonts.outfit(fontSize: 11.5, fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  elevation: 0,
                ),
              ),
            ],
          ),
        ),

        // Students List
        Expanded(
          child: ListView.builder(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.only(left: 18, right: 18, bottom: 24),
            itemCount: _students.length,
            itemBuilder: (context, index) {
              final santri = _students[index];
              return _buildStudentCard(santri, mapel, isDark);
            },
          ),
        ),
      ],
    );
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
        title: Text(
          "Input Nilai",
          style: GoogleFonts.outfit(color: context.titleColor, fontWeight: FontWeight.bold, fontSize: 17),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: Icon(Icons.menu_book_rounded, color: context.titleColor, size: 21),
            onPressed: () => MuhafadzohInfoBottomSheet.show(
              context,
              tahunAjaranId: _selectedTahunAjaran?['id'],
              semester: _selectedSemester,
            ),
            tooltip: "Ketentuan Nilai Muhafadzoh",
          ),
          IconButton(
            icon: Icon(Icons.chrome_reader_mode_rounded, color: context.titleColor, size: 21),
            onPressed: () => QiroahMaqroBottomSheet.show(
              context,
              tahunAjaranId: _selectedTahunAjaran?['id'],
              semester: _selectedSemester,
            ),
            tooltip: "Maqro Qiroatul Kitab",
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFF97316)))
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // ── TOP FILTER CARD (Tahun, Semester, & Class Popup Picker) ─
                Container(
                  margin: const EdgeInsets.only(left: 18, right: 18, top: 12, bottom: 8),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF131D2E) : Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: isDark ? const Color(0xFF334155).withOpacity(0.5) : const Color(0xFFE2E8F0),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      // Year & Semester Row
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "Tahun Ajaran",
                                  style: GoogleFonts.outfit(fontSize: 11, color: context.subTitleColor),
                                ),
                                DropdownButton<Map<String, dynamic>>(
                                  dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                                  value: _selectedTahunAjaran,
                                  isExpanded: true,
                                  underline: const SizedBox(),
                                  style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13, fontWeight: FontWeight.bold),
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
                                      _apiService.getClasses(tahunAjaranId: val['id'], semester: _selectedSemester).then((classesData) {
                                        _classes = classesData['classes'] ?? [];
                                        if (_classes.isNotEmpty) {
                                          _selectedKelasId = _classes.first['id'] as int;
                                        } else {
                                          _selectedKelasId = null;
                                        }
                                        _loadGradeEntryForm().then((_) {
                                          setState(() => _isLoading = false);
                                        });
                                      });
                                    }
                                  },
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "Semester",
                                  style: GoogleFonts.outfit(fontSize: 11, color: context.subTitleColor),
                                ),
                                DropdownButton<String>(
                                  dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                                  value: _selectedSemester,
                                  isExpanded: true,
                                  underline: const SizedBox(),
                                  style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13, fontWeight: FontWeight.bold),
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
                                      _loadGradeEntryForm().then((_) {
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

                      const SizedBox(height: 10),

                      // Class Picker Button (Triggers 4-column mini-grid popup)
                      GestureDetector(
                        onTap: () => _showClassSelectionDialog(context),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: const Color(0xFFF97316).withOpacity(0.4),
                              width: 1.2,
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.school_rounded, size: 18, color: Color(0xFFF97316)),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      "Kelas Terpilih",
                                      style: GoogleFonts.outfit(fontSize: 10.5, color: context.subTitleColor, fontWeight: FontWeight.w500),
                                    ),
                                    Text(
                                      _selectedKelasName,
                                      style: GoogleFonts.outfit(fontSize: 13.5, fontWeight: FontWeight.bold, color: context.titleColor),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF97316).withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      "Ganti",
                                      style: GoogleFonts.outfit(fontSize: 11.5, fontWeight: FontWeight.bold, color: const Color(0xFFF97316)),
                                    ),
                                    const SizedBox(width: 4),
                                    const Icon(Icons.grid_view_rounded, size: 13, color: Color(0xFFF97316)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // ── TAB BAR FOR GRADE PARTS ─────────────────────────────────
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 18, vertical: 6),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: TabBar(
                    controller: _tabController,
                    isScrollable: true,
                    tabAlignment: TabAlignment.start,
                    indicator: BoxDecoration(
                      color: const Color(0xFFF97316),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    labelColor: Colors.white,
                    unselectedLabelColor: context.subTitleColor,
                    labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 12),
                    unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.w500, fontSize: 12),
                    indicatorSize: TabBarIndicatorSize.tab,
                    dividerColor: Colors.transparent,
                    padding: const EdgeInsets.all(4),
                    tabs: const [
                      Tab(text: "Muhafadzoh Akbar"),
                      Tab(text: "Qiroatul Kitab"),
                      Tab(text: "Taftisyul Kutub"),
                      Tab(text: "Ujian Tulis"),
                    ],
                  ),
                ),

                const SizedBox(height: 6),

                // ── TAB VIEWS CONTENT ───────────────────────────────────────
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      // 1. Tab Muhafadzoh Akbar
                      _buildTabContent(_muhafadzohMapel, isDark),

                      // 2. Tab Qiroatul Kitab
                      _buildTabContent(_qiroatulMapel, isDark),

                      // 3. Tab Taftisyul Kutub
                      Builder(builder: (context) {
                        final taftisyList = _taftisyMapels;
                        Map<String, dynamic>? activeTaftisy;
                        if (taftisyList.isNotEmpty) {
                          activeTaftisy = taftisyList.firstWhere(
                            (m) => m['id'] == _selectedTaftisyMapelId,
                            orElse: () => taftisyList.first,
                          );
                        }

                        Widget? subHeader;
                        if (taftisyList.length > 1) {
                          subHeader = Container(
                            height: 38,
                            margin: const EdgeInsets.only(left: 18, right: 18, bottom: 8),
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: taftisyList.length,
                              itemBuilder: (ctx, i) {
                                final m = taftisyList[i];
                                final isSel = m['id'] == activeTaftisy?['id'];
                                return Padding(
                                  padding: const EdgeInsets.only(right: 6),
                                  child: ChoiceChip(
                                    label: Text(m['nama'] ?? '-'),
                                    selected: isSel,
                                    onSelected: (val) {
                                      if (val) setState(() => _selectedTaftisyMapelId = m['id']);
                                    },
                                    selectedColor: const Color(0xFFF97316),
                                    backgroundColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                                    labelStyle: GoogleFonts.outfit(
                                      fontSize: 11.5,
                                      fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                                      color: isSel ? Colors.white : context.titleColor,
                                    ),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                );
                              },
                            ),
                          );
                        }

                        return _buildTabContent(activeTaftisy, isDark, subHeader: subHeader);
                      }),

                      // 4. Tab Ujian Tulis (Reguler Subjects)
                      Builder(builder: (context) {
                        final regList = _regulerMapels;
                        Map<String, dynamic>? activeReguler;
                        if (regList.isNotEmpty) {
                          activeReguler = regList.firstWhere(
                            (m) => m['id'] == _selectedRegulerMapelId,
                            orElse: () => regList.first,
                          );
                        }

                        Widget? subHeader;
                        if (regList.isNotEmpty) {
                          subHeader = Container(
                            height: 38,
                            margin: const EdgeInsets.only(left: 18, right: 18, bottom: 8),
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: regList.length,
                              itemBuilder: (ctx, i) {
                                final m = regList[i];
                                final isSel = m['id'] == activeReguler?['id'];
                                return Padding(
                                  padding: const EdgeInsets.only(right: 6),
                                  child: ChoiceChip(
                                    label: Text(m['nama'] ?? '-'),
                                    selected: isSel,
                                    onSelected: (val) {
                                      if (val) setState(() => _selectedRegulerMapelId = m['id']);
                                    },
                                    selectedColor: const Color(0xFFF97316),
                                    backgroundColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                                    labelStyle: GoogleFonts.outfit(
                                      fontSize: 11.5,
                                      fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                                      color: isSel ? Colors.white : context.titleColor,
                                    ),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                );
                              },
                            ),
                          );
                        }

                        return _buildTabContent(activeReguler, isDark, subHeader: subHeader);
                      }),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
