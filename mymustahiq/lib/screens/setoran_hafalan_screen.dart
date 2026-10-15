import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';
import '../services/network_service.dart';
import '../widgets/offline_widget.dart';

class SetoranHafalanScreen extends StatefulWidget {
  final Map<String, dynamic> kelasMustahiq;

  const SetoranHafalanScreen({
    super.key,
    required this.kelasMustahiq,
  });

  @override
  State<SetoranHafalanScreen> createState() => _SetoranHafalanScreenState();
}

class _SetoranHafalanScreenState extends State<SetoranHafalanScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  String? _errorMessage;

  Map<String, dynamic>? _overviewData;
  List<dynamic> _santriList = [];
  String _searchQuery = '';
  String _filterStatus = 'all'; // 'all', 'tuntas', 'melampaui', 'belum_setor'

  @override
  void initState() {
    super.initState();
    _fetchOverview();
  }

  Future<void> _fetchOverview() async {
    if (!NetworkService().isOnline) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'NO_INTERNET';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final kelasId = widget.kelasMustahiq['id'] as int?;
      final res = await _apiService.getSetoranOverview(kelasId: kelasId);
      if (mounted) {
        setState(() {
          _overviewData = res;
          _santriList = res['santriList'] as List<dynamic>? ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceFirst('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  // --- FILTERED SANTRI LIST ---
  List<dynamic> get _filteredSantriList {
    return _santriList.where((s) {
      final name = (s['nama'] ?? '').toString().toLowerCase();
      final nis = (s['nis'] ?? '').toString().toLowerCase();
      final query = _searchQuery.toLowerCase();

      final matchesSearch = query.isEmpty || name.contains(query) || nis.contains(query);
      if (!matchesSearch) return false;

      final persentase = (s['persentase'] as num?)?.toInt() ?? 0;
      final isMelampaui = s['is_melampaui_ganjil'] == true;
      final hasSetorThisWeek = s['has_setor_this_week'] == true;

      switch (_filterStatus) {
        case 'tuntas':
          return persentase >= 100;
        case 'melampaui':
          return isMelampaui;
        case 'belum_setor':
          return !hasSetorThisWeek;
        default:
          return true;
      }
    }).toList();
  }

  // --- BOTTOM SHEET: ATUR RITME PENARIKAN KELAS ---
  void _openAturRitmeSheet() {
    if (_overviewData == null) return;
    final ritme = _overviewData!['konfigurasiRitme'] as Map<String, dynamic>? ?? {};
    final kelasId = _overviewData!['kelas']?['id'];
    final taId = _overviewData!['tahunAjaran']?['id'];
    final katId = _overviewData!['kategoriEvaluasiId'];

    String selectedMode = ritme['mode_frekuensi'] ?? 'mingguan';
    final targetController = TextEditingController(text: (ritme['target_per_setoran'] ?? 10).toString());
    final intervalController = TextEditingController(text: (ritme['interval_hari'] ?? 7).toString());
    final catatanController = TextEditingController(text: ritme['catatan'] ?? '');
    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            final isDark = context.isDarkMode;
            return Container(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              decoration: BoxDecoration(
                color: context.cardBg,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                border: Border.all(color: context.borderColor),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: context.borderColor,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        const Icon(Icons.tune_rounded, color: Color(0xFFD97706), size: 22),
                        const SizedBox(width: 10),
                        Text(
                          "Pengaturan Ritme Setoran",
                          style: GoogleFonts.outfit(
                            color: context.titleColor,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      "Tentukan ritme target hafalan kelas binaan Anda.",
                      style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 12),
                    ),
                    const SizedBox(height: 20),

                    // Mode Frekuensi
                    Text(
                      "MODE FREKUENSI PENARIKAN",
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _buildModeChip(
                          label: "Setiap Hari",
                          mode: "harian",
                          current: selectedMode,
                          onSelect: (m) => setSheetState(() {
                            selectedMode = m;
                            intervalController.text = "1";
                          }),
                        ),
                        _buildModeChip(
                          label: "Per N Hari",
                          mode: "interval_hari",
                          current: selectedMode,
                          onSelect: (m) => setSheetState(() => selectedMode = m),
                        ),
                        _buildModeChip(
                          label: "1 Pekan Sekali",
                          mode: "mingguan",
                          current: selectedMode,
                          onSelect: (m) => setSheetState(() {
                            selectedMode = m;
                            intervalController.text = "7";
                          }),
                        ),
                        _buildModeChip(
                          label: "Fleksibel / Bebas",
                          mode: "bebas",
                          current: selectedMode,
                          onSelect: (m) => setSheetState(() => selectedMode = m),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    if (selectedMode == 'interval_hari') ...[
                      Text(
                        "INTERVAL HARI",
                        style: GoogleFonts.outfit(
                          color: context.subTitleColor,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: intervalController,
                        keyboardType: TextInputType.number,
                        style: GoogleFonts.outfit(color: context.titleColor),
                        decoration: InputDecoration(
                          hintText: "Contoh: 3 untuk setiap 3 hari sekali",
                          filled: true,
                          fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: context.borderColor),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Target per Sesi
                    Text(
                      "TARGET NADZOM PER SETORAN",
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: targetController,
                      keyboardType: TextInputType.number,
                      style: GoogleFonts.outfit(color: context.titleColor),
                      decoration: InputDecoration(
                        hintText: "Jumlah nadzom target per setor (contoh: 10)",
                        suffixText: "Nadzom",
                        filled: true,
                        fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: context.borderColor),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Catatan
                    Text(
                      "CATATAN / PESAN PEMBINAAN",
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: catatanController,
                      maxLines: 2,
                      style: GoogleFonts.outfit(color: context.titleColor),
                      decoration: InputDecoration(
                        hintText: "Contoh: Setoran dilaksanakan ba'da Maghrib...",
                        filled: true,
                        fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: context.borderColor),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Tombol Simpan
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFD97706),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          elevation: 0,
                        ),
                        onPressed: isSaving
                            ? null
                            : () async {
                                setSheetState(() => isSaving = true);
                                try {
                                  await _apiService.saveSetoranKonfigurasi({
                                    'kelas_id': kelasId,
                                    'tahun_ajaran_id': taId,
                                    'kategori_evaluasi_id': katId,
                                    'mode_frekuensi': selectedMode,
                                    'interval_hari': int.tryParse(intervalController.text) ?? 7,
                                    'target_per_setoran': int.tryParse(targetController.text) ?? 10,
                                    'catatan': catatanController.text.trim(),
                                  });
                                  if (mounted) {
                                    Navigator.pop(ctx);
                                    _fetchOverview();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Ritme setoran berhasil disimpan.')),
                                    );
                                  }
                                } catch (e) {
                                  setSheetState(() => isSaving = false);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Gagal: ${e.toString().replaceFirst("Exception: ", "")}')),
                                  );
                                }
                              },
                        child: isSaving
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : Text("Simpan Pengaturan", style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildModeChip({
    required String label,
    required String mode,
    required String current,
    required Function(String) onSelect,
  }) {
    final isSelected = current == mode;
    return GestureDetector(
      onTap: () => onSelect(mode),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFD97706) : context.borderColor.withOpacity(0.3),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFFD97706) : context.borderColor,
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.outfit(
            color: isSelected ? Colors.white : context.titleColor,
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ),
    );
  }

  // --- BOTTOM SHEET: INPUT SETORAN SANTRI (DUAL LINKED INPUT) ---
  void _openInputSetoranSheet(Map<String, dynamic> santri) {
    if (_overviewData == null) return;
    final isAngka = _overviewData!['tipeInput'] != 'Teks';
    final kelasId = _overviewData!['kelas']?['id'];
    final taId = _overviewData!['tahunAjaran']?['id'];
    final katId = _overviewData!['kategoriEvaluasiId'];

    final int prevBait = santri['bait_terakhir'] ?? 0;
    final targetBaitSemester = santri['target_semester'] ?? 100;

    // Controllers
    final baitAkhirController = TextEditingController(text: (prevBait + 10).toString());
    final deltaController = TextEditingController(text: "10");
    final babController = TextEditingController(text: santri['nama_bab_terakhir'] ?? '');
    final catatanController = TextEditingController();

    String statusKelancaran = 'Lancar';
    bool isSaving = false;
    bool isSyncing = false;

    // Dual-direction auto-sync
    void syncFromBaitAkhir(String val) {
      if (isSyncing) return;
      isSyncing = true;
      final akhir = int.tryParse(val) ?? prevBait;
      final delta = akhir - prevBait;
      deltaController.text = (delta > 0 ? delta : 0).toString();
      isSyncing = false;
    }

    void syncFromDelta(String val) {
      if (isSyncing) return;
      isSyncing = true;
      final delta = int.tryParse(val) ?? 0;
      final akhir = prevBait + delta;
      baitAkhirController.text = akhir.toString();
      isSyncing = false;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            final isDark = context.isDarkMode;
            final akhirInt = int.tryParse(baitAkhirController.text) ?? prevBait;
            final isMelampaui = akhirInt > targetBaitSemester;

            return Container(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              decoration: BoxDecoration(
                color: context.cardBg,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                border: Border.all(color: context.borderColor),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: context.borderColor,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Header Info Santri
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 20,
                          backgroundColor: const Color(0xFF3B82F6),
                          backgroundImage: santri['foto_url'] != null ? NetworkImage(santri['foto_url']) : null,
                          child: santri['foto_url'] == null
                              ? Text((santri['nama'] ?? 'S').substring(0, 1).toUpperCase(),
                                  style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold))
                              : null,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                santri['nama'] ?? '-',
                                style: GoogleFonts.outfit(
                                  color: context.titleColor,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                isAngka
                                    ? "Capaian sebelumnya: Bait ke-$prevBait (Target: $targetBaitSemester)"
                                    : "Capaian sebelumnya: ${santri['nama_bab_terakhir'] ?? 'Belum ada'}",
                                style: GoogleFonts.outfit(color: const Color(0xFFD97706), fontSize: 11, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    if (isAngka) ...[
                      // Dual Interactive Input: Bait Terakhir Disetor & Jumlah Nadzom
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "BAIT TERAKHIR",
                                  style: GoogleFonts.outfit(
                                    color: context.subTitleColor,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.0,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                TextField(
                                  controller: baitAkhirController,
                                  keyboardType: TextInputType.number,
                                  onChanged: (val) => setSheetState(() => syncFromBaitAkhir(val)),
                                  style: GoogleFonts.outfit(color: context.titleColor, fontSize: 16, fontWeight: FontWeight.bold),
                                  decoration: InputDecoration(
                                    filled: true,
                                    fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: BorderSide(color: context.borderColor),
                                    ),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "JUMLAH NADZOM (+)",
                                  style: GoogleFonts.outfit(
                                    color: context.subTitleColor,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.0,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                TextField(
                                  controller: deltaController,
                                  keyboardType: TextInputType.number,
                                  onChanged: (val) => setSheetState(() => syncFromDelta(val)),
                                  style: GoogleFonts.outfit(color: const Color(0xFF10B981), fontSize: 16, fontWeight: FontWeight.bold),
                                  decoration: InputDecoration(
                                    filled: true,
                                    fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                                    prefixText: "+",
                                    prefixStyle: GoogleFonts.outfit(color: const Color(0xFF10B981), fontWeight: FontWeight.bold),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: BorderSide(color: context.borderColor),
                                    ),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      if (isMelampaui)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF8B5CF6).withOpacity(0.12),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFF8B5CF6).withOpacity(0.3)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.auto_awesome, color: Color(0xFF8B5CF6), size: 16),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  "Capaian melampaui target Semester Ganjil! Setoran akan dihitung masuk ke materi Semester Genap.",
                                  style: GoogleFonts.outfit(color: const Color(0xFF8B5CF6), fontSize: 11, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ] else ...[
                      // Model Bab / Teks
                      Text(
                        "NAMA BAB / CAPAIAN TERAKHIR",
                        style: GoogleFonts.outfit(
                          color: context.subTitleColor,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.0,
                        ),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: babController,
                        style: GoogleFonts.outfit(color: context.titleColor),
                        decoration: InputDecoration(
                          hintText: "Contoh: Bab Kalam / Bab I'rab...",
                          filled: true,
                          fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: context.borderColor),
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        ),
                      ),
                    ],

                    const SizedBox(height: 16),

                    // Status Kelancaran Setoran
                    Text(
                      "STATUS KELANCARAN",
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.0,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _buildStatusBtn(
                          label: "Lancar",
                          value: "Lancar",
                          color: const Color(0xFF10B981),
                          current: statusKelancaran,
                          onSelect: (v) => setSheetState(() => statusKelancaran = v),
                        ),
                        const SizedBox(width: 8),
                        _buildStatusBtn(
                          label: "Kurang Lancar",
                          value: "Kurang Lancar",
                          color: const Color(0xFFF59E0B),
                          current: statusKelancaran,
                          onSelect: (v) => setSheetState(() => statusKelancaran = v),
                        ),
                        const SizedBox(width: 8),
                        _buildStatusBtn(
                          label: "Mengulang",
                          value: "Mengulang",
                          color: const Color(0xFFEF4444),
                          current: statusKelancaran,
                          onSelect: (v) => setSheetState(() => statusKelancaran = v),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Catatan Mustahiq
                    Text(
                      "CATATAN TAMBAHAN (OPSIONAL)",
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.0,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: catatanController,
                      style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13),
                      decoration: InputDecoration(
                        hintText: "Pesan tajwid, kelancaran, atau motivasi...",
                        filled: true,
                        fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: context.borderColor),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Tombol Submit Setoran
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          elevation: 0,
                        ),
                        onPressed: isSaving
                            ? null
                            : () async {
                                setSheetState(() => isSaving = true);
                                try {
                                  await _apiService.inputSetoran({
                                    'santri_id': santri['id'],
                                    'kelas_id': kelasId,
                                    'tahun_ajaran_id': taId,
                                    'kategori_evaluasi_id': katId,
                                    'tipe_setoran': isAngka ? 'Angka' : 'Bab',
                                    'bait_awal': prevBait,
                                    'bait_akhir': isAngka ? (int.tryParse(baitAkhirController.text) ?? prevBait) : 0,
                                    'jumlah_bait': isAngka ? (int.tryParse(deltaController.text) ?? 0) : 0,
                                    'nama_bab': isAngka ? null : babController.text.trim(),
                                    'status_kelancaran': statusKelancaran,
                                    'catatan': catatanController.text.trim(),
                                  });
                                  if (mounted) {
                                    Navigator.pop(ctx);
                                    _fetchOverview();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('Setoran ${santri['nama']} berhasil dicatat!'),
                                        backgroundColor: const Color(0xFF10B981),
                                      ),
                                    );
                                  }
                                } catch (e) {
                                  setSheetState(() => isSaving = false);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Gagal: ${e.toString().replaceFirst("Exception: ", "")}')),
                                  );
                                }
                              },
                        child: isSaving
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : Text("Simpan Setoran", style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildStatusBtn({
    required String label,
    required String value,
    required Color color,
    required String current,
    required Function(String) onSelect,
  }) {
    final isSelected = current == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => onSelect(value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? color.withOpacity(0.15) : context.borderColor.withOpacity(0.2),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected ? color : context.borderColor,
              width: isSelected ? 1.5 : 1.0,
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: GoogleFonts.outfit(
              color: isSelected ? color : context.titleColor,
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }

  // --- BOTTOM SHEET: RIWAYAT TIMELINE SANTRI ---
  void _openRiwayatTimelineSheet(Map<String, dynamic> santri) async {
    final kelasId = _overviewData?['kelas']?['id'];
    final taId = _overviewData?['tahunAjaran']?['id'];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return FutureBuilder<Map<String, dynamic>>(
          future: _apiService.getSantriSetoranHistory(santri['id'], tahunAjaranId: taId, kelasId: kelasId),
          builder: (context, snapshot) {
            final isDark = context.isDarkMode;

            return Container(
              height: MediaQuery.of(context).size.height * 0.75,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: context.cardBg,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                border: Border.all(color: context.borderColor),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: context.borderColor,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Icon(Icons.history_rounded, color: Color(0xFF3B82F6), size: 22),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          "Riwayat: ${santri['nama']}",
                          style: GoogleFonts.outfit(
                            color: context.titleColor,
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  if (snapshot.connectionState == ConnectionState.waiting)
                    const Expanded(child: Center(child: CircularProgressIndicator()))
                  else if (snapshot.hasError)
                    Expanded(child: Center(child: Text("Gagal: ${snapshot.error}", style: GoogleFonts.outfit(color: context.bodyColor))))
                  else ...[
                    Builder(builder: (context) {
                      final history = snapshot.data?['riwayat'] as List<dynamic>? ?? [];
                      if (history.isEmpty) {
                        return Expanded(
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.menu_book_outlined, size: 40, color: Color(0xFF94A3B8)),
                                const SizedBox(height: 8),
                                Text("Belum ada riwayat setoran.", style: GoogleFonts.outfit(color: context.subTitleColor)),
                              ],
                            ),
                          ),
                        );
                      }

                      return Expanded(
                        child: ListView.separated(
                          itemCount: history.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, idx) {
                            final item = history[idx];
                            final dateStr = item['tanggal_setor'] ?? '';
                            final isBab = item['tipe_setoran'] == 'Bab';

                            return Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: context.borderColor),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 32,
                                    height: 32,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF3B82F6).withOpacity(0.12),
                                      shape: BoxShape.circle,
                                    ),
                                    alignment: Alignment.center,
                                    child: Text(
                                      "${history.length - idx}",
                                      style: GoogleFonts.outfit(color: const Color(0xFF3B82F6), fontWeight: FontWeight.bold, fontSize: 12),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text(
                                              dateStr,
                                              style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 11, fontWeight: FontWeight.bold),
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: _getStatusColor(item['status_kelancaran']).withOpacity(0.15),
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: Text(
                                                item['status_kelancaran'] ?? 'Lancar',
                                                style: GoogleFonts.outfit(
                                                  color: _getStatusColor(item['status_kelancaran']),
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          isBab
                                              ? "Bab: ${item['nama_bab'] ?? '-'}"
                                              : "Bait ${item['bait_awal'] ?? 0} s/d ${item['bait_akhir'] ?? 0} (+${item['jumlah_bait'] ?? 0} Nadzom)",
                                          style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13, fontWeight: FontWeight.bold),
                                        ),
                                        if (item['catatan'] != null && item['catatan'].toString().isNotEmpty) ...[
                                          const SizedBox(height: 4),
                                          Text(
                                            "\"${item['catatan']}\"",
                                            style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 11, fontStyle: FontStyle.italic),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline, size: 18, color: Color(0xFFEF4444)),
                                    onPressed: () async {
                                      final confirm = await showDialog<bool>(
                                        context: context,
                                        builder: (c) => AlertDialog(
                                          title: const Text("Hapus Catatan?"),
                                          content: const Text("Catatan setoran ini akan dihapus dari riwayat."),
                                          actions: [
                                            TextButton(onPressed: () => Navigator.pop(c, false), child: const Text("Batal")),
                                            ElevatedButton(
                                              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
                                              onPressed: () => Navigator.pop(c, true),
                                              child: const Text("Hapus", style: TextStyle(color: Colors.white)),
                                            ),
                                          ],
                                        ),
                                      );
                                      if (confirm == true) {
                                        await _apiService.deleteSetoran(item['id']);
                                        Navigator.pop(ctx);
                                        _fetchOverview();
                                      }
                                    },
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      );
                    }),
                  ],
                ],
              ),
            );
          },
        );
      },
    );
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'kurang lancar':
        return const Color(0xFFF59E0B);
      case 'mengulang':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF10B981);
    }
  }

  Color _getPredikatColor(String predikat) {
    final lower = predikat.toLowerCase();
    if (lower.contains('mumtaz')) return const Color(0xFF10B981);
    if (lower.contains('jayyid')) return const Color(0xFF3B82F6);
    if (lower.contains('mutawassith')) return const Color(0xFFD97706);
    if (lower.contains('rodi')) return const Color(0xFFEF4444);
    return const Color(0xFF64748B);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.scaffoldBg,
      appBar: AppBar(
        backgroundColor: context.cardBg,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, size: 18, color: context.titleColor),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "Setoran Hafalan (Muhafadzoh)",
          style: GoogleFonts.outfit(
            color: context.titleColor,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, size: 20),
            color: context.titleColor,
            onPressed: _fetchOverview,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? _errorMessage == 'NO_INTERNET'
                  ? OfflineWidget(onRetry: _fetchOverview)
                  : Center(child: Text(_errorMessage!, style: GoogleFonts.outfit(color: context.bodyColor)))
              : RefreshIndicator(
                  onRefresh: _fetchOverview,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Card Header Kelas & Kitab
                        _buildClassHeaderCard(),
                        const SizedBox(height: 16),

                        // Stats Summary Row
                        _buildMetricsRow(),
                        const SizedBox(height: 16),

                        // Notice Catatan Mustahiq
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFF3B82F6).withOpacity(0.08),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.2)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.info_outline_rounded, color: Color(0xFF3B82F6), size: 18),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  "Catatan hafalan harian ini adalah jurnal monitoring Mustahiq dan tidak menggantikan nilai rapor resmi.",
                                  style: GoogleFonts.outfit(color: const Color(0xFF3B82F6), fontSize: 11),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Search & Filter Chips
                        _buildSearchAndFilters(),
                        const SizedBox(height: 16),

                        // Daftar Santri
                        _buildSantriListView(),
                      ],
                    ),
                  ),
                ),
    );
  }

  // --- WIDGET: HEADER KELAS & RITME ---
  Widget _buildClassHeaderCard() {
    final kelas = _overviewData?['kelas'] ?? {};
    final ta = _overviewData?['tahunAjaran'] ?? {};
    final semester = _overviewData?['semester'] ?? 'Ganjil';
    final ritme = _overviewData?['konfigurasiRitme'] ?? {};
    final isAngka = _overviewData?['tipeInput'] != 'Teks';

    String ritmeText = '1 Pekan Sekali';
    if (ritme['mode_frekuensi'] == 'harian') ritmeText = 'Setiap Hari';
    if (ritme['mode_frekuensi'] == 'interval_hari') ritmeText = 'Setiap ${ritme['interval_hari']} Hari Sekali';
    if (ritme['mode_frekuensi'] == 'bebas') ritmeText = 'Fleksibel / Bebas';
    if (ritme['target_per_setoran'] != null) ritmeText += " (@ ${ritme['target_per_setoran']} Nadzom)";

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF3B82F6).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  "Kelas ${kelas['nama'] ?? '-'}",
                  style: GoogleFonts.outfit(
                    color: const Color(0xFF3B82F6),
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              Text(
                "TA ${ta['kode'] ?? '-'} • $semester",
                style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 11, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            "Kitab: ${kelas['muhafadzoh_nama'] ?? 'Muhafadzoh'}",
            style: GoogleFonts.outfit(
              color: context.titleColor,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            "Model: ${isAngka ? 'Skala Angka (Nadzom)' : 'Materi Bab'}",
            style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 11),
          ),
          const Divider(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.timer_outlined, size: 16, color: Color(0xFFD97706)),
                  const SizedBox(width: 6),
                  Text(
                    ritmeText,
                    style: GoogleFonts.outfit(
                      color: const Color(0xFFD97706),
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              InkWell(
                onTap: _openAturRitmeSheet,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFD97706).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.tune, size: 13, color: Color(0xFFD97706)),
                      const SizedBox(width: 4),
                      Text("Atur Ritme", style: GoogleFonts.outfit(color: const Color(0xFFD97706), fontSize: 11, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // --- WIDGET: METRICS SUMMARY ---
  Widget _buildMetricsRow() {
    final stats = _overviewData?['stats'] ?? {};
    return Row(
      children: [
        _buildMetricBox("Total", "${stats['totalSantri'] ?? 0}", const Color(0xFF3B82F6)),
        const SizedBox(width: 8),
        _buildMetricBox("Tuntas", "${stats['countTuntasGanjil'] ?? 0}", const Color(0xFF10B981)),
        const SizedBox(width: 8),
        _buildMetricBox("Melampaui", "${stats['countMelampaui'] ?? 0}", const Color(0xFF8B5CF6)),
        const SizedBox(width: 8),
        _buildMetricBox("Belum Setor", "${stats['countBelumSetorPekanIni'] ?? 0}", const Color(0xFFEF4444)),
      ],
    );
  }

  Widget _buildMetricBox(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: context.cardBg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: context.borderColor),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: GoogleFonts.outfit(color: color, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 10),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  // --- WIDGET: SEARCH & FILTERS ---
  Widget _buildSearchAndFilters() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          onChanged: (val) => setState(() => _searchQuery = val),
          style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13),
          decoration: InputDecoration(
            hintText: "Cari nama santri atau NIS...",
            prefixIcon: const Icon(Icons.search, size: 18),
            filled: true,
            fillColor: context.cardBg,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: context.borderColor),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          ),
        ),
        const SizedBox(height: 10),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildFilterChip("Semua", "all"),
              const SizedBox(width: 6),
              _buildFilterChip("Tuntas Target", "tuntas"),
              const SizedBox(width: 6),
              _buildFilterChip("Melampaui", "melampaui"),
              const SizedBox(width: 6),
              _buildFilterChip("Belum Setor 7 Hari", "belum_setor"),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChip(String label, String key) {
    final isSelected = _filterStatus == key;
    return GestureDetector(
      onTap: () => setState(() => _filterStatus = key),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF3B82F6) : context.cardBg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? const Color(0xFF3B82F6) : context.borderColor),
        ),
        child: Text(
          label,
          style: GoogleFonts.outfit(
            color: isSelected ? Colors.white : context.titleColor,
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ),
    );
  }

  // --- WIDGET: SANTRI LIST ---
  Widget _buildSantriListView() {
    final list = _filteredSantriList;
    final isAngka = _overviewData?['tipeInput'] != 'Teks';

    if (list.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 40),
          child: Text("Tidak ada santri yang cocok.", style: GoogleFonts.outfit(color: context.subTitleColor)),
        ),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: list.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, idx) {
        final santri = list[idx];
        final persentase = (santri['persentase'] as num?)?.toInt() ?? 0;
        final predikat = santri['predikat'] ?? '-';
        final isMelampaui = santri['is_melampaui_ganjil'] == true;
        final predColor = _getPredikatColor(predikat);

        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: context.cardBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: context.borderColor),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: const Color(0xFF3B82F6),
                    backgroundImage: santri['foto_url'] != null ? NetworkImage(santri['foto_url']) : null,
                    child: santri['foto_url'] == null
                        ? Text((santri['nama'] ?? 'S').substring(0, 1).toUpperCase(),
                            style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12))
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
                            color: context.titleColor,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          isAngka
                              ? "Capaian: Bait ke-${santri['bait_terakhir'] ?? 0} (Target: ${santri['target_semester'] ?? 100})"
                              : "Capaian: ${santri['nama_bab_terakhir'] ?? 'Belum ada'}",
                          style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: predColor.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      predikat,
                      style: GoogleFonts.outfit(color: predColor, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Progress Bar
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: (persentase / 100).clamp(0.0, 1.0),
                  backgroundColor: context.borderColor.withOpacity(0.3),
                  valueColor: AlwaysStoppedAnimation<Color>(
                    isMelampaui ? const Color(0xFF8B5CF6) : const Color(0xFF10B981),
                  ),
                  minHeight: 5,
                ),
              ),
              const SizedBox(height: 6),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "$persentase% dari target",
                    style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                  if (isMelampaui)
                    Row(
                      children: [
                        const Icon(Icons.auto_awesome, size: 12, color: Color(0xFF8B5CF6)),
                        const SizedBox(width: 4),
                        Text(
                          "Melampaui Target",
                          style: GoogleFonts.outfit(color: const Color(0xFF8B5CF6), fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                ],
              ),
              const Divider(height: 18),

              // Actions: + Setor & Riwayat
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    santri['tanggal_setor_terakhir'] != null
                        ? "Terakhir: ${santri['tanggal_setor_terakhir']}"
                        : "Belum pernah setor",
                    style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 10),
                  ),
                  Row(
                    children: [
                      InkWell(
                        onTap: () => _openRiwayatTimelineSheet(santri),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: context.borderColor.withOpacity(0.3),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.history, size: 13, color: Color(0xFF64748B)),
                              const SizedBox(width: 4),
                              Text("Riwayat", style: GoogleFonts.outfit(color: context.titleColor, fontSize: 11, fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      InkWell(
                        onTap: () => _openInputSetoranSheet(santri),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.add, size: 14, color: Colors.white),
                              const SizedBox(width: 4),
                              Text("+ Setor", style: GoogleFonts.outfit(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}
