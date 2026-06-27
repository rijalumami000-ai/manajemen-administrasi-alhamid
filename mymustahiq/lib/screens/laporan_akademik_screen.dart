import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';

class LaporanAkademikScreen extends StatefulWidget {
  const LaporanAkademikScreen({super.key});

  @override
  State<LaporanAkademikScreen> createState() => _LaporanAkademikScreenState();
}

class _LaporanAkademikScreenState extends State<LaporanAkademikScreen> {
  final ApiService _apiService = ApiService();

  bool _isLoadingClasses = true;
  bool _isLoadingData = false;
  String? _errorMessage;

  List<dynamic> _classList = [];
  List<dynamic> _tahunAjaranList = [];
  Map<String, dynamic>? _selectedTahunAjaran;
  String _selectedSemester = 'Ganjil';
  Map<String, dynamic>? _selectedKelas;

  Map<String, dynamic>? _laporanData;

  @override
  void initState() {
    super.initState();
    _fetchInitialData();
  }

  Future<void> _fetchInitialData() async {
    setState(() { _isLoadingClasses = true; _errorMessage = null; });
    try {
      final taRes = await _apiService.getTahunAjaranList();
      _tahunAjaranList = taRes['tahunAjaran'] ?? [];
      _selectedSemester = taRes['activeSemester'] ?? 'Ganjil';
      if (_tahunAjaranList.isNotEmpty) {
        _selectedTahunAjaran = _tahunAjaranList.firstWhere(
          (ta) => ta['is_active'] == true,
          orElse: () => _tahunAjaranList.first,
        );
      }

      final classRes = await _apiService.getClasses(
        tahunAjaranId: _selectedTahunAjaran?['id'],
        semester: _selectedSemester,
      );
      setState(() {
        _classList = classRes['classes'] ?? [];
        _isLoadingClasses = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoadingClasses = false;
      });
    }
  }

