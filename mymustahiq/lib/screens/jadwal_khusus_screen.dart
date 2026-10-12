import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';

class JadwalKhususScreen extends StatefulWidget {
  final int initialTabIndex; // 0 for Balagh Romadhon, 1 for Imam Tarawih & Bilal
  const JadwalKhususScreen({
    super.key,
    this.initialTabIndex = 0,
  });

  @override
  State<JadwalKhususScreen> createState() => _JadwalKhususScreenState();
}

class _JadwalKhususScreenState extends State<JadwalKhususScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ApiService _apiService = ApiService();

  List<dynamic> _kajianList = [];
  List<dynamic> _tarawihList = [];
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
        _apiService.getKajianBalagh(),
        _apiService.getImamTarawih(),
      ]);
      setState(() {
        _kajianList = results[0];
        _tarawihList = results[1];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
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
          "Jadwal Khusus & Romadhon",
          style: GoogleFonts.outfit(
            color: context.titleColor,
            fontWeight: FontWeight.bold,
            fontSize: 17,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF10B981),
          indicatorWeight: 3,
          labelColor: const Color(0xFF10B981),
          unselectedLabelColor: context.subTitleColor,
          labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13),
          unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.w500, fontSize: 13),
          tabs: const [
            Tab(
              icon: Icon(Icons.menu_book_rounded, size: 18),
              text: "Kajian Balagh Romadhon",
            ),
            Tab(
              icon: Icon(Icons.mosque_rounded, size: 18),
              text: "Imam Tarawih & Bilal",
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
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
                            backgroundColor: const Color(0xFF10B981),
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
                    _buildBalaghTab(context, isDark),
                    _buildTarawihTab(context, isDark),
                  ],
                ),
    );
  }

  Widget _buildBalaghTab(BuildContext context, bool isDark) {
    // Group by kelas
    final Map<String, List<dynamic>> grouped = {};
    for (final item in _kajianList) {
      final kelas = item['kelas']?.toString() ?? 'Lainnya';
      grouped.putIfAbsent(kelas, () => []);
      grouped[kelas]!.add(item);
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      color: const Color(0xFF10B981),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Banner
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark
                      ? [const Color(0xFF065F46), const Color(0xFF0F172A)]
                      : [const Color(0xFFECFDF5), const Color(0xFFD1FAE5)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.18),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.nights_stay_rounded, color: Color(0xFF10B981), size: 28),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Kajian Kilatan Balagh Romadhon",
                          style: GoogleFonts.outfit(
                            color: isDark ? Colors.white : const Color(0xFF065F46),
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "Khataman Kitab Salaf bersama Masyayikh & Dewan Asatidz Pondok Pesantren Al-Hamid.",
                          style: GoogleFonts.outfit(
                            color: isDark ? Colors.white70 : const Color(0xFF047857),
                            fontSize: 11,
                            height: 1.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            if (_kajianList.isEmpty)
              _buildEmptyState("Belum ada data jadwal kajian balagh.", Icons.menu_book_rounded)
            else
              ...grouped.entries.map((entry) {
                final kelas = entry.key;
                final items = entry.value;
                return _buildKelasGroup(kelas, items, isDark);
              }),
          ],
        ),
      ),
    );
  }

  Widget _buildKelasGroup(String kelas, List<dynamic> items, bool isDark) {
    final colors = [
      const Color(0xFF10B981),
      const Color(0xFF3B82F6),
      const Color(0xFF8B5CF6),
      const Color(0xFFF59E0B),
      const Color(0xFFEC4899),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Kelas header
        Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [const Color(0xFF065F46), const Color(0xFF047857)],
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              const Icon(Icons.groups_rounded, color: Colors.white, size: 16),
              const SizedBox(width: 8),
              Text(
                kelas,
                style: GoogleFonts.outfit(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              const Spacer(),
              Text(
                "${items.length} sesi",
                style: GoogleFonts.outfit(
                  color: Colors.white70,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
        ...items.asMap().entries.map((entry) {
          final idx = entry.key;
          final item = entry.value;
          final color = colors[idx % colors.length];
          return _buildKajianCard(item, color, isDark);
        }),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildKajianCard(Map<String, dynamic> item, Color badgeColor, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131C2E) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.06)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(isDark ? 0.15 : 0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: badgeColor.withOpacity(0.14),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(Icons.auto_stories_rounded, color: badgeColor, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  item['kitab']?.toString() ?? '-',
                  style: GoogleFonts.outfit(
                    color: context.titleColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildInfoRow(Icons.person_rounded, "Qori'", item['qori']?.toString() ?? '-', isDark),
          _buildInfoRow(Icons.access_time_rounded, "Waktu", item['waktu']?.toString() ?? '-', isDark),
          if (item['tempat'] != null && item['tempat'].toString().isNotEmpty)
            _buildInfoRow(Icons.location_on_rounded, "Tempat", item['tempat'].toString(), isDark),
        ],
      ),
    );
  }

  Widget _buildTarawihTab(BuildContext context, bool isDark) {
    return RefreshIndicator(
      onRefresh: _loadData,
      color: const Color(0xFF10B981),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Banner
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark
                      ? [const Color(0xFF312E81), const Color(0xFF0F172A)]
                      : [const Color(0xFFEDE9FE), const Color(0xFFC4B5FD)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFF8B5CF6).withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF8B5CF6).withOpacity(0.18),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.mosque_rounded, color: Color(0xFF8B5CF6), size: 28),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Jadwal Imam Tarawih & Bilal",
                          style: GoogleFonts.outfit(
                            color: isDark ? Colors.white : const Color(0xFF312E81),
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "Petugas sholat tarawih dan bilal/muroqqi Bulan Romadhon.",
                          style: GoogleFonts.outfit(
                            color: isDark ? Colors.white70 : const Color(0xFF5B21B6),
                            fontSize: 11,
                            height: 1.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            if (_tarawihList.isEmpty)
              _buildEmptyState("Belum ada data jadwal imam tarawih.", Icons.mosque_rounded)
            else
              ..._tarawihList.map((item) => _buildTarawihCard(item, isDark)),
          ],
        ),
      ),
    );
  }

  Widget _buildTarawihCard(dynamic item, bool isDark) {
    final malam = item['malam']?.toString() ?? '-';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131C2E) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.06)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(isDark ? 0.15 : 0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Row(
        children: [
          // Malam badge
          Container(
            width: 60,
            padding: const EdgeInsets.symmetric(vertical: 18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(18),
                bottomLeft: Radius.circular(18),
              ),
            ),
            child: Column(
              children: [
                Text(
                  malam,
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 22,
                  ),
                ),
                Text(
                  "Malam",
                  style: GoogleFonts.outfit(
                    color: Colors.white70,
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildInfoRow(Icons.person_rounded, "Imam", item['imam']?.toString() ?? '-', isDark),
                  if (item['bilal'] != null && item['bilal'].toString().isNotEmpty)
                    _buildInfoRow(Icons.record_voice_over_rounded, "Bilal", item['bilal'].toString(), isDark),
                  if (item['tempat'] != null && item['tempat'].toString().isNotEmpty)
                    _buildInfoRow(Icons.location_on_rounded, "Tempat", item['tempat'].toString(), isDark),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 14, color: isDark ? Colors.white38 : Colors.grey[500]),
          const SizedBox(width: 6),
          Text(
            "$label: ",
            style: GoogleFonts.outfit(
              color: isDark ? Colors.white38 : Colors.grey[500],
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.outfit(
                color: context.titleColor,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String message, IconData icon) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 60),
        child: Column(
          children: [
            Icon(icon, size: 48, color: Colors.grey[300]),
            const SizedBox(height: 12),
            Text(
              message,
              style: GoogleFonts.outfit(color: Colors.grey, fontSize: 13),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
