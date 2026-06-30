import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';

class InputAbsensiScreen extends StatefulWidget {
  const InputAbsensiScreen({super.key});

  @override
  State<InputAbsensiScreen> createState() => _InputAbsensiScreenState();
}

class _InputAbsensiScreenState extends State<InputAbsensiScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  String? _errorMessage;

  List<dynamic> _classes = [];
  Map<String, dynamic>? _selectedClass;

  List<dynamic> _months = [];
  String? _selectedMonth;

  List<dynamic> _santriList = [];
  int? _tahunAjaranId;
  int? _kategoriEvaluasiId;

  // Local changes structure: { santriId: { 'sakit': 0, 'izin': 0, 'alpa': 0 } }
  final Map<int, Map<String, int>> _localAbsensi = {};

  @override
  void initState() {
    super.initState();
    _loadClasses();
  }

  Future<void> _loadClasses() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await _apiService.getClasses();
      setState(() {
        _classes = res['classes'] ?? [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _loadAbsensiReport() async {
    if (_selectedClass == null) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _santriList = [];
      _localAbsensi.clear();
    });

    try {
      final res = await _apiService.getAbsensiReport(kelasId: _selectedClass!['id']);
      _tahunAjaranId = res['tahunAjaranId'];
      _kategoriEvaluasiId = res['kategoriId'];
      _months = res['months'] ?? [];

      // Set default month if available
      if (_months.isNotEmpty) {
        _selectedMonth = _months.first;
      }

      setState(() {
        _santriList = res['santri'] ?? [];
        _isLoading = false;
        _initializeLocalAbsensi();
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  void _initializeLocalAbsensi() {
    if (_selectedMonth == null) return;
    _localAbsensi.clear();

    for (var s in _santriList) {
      final id = s['id'] as int;
      final monthly = s['absensi']?[_selectedMonth] as Map<String, dynamic>?;
      _localAbsensi[id] = {
        'sakit': (monthly?['sakit'] ?? 0) as int,
        'izin': (monthly?['izin'] ?? 0) as int,
        'alpa': (monthly?['alpa'] ?? 0) as int,
      };
    }
  }

  void _adjustCount(int santriId, String type, int delta) {
    if (!_localAbsensi.containsKey(santriId)) return;
    setState(() {
      int currentVal = _localAbsensi[santriId]![type] ?? 0;
      int newVal = currentVal + delta;
      if (newVal < 0) newVal = 0;
      _localAbsensi[santriId]![type] = newVal;
    });
  }

  Future<void> _saveAbsensi() async {
    if (_selectedClass == null || _selectedMonth == null || _tahunAjaranId == null || _kategoriEvaluasiId == null) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final dataList = _localAbsensi.entries.map((entry) {
        return {
          'santri_id': entry.key,
          'sakit': entry.value['sakit'],
          'izin': entry.value['izin'],
          'alpa': entry.value['alpa'],
        };
      }).toList();

      await _apiService.updateAbsensiBulanan(
        tahunAjaranId: _tahunAjaranId!,
        kategoriEvaluasiId: _kategoriEvaluasiId!,
        bulan: _selectedMonth!,
        data: dataList,
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Absensi bulan $_selectedMonth berhasil disimpan!',
            style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold),
          ),
          backgroundColor: const Color(0xFF10B981),
        ),
      );

      _loadAbsensiReport();
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Gagal menyimpan: $e', style: GoogleFonts.outfit(color: Colors.white)),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
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
          "Input Absensi Santri",
          style: GoogleFonts.outfit(color: headingColor, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: Column(
        children: [
          // Filter Bar
          Container(
            padding: const EdgeInsets.all(16),
            color: isDark ? const Color(0xFF131C2E) : Colors.white,
            child: Row(
              children: [
                // Class selector
                Expanded(
                  child: DropdownButtonFormField<Map<String, dynamic>>(
                    value: _selectedClass,
                    hint: Text("Pilih Kelas", style: GoogleFonts.outfit(fontSize: 13, color: context.subTitleColor)),
                    dropdownColor: isDark ? const Color(0xFF1F2937) : Colors.white,
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: isDark ? const Color(0xFF1F2937) : const Color(0xFFF1F5F9),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    style: GoogleFonts.outfit(color: headingColor, fontSize: 13),
                    items: _classes.map<DropdownMenuItem<Map<String, dynamic>>>((c) {
                      return DropdownMenuItem<Map<String, dynamic>>(
                        value: c as Map<String, dynamic>,
                        child: Text("Kelas ${c['nama']}"),
                      );
                    }).toList(),
                    onChanged: (val) {
                      setState(() {
                        _selectedClass = val;
                      });
                      _loadAbsensiReport();
                    },
                  ),
                ),
                
                if (_selectedClass != null && _months.isNotEmpty) ...[
                  const SizedBox(width: 12),
                  // Month selector
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _selectedMonth,
                      dropdownColor: isDark ? const Color(0xFF1F2937) : Colors.white,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: isDark ? const Color(0xFF1F2937) : const Color(0xFFF1F5F9),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      style: GoogleFonts.outfit(color: headingColor, fontSize: 13),
                      items: _months.map<DropdownMenuItem<String>>((m) {
                        return DropdownMenuItem<String>(
                          value: m as String,
                          child: Text(m),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() {
                          _selectedMonth = val;
                        });
                        _initializeLocalAbsensi();
                      },
                    ),
                  ),
                ],
              ],
            ),
          ),
          const Divider(height: 1),

          // Main body
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
                : _errorMessage != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24.0),
                          child: Text(_errorMessage!, style: GoogleFonts.outfit(color: Colors.redAccent)),
                        ),
                      )
                    : _selectedClass == null
                        ? _buildKelasSelectorGrid()
                        : _santriList.isEmpty
                            ? Center(
                                child: Text(
                                  "Tidak ada data santri.",
                                  style: GoogleFonts.outfit(color: context.subTitleColor),
                                ),
                              )
                            : _buildStudentAbsensiList(),
          ),
        ],
      ),
      floatingActionButton: (_selectedClass != null && _santriList.isNotEmpty && !_isLoading)
          ? FloatingActionButton.extended(
              onPressed: _saveAbsensi,
              backgroundColor: const Color(0xFF10B981),
              icon: const Icon(Icons.check_circle_rounded, color: Colors.white),
              label: Text("Simpan Absensi", style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
            )
          : null,
    );
  }

  Widget _buildKelasSelectorGrid() {
    final isDark = context.isDarkMode;
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            "PILIH KELAS DINIYAH",
            style: GoogleFonts.outfit(
              color: context.subTitleColor,
              fontSize: 11,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 16),
          _classes.isEmpty
              ? Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: context.cardBg,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: context.borderColor),
                  ),
                  child: Center(
                    child: Text(
                      "Belum ada daftar kelas Diniyah.",
                      style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 13),
                    ),
                  ),
                )
              : GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.6,
                  ),
                  itemCount: _classes.length,
                  itemBuilder: (context, index) {
                    final c = _classes[index];
                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          _selectedClass = c;
                        });
                        _loadAbsensiReport();
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: context.borderColor),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
                              blurRadius: 6,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Text(
                          c['nama'] ?? '-',
                          style: GoogleFonts.outfit(
                            color: context.titleColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ],
      ),
    );
  }

  Widget _buildStudentAbsensiList() {
    return ListView.separated(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 84),
      itemCount: _santriList.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final s = _santriList[index];
        final id = s['id'] as int;
        
        final localData = _localAbsensi[id] ?? {'sakit': 0, 'izin': 0, 'alpa': 0};

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: context.cardBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: context.borderColor),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    backgroundColor: context.isDarkMode ? Colors.white10 : Colors.black12,
                    radius: 12,
                    child: Text(
                      "${index + 1}",
                      style: GoogleFonts.outfit(color: context.titleColor, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      s['nama'] ?? '-',
                      style: GoogleFonts.outfit(color: context.titleColor, fontWeight: FontWeight.bold, fontSize: 14),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              
              // Counters Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildCounterButton(
                    label: "Sakit",
                    value: localData['sakit'] ?? 0,
                    color: const Color(0xFFF59E0B),
                    onDecrement: () => _adjustCount(id, 'sakit', -1),
                    onIncrement: () => _adjustCount(id, 'sakit', 1),
                  ),
                  _buildCounterButton(
                    label: "Izin",
                    value: localData['izin'] ?? 0,
                    color: const Color(0xFF3B82F6),
                    onDecrement: () => _adjustCount(id, 'izin', -1),
                    onIncrement: () => _adjustCount(id, 'izin', 1),
                  ),
                  _buildCounterButton(
                    label: "Alpa",
                    value: localData['alpa'] ?? 0,
                    color: const Color(0xFFEF4444),
                    onDecrement: () => _adjustCount(id, 'alpa', -1),
                    onIncrement: () => _adjustCount(id, 'alpa', 1),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildCounterButton({
    required String label,
    required int value,
    required Color color,
    required VoidCallback onDecrement,
    required VoidCallback onIncrement,
  }) {
    final isDark = ThemeManager().isDarkMode;
    final btnBg = isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.04);
    final countColor = isDark ? Colors.white : const Color(0xFF0F172A);

    return Column(
      children: [
        Text(
          label,
          style: GoogleFonts.outfit(color: color, fontSize: 11, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: btnBg,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                icon: const Icon(Icons.remove_rounded, size: 16),
                color: color,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                onPressed: onDecrement,
              ),
              Container(
                alignment: Alignment.center,
                constraints: const BoxConstraints(minWidth: 28),
                child: Text(
                  "$value",
                  style: GoogleFonts.outfit(color: countColor, fontSize: 13, fontWeight: FontWeight.bold),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.add_rounded, size: 16),
                color: color,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                onPressed: onIncrement,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