  Future<void> _fetchLaporanAkademik() async {
    if (_selectedKelas == null) return;
    setState(() { _isLoadingData = true; _errorMessage = null; _laporanData = null; });
    try {
      final res = await _apiService.getLaporanAkademik(
        kelasId: _selectedKelas!['id'],
        tahunAjaranId: _selectedTahunAjaran?['id'],
        semester: _selectedSemester,
      );
      setState(() {
        _laporanData = res;
        _isLoadingData = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoadingData = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.scaffoldBg,
      appBar: AppBar(
        backgroundColor: context.isDarkMode ? const Color(0xFF0D1527) : Colors.white.withOpacity(0.95),
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.titleColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Laporan Akademik Siswa',
          style: GoogleFonts.outfit(color: context.titleColor, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: _isLoadingClasses
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : Column(
              children: [
                _buildFilterBar(),
                const Divider(height: 1, thickness: 1),
                Expanded(
                  child: _laporanData == null
                      ? _buildKelasSelector()
                      : _buildMatriksView(),
                ),
              ],
            ),
    );
  }

  Widget _buildFilterBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: context.isDarkMode ? const Color(0xFF0D1527) : Colors.white,
      child: Row(
        children: [
          Expanded(
            child: DropdownButton<Map<String, dynamic>>(
              dropdownColor: context.isDarkMode ? const Color(0xFF1E293B) : Colors.white,
              value: _selectedTahunAjaran,
              isExpanded: true,
              underline: const SizedBox(),
              style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13, fontWeight: FontWeight.bold),
              items: _tahunAjaranList.map<DropdownMenuItem<Map<String, dynamic>>>((ta) {
                return DropdownMenuItem<Map<String, dynamic>>(
                  value: ta as Map<String, dynamic>,
                  child: Text("T.A: ${ta['kode']}"),
                );
              }).toList(),
              onChanged: (val) {
                if (val != null) {
                  setState(() { _selectedTahunAjaran = val; _laporanData = null; _selectedKelas = null; });
                  _fetchInitialData();
                }
              },
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: DropdownButton<String>(
              dropdownColor: context.isDarkMode ? const Color(0xFF1E293B) : Colors.white,
              value: _selectedSemester,
              isExpanded: true,
              underline: const SizedBox(),
              style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13, fontWeight: FontWeight.bold),
              items: const [
                DropdownMenuItem(value: 'Ganjil', child: Text('Sem: Ganjil')),
                DropdownMenuItem(value: 'Genap', child: Text('Sem: Genap')),
              ],
              onChanged: (val) {
                if (val != null) {
                  setState(() { _selectedSemester = val; _laporanData = null; _selectedKelas = null; });
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKelasSelector() {
    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline_rounded, color: Colors.amber, size: 48),
              const SizedBox(height: 16),
              Text(_errorMessage!, textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(color: context.titleColor, fontSize: 14)),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: _fetchInitialData,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: Text('Coba Lagi', style: GoogleFonts.outfit()),
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF064E3B)),
              ),
            ],
          ),
        ),
      );
    }

    if (_classList.isEmpty) {
      return Center(
        child: Text('Tidak ada kelas tersedia.', style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 14)),
      );
    }

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withOpacity(0.08),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFF10B981).withOpacity(0.2)),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline_rounded, color: Color(0xFF10B981), size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Pilih kelas untuk melihat laporan akademik seluruh santri dalam satu tampilan.',
                    style: GoogleFonts.outfit(color: const Color(0xFF10B981), fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Text('PILIH KELAS',
              style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 11,
                  fontWeight: FontWeight.bold, letterSpacing: 1.5)),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.6,
            ),
            itemCount: _classList.length,
            itemBuilder: (context, index) {
              final kelas = _classList[index];
              final isSelected = _selectedKelas?['id'] == kelas['id'];
              return GestureDetector(
                onTap: () {
                  setState(() { _selectedKelas = kelas as Map<String, dynamic>; });
                  _fetchLaporanAkademik();
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFF10B981) : context.cardBg,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSelected ? const Color(0xFF10B981) : context.borderColor,
                      width: isSelected ? 2 : 1,
                    ),
                    boxShadow: isSelected
                        ? [BoxShadow(color: const Color(0xFF10B981).withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 4))]
                        : [],
                  ),
                  alignment: Alignment.center,
                  child: _isLoadingData && isSelected
                      ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text(
                          kelas['nama'] ?? '-',
                          style: GoogleFonts.outfit(
                            color: isSelected ? Colors.white : context.titleColor,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
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

  Widget _buildMatriksView() {
    final santriList = _laporanData?['santri'] as List<dynamic>? ?? [];
    final kelasNama = _laporanData?['kelas']?['nama'] ?? '';
    final tahunAjaran = _laporanData?['tahunAjaran'] ?? '';
    final semester = _laporanData?['semester'] ?? '';
    final isSemesterGenap = semester.toLowerCase() == 'genap';

    if (santriList.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.people_outline_rounded, size: 60, color: context.subTitleColor.withOpacity(0.5)),
            const SizedBox(height: 16),
            Text('Tidak ada santri di kelas ini.', style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 14)),
            const SizedBox(height: 16),
            TextButton.icon(
              onPressed: () => setState(() { _laporanData = null; }),
              icon: const Icon(Icons.arrow_back_rounded, size: 16),
              label: Text('Kembali Pilih Kelas', style: GoogleFonts.outfit()),
            ),
          ],
        ),
      );
    }

    return DefaultTabController(
      length: 5,
      child: Column(
        children: [
          // Header Kelas
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            color: context.isDarkMode ? const Color(0xFF0D1527) : const Color(0xFFF0FDF4),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Kelas $kelasNama — $tahunAjaran (Sem. $semester)',
                        style: GoogleFonts.outfit(color: context.titleColor, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      Text('${santriList.length} santri',
                          style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 12)),
                    ],
                  ),
                ),
                TextButton.icon(
                  onPressed: () => setState(() { _laporanData = null; }),
                  icon: const Icon(Icons.swap_horiz_rounded, size: 16, color: Color(0xFF10B981)),
                  label: Text('Ganti Kelas', style: GoogleFonts.outfit(color: const Color(0xFF10B981), fontSize: 12)),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Tab Bar Kategori Nilai
          Container(
            color: context.isDarkMode ? const Color(0xFF0D1527) : Colors.white,
            child: TabBar(
              indicatorColor: const Color(0xFF10B981),
              labelColor: const Color(0xFF10B981),
              unselectedLabelColor: context.subTitleColor,
              labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13),
              unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.normal, fontSize: 13),
              isScrollable: true,
              tabs: const [
                Tab(text: "Muhafadzoh Akbar"),
                Tab(text: "Qiroatul Kitab"),
                Tab(text: "Taftisyul Kutub"),
                Tab(text: "Ujian Tulis"),
                Tab(text: "Rapor & Absensi"),
              ],
            ),
          ),
          const Divider(height: 1),

          // Tab View Konten
          Expanded(
            child: TabBarView(
              children: [
                _buildMuhafadzohList(santriList),
                _buildQiroahList(santriList),
                _buildTaftisyulList(santriList),
                _buildUjianTulisList(santriList),
                _buildRaporList(santriList, isSemesterGenap),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // --- 1. TAB MUHAFADZOH LIST ---
  Widget _buildMuhafadzohList(List<dynamic> santriList) {
    return ListView.separated(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: santriList.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final s = santriList[index] as Map<String, dynamic>;
        final muhafadzoh = s['muhafadzoh'] as Map<String, dynamic>?;

        return _buildBaseSantriRow(
          no: index + 1,
          nama: s['nama'] ?? '-',
          nis: s['nis'] ?? '-',
          fotoUrl: s['foto_url'],
          rightWidget: muhafadzoh != null
              ? _buildMuhafadzohRow(muhafadzoh, const Color(0xFF10B981))
              : _buildEmptyValueWidget(),
        );
      },
    );
  }

  // --- 2. TAB QIROAH LIST ---
  Widget _buildQiroahList(List<dynamic> santriList) {
    return ListView.separated(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: santriList.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final s = santriList[index] as Map<String, dynamic>;
        final qiroatul = s['qiroatul'] as Map<String, dynamic>?;

        return _buildBaseSantriRow(
          no: index + 1,
          nama: s['nama'] ?? '-',
          nis: s['nis'] ?? '-',
          fotoUrl: s['foto_url'],
          rightWidget: qiroatul != null
              ? _buildQiroahRow(qiroatul, const Color(0xFF3B82F6))
              : _buildEmptyValueWidget(),
        );
      },
    );
  }

  // --- 3. TAB TAFTISYUL KUTUB LIST ---
  Widget _buildTaftisyulList(List<dynamic> santriList) {
    return ListView.separated(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: santriList.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final s = santriList[index] as Map<String, dynamic>;
        final taftisyul = s['taftisyul'] as List<dynamic>? ?? [];

        return _buildBaseSantriRow(
          no: index + 1,
          nama: s['nama'] ?? '-',
          nis: s['nis'] ?? '-',
          fotoUrl: s['foto_url'],
          bottomContent: taftisyul.isNotEmpty
              ? Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: taftisyul.map<Widget>((t) {
                      final val = t['nilai']?.toString() ?? '-';
                      final isTam = val.toLowerCase().contains('tam') && !val.toLowerCase().contains('naq');
                      final color = isTam
                          ? const Color(0xFF10B981)
                          : (val == '-' ? const Color(0xFF94A3B8) : const Color(0xFFEF4444));
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: color.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: color.withOpacity(0.2)),
                        ),
                        child: Text(
                          '${t['mata_pelajaran']}: $val',
                          style: GoogleFonts.outfit(color: color, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      );
                    }).toList(),
                  ),
                )
              : Padding(
                  padding: const EdgeInsets.only(top: 6.0),
                  child: Text('Belum ada nilai Taftisyul Kutub',
                      style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 11, fontStyle: FontStyle.italic)),
                ),
        );
      },
    );
  }

  // --- 4. TAB UJIAN TULIS LIST ---
  Widget _buildUjianTulisList(List<dynamic> santriList) {
    return ListView.separated(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: santriList.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final s = santriList[index] as Map<String, dynamic>;
        final ujianTulis = s['ujian_tulis'] as List<dynamic>? ?? [];

        return _buildBaseSantriRow(
          no: index + 1,
          nama: s['nama'] ?? '-',
          nis: s['nis'] ?? '-',
          fotoUrl: s['foto_url'],
          bottomContent: ujianTulis.isNotEmpty
              ? Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: ujianTulis.map<Widget>((u) {
                      final score = double.tryParse(u['nilai_angka']?.toString() ?? '') ?? 0.0;
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF59E0B).withOpacity(0.08),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.2)),
                        ),
                        child: Text(
                          '${u['mata_pelajaran']}: ${score.toStringAsFixed(score % 1 == 0 ? 0 : 1)}',
                          style: GoogleFonts.outfit(color: const Color(0xFFF59E0B), fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      );
                    }).toList(),
                  ),
                )
              : Padding(
                  padding: const EdgeInsets.only(top: 6.0),
                  child: Text('Belum ada nilai Ujian Tulis',
                      style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 11, fontStyle: FontStyle.italic)),
                ),
        );
      },
    );
  }

  // --- 5. TAB RAPOR & ABSENSI LIST ---
  Widget _buildRaporList(List<dynamic> santriList, bool isSemesterGenap) {
    return ListView.separated(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: santriList.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final s = santriList[index] as Map<String, dynamic>;
        final rapor = s['rapor'] as Map<String, dynamic>?;

        return _buildBaseSantriRow(
          no: index + 1,
          nama: s['nama'] ?? '-',
          nis: s['nis'] ?? '-',
          fotoUrl: s['foto_url'],
          bottomContent: rapor != null
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 8),
                    // Row Absensi & Kepribadian
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _buildAbsensiChip('Sakit', rapor['sakit'] ?? 0, const Color(0xFFF59E0B)),
                        _buildAbsensiChip('Izin', rapor['izin'] ?? 0, const Color(0xFF3B82F6)),
                        _buildAbsensiChip('Alpa', rapor['alpa'] ?? 0, const Color(0xFFEF4444)),
                        _buildKepribadianChip('Akhlaq', rapor['akhlaq']),
                        _buildKepribadianChip('Keaktifan', rapor['keaktifan']),
                        _buildKepribadianChip('Kerapihan', rapor['kerapihan']),
                      ],
                    ),
                    // Catatan Wali Kelas
                    if ((rapor['catatan'] ?? '').toString().trim().isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: context.isDarkMode ? Colors.white.withOpacity(0.04) : Colors.black.withOpacity(0.03),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Catatan Wali Kelas: "${rapor['catatan']}"',
                          style: GoogleFonts.inter(
                            color: context.bodyColor,
                            fontSize: 11,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ),
                    ],
                    // Keputusan Kenaikan
                    if (isSemesterGenap && (rapor['keputusan_kenaikan'] ?? '').toString().trim().isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withOpacity(0.08),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFF10B981).withOpacity(0.2)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.campaign_rounded, color: Color(0xFF10B981), size: 14),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                'Naik ke kelas ${rapor['keputusan_kenaikan']}',
                                style: GoogleFonts.outfit(color: const Color(0xFF10B981), fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                )
              : Padding(
                  padding: const EdgeInsets.only(top: 6.0),
                  child: Text('Belum ada data rapor & absensi',
                      style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 11, fontStyle: FontStyle.italic)),
                ),
        );
      },
    );
  }

  // --- BASE SANTRI ROW CONTAINER ---
  Widget _buildBaseSantriRow({
    required int no,
    required String nama,
    required String nis,
    String? fotoUrl,
    Widget? rightWidget,
    Widget? bottomContent,
  }) {
    final baseUrl = 'https://alhamidcintamulya.my.id';
    final fullFotoUrl = fotoUrl != null && fotoUrl.isNotEmpty
        ? (fotoUrl.startsWith('http') ? fotoUrl : '$baseUrl$fotoUrl')
        : null;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Nomor urut kecil
              Container(
                width: 22,
                height: 22,
                alignment: Alignment.center,
                decoration: const BoxDecoration(
                  color: Color(0xFF10B981),
                  shape: BoxShape.circle,
                ),
                child: Text('$no',
                    style: GoogleFonts.outfit(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 8),
              // Foto
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: context.isDarkMode ? Colors.white.withOpacity(0.08) : const Color(0xFFE2E8F0),
                  border: Border.all(color: context.borderColor, width: 1),
                  image: fullFotoUrl != null
                      ? DecorationImage(image: NetworkImage(fullFotoUrl), fit: BoxFit.cover)
                      : null,
                ),
                child: fullFotoUrl == null
                    ? Icon(Icons.person_rounded, size: 22, color: context.subTitleColor)
                    : null,
              ),
              const SizedBox(width: 10),
              // Nama & NIS - expanded agar nama tidak wrap lebih dari 1 baris
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      nama,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      'NIS: $nis',
                      style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 10),
                    ),
                  ],
                ),
              ),
              if (rightWidget != null) ...[
                const SizedBox(width: 8),
                rightWidget,
              ],
            ],
          ),
          if (bottomContent != null) bottomContent,
        ],
      ),
    );
  }

  Widget _buildEmptyValueWidget() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: context.isDarkMode ? Colors.white.withOpacity(0.04) : Colors.black.withOpacity(0.03),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text('-', style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 14, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildMuhafadzohRow(Map<String, dynamic> n, Color color) {
    final kitab = n['kitab']?.toString() ?? '-';
    final predikat = n['predikat']?.toString() ?? '-';
    final nilaiAngka = double.tryParse(n['nilai_angka']?.toString() ?? '');
    final capaian = n['capaian']?.toString().trim() ?? '';

    final tipeInput = _laporanData?['muhafadzoh_tipe_input']?.toString() ?? 'Angka';
    final isTeks = tipeInput.toLowerCase() == 'teks';

    // Prioritas berdasarkan tipeInput
    final showCapaian = isTeks ? capaian.isNotEmpty : (capaian.isNotEmpty && (nilaiAngka == null || nilaiAngka <= 0));
    final showNumeric = !showCapaian && nilaiAngka != null && nilaiAngka > 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Nilai (bulatan atau teks)
        if (showNumeric)
          Container(
            width: 36,
            height: 36,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              shape: BoxShape.circle,
              border: Border.all(color: color.withOpacity(0.3), width: 1.5),
            ),
            child: Text(
              nilaiAngka.toStringAsFixed(nilaiAngka % 1 == 0 ? 0 : 1),
              style: GoogleFonts.outfit(color: color, fontSize: 13, fontWeight: FontWeight.w900),
            ),
          )
        else if (showCapaian)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: color.withOpacity(0.25)),
            ),
            child: Text(capaian, style: GoogleFonts.outfit(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
          )
        else
          Icon(Icons.remove_rounded, color: context.subTitleColor, size: 16),
        const SizedBox(height: 2),
        // Nama kitab
        SizedBox(
          width: 90,
          child: Text(
            kitab,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.right,
            style: GoogleFonts.outfit(color: context.titleColor, fontSize: 9, fontWeight: FontWeight.w600),
          ),
        ),
        // Predikat
        SizedBox(
          width: 90,
          child: Text(
            predikat,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.right,
            style: GoogleFonts.outfit(color: color, fontSize: 9),
          ),
        ),
      ],
    );
  }

  Widget _buildQiroahRow(Map<String, dynamic> n, Color color) {
    final kitab = n['kitab']?.toString() ?? '-';
    final nilaiAngka = double.tryParse(n['nilai_angka']?.toString() ?? '');
    final capaian = n['capaian']?.toString().trim() ?? '';

    final tipeInput = _laporanData?['qiroatul_tipe_input']?.toString() ?? 'Angka';
    final isTeks = tipeInput.toLowerCase() == 'teks';

    // Prioritas berdasarkan tipeInput
    final showCapaian = isTeks ? capaian.isNotEmpty : (capaian.isNotEmpty && (nilaiAngka == null || nilaiAngka <= 0));
    final showNumeric = !showCapaian && nilaiAngka != null && nilaiAngka > 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Nilai
        if (showNumeric)
          Container(
            width: 36,
            height: 36,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              shape: BoxShape.circle,
              border: Border.all(color: color.withOpacity(0.3), width: 1.5),
            ),
            child: Text(
              nilaiAngka.toStringAsFixed(nilaiAngka % 1 == 0 ? 0 : 1),
              style: GoogleFonts.outfit(color: color, fontSize: 13, fontWeight: FontWeight.w900),
            ),
          )
        else if (showCapaian)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: color.withOpacity(0.25)),
            ),
            child: Text(capaian, style: GoogleFonts.outfit(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
          )
        else
          Icon(Icons.remove_rounded, color: context.subTitleColor, size: 16),
        const SizedBox(height: 2),
        // Nama kitab saja (tanpa predikat)
        SizedBox(
          width: 90,
          child: Text(
            kitab,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.right,
            style: GoogleFonts.outfit(color: context.titleColor, fontSize: 9, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }



  Widget _buildAbsensiChip(String label, dynamic value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('$label ', style: GoogleFonts.outfit(color: color, fontSize: 10, fontWeight: FontWeight.w600)),
          Text('${value ?? 0}', style: GoogleFonts.outfit(color: color, fontSize: 11, fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }

  Widget _buildKepribadianChip(String label, String? val) {
    String textVal = val ?? '-';
    if (val == 'A') textVal = 'A';
    if (val == 'B') textVal = 'B';
    if (val == 'C') textVal = 'C';
    if (val == 'D') textVal = 'D';
    final color = val == null ? context.subTitleColor : const Color(0xFF6366F1);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.06),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Text('$label: $textVal',
          style: GoogleFonts.outfit(color: color, fontSize: 10, fontWeight: FontWeight.w600)),
    );
  }
}

