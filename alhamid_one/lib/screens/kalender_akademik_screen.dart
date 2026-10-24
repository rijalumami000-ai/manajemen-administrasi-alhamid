import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';

class KalenderAkademikScreen extends StatefulWidget {
  const KalenderAkademikScreen({super.key});

  @override
  State<KalenderAkademikScreen> createState() => _KalenderAkademikScreenState();
}

class _KalenderAkademikScreenState extends State<KalenderAkademikScreen>
    with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  late TabController _tabController;

  List<dynamic> _tahunAjaranList = [];
  Map<String, dynamic>? _selectedTahunAjaran;

  List<dynamic> _ganjilList = [];
  List<dynamic> _genapList = [];

  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final taResult = await _apiService.getTahunAjaranList();
      final taList = taResult['tahunAjaran'] as List<dynamic>? ?? [];
      final activeTa = taList.firstWhere(
        (ta) => ta['is_active'] == true,
        orElse: () => taList.isNotEmpty ? taList.first : null,
      );

      if (!mounted) return;
      setState(() {
        _tahunAjaranList = taList;
        _selectedTahunAjaran = activeTa;
      });

      await _fetchKalender();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  Future<void> _fetchKalender() async {
    if (_selectedTahunAjaran == null) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final taId = _selectedTahunAjaran!['id'] as int;
      final results = await Future.wait([
        _apiService.getKalenderAkademik(tahunAjaranId: taId, semester: 'Ganjil'),
        _apiService.getKalenderAkademik(tahunAjaranId: taId, semester: 'Genap'),
      ]);
      if (!mounted) return;
      setState(() {
        _ganjilList = results[0];
        _genapList = results[1];
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;
    final headingColor = isDark ? Colors.white : const Color(0xFF0D1527);
    final accentColor = const Color(0xFF10B981);

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
          'Kalender Akademik',
          style: GoogleFonts.outfit(
            color: headingColor,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        actions: [
          // Tahun Ajaran dropdown
          if (_tahunAjaranList.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withOpacity(0.07) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: context.borderColor),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<Map<String, dynamic>>(
                    value: _selectedTahunAjaran,
                    dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                    isDense: true,
                    style: GoogleFonts.outfit(
                      color: headingColor,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                    items: _tahunAjaranList.map<DropdownMenuItem<Map<String, dynamic>>>((ta) {
                      return DropdownMenuItem<Map<String, dynamic>>(
                        value: ta as Map<String, dynamic>,
                        child: Text(ta['kode'] ?? '-'),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setState(() => _selectedTahunAjaran = val);
                        _fetchKalender();
                      }
                    },
                  ),
                ),
              ),
            ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            color: isDark ? const Color(0xFF0D1527) : Colors.white,
            child: TabBar(
              controller: _tabController,
              labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13),
              unselectedLabelStyle: GoogleFonts.outfit(fontSize: 13),
              labelColor: accentColor,
              unselectedLabelColor: context.subTitleColor,
              indicatorColor: accentColor,
              indicatorWeight: 3,
              tabs: const [
                Tab(text: 'Semester Ganjil'),
                Tab(text: 'Semester Genap'),
              ],
            ),
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 48),
                        const SizedBox(height: 12),
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.outfit(color: Colors.redAccent),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _loadData,
                          icon: const Icon(Icons.refresh_rounded),
                          label: Text('Coba Lagi', style: GoogleFonts.outfit()),
                          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
                        ),
                      ],
                    ),
                  ),
                )
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildKalenderTab(_ganjilList, 'Ganjil', isDark),
                    _buildKalenderTab(_genapList, 'Genap', isDark),
                  ],
                ),
    );
  }

  Widget _buildKalenderTab(List<dynamic> items, String semester, bool isDark) {
    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.calendar_today_rounded,
              size: 56,
              color: context.subTitleColor.withOpacity(0.4),
            ),
            const SizedBox(height: 16),
            Text(
              'Belum ada jadwal untuk\nSemester $semester',
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                color: context.subTitleColor,
                fontSize: 14,
                height: 1.5,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final item = items[index] as Map<String, dynamic>;
        final tanggal = item['tanggal']?.toString() ?? '-';
        final kegiatan = item['kegiatan']?.toString() ?? '-';

        return Container(
          decoration: BoxDecoration(
            color: context.cardBg,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: context.borderColor),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(isDark ? 0.15 : 0.03),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Number badge
              Container(
                width: 42,
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(isDark ? 0.15 : 0.08),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(14),
                    bottomLeft: Radius.circular(14),
                  ),
                ),
                alignment: Alignment.center,
                child: Text(
                  '${index + 1}',
                  style: GoogleFonts.outfit(
                    color: const Color(0xFF10B981),
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
              // Content
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (tanggal != '-' && tanggal.isNotEmpty)
                        Row(
                          children: [
                            Icon(
                              Icons.event_rounded,
                              size: 13,
                              color: const Color(0xFF10B981),
                            ),
                            const SizedBox(width: 5),
                            Expanded(
                              child: Text(
                                tanggal,
                                style: GoogleFonts.outfit(
                                  color: const Color(0xFF10B981),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      if (tanggal != '-' && tanggal.isNotEmpty) const SizedBox(height: 5),
                      Text(
                        kegiatan,
                        style: GoogleFonts.outfit(
                          color: context.titleColor,
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
