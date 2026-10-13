import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';

class LaporanPelanggaranPrestasiScreen extends StatefulWidget {
  final int initialTabIndex; // 0 for Pelanggaran, 1 for Prestasi
  const LaporanPelanggaranPrestasiScreen({
    super.key,
    this.initialTabIndex = 0,
  });

  @override
  State<LaporanPelanggaranPrestasiScreen> createState() => _LaporanPelanggaranPrestasiScreenState();
}

class _LaporanPelanggaranPrestasiScreenState extends State<LaporanPelanggaranPrestasiScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ApiService _apiService = ApiService();
  String _searchQuery = '';

  List<dynamic> _pelanggaranList = [];
  List<dynamic> _prestasiList = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 2,
      vsync: this,
      initialIndex: widget.initialTabIndex,
    );
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final results = await Future.wait([
        _apiService.getPelanggaran(),
        _apiService.getPrestasi(),
      ]);
      setState(() {
        _pelanggaranList = results[0];
        _prestasiList = results[1];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  String _formatTanggal(dynamic tanggal) {
    if (tanggal == null) return '-';
    try {
      final dt = DateTime.parse(tanggal.toString());
      const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return '${dt.day} ${bulan[dt.month - 1]} ${dt.year}';
    } catch (_) {
      return tanggal.toString();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;

    return Scaffold(
      backgroundColor: context.scaffoldBg,
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF0D1527) : Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.titleColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "Laporan Kedisiplinan & Prestasi",
          style: GoogleFonts.outfit(
            color: context.titleColor,
            fontWeight: FontWeight.bold,
            fontSize: 17,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFFEF4444),
          indicatorWeight: 3,
          labelColor: const Color(0xFFEF4444),
          unselectedLabelColor: context.subTitleColor,
          labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13),
          unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.w500, fontSize: 13),
          tabs: const [
            Tab(icon: Icon(Icons.warning_amber_rounded, size: 18), text: "Pelanggaran Santri"),
            Tab(icon: Icon(Icons.emoji_events_rounded, size: 18), text: "Prestasi Santri"),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFEF4444)))
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.cloud_off_rounded, size: 48, color: Colors.grey[400]),
                        const SizedBox(height: 12),
                        Text(_error!, textAlign: TextAlign.center, style: GoogleFonts.outfit(color: Colors.grey)),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: _loadData,
                          icon: const Icon(Icons.refresh_rounded, size: 18),
                          label: const Text("Coba Lagi"),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFEF4444),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
    );
  }

  Widget _buildPelanggaranTab(BuildContext context, bool isDark) {
    final filtered = _pelanggaranList.where((p) {
      final matchQuery = (p['nama_santri'] ?? '').toString().toLowerCase().contains(_searchQuery) ||
          (p['kelas_nama'] ?? '').toString().toLowerCase().contains(_searchQuery) ||
          (p['deskripsi'] ?? '').toString().toLowerCase().contains(_searchQuery) ||
          (p['jenis'] ?? '').toString().toLowerCase().contains(_searchQuery) ||
          (p['sanksi'] ?? '').toString().toLowerCase().contains(_searchQuery);
      return matchQuery;
    }).toList();

    return RefreshIndicator(
      onRefresh: _loadData,
      color: const Color(0xFFEF4444),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Summary cards
            Row(
              children: [
                Expanded(
                  child: _buildSummaryCard(
                    title: 'Total Pelanggaran',
                    value: '${_pelanggaranList.length}',
                    subtitle: 'Catatan terbaru',
                    icon: Icons.warning_amber_rounded,
                    color: const Color(0xFFEF4444),
                    isDark: isDark,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildSummaryCard(
                    title: 'Data Pesantren',
                    value: 'Aktif',
                    subtitle: 'Sinkron dari Web',
                    icon: Icons.sync_rounded,
                    color: const Color(0xFF10B981),
                    isDark: isDark,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),

            _buildSearchBar(hint: 'Cari nama santri, kelas, atau deskripsi...', isDark: isDark),
            const SizedBox(height: 18),

            if (filtered.isEmpty)
              _buildEmptyState('Tidak ada data catatan pelanggaran.')
            else
              ...filtered.map((item) => _buildPelanggaranCard(item, isDark)),
          ],
        ),
      ),
    );
  }

  Widget _buildPrestasiTab(BuildContext context, bool isDark) {
    final filtered = _prestasiList.where((p) {
      final matchQuery = (p['nama_santri'] ?? '').toString().toLowerCase().contains(_searchQuery) ||
          (p['kelas_nama'] ?? '').toString().toLowerCase().contains(_searchQuery) ||
          (p['deskripsi'] ?? '').toString().toLowerCase().contains(_searchQuery) ||
          (p['jenis'] ?? '').toString().toLowerCase().contains(_searchQuery) ||
          (p['penghargaan'] ?? '').toString().toLowerCase().contains(_searchQuery);
      return matchQuery;
    }).toList();

    return RefreshIndicator(
      onRefresh: _loadData,
      color: const Color(0xFFF59E0B),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: _buildSummaryCard(
                    title: 'Total Prestasi',
                    value: '${_prestasiList.length}',
                    subtitle: 'Catatan terbaru',
                    icon: Icons.emoji_events_rounded,
                    color: const Color(0xFFF59E0B),
                    isDark: isDark,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildSummaryCard(
                    title: 'Data Pesantren',
                    value: 'Aktif',
                    subtitle: 'Sinkron dari Web',
                    icon: Icons.sync_rounded,
                    color: const Color(0xFF3B82F6),
                    isDark: isDark,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),

            _buildSearchBar(hint: 'Cari nama santri, kelas, atau deskripsi...', isDark: isDark),
            const SizedBox(height: 18),

            if (filtered.isEmpty)
              _buildEmptyState('Tidak ada data prestasi.')
            else
              ...filtered.map((item) => _buildPrestasiCard(item, isDark)),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryCard({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color color,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131C2E) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: color.withOpacity(isDark ? 0.3 : 0.2), width: 1.2),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(isDark ? 0.2 : 0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(14)),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value, style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: context.titleColor)),
                Text(title, style: GoogleFonts.outfit(fontSize: 11, color: context.subTitleColor, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar({required String hint, required bool isDark}) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131C2E) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isDark ? Colors.white10 : Colors.black12),
      ),
      child: TextField(
        onChanged: (val) => setState(() => _searchQuery = val.toLowerCase()),
        style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 13),
          prefixIcon: Icon(Icons.search_rounded, color: context.subTitleColor, size: 20),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
    );
  }

  Widget _buildPelanggaranCard(dynamic item, bool isDark) {
    final badgeText = (item['jenis'] ?? item['tingkat'])?.toString();
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131C2E) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.warning_amber_rounded, color: Color(0xFFEF4444), size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item['nama_santri']?.toString() ?? '-',
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14, color: context.titleColor),
                    ),
                    Text(
                      'Kelas ${item['kelas_nama'] ?? '-'}',
                      style: GoogleFonts.outfit(fontSize: 11, color: context.subTitleColor),
                    ),
                  ],
                ),
              ),
              if (badgeText != null && badgeText.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    badgeText,
                    style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFFEF4444)),
                  ),
                ),
            ],
          ),
          if (item['deskripsi'] != null && item['deskripsi'].toString().isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              item['deskripsi']?.toString() ?? '',
              style: GoogleFonts.outfit(fontSize: 12, color: context.subTitleColor, height: 1.4),
            ),
          ],
          if (item['sanksi'] != null && item['sanksi'].toString().isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444).withOpacity(0.08),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.2)),
              ),
              child: Text(
                'Sanksi: ${item['sanksi']}',
                style: GoogleFonts.outfit(fontSize: 11, color: const Color(0xFFEF4444), fontWeight: FontWeight.w600),
              ),
            ),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.calendar_today_rounded, size: 12, color: Colors.grey[400]),
              const SizedBox(width: 4),
              Text(
                _formatTanggal(item['tanggal']),
                style: GoogleFonts.outfit(fontSize: 11, color: Colors.grey[500]),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPrestasiCard(dynamic item, bool isDark) {
    final presBadge = (item['penghargaan'] ?? item['jenis'] ?? item['tingkat'])?.toString();
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131C2E) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.emoji_events_rounded, color: Color(0xFFF59E0B), size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item['nama_santri']?.toString() ?? '-',
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14, color: context.titleColor),
                    ),
                    Text(
                      'Kelas ${item['kelas_nama'] ?? '-'}',
                      style: GoogleFonts.outfit(fontSize: 11, color: context.subTitleColor),
                    ),
                  ],
                ),
              ),
              if (presBadge != null && presBadge.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF59E0B).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    presBadge,
                    style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFFF59E0B)),
                  ),
                ),
            ],
          ),
          if (item['deskripsi'] != null && item['deskripsi'].toString().isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              item['deskripsi']?.toString() ?? '',
              style: GoogleFonts.outfit(fontSize: 12, color: context.subTitleColor, height: 1.4),
            ),
          ],
          if (item['jenis'] != null && item['jenis'].toString().isNotEmpty && item['penghargaan'] != null) ...[
            const SizedBox(height: 6),
            Text(
              'Kategori: ${item['jenis']}',
              style: GoogleFonts.outfit(fontSize: 11, color: context.subTitleColor),
            ),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.calendar_today_rounded, size: 12, color: Colors.grey[400]),
              const SizedBox(width: 4),
              Text(
                _formatTanggal(item['tanggal']),
                style: GoogleFonts.outfit(fontSize: 11, color: Colors.grey[500]),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 60),
        child: Column(
          children: [
            Icon(Icons.inbox_rounded, size: 48, color: Colors.grey[300]),
            const SizedBox(height: 12),
            Text(message, style: GoogleFonts.outfit(color: Colors.grey, fontSize: 13), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
