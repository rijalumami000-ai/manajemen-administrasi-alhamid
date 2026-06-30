import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';

class KelaskuRaporInputScreen extends StatefulWidget {
  final int kelasId;
  final String kelasNama;

  const KelaskuRaporInputScreen({
    super.key,
    required this.kelasId,
    required this.kelasNama,
  });

  @override
  State<KelaskuRaporInputScreen> createState() => _KelaskuRaporInputScreenState();
}

class _KelaskuRaporInputScreenState extends State<KelaskuRaporInputScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  String? _errorMessage;
  
  List<dynamic> _santriList = [];
  int? _tahunAjaranId;
  int? _kategoriEvaluasiId;
  String _semester = 'Ganjil';

  // Map to hold local updates: { santriId: { 'akhlaq': '...', 'catatan': '...' } }
  final Map<int, Map<String, dynamic>> _localChanges = {};

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await _apiService.getLaporanAkademik(kelasId: widget.kelasId);
      
      _tahunAjaranId = res['tahunAjaranId'];
      _semester = res['semester'] ?? 'Ganjil';
      
      // Determine Kategori Evaluasi ID based on semester
      _kategoriEvaluasiId = res['kategoriId'] ?? (_semester.toLowerCase().contains('genap') ? 2 : 1);

      setState(() {
        _santriList = res['santri'] as List<dynamic>? ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  void _onStudentUpdate(int santriId, String key, dynamic value) {
    if (!_localChanges.containsKey(santriId)) {
      _localChanges[santriId] = {};
    }
    setState(() {
      _localChanges[santriId]![key] = value;
    });
  }

  Future<void> _saveChanges() async {
    if (_localChanges.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Tidak ada perubahan yang perlu disimpan.',
            style: GoogleFonts.outfit(color: Colors.white),
          ),
          backgroundColor: Colors.amber.shade800,
        ),
      );
      return;
    }

    if (_tahunAjaranId == null || _kategoriEvaluasiId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Gagal menyimpan: Metadata tahun ajaran tidak valid.',
            style: GoogleFonts.outfit(color: Colors.white),
          ),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final listData = _localChanges.entries.map((entry) {
        return {
          'santri_id': entry.key,
          ...entry.value,
        };
      }).toList();

      await _apiService.updateKelasRapor(
        tahunAjaranId: _tahunAjaranId!,
        kategoriEvaluasiId: _kategoriEvaluasiId!,
        data: listData,
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Rapor kelas berhasil disimpan!',
            style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold),
          ),
          backgroundColor: const Color(0xFF10B981),
        ),
      );

      _localChanges.clear();
      _loadData();
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Gagal menyimpan: $e',
            style: GoogleFonts.outfit(color: Colors.white),
          ),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  void _openEditDialog(Map<String, dynamic> santri) {
    final santriId = santri['id'] as int;
    final rapor = santri['rapor'] as Map<String, dynamic>? ?? {};

    // Retrieve initial values from local changes or database
    String currentAkhlaq = _localChanges[santriId]?['akhlaq'] ?? rapor['akhlaq'] ?? 'B';
    String currentKeaktifan = _localChanges[santriId]?['keaktifan'] ?? rapor['keaktifan'] ?? 'B';
    String currentKerapihan = _localChanges[santriId]?['kerapihan'] ?? rapor['kerapihan'] ?? 'B';
    String currentCatatan = _localChanges[santriId]?['catatan'] ?? rapor['catatan'] ?? '';
    String currentKenaikan = _localChanges[santriId]?['keputusan_kenaikan'] ?? rapor['keputusan_kenaikan'] ?? '';
    
    // Peringkat Manual
    final rawPeringkat = _localChanges[santriId]?['peringkat_manual'] ?? rapor['peringkat_manual'];
    String currentPeringkatText = rawPeringkat != null ? rawPeringkat.toString() : '';

    final isGenap = _semester.toLowerCase().contains('genap');

    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) {
        final innerIsDark = ThemeManager().isDarkMode;
        final dialogBg = innerIsDark ? const Color(0xFF131C2E) : Colors.white;
        final inputBg = innerIsDark ? const Color(0xFF1F2937) : const Color(0xFFF1F5F9);
        final titleColor = innerIsDark ? Colors.white : const Color(0xFF0F172A);

        final catatanController = TextEditingController(text: currentCatatan);
        final kenaikanController = TextEditingController(text: currentKenaikan);
        final peringkatController = TextEditingController(text: currentPeringkatText);

        final List<String> listKriteria = ['A', 'B', 'C', 'D'];

        return AlertDialog(
          backgroundColor: dialogBg,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: Text(
            santri['nama'] ?? 'Kelola Rapor Santri',
            style: GoogleFonts.outfit(color: titleColor, fontWeight: FontWeight.bold, fontSize: 18),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Akhlaq
                _buildDropdownField(
                  label: "Akhlaq / Kepribadian",
                  value: listKriteria.contains(currentAkhlaq) ? currentAkhlaq : 'B',
                  items: listKriteria,
                  onChanged: (val) {
                    if (val != null) currentAkhlaq = val;
                  },
                  isDark: innerIsDark,
                ),
                const SizedBox(height: 12),

                // Keaktifan
                _buildDropdownField(
                  label: "Keaktifan",
                  value: listKriteria.contains(currentKeaktifan) ? currentKeaktifan : 'B',
                  items: listKriteria,
                  onChanged: (val) {
                    if (val != null) currentKeaktifan = val;
                  },
                  isDark: innerIsDark,
                ),
                const SizedBox(height: 12),

                // Kerapihan
                _buildDropdownField(
                  label: "Kerapihan",
                  value: listKriteria.contains(currentKerapihan) ? currentKerapihan : 'B',
                  items: listKriteria,
                  onChanged: (val) {
                    if (val != null) currentKerapihan = val;
                  },
                  isDark: innerIsDark,
                ),
                const SizedBox(height: 12),

                // Peringkat Manual
                Text(
                  "Sesuaikan Peringkat Manual (Opsional)",
                  style: GoogleFonts.outfit(color: titleColor.withOpacity(0.7), fontSize: 12, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: peringkatController,
                  keyboardType: TextInputType.number,
                  style: GoogleFonts.outfit(color: titleColor),
                  decoration: InputDecoration(
                    hintText: "Peringkat sistem: ${rapor['peringkat'] ?? '-'}",
                    hintStyle: GoogleFonts.outfit(color: titleColor.withOpacity(0.3), fontSize: 13),
                    filled: true,
                    fillColor: inputBg,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                ),
                const SizedBox(height: 12),

                // Catatan Wali Kelas
                Text(
                  "Catatan Wali Kelas",
                  style: GoogleFonts.outfit(color: titleColor.withOpacity(0.7), fontSize: 12, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: catatanController,
                  maxLines: 3,
                  style: GoogleFonts.outfit(color: titleColor),
                  decoration: InputDecoration(
                    hintText: "Tulis catatan perkembangan santri...",
                    hintStyle: GoogleFonts.outfit(color: titleColor.withOpacity(0.3), fontSize: 13),
                    filled: true,
                    fillColor: inputBg,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    contentPadding: const EdgeInsets.all(14),
                  ),
                ),

                // Kenaikan Kelas (Hanya Semester Genap)
                if (isGenap) ...[
                  const SizedBox(height: 12),
                  Text(
                    "Kenaikan Kelas (Tulis Target Kelas Baru)",
                    style: GoogleFonts.outfit(color: titleColor.withOpacity(0.7), fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: kenaikanController,
                    style: GoogleFonts.outfit(color: titleColor),
                    decoration: InputDecoration(
                      hintText: "Contoh: naik ke kelas 3D",
                      hintStyle: GoogleFonts.outfit(color: titleColor.withOpacity(0.3), fontSize: 13),
                      filled: true,
                      fillColor: inputBg,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text("Batal", style: GoogleFonts.outfit(color: Colors.grey)),
            ),
            ElevatedButton(
              onPressed: () {
                final textRank = peringkatController.text.trim();
                final intRank = textRank.isNotEmpty ? int.tryParse(textRank) : null;

                _onStudentUpdate(santriId, 'akhlaq', currentAkhlaq);
                _onStudentUpdate(santriId, 'keaktifan', currentKeaktifan);
                _onStudentUpdate(santriId, 'kerapihan', currentKerapihan);
                _onStudentUpdate(santriId, 'peringkat_manual', intRank);
                _onStudentUpdate(santriId, 'catatan', catatanController.text.trim());
                if (isGenap) {
                  _onStudentUpdate(santriId, 'keputusan_kenaikan', kenaikanController.text.trim());
                }

                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text("Terapkan", style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }

  Widget _buildDropdownField({
    required String label,
    required String value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
    required bool isDark,
  }) {
    final titleColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final inputBg = isDark ? const Color(0xFF1F2937) : const Color(0xFFF1F5F9);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.outfit(color: titleColor.withOpacity(0.7), fontSize: 12, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: value,
          dropdownColor: isDark ? const Color(0xFF1F2937) : Colors.white,
          decoration: InputDecoration(
            filled: true,
            fillColor: inputBg,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          ),
          style: GoogleFonts.outfit(color: titleColor, fontSize: 14),
          items: items.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
          onChanged: onChanged,
        ),
      ],
    );
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
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "Kelola Rapor Kelas ${widget.kelasNama}",
          style: GoogleFonts.outfit(color: headingColor, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          if (_localChanges.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(right: 8.0),
              child: TextButton.icon(
                onPressed: _saveChanges,
                icon: const Icon(Icons.save_rounded, color: Color(0xFF10B981), size: 20),
                label: Text(
                  "Simpan (${_localChanges.length})",
                  style: GoogleFonts.outfit(color: const Color(0xFF10B981), fontWeight: FontWeight.bold),
                ),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline_rounded, color: Colors.amber, size: 48),
                        const SizedBox(height: 16),
                        Text(_errorMessage!, textAlign: TextAlign.center, style: GoogleFonts.outfit(color: context.titleColor, fontSize: 15)),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: _loadData,
                          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
                          child: Text('Coba Lagi', style: GoogleFonts.outfit(color: Colors.white)),
                        ),
                      ],
                    ),
                  ),
                )
              : Column(
                  children: [
                    // Info Header
                    Container(
                      padding: const EdgeInsets.all(16),
                      color: isDark ? const Color(0xFF131C2E) : Colors.white,
                      child: Row(
                        children: [
                          Icon(Icons.info_outline_rounded, color: context.subTitleColor, size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              "Ketuk nama santri untuk mengedit kepribadian, catatan wali kelas, penyesuaian peringkat, dan kenaikan kelas.",
                              style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 11, height: 1.4),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1),

                    // Student List
                    Expanded(
                      child: ListView.separated(
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.all(16),
                        itemCount: _santriList.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final s = _santriList[index];
                          final santriId = s['id'] as int;
                          final hasPending = _localChanges.containsKey(santriId);
                          final rapor = s['rapor'] as Map<String, dynamic>? ?? {};

                          // Local live values
                          final liveAkhlaq = _localChanges[santriId]?['akhlaq'] ?? rapor['akhlaq'] ?? 'B';
                          final liveCatatan = _localChanges[santriId]?['catatan'] ?? rapor['catatan'] ?? '';
                          final livePeringkat = _localChanges[santriId]?['peringkat_manual'] ?? rapor['peringkat_manual'] ?? rapor['peringkat'];
                          
                          return GestureDetector(
                            onTap: () => _openEditDialog(s),
                            child: Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: context.cardBg,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: hasPending
                                      ? const Color(0xFF10B981).withOpacity(0.5)
                                      : context.borderColor,
                                  width: hasPending ? 1.8 : 1.0,
                                ),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor: isDark ? Colors.white10 : Colors.black12,
                                    radius: 20,
                                    child: Text(
                                      "${index + 1}",
                                      style: GoogleFonts.outfit(color: context.titleColor, fontWeight: FontWeight.bold, fontSize: 13),
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          s['nama'] ?? '-',
                                          style: GoogleFonts.outfit(color: context.titleColor, fontWeight: FontWeight.bold, fontSize: 14),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          "NIS: ${s['nis'] ?? '-'}  •  Peringkat: $livePeringkat",
                                          style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 11),
                                        ),
                                        if (liveCatatan.isNotEmpty) ...[
                                          const SizedBox(height: 4),
                                          Text(
                                            "Catatan: \"$liveCatatan\"",
                                            style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 11, fontStyle: FontStyle.italic),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  if (hasPending)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF10B981).withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(Icons.edit_rounded, color: Color(0xFF10B981), size: 12),
                                          const SizedBox(width: 4),
                                          Text(
                                            "Edit",
                                            style: GoogleFonts.outfit(color: const Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.bold),
                                          ),
                                        ],
                                      ),
                                    )
                                  else
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF10B981).withOpacity(0.06),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        liveAkhlaq,
                                        style: GoogleFonts.outfit(color: const Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
      floatingActionButton: (_localChanges.isNotEmpty && !_isLoading)
          ? FloatingActionButton.extended(
              onPressed: _saveChanges,
              backgroundColor: const Color(0xFF10B981),
              icon: const Icon(Icons.save_rounded, color: Colors.white),
              label: Text(
                "Simpan Semua Perubahan",
                style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            )
          : null,
    );
  }
}
