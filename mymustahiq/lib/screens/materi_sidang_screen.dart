import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';

class MateriSidangScreen extends StatefulWidget {
  final int initialTabIndex;
  const MateriSidangScreen({
    super.key,
    this.initialTabIndex = 0,
  });

  @override
  State<MateriSidangScreen> createState() => _MateriSidangScreenState();
}

class _MateriSidangScreenState extends State<MateriSidangScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ApiService _apiService = ApiService();

  List<dynamic> _allDocs = [];
  List<String> _tahunOptions = [];
  String? _selectedTahun;
  bool _isLoading = true;
  String? _error;

  final List<Map<String, dynamic>> _kategoriTabs = [
    {'key': 'madin', 'label': 'Sidang Madin', 'icon': Icons.menu_book_rounded, 'color': const Color(0xFF10B981)},
    {'key': 'pmq', 'label': 'Sidang PMQ', 'icon': Icons.auto_stories_rounded, 'color': const Color(0xFF3B82F6)},
    {'key': 'pondok', 'label': 'Sidang Pondok', 'icon': Icons.account_balance_rounded, 'color': const Color(0xFF8B5CF6)},
    {'key': 'haflah', 'label': 'Sidang Haflah', 'icon': Icons.celebration_rounded, 'color': const Color(0xFFF59E0B)},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: _kategoriTabs.length,
      vsync: this,
      initialIndex: widget.initialTabIndex,
    );
    _loadTahunOptions();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadTahunOptions() async {
    try {
      final options = await _apiService.getMateriSidangTahunOptions();
      final now = DateTime.now();
      final currentYear = now.month >= 7 ? '${now.year}-${now.year + 1}' : '${now.year - 1}-${now.year}';
      final allOptions = <String>{currentYear, ...options.map((e) => e.toString())}.toList();
      allOptions.sort((a, b) => b.compareTo(a));

      setState(() {
        _tahunOptions = allOptions;
        _selectedTahun = allOptions.isNotEmpty ? allOptions.first : currentYear;
      });
      _loadData();
    } catch (e) {
      setState(() { _error = e.toString().replaceAll('Exception: ', ''); _isLoading = false; });
    }
  }

  Future<void> _loadData() async {
    if (_selectedTahun == null) return;
    setState(() { _isLoading = true; _error = null; });
    try {
      final docs = await _apiService.getMateriSidang(tahunMasehi: _selectedTahun);
      setState(() { _allDocs = docs; _isLoading = false; });
    } catch (e) {
      setState(() { _error = e.toString().replaceAll('Exception: ', ''); _isLoading = false; });
    }
  }

  List<dynamic> _getDocsForKategori(String kategori) {
    return _allDocs.where((d) => d['kategori'] == kategori).toList();
  }

  String _formatTanggal(dynamic tanggal) {
    if (tanggal == null) return '-';
    try {
      final dt = DateTime.parse(tanggal.toString());
      const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return '${dt.day} ${bulan[dt.month - 1]} ${dt.year}';
    } catch (_) {
      return tanggal.toString();
    }
  }

  Future<void> _openPdf(String url) async {
    final fullUrl = 'https://alhamidcintamulya.my.id$url';
    final uri = Uri.parse(fullUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _sharePdf(String url, String title) {
    final fullUrl = 'https://alhamidcintamulya.my.id$url';
    Share.share('$title\n\nUnduh PDF: $fullUrl', subject: title);
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
          "Materi & Dokumen Sidang",
          style: GoogleFonts.outfit(
            color: context.titleColor,
            fontWeight: FontWeight.bold,
            fontSize: 17,
          ),
        ),
        actions: [
          // Tahun dropdown
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _selectedTahun,
                icon: Icon(Icons.expand_more_rounded, color: context.subTitleColor, size: 20),
                style: GoogleFonts.outfit(color: context.titleColor, fontSize: 12, fontWeight: FontWeight.w600),
                dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                items: _tahunOptions.map((t) {
                  return DropdownMenuItem(value: t, child: Text('$t M'));
                }).toList(),
                onChanged: (val) {
                  if (val != null) {
                    setState(() => _selectedTahun = val);
                    _loadData();
                  }
                },
              ),
            ),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: const Color(0xFFEF4444),
          indicatorWeight: 3,
          labelColor: const Color(0xFFEF4444),
          unselectedLabelColor: context.subTitleColor,
          labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 12),
          unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.w500, fontSize: 12),
          tabs: _kategoriTabs.map((tab) {
            final count = _getDocsForKategori(tab['key']).length;
            return Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(tab['icon'] as IconData, size: 16),
                  const SizedBox(width: 6),
                  Text(tab['label'] as String),
                  if (count > 0) ...[
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: (tab['color'] as Color).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '$count',
                        style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: tab['color'] as Color),
                      ),
                    ),
                  ],
                ],
              ),
            );
          }).toList(),
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
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : TabBarView(
                  controller: _tabController,
                  children: _kategoriTabs.map((tab) {
                    return _buildDocList(tab['key'] as String, tab['color'] as Color, isDark);
                  }).toList(),
                ),
    );
  }

  Widget _buildDocList(String kategori, Color color, bool isDark) {
    final docs = _getDocsForKategori(kategori);

    return RefreshIndicator(
      onRefresh: _loadData,
      color: color,
      child: docs.isEmpty
          ? ListView(
              children: [
                SizedBox(
                  height: MediaQuery.of(context).size.height * 0.5,
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.description_outlined, size: 48, color: Colors.grey[300]),
                        const SizedBox(height: 12),
                        Text(
                          "Belum ada dokumen untuk kategori ini.",
                          style: GoogleFonts.outfit(color: Colors.grey, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            )
          : ListView.builder(
              physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
              padding: const EdgeInsets.all(20),
              itemCount: docs.length,
              itemBuilder: (context, index) => _buildDocCard(docs[index], color, isDark),
            ),
    );
  }

  Widget _buildDocCard(dynamic doc, Color color, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131C2E) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border(left: BorderSide(color: color, width: 4)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status badge
          if (doc['status'] != null)
            Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                doc['status']?.toString() ?? '',
                style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: color, letterSpacing: 0.5),
              ),
            ),

          // Title
          Text(
            doc['judul']?.toString() ?? '-',
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.bold,
              fontSize: 14,
              color: context.titleColor,
              height: 1.3,
            ),
          ),

          // No surat
          if (doc['no_surat'] != null && doc['no_surat'].toString().isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(
                doc['no_surat']?.toString() ?? '',
                style: GoogleFonts.sourceCodePro(
                  fontSize: 11,
                  color: context.subTitleColor,
                ),
              ),
            ),

          // Ringkasan
          if (doc['ringkasan'] != null && doc['ringkasan'].toString().isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                doc['ringkasan']?.toString() ?? '',
                style: GoogleFonts.outfit(fontSize: 12, color: context.subTitleColor, height: 1.4),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ),

          const SizedBox(height: 12),

          // Meta info
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              if (doc['tanggal'] != null) _buildMetaChip(Icons.calendar_today_rounded, _formatTanggal(doc['tanggal']), isDark),
              if (doc['halaman'] != null && doc['halaman'] > 0) _buildMetaChip(Icons.description_rounded, '${doc['halaman']} hlm', isDark),
              if (doc['ukuran'] != null) _buildMetaChip(Icons.sd_storage_rounded, doc['ukuran'].toString(), isDark),
              if (doc['pengesah'] != null) _buildMetaChip(Icons.verified_rounded, doc['pengesah'].toString(), isDark),
            ],
          ),

          // PDF actions
          if (doc['file_url'] != null && doc['file_url'].toString().isNotEmpty) ...[
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _openPdf(doc['file_url']),
                    icon: const Icon(Icons.open_in_new_rounded, size: 16),
                    label: Text("Buka PDF", style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: color,
                      side: BorderSide(color: color.withOpacity(0.4)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                IconButton(
                  onPressed: () => _sharePdf(doc['file_url'], doc['judul'] ?? ''),
                  icon: Icon(Icons.share_rounded, color: color, size: 20),
                  tooltip: 'Bagikan',
                  style: IconButton.styleFrom(
                    backgroundColor: color.withOpacity(0.1),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMetaChip(IconData icon, String text, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: context.subTitleColor),
          const SizedBox(width: 4),
          Text(text, style: GoogleFonts.outfit(fontSize: 10, color: context.subTitleColor)),
        ],
      ),
    );
  }
}
