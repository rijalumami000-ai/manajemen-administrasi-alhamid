import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';

class InputPelanggaranPrestasiScreen extends StatefulWidget {
  final int initialTabIndex; // 0: Pelanggaran, 1: Prestasi
  const InputPelanggaranPrestasiScreen({super.key, this.initialTabIndex = 0});

  @override
  State<InputPelanggaranPrestasiScreen> createState() => _InputPelanggaranPrestasiScreenState();
}

class _InputPelanggaranPrestasiScreenState extends State<InputPelanggaranPrestasiScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ApiService _apiService = ApiService();

  List<dynamic> _pelanggaranList = [];
  List<dynamic> _prestasiList = [];
  List<dynamic> _santriList = [];
  List<dynamic> _tahunAjaranList = [];
  int? _activeTahunAjaranId;

  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 2,
      vsync: this,
      initialIndex: widget.initialTabIndex,
    );
    _loadInitialData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final taData = await _apiService.getTahunAjaranList();
      if (taData['tahunAjaran'] is List) {
        final list = taData['tahunAjaran'] as List;
        _tahunAjaranList = list;
        final active = list.firstWhere((t) => t['is_active'] == true, orElse: () => null);
        if (active != null) {
          _activeTahunAjaranId = active['id'] as int;
        } else if (list.isNotEmpty) {
          _activeTahunAjaranId = list.first['id'] as int;
        }
      }

      final results = await Future.wait([
        _apiService.getPelanggaran(tahunAjaranId: _activeTahunAjaranId),
        _apiService.getPrestasi(tahunAjaranId: _activeTahunAjaranId),
        _apiService.getSantriBukuInduk(),
      ]);

      if (mounted) {
        setState(() {
          _pelanggaranList = results[0];
          _prestasiList = results[1];
          _santriList = results[2];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _refreshData() async {
    try {
      final results = await Future.wait([
        _apiService.getPelanggaran(tahunAjaranId: _activeTahunAjaranId),
        _apiService.getPrestasi(tahunAjaranId: _activeTahunAjaranId),
      ]);
      if (mounted) {
        setState(() {
          _pelanggaranList = results[0];
          _prestasiList = results[1];
        });
      }
    } catch (_) {}
  }

  String _formatDate(dynamic date) {
    if (date == null) return '-';
    try {
      final dt = DateTime.parse(date.toString());
      const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return '${dt.day} ${bulan[dt.month - 1]} ${dt.year}';
    } catch (_) {
      return date.toString();
    }
  }

  // ── FORM DIALOG: TAMBAH PELANGGARAN ────────────────────────────────────────
  void _showAddPelanggaranDialog(BuildContext context) {
    dynamic selectedSantri;
    String selectedJenis = 'Ringan';
    DateTime selectedDate = DateTime.now();
    final deskripsiCtrl = TextEditingController();
    final sanksiCtrl = TextEditingController();
    bool isSaving = false;
    String? formError;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (modalCtx, setModalState) {
          final isDark = context.isDarkMode;

          return Container(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(modalCtx).viewInsets.bottom + 20,
              top: 24,
              left: 20,
              right: 20,
            ),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF0F172A) : Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
              border: Border.all(
                color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.06),
              ),
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Drag handle
                  Center(
                    child: Container(
                      width: 44,
                      height: 4,
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white24 : Colors.black12,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Header
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEF4444).withOpacity(0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.gavel_rounded, color: Color(0xFFEF4444), size: 20),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        "Input Catatan Pelanggaran",
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: context.titleColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),

                  if (formError != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.red.withOpacity(0.3)),
                      ),
                      child: Text(
                        formError!,
                        style: GoogleFonts.outfit(color: Colors.redAccent, fontSize: 12),
                      ),
                    ),

                  // 1. Pilih Santri
                  Text("Pilih Santri *", style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13, color: context.titleColor)),
                  const SizedBox(height: 6),
                  GestureDetector(
                    onTap: () async {
                      final chosen = await _showSantriPicker(context);
                      if (chosen != null) {
                        setModalState(() => selectedSantri = chosen);
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: selectedSantri != null ? const Color(0xFFEF4444) : (isDark ? Colors.white12 : Colors.black12),
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.person_search_rounded,
                            size: 20,
                            color: selectedSantri != null ? const Color(0xFFEF4444) : context.subTitleColor,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              selectedSantri != null
                                  ? "${selectedSantri['nama']} (NIS: ${selectedSantri['nis'] ?? '-'})"
                                  : "Cari nama / NIS santri...",
                              style: GoogleFonts.outfit(
                                fontSize: 13,
                                fontWeight: selectedSantri != null ? FontWeight.w600 : FontWeight.w400,
                                color: selectedSantri != null ? context.titleColor : context.subTitleColor,
                              ),
                            ),
                          ),
                          const Icon(Icons.arrow_drop_down_rounded),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 14),

                  // 2. Tingkat Pelanggaran
                  Text("Tingkat Pelanggaran *", style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13, color: context.titleColor)),
                  const SizedBox(height: 6),
                  Row(
                    children: ['Ringan', 'Sedang', 'Berat'].map((jenis) {
                      final isSelected = selectedJenis == jenis;
                      Color btnColor = jenis == 'Ringan'
                          ? const Color(0xFFF59E0B)
                          : jenis == 'Sedang'
                              ? const Color(0xFFF97316)
                              : const Color(0xFFEF4444);

                      return Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          child: GestureDetector(
                            onTap: () => setModalState(() => selectedJenis = jenis),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: isSelected ? btnColor.withOpacity(0.18) : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected ? btnColor : Colors.transparent,
                                  width: 1.5,
                                ),
                              ),
                              child: Center(
                                child: Text(
                                  jenis,
                                  style: GoogleFonts.outfit(
                                    fontSize: 12.5,
                                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                    color: isSelected ? btnColor : context.subTitleColor,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 14),

                  // 3. Tanggal
                  Text("Tanggal Kejadian *", style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13, color: context.titleColor)),
                  const SizedBox(height: 6),
                  GestureDetector(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: selectedDate,
                        firstDate: DateTime(2020),
                        lastDate: DateTime.now().add(const Duration(days: 30)),
                      );
                      if (picked != null) {
                        setModalState(() => selectedDate = picked);
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_month_rounded, size: 18, color: Color(0xFFEF4444)),
                          const SizedBox(width: 10),
                          Text(
                            _formatDate(selectedDate.toIso8601String()),
                            style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600, color: context.titleColor),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 14),

                  // 4. Deskripsi
                  Text("Deskripsi Pelanggaran *", style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13, color: context.titleColor)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: deskripsiCtrl,
                    maxLines: 2,
                    style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: "Contoh: Terlambat mengikuti sholat berjamaah...",
                      hintStyle: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 12.5),
                      filled: true,
                      fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                  ),

                  const SizedBox(height: 14),

                  // 5. Sanksi / Tindakan
                  Text("Sanksi / Tindakan Ta'zir", style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13, color: context.titleColor)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: sanksiCtrl,
                    style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: "Contoh: Teguran lisan & hafalan 1 juz...",
                      hintStyle: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 12.5),
                      filled: true,
                      fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Submit Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: isSaving
                          ? null
                          : () async {
                              if (selectedSantri == null) {
                                setModalState(() => formError = "Santri wajib dipilih!");
                                return;
                              }
                              if (deskripsiCtrl.text.trim().isEmpty) {
                                setModalState(() => formError = "Deskripsi pelanggaran wajib diisi!");
                                return;
                              }

                              setModalState(() {
                                isSaving = true;
                                formError = null;
                              });

                              try {
                                final payload = {
                                  'santri_id': selectedSantri['id'],
                                  'jenis': selectedJenis,
                                  'tanggal': selectedDate.toIso8601String().split('T')[0],
                                  'deskripsi': deskripsiCtrl.text.trim(),
                                  'sanksi': sanksiCtrl.text.trim(),
                                  'tahun_ajaran_id': _activeTahunAjaranId,
                                };

                                await _apiService.createPelanggaran(payload);
                                if (modalCtx.mounted) Navigator.pop(modalCtx);
                                _refreshData();
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text("Catatan pelanggaran berhasil disimpan dan tersinkron ke Web!"),
                                      backgroundColor: Color(0xFF059669),
                                    ),
                                  );
                                }
                              } catch (e) {
                                setModalState(() {
                                  isSaving = false;
                                  formError = e.toString().replaceAll('Exception: ', '');
                                });
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFEF4444),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 0,
                      ),
                      child: isSaving
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Text(
                              "SIMPAN PELANGGARAN",
                              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ── FORM DIALOG: TAMBAH PRESTASI ──────────────────────────────────────────
  void _showAddPrestasiDialog(BuildContext context) {
    dynamic selectedSantri;
    String selectedJenis = 'Akademik';
    DateTime selectedDate = DateTime.now();
    final deskripsiCtrl = TextEditingController();
    final penghargaanCtrl = TextEditingController();
    bool isSaving = false;
    String? formError;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (modalCtx, setModalState) {
          final isDark = context.isDarkMode;

          return Container(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(modalCtx).viewInsets.bottom + 20,
              top: 24,
              left: 20,
              right: 20,
            ),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF0F172A) : Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
              border: Border.all(
                color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.06),
              ),
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 44,
                      height: 4,
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white24 : Colors.black12,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF59E0B).withOpacity(0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.emoji_events_rounded, color: Color(0xFFF59E0B), size: 20),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        "Input Catatan Prestasi",
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: context.titleColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),

                  if (formError != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.red.withOpacity(0.3)),
                      ),
                      child: Text(formError!, style: GoogleFonts.outfit(color: Colors.redAccent, fontSize: 12)),
                    ),

                  // Santri
                  Text("Pilih Santri *", style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13, color: context.titleColor)),
                  const SizedBox(height: 6),
                  GestureDetector(
                    onTap: () async {
                      final chosen = await _showSantriPicker(context);
                      if (chosen != null) {
                        setModalState(() => selectedSantri = chosen);
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: selectedSantri != null ? const Color(0xFFF59E0B) : (isDark ? Colors.white12 : Colors.black12),
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.person_search_rounded,
                            size: 20,
                            color: selectedSantri != null ? const Color(0xFFF59E0B) : context.subTitleColor,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              selectedSantri != null
                                  ? "${selectedSantri['nama']} (NIS: ${selectedSantri['nis'] ?? '-'})"
                                  : "Cari nama / NIS santri...",
                              style: GoogleFonts.outfit(
                                fontSize: 13,
                                fontWeight: selectedSantri != null ? FontWeight.w600 : FontWeight.w400,
                                color: selectedSantri != null ? context.titleColor : context.subTitleColor,
                              ),
                            ),
                          ),
                          const Icon(Icons.arrow_drop_down_rounded),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 14),

                  // Kategori Prestasi
                  Text("Kategori Prestasi *", style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13, color: context.titleColor)),
                  const SizedBox(height: 6),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: ['Akademik', 'Tahfidz Al-Qur\'an', 'Kitab Kuning', 'Pidato / Da\'i', 'Olahraga', 'Lainnya'].map((jenis) {
                        final isSelected = selectedJenis == jenis;
                        return Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: GestureDetector(
                            onTap: () => setModalState(() => selectedJenis = jenis),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: isSelected ? const Color(0xFFF59E0B).withOpacity(0.18) : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: isSelected ? const Color(0xFFF59E0B) : Colors.transparent,
                                  width: 1.5,
                                ),
                              ),
                              child: Text(
                                jenis,
                                style: GoogleFonts.outfit(
                                  fontSize: 12,
                                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                  color: isSelected ? const Color(0xFFF59E0B) : context.subTitleColor,
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),

                  const SizedBox(height: 14),

                  // Tanggal
                  Text("Tanggal Raihan *", style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13, color: context.titleColor)),
                  const SizedBox(height: 6),
                  GestureDetector(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: selectedDate,
                        firstDate: DateTime(2020),
                        lastDate: DateTime.now().add(const Duration(days: 30)),
                      );
                      if (picked != null) {
                        setModalState(() => selectedDate = picked);
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_month_rounded, size: 18, color: Color(0xFFF59E0B)),
                          const SizedBox(width: 10),
                          Text(
                            _formatDate(selectedDate.toIso8601String()),
                            style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600, color: context.titleColor),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 14),

                  // Deskripsi
                  Text("Nama Prestasi / Juara *", style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13, color: context.titleColor)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: deskripsiCtrl,
                    style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: "Contoh: Juara 1 Musabaqah Qira'atil Kutub (MQK)...",
                      hintStyle: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 12.5),
                      filled: true,
                      fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                  ),

                  const SizedBox(height: 14),

                  // Penghargaan
                  Text("Penghargaan / Hadiah", style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13, color: context.titleColor)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: penghargaanCtrl,
                    style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: "Contoh: Piagam Penghargaan & Piala Bergilir...",
                      hintStyle: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 12.5),
                      filled: true,
                      fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Submit
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: isSaving
                          ? null
                          : () async {
                              if (selectedSantri == null) {
                                setModalState(() => formError = "Santri wajib dipilih!");
                                return;
                              }
                              if (deskripsiCtrl.text.trim().isEmpty) {
                                setModalState(() => formError = "Nama prestasi wajib diisi!");
                                return;
                              }

                              setModalState(() {
                                isSaving = true;
                                formError = null;
                              });

                              try {
                                final payload = {
                                  'santri_id': selectedSantri['id'],
                                  'jenis': selectedJenis,
                                  'tanggal': selectedDate.toIso8601String().split('T')[0],
                                  'deskripsi': deskripsiCtrl.text.trim(),
                                  'penghargaan': penghargaanCtrl.text.trim(),
                                  'tahun_ajaran_id': _activeTahunAjaranId,
                                };

                                await _apiService.createPrestasi(payload);
                                if (modalCtx.mounted) Navigator.pop(modalCtx);
                                _refreshData();
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text("Catatan prestasi berhasil disimpan dan tersinkron ke Web!"),
                                      backgroundColor: Color(0xFF059669),
                                    ),
                                  );
                                }
                              } catch (e) {
                                setModalState(() {
                                  isSaving = false;
                                  formError = e.toString().replaceAll('Exception: ', '');
                                });
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFF59E0B),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 0,
                      ),
                      child: isSaving
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Text(
                              "SIMPAN PRESTASI",
                              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ── SANTRI SEARCH DIALOG PICKER ───────────────────────────────────────────
  Future<dynamic> _showSantriPicker(BuildContext context) async {
    String search = '';
    return showDialog<dynamic>(
      context: context,
      builder: (dlgCtx) => StatefulBuilder(
        builder: (context, setDlgState) {
          final isDark = context.isDarkMode;
          final matches = _santriList.where((s) {
            final q = search.toLowerCase();
            final name = (s['nama'] ?? '').toString().toLowerCase();
            final nis = (s['nis'] ?? '').toString().toLowerCase();
            return name.contains(q) || nis.contains(q);
          }).toList();

          return Dialog(
            backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            child: Container(
              width: double.maxFinite,
              height: 480,
              padding: const EdgeInsets.all(18),
              child: Column(
                children: [
                  Text(
                    "Pilih Santri",
                    style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: context.titleColor),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    autofocus: true,
                    onChanged: (val) => setDlgState(() => search = val),
                    style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: "Ketik nama atau NIS santri...",
                      hintStyle: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 12.5),
                      prefixIcon: const Icon(Icons.search_rounded, size: 18),
                      filled: true,
                      fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Expanded(
                    child: matches.isEmpty
                        ? Center(
                            child: Text(
                              "Santri tidak ditemukan.",
                              style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 12),
                            ),
                          )
                        : ListView.separated(
                            itemCount: matches.length,
                            separatorBuilder: (_, __) => Divider(
                              height: 1,
                              color: isDark ? Colors.white10 : Colors.black12,
                            ),
                            itemBuilder: (ctx, i) {
                              final santri = matches[i];
                              return ListTile(
                                dense: true,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                leading: CircleAvatar(
                                  radius: 16,
                                  backgroundColor: const Color(0xFF10B981).withOpacity(0.15),
                                  child: Text(
                                    (santri['nama'] ?? '?')[0].toUpperCase(),
                                    style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF10B981)),
                                  ),
                                ),
                                title: Text(
                                  santri['nama'] ?? '-',
                                  style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600, color: context.titleColor),
                                ),
                                subtitle: Text(
                                  "NIS: ${santri['nis'] ?? '-'} • ${santri['kelas_diniyah'] ?? 'Kelas -'}",
                                  style: GoogleFonts.outfit(fontSize: 11, color: context.subTitleColor),
                                ),
                                onTap: () => Navigator.pop(dlgCtx, santri),
                              );
                            },
                          ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ── DELETE CONFIRMATION ───────────────────────────────────────────────────
  Future<void> _confirmDelete(BuildContext context, {required bool isPelanggaran, required int id, required String title}) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: context.cardBg,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Text(
          "Hapus Catatan?",
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: context.titleColor),
        ),
        content: Text(
          "Apakah Anda yakin ingin menghapus catatan '${title}'? Tindakan ini akan langsung menghapus data di database Web dan App.",
          style: GoogleFonts.outfit(fontSize: 13, color: context.bodyColor),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text("Batal", style: GoogleFonts.outfit(color: context.subTitleColor)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444), elevation: 0),
            child: Text("Hapus", style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (ok == true) {
      try {
        if (isPelanggaran) {
          await _apiService.deletePelanggaran(id);
        } else {
          await _apiService.deletePrestasi(id);
        }
        _refreshData();
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Catatan berhasil dihapus dari sistem!"), backgroundColor: Color(0xFF10B981)),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString().replaceAll('Exception: ', '')), backgroundColor: Colors.redAccent),
          );
        }
      }
    }
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
          "Input Pelanggaran & Prestasi",
          style: GoogleFonts.outfit(
            color: context.titleColor,
            fontWeight: FontWeight.bold,
            fontSize: 17,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFFE11D48),
          indicatorWeight: 3,
          labelColor: const Color(0xFFE11D48),
          unselectedLabelColor: context.subTitleColor,
          labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13),
          unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.w500, fontSize: 13),
          tabs: const [
            Tab(icon: Icon(Icons.gavel_rounded, size: 18), text: "Pelanggaran Santri"),
            Tab(icon: Icon(Icons.emoji_events_rounded, size: 18), text: "Prestasi Santri"),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFE11D48)))
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.cloud_off_rounded, size: 48, color: Colors.grey[400]),
                        const SizedBox(height: 12),
                        Text(_errorMessage!, textAlign: TextAlign.center, style: GoogleFonts.outfit(color: Colors.grey)),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _loadInitialData,
                          icon: const Icon(Icons.refresh_rounded, size: 18),
                          label: const Text("Coba Lagi"),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFE11D48),
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildPelanggaranTab(context, isDark),
                    _buildPrestasiTab(context, isDark),
                  ],
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          if (_tabController.index == 0) {
            _showAddPelanggaranDialog(context);
          } else {
            _showAddPrestasiDialog(context);
          }
        },
        backgroundColor: const Color(0xFFE11D48),
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: Text(
          "Tambah Catatan",
          style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
        ),
      ),
    );
  }

  // ── TAB VIEW: PELANGGARAN ─────────────────────────────────────────────────
  Widget _buildPelanggaranTab(BuildContext context, bool isDark) {
    return RefreshIndicator(
      onRefresh: _refreshData,
      color: const Color(0xFFE11D48),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.only(left: 18, right: 18, top: 16, bottom: 90),
        children: [


          if (_pelanggaranList.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 40),
                child: Column(
                  children: [
                    Icon(Icons.verified_rounded, size: 54, color: Colors.teal.withOpacity(0.4)),
                    const SizedBox(height: 12),
                    Text(
                      "Belum ada catatan pelanggaran.",
                      style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: context.titleColor),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "Tekan tombol 'Tambah Catatan' untuk menginput.",
                      style: GoogleFonts.outfit(fontSize: 12, color: context.subTitleColor),
                    ),
                  ],
                ),
              ),
            )
          else
            ..._pelanggaranList.map((item) {
              final id = item['id'] as int;
              final nama = item['nama_santri'] ?? 'Santri';
              final nis = item['nis'] ?? '-';
              final jenis = item['jenis'] ?? 'Ringan';
              final tanggal = _formatDate(item['tanggal']);
              final deskripsi = item['deskripsi'] ?? '-';
              final sanksi = item['sanksi'] ?? '-';

              Color tagColor = jenis == 'Ringan'
                  ? const Color(0xFFF59E0B)
                  : jenis == 'Sedang'
                      ? const Color(0xFFF97316)
                      : const Color(0xFFEF4444);

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF131D2E) : Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: isDark ? const Color(0xFF334155).withOpacity(0.5) : const Color(0xFFE2E8F0),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: tagColor.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: tagColor.withOpacity(0.3)),
                          ),
                          child: Text(
                            jenis,
                            style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.bold, color: tagColor),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          tanggal,
                          style: GoogleFonts.outfit(fontSize: 11.5, color: context.subTitleColor, fontWeight: FontWeight.w500),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 20),
                          onPressed: () => _confirmDelete(context, isPelanggaran: true, id: id, title: deskripsi),
                          constraints: const BoxConstraints(),
                          padding: EdgeInsets.zero,
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      nama,
                      style: GoogleFonts.outfit(fontSize: 14.5, fontWeight: FontWeight.bold, color: context.titleColor),
                    ),
                    Text(
                      "NIS: $nis",
                      style: GoogleFonts.outfit(fontSize: 11.5, color: context.subTitleColor),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withOpacity(0.04) : Colors.black.withOpacity(0.02),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            deskripsi,
                            style: GoogleFonts.outfit(fontSize: 12.5, color: context.titleColor, height: 1.3),
                          ),
                          if (sanksi != '-') ...[
                            const SizedBox(height: 4),
                            Text(
                              "Sanksi: $sanksi",
                              style: GoogleFonts.outfit(fontSize: 11.5, fontWeight: FontWeight.w600, color: const Color(0xFFEF4444)),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  // ── TAB VIEW: PRESTASI ────────────────────────────────────────────────────
  Widget _buildPrestasiTab(BuildContext context, bool isDark) {
    return RefreshIndicator(
      onRefresh: _refreshData,
      color: const Color(0xFFF59E0B),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.only(left: 18, right: 18, top: 16, bottom: 90),
        children: [


          if (_prestasiList.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 40),
                child: Column(
                  children: [
                    Icon(Icons.emoji_events_outlined, size: 54, color: Colors.amber.withOpacity(0.4)),
                    const SizedBox(height: 12),
                    Text(
                      "Belum ada catatan prestasi.",
                      style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: context.titleColor),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "Tekan tombol 'Tambah Catatan' untuk menginput.",
                      style: GoogleFonts.outfit(fontSize: 12, color: context.subTitleColor),
                    ),
                  ],
                ),
              ),
            )
          else
            ..._prestasiList.map((item) {
              final id = item['id'] as int;
              final nama = item['nama_santri'] ?? 'Santri';
              final nis = item['nis'] ?? '-';
              final jenis = item['jenis'] ?? 'Akademik';
              final tanggal = _formatDate(item['tanggal']);
              final deskripsi = item['deskripsi'] ?? '-';
              final penghargaan = item['penghargaan'] ?? '-';

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF131D2E) : Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: isDark ? const Color(0xFF334155).withOpacity(0.5) : const Color(0xFFE2E8F0),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF59E0B).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.3)),
                          ),
                          child: Text(
                            jenis,
                            style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFFF59E0B)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          tanggal,
                          style: GoogleFonts.outfit(fontSize: 11.5, color: context.subTitleColor, fontWeight: FontWeight.w500),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 20),
                          onPressed: () => _confirmDelete(context, isPelanggaran: false, id: id, title: deskripsi),
                          constraints: const BoxConstraints(),
                          padding: EdgeInsets.zero,
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      nama,
                      style: GoogleFonts.outfit(fontSize: 14.5, fontWeight: FontWeight.bold, color: context.titleColor),
                    ),
                    Text(
                      "NIS: $nis",
                      style: GoogleFonts.outfit(fontSize: 11.5, color: context.subTitleColor),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withOpacity(0.04) : Colors.black.withOpacity(0.02),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            deskripsi,
                            style: GoogleFonts.outfit(fontSize: 12.5, color: context.titleColor, height: 1.3),
                          ),
                          if (penghargaan != '-') ...[
                            const SizedBox(height: 4),
                            Text(
                              "Penghargaan: $penghargaan",
                              style: GoogleFonts.outfit(fontSize: 11.5, fontWeight: FontWeight.w600, color: const Color(0xFF10B981)),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}
