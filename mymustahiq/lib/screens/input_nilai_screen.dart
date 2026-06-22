import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';

class InputNilaiScreen extends StatefulWidget {
  const InputNilaiScreen({super.key});

  @override
  State<InputNilaiScreen> createState() => _InputNilaiScreenState();
}

class _InputNilaiScreenState extends State<InputNilaiScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  bool _isDataLoading = false;

  List<dynamic> _tahunAjaranList = [];
  Map<String, dynamic>? _selectedTahunAjaran;
  String _selectedSemester = 'Ganjil';

  List<dynamic> _classes = [];
  int? _selectedKelasId;

  // Grade form data
  Map<String, dynamic>? _classDetail;
  int? _kategoriEvaluasiId;
  int? _muhafadzohMapelId;
  int? _qiroatulMapelId;
  List<dynamic> _students = [];
  List<dynamic> _mataPelajaran = [];
  Map<String, dynamic> _nilaiExisting = {};

  @override
  void initState() {
    super.initState();
    _initializeFilters();
  }

  Future<void> _initializeFilters() async {
    setState(() => _isLoading = true);
    try {
      // 1. Load academic years list
      final taResult = await _apiService.getTahunAjaranList();
      _tahunAjaranList = taResult['tahunAjaran'] ?? [];
      _selectedSemester = taResult['activeSemester'] ?? 'Ganjil';

      if (_tahunAjaranList.isNotEmpty) {
        _selectedTahunAjaran = _tahunAjaranList.firstWhere(
          (ta) => ta['is_active'] == true,
          orElse: () => _tahunAjaranList.first,
        );
      }

      // 2. Load classes for the active academic year
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
      setState(() => _isLoading = false);
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
    } catch (e) {
      _showSnackBar(e.toString(), isError: true);
    } finally {
      setState(() => _isDataLoading = false);
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

  String _calculatePredikat(double? score, dynamic konfigurasi) {
    if (score == null) return '';
    
    // Use dynamic configuration if provided
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
      return ''; // No match found in config
    }

    // Default hardcoded fallback
    if (score >= 90) return 'Mumtaz';
    if (score >= 80) return 'Jayyid';
    if (score >= 70) return 'Mutawassith';
    if (score >= 60) return "Rodi'";
    return "Rodi'";
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

  int _getGradeProgress(int santriId) {
    final sIdStr = santriId.toString();
    if (!_nilaiExisting.containsKey(sIdStr)) return 0;
    
    final studentGrades = _nilaiExisting[sIdStr] as Map<String, dynamic>;
    int filled = 0;
    
    // Check muhafadzoh
    if (_muhafadzohMapelId != null && studentGrades.containsKey(_muhafadzohMapelId.toString())) {
      final g = studentGrades[_muhafadzohMapelId.toString()];
      if (g != null && g['nilai'] != null) filled++;
    }
    
    // Check qiroah
    if (_qiroatulMapelId != null && studentGrades.containsKey(_qiroatulMapelId.toString())) {
      final g = studentGrades[_qiroatulMapelId.toString()];
      if (g != null && g['nilai'] != null) filled++;
    }
    
    // Check others
    for (final mapel in _mataPelajaran) {
      final mId = mapel['id'].toString();
      if (mId == _muhafadzohMapelId?.toString() || mId == _qiroatulMapelId?.toString()) continue;
      if (studentGrades.containsKey(mId)) {
        final g = studentGrades[mId];
        if (g != null && g['nilai'] != null) filled++;
      }
    }
    
    return filled;
  }

  int _getTotalSubjectsCount() {
    int total = _mataPelajaran.length;
    // Ensure muhafadzoh & qiroah are counted if they exist but not in schedule list
    if (_muhafadzohMapelId != null && !_mataPelajaran.any((m) => m['id'] == _muhafadzohMapelId)) {
      total++;
    }
    if (_qiroatulMapelId != null && !_mataPelajaran.any((m) => m['id'] == _qiroatulMapelId)) {
      total++;
    }
    return total;
  }

  void _showStudentGradesEditPanel(Map<String, dynamic> santri) {
    final santriId = santri['id'] as int;
    final sIdStr = santriId.toString();
    final studentGrades = Map<String, dynamic>.from(_nilaiExisting[sIdStr] ?? {});

    // Prepare lists of form items
    final List<Map<String, dynamic>> formItems = [];

    // 1. Muhafadzoh Akbar
    if (_muhafadzohMapelId != null) {
      final mIdStr = _muhafadzohMapelId.toString();
      final existing = studentGrades[mIdStr];
      final mapelData = _mataPelajaran.firstWhere((m) => m['id'] == _muhafadzohMapelId, orElse: () => <String, dynamic>{});
      final String tipeInput = mapelData['tipe_input']?.toString() ?? 'Angka';
      
      formItems.add({
        'mapel_id': _muhafadzohMapelId,
        'title': 'Muhafadzoh Akbar',
        'is_special': true,
        'tipe_input': tipeInput,
        'konfigurasi': mapelData['konfigurasi'],
        'controller': TextEditingController(text: tipeInput == 'Teks' ? (existing?['capaian'] ?? '') : (existing != null && existing['nilai'] != null ? _formatNilai(existing['nilai']) : '')),
        'predikat_controller': TextEditingController(text: existing?['predikat'] ?? ''),
        'capaian_controller': TextEditingController(text: tipeInput == 'Teks' ? '' : (existing?['capaian'] ?? '')),
      });
    }

    // 2. Qiroatul Kitab
    if (_qiroatulMapelId != null) {
      final mIdStr = _qiroatulMapelId.toString();
      final existing = studentGrades[mIdStr];
      formItems.add({
        'mapel_id': _qiroatulMapelId,
        'title': 'Qiroatul Kitab',
        'is_special': true,
        'tipe_input': 'Angka',
        'konfigurasi': null,
        'controller': TextEditingController(text: existing != null && existing['nilai'] != null ? _formatNilai(existing['nilai']) : ''),
        'predikat_controller': TextEditingController(text: existing?['predikat'] ?? ''),
        'capaian_controller': TextEditingController(text: existing?['capaian'] ?? ''),
      });
    }

    // 3. Taftisyul Kutub and Reguler subjects
    for (final mapel in _mataPelajaran) {
      final mId = mapel['id'] as int;
      if (mId == _muhafadzohMapelId || mId == _qiroatulMapelId) continue;
      
      final mIdStr = mId.toString();
      final existing = studentGrades[mIdStr];
      final isTaftisy = mapel['jenis'] == 'Taftisyul Kutub' || mapel['nama'].toString().toLowerCase().contains('taftisy');
      final String tipeInput = mapel['tipe_input']?.toString() ?? 'Angka';
      
      formItems.add({
        'mapel_id': mId,
        'title': mapel['nama'] as String,
        'is_special': isTaftisy,
        'tipe_input': tipeInput,
        'konfigurasi': mapel['konfigurasi'],
        'controller': TextEditingController(text: tipeInput == 'Teks' ? (existing?['capaian'] ?? '') : (existing != null && existing['nilai'] != null ? _formatNilai(existing['nilai']) : '')),
        'predikat_controller': TextEditingController(text: existing?['predikat'] ?? ''),
        'capaian_controller': TextEditingController(text: tipeInput == 'Teks' ? '' : (existing?['capaian'] ?? '')),
      });
    }

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
              height: MediaQuery.of(context).size.height * 0.85,
              decoration: BoxDecoration(
                color: panelBg,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
              ),
              padding: const EdgeInsets.only(top: 24, left: 20, right: 20, bottom: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Top Title
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 20,
                        backgroundColor: isDark ? Colors.white10 : Colors.black.withOpacity(0.1),
                        backgroundImage: santri['foto_url'] != null
                            ? NetworkImage(_apiService.getFullImageUrl(santri['foto_url'] as String))
                            : null,
                        child: santri['foto_url'] == null
                            ? Icon(
                                santri['jenis_kelamin'] == 'P' ? Icons.female_rounded : Icons.male_rounded,
                                color: Colors.grey,
                                size: 24,
                              )
                            : null,
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              santri['nama'] as String,
                              style: GoogleFonts.outfit(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: titleColor,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              "NIS: ${santri['nis'] ?? '-'}",
                              style: GoogleFonts.outfit(fontSize: 11, color: isDark ? Colors.white54 : Colors.black54),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const Divider(height: 24),
                  
                  // Grade entry list
                  Expanded(
                    child: ListView.builder(
                      physics: const BouncingScrollPhysics(),
                      itemCount: formItems.length,
                      itemBuilder: (context, index) {
                        final item = formItems[index];
                        final scoreCtrl = item['controller'] as TextEditingController;
                        final predCtrl = item['predikat_controller'] as TextEditingController;
                        final descCtrl = item['capaian_controller'] as TextEditingController;

                        return Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white.withOpacity(0.03) : Colors.black.withOpacity(0.02),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.04),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Subject Title
                              Text(
                                item['title'] as String,
                                style: GoogleFonts.outfit(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? const Color(0xFFFB923C) : const Color(0xFFC2410C),
                                ),
                              ),
                              const SizedBox(height: 12),
                              
                              // Score and Predicate Row
                              Row(
                                children: [
                                  // Score Input
                                  Expanded(
                                    flex: 2,
                                    child: item['tipe_input'] == 'Teks'
                                        ? DropdownButtonFormField<String>(
                                            value: scoreCtrl.text.isEmpty ? null : ((item['konfigurasi'] as List<dynamic>? ?? []).any((c) => c['bab'].toString() == scoreCtrl.text) ? scoreCtrl.text : null),
                                            dropdownColor: panelBg,
                                            style: textStyle,
                                            decoration: _inputDecoration("Pilih Capaian / Teks", isDark),
                                            items: (item['konfigurasi'] as List<dynamic>? ?? [])
                                                .map<DropdownMenuItem<String>>((c) {
                                              return DropdownMenuItem<String>(
                                                value: c['bab'].toString(),
                                                child: Text(c['bab'].toString(), style: textStyle),
                                              );
                                            }).toList(),
                                            onChanged: (val) {
                                              if (val != null) {
                                                setModalState(() {
                                                  scoreCtrl.text = val;
                                                  final cfg = (item['konfigurasi'] as List<dynamic>?)?.firstWhere(
                                                      (c) => c['bab'].toString() == val, orElse: () => null);
                                                  predCtrl.text = cfg != null ? (cfg['predikat']?.toString() ?? '') : '';
                                                });
                                              }
                                            },
                                          )
                                        : TextField(
                                            controller: scoreCtrl,
                                            keyboardType: TextInputType.number,
                                            style: textStyle,
                                            decoration: _inputDecoration("Nilai (0-100)", isDark),
                                            onChanged: (val) {
                                              final double? score = double.tryParse(val);
                                              if (score != null) {
                                                setModalState(() {
                                                  predCtrl.text = _calculatePredikat(score, item['konfigurasi']);
                                                });
                                              } else {
                                                setModalState(() {
                                                  predCtrl.text = '';
                                                });
                                              }
                                            },
                                          ),
                                  ),
                                  const SizedBox(width: 12),
                                  // Predicate Input
                                  Expanded(
                                    flex: 1,
                                    child: TextField(
                                      controller: predCtrl,
                                      textAlign: TextAlign.center,
                                      maxLength: 2,
                                      style: textStyle.copyWith(fontWeight: FontWeight.bold),
                                      decoration: _inputDecoration("Predikat", isDark).copyWith(
                                        counterText: "",
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              
                              // Capaian Input
                              TextField(
                                controller: descCtrl,
                                style: textStyle,
                                decoration: _inputDecoration("Catatan Capaian / Deskripsi", isDark),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                  
                  const SizedBox(height: 12),
                  
                  // Save button
                  ElevatedButton(
                    onPressed: () async {
                      Navigator.pop(context); // Close bottomsheet
                      setState(() => _isDataLoading = true);

                      // Package grades data
                      final List<Map<String, dynamic>> gradesToSave = [];
                      for (final item in formItems) {
                        final mId = item['mapel_id'] as int;
                        final scoreText = (item['controller'] as TextEditingController).text.trim();
                        final pred = (item['predikat_controller'] as TextEditingController).text.trim();
                        final desc = (item['capaian_controller'] as TextEditingController).text.trim();

                        final bool isTeks = item['tipe_input'] == 'Teks';
                        final double? score = isTeks ? null : double.tryParse(scoreText);
                        
                        // For 'Teks', scoreText holds the "bab" which goes to capaian. 
                        // We also append desc if there's any extra note.
                        String finalCapaian = '';
                        if (isTeks) {
                          finalCapaian = desc.isNotEmpty ? "$scoreText - $desc" : scoreText;
                        } else {
                          finalCapaian = desc;
                        }

                        gradesToSave.add({
                          'santri_id': santriId,
                          'mata_pelajaran_id': mId,
                          'nilai_angka': score,
                          'predikat': pred.isNotEmpty ? pred : null,
                          'capaian': finalCapaian.isNotEmpty ? finalCapaian : null,
                        });
                      }

                      try {
                        await _apiService.saveInputNilai(
                          tahunAjaranId: _selectedTahunAjaran!['id'],
                          kategoriEvaluasiId: _kategoriEvaluasiId!,
                          data: gradesToSave,
                        );
                        _showSnackBar("Nilai ${santri['nama']} berhasil disimpan!");
                        await _loadGradeEntryForm();
                      } catch (e) {
                        _showSnackBar(e.toString(), isError: true);
                      } finally {
                        setState(() => _isDataLoading = false);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isDark ? const Color(0xFFFB923C) : const Color(0xFFC2410C),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      elevation: 0,
                    ),
                    child: Text(
                      "Simpan Nilai Santri",
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  InputDecoration _inputDecoration(String label, bool isDark) {
    return InputDecoration(
      labelText: label,
      labelStyle: GoogleFonts.outfit(color: isDark ? Colors.white38 : Colors.black38, fontSize: 13),
      filled: true,
      fillColor: isDark ? Colors.white.withOpacity(0.03) : Colors.black.withOpacity(0.015),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: isDark ? Colors.white12 : Colors.black12),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: isDark ? const Color(0xFFFB923C) : const Color(0xFFC2410C), width: 1.5),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;
    final primaryBgColor = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final cardBgColor = isDark ? const Color(0xFF1E293B) : Colors.white;
    final headingColor = isDark ? Colors.white : const Color(0xFF1E293B);
    final subColor = isDark ? const Color(0xFFFB923C) : const Color(0xFFC2410C);

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
          "Input Nilai",
          style: GoogleFonts.outfit(color: isDark ? Colors.white : Colors.black87, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.orange))
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
                                        // Reload classes and form
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
                        const Divider(height: 20),
                        // Kelas selection
                        Row(
                          children: [
                            Icon(Icons.class_rounded, size: 16, color: subColor),
                            const SizedBox(width: 8),
                            Text(
                              "Pilih Kelas:",
                              style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: headingColor),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: DropdownButton<int?>(
                                dropdownColor: cardBgColor,
                                value: _selectedKelasId,
                                isExpanded: true,
                                underline: const SizedBox(),
                                style: GoogleFonts.outfit(color: headingColor, fontSize: 13, fontWeight: FontWeight.bold),
                                items: _classes.map<DropdownMenuItem<int?>>((c) {
                                  return DropdownMenuItem<int?>(
                                    value: c['id'] as int,
                                    child: Text(c['nama'] as String),
                                  );
                                }).toList(),
                                onChanged: (val) {
                                  if (val != null) {
                                    setState(() {
                                      _selectedKelasId = val;
                                      _isDataLoading = true;
                                    });
                                    _loadGradeEntryForm();
                                  }
                                },
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Student list loader
                  Expanded(
                    child: _isDataLoading
                        ? const Center(child: CircularProgressIndicator(color: Colors.orange))
                        : _students.isEmpty
                            ? Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.people_alt_outlined, size: 64, color: subColor.withOpacity(0.4)),
                                    const SizedBox(height: 16),
                                    Text(
                                      "Tidak ada santri aktif.",
                                      style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold, color: headingColor),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      "Tidak ada santri aktif di kelas ini pada tahun ajaran terpilih.",
                                      textAlign: TextAlign.center,
                                      style: GoogleFonts.outfit(fontSize: 11, color: isDark ? Colors.white60 : Colors.black54),
                                    ),
                                  ],
                                ),
                              )
                            : Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.only(left: 6.0, bottom: 8),
                                    child: Text(
                                      "Daftar Santri (${_students.length} Orang)",
                                      style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold, color: isDark ? Colors.white70 : Colors.black54),
                                    ),
                                  ),
                                  Expanded(
                                    child: ListView.builder(
                                      physics: const BouncingScrollPhysics(),
                                      itemCount: _students.length,
                                      itemBuilder: (context, index) {
                                        final santri = _students[index];
                                        return _buildStudentCard(santri, cardBgColor, isDark, headingColor, subColor);
                                      },
                                    ),
                                  ),
                                ],
                              ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildStudentCard(Map<String, dynamic> santri, Color cardBg, bool isDark, Color headingColor, Color subColor) {
    final santriId = santri['id'] as int;
    final filled = _getGradeProgress(santriId);
    final total = _getTotalSubjectsCount();
    final bool isComplete = filled == total && total > 0;

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
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => _showStudentGradesEditPanel(santri),
            child: Padding(
              padding: const EdgeInsets.all(14.0),
              child: Row(
                children: [
                  // Photo/Avatar
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: isDark ? Colors.white10 : Colors.black.withOpacity(0.1),
                    backgroundImage: santri['foto_url'] != null
                        ? NetworkImage(_apiService.getFullImageUrl(santri['foto_url'] as String))
                        : null,
                    child: santri['foto_url'] == null
                        ? Icon(
                            santri['jenis_kelamin'] == 'P' ? Icons.female_rounded : Icons.male_rounded,
                            color: Colors.grey,
                            size: 28,
                          )
                        : null,
                  ),
                  const SizedBox(width: 14),
                  // Name and NIS
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          santri['nama'] ?? '-',
                          style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: headingColor),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "NIS: ${santri['nis'] ?? '-'}",
                          style: GoogleFonts.outfit(fontSize: 11, color: isDark ? Colors.white54 : Colors.black54),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Grade progress badge
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: isComplete
                              ? const Color(0xFF10B981).withOpacity(0.1)
                              : subColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          "$filled / $total Nilai",
                          style: GoogleFonts.outfit(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: isComplete ? const Color(0xFF10B981) : subColor,
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Text(
                            "Input",
                            style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.bold, color: subColor),
                          ),
                          const SizedBox(width: 2),
                          Icon(Icons.chevron_right_rounded, size: 14, color: subColor),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
