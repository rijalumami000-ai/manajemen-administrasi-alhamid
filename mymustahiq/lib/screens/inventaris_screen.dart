import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/theme_manager.dart';
import '../services/api_service.dart';

class InventarisScreen extends StatefulWidget {
  final int initialIndex;
  const InventarisScreen({super.key, this.initialIndex = 0});

  @override
  State<InventarisScreen> createState() => _InventarisScreenState();
}

class _InventarisScreenState extends State<InventarisScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ApiService _apiService = ApiService();

  final List<String> _kategoriKeys = ['pondok', 'madin', 'pmq'];
  final List<String> _kategoriTitles = ['Pondok', 'Madin', 'PMQ'];

  Map<String, List<dynamic>> _itemsMap = {
    'pondok': [],
    'madin': [],
    'pmq': [],
  };

  Map<String, dynamic>? _rekap;
  bool _isLoading = true;
  String? _errorMessage;

  String _searchQuery = '';
  String _filterKondisi = ''; // '' | 'Baik' | 'Rusak Ringan' | 'Rusak Berat'
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    final idx = (widget.initialIndex >= 0 && widget.initialIndex < 3) ? widget.initialIndex : 0;
    _tabController = TabController(length: 3, vsync: this, initialIndex: idx);
    _tabController.addListener(() {
      if (_tabController.indexIsChanging) {
        setState(() {});
      }
    });
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });

      final rekapRes = await _apiService.getInventarisRekap();
      final pondokRes = await _apiService.getInventaris(kategori: 'pondok');
      final madinRes = await _apiService.getInventaris(kategori: 'madin');
      final pmqRes = await _apiService.getInventaris(kategori: 'pmq');

      if (mounted) {
        setState(() {
          _rekap = rekapRes;
          _itemsMap = {
            'pondok': pondokRes,
            'madin': madinRes,
            'pmq': pmqRes,
          };
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;
    final currentKey = _kategoriKeys[_tabController.index];
    final currentItems = _itemsMap[currentKey] ?? [];

    // Filter items by search & kondisi
    final filteredItems = currentItems.where((item) {
      if (_filterKondisi.isNotEmpty && item['kondisi'] != _filterKondisi) {
        return false;
      }
      if (_searchQuery.trim().isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      final nama = (item['nama_barang'] ?? '').toString().toLowerCase();
      final kode = (item['kode_barang'] ?? '').toString().toLowerCase();
      final lokasi = (item['lokasi'] ?? '').toString().toLowerCase();
      final pj = (item['penanggung_jawab'] ?? '').toString().toLowerCase();
      return nama.contains(q) || kode.contains(q) || lokasi.contains(q) || pj.contains(q);
    }).toList();

    return Scaffold(
      backgroundColor: context.scaffoldBg,
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF0D1527) : Colors.white.withOpacity(0.85),
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: context.titleColor),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "Inventaris Pesantren",
          style: GoogleFonts.outfit(
            color: context.titleColor,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(14),
            ),
            child: TabBar(
              controller: _tabController,
              indicator: BoxDecoration(
                color: const Color(0xFF10B981),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF10B981).withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  )
                ],
              ),
              labelColor: Colors.white,
              unselectedLabelColor: isDark ? Colors.white60 : const Color(0xFF64748B),
              labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13),
              unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13),
              tabs: [
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.apartment_rounded, size: 16),
                      const SizedBox(width: 6),
                      Text("Pondok (${_itemsMap['pondok']?.length ?? 0})"),
                    ],
                  ),
                ),
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.school_rounded, size: 16),
                      const SizedBox(width: 6),
                      Text("Madin (${_itemsMap['madin']?.length ?? 0})"),
                    ],
                  ),
                ),
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.menu_book_rounded, size: 16),
                      const SizedBox(width: 6),
                      Text("PMQ (${_itemsMap['pmq']?.length ?? 0})"),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: const Color(0xFF10B981),
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
            : _errorMessage != null
                ? _buildErrorView(isDark)
                : SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // KPI Metric Summary
                        _buildKpiSummary(currentKey, isDark),
                        const SizedBox(height: 16),

                        // Search and Filter Bar
                        _buildSearchBar(isDark),
                        const SizedBox(height: 12),

                        // Condition Filter Chips
                        _buildFilterChips(isDark),
                        const SizedBox(height: 18),

                        // Header Count
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              "Daftar Barang Inventaris",
                              style: GoogleFonts.outfit(
                                color: context.titleColor,
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              "${filteredItems.length} Barang",
                              style: GoogleFonts.outfit(
                                color: context.subTitleColor,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // List of items
                        if (filteredItems.isEmpty)
                          _buildEmptyView(isDark)
                        else
                          ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: filteredItems.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              return _buildItemCard(filteredItems[index], isDark);
                            },
                          ),
                        const SizedBox(height: 30),
                      ],
                    ),
                  ),
      ),
    );
  }

  // KPI Summary
  Widget _buildKpiSummary(String kategori, bool isDark) {
    final list = _itemsMap[kategori] ?? [];
    final totalMacam = list.length;
    int totalUnit = 0;
    int totalBaik = 0;
    int totalRusak = 0;

    for (var item in list) {
      final jml = (item['jumlah'] ?? 1) as int;
      totalUnit += jml;
      if (item['kondisi'] == 'Baik') {
        totalBaik += jml;
      } else {
        totalRusak += jml;
      }
    }

    return Row(
      children: [
        Expanded(
          child: _buildMetricTile(
            label: "Jenis Barang",
            value: "$totalMacam",
            icon: Icons.inventory_2_rounded,
            color: const Color(0xFF3B82F6),
            isDark: isDark,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildMetricTile(
            label: "Total Unit",
            value: "$totalUnit",
            icon: Icons.widgets_rounded,
            color: const Color(0xFF8B5CF6),
            isDark: isDark,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildMetricTile(
            label: "Kondisi Baik",
            value: "$totalBaik",
            icon: Icons.check_circle_rounded,
            color: const Color(0xFF10B981),
            isDark: isDark,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildMetricTile(
            label: "Perlu Servis",
            value: "$totalRusak",
            icon: Icons.warning_rounded,
            color: const Color(0xFFEF4444),
            isDark: isDark,
          ),
        ),
      ],
    );
  }

  Widget _buildMetricTile({
    required String label,
    required String value,
    required IconData icon,
    required Color color,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: color.withOpacity(0.25),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(height: 6),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: GoogleFonts.outfit(
              fontSize: 10,
              color: isDark ? Colors.white54 : const Color(0xFF64748B),
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  // Search Bar
  Widget _buildSearchBar(bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.08) : const Color(0xFFE2E8F0),
        ),
      ),
      child: TextField(
        controller: _searchController,
        onChanged: (val) => setState(() => _searchQuery = val),
        style: GoogleFonts.outfit(
          color: isDark ? Colors.white : const Color(0xFF0F172A),
          fontSize: 13,
        ),
        decoration: InputDecoration(
          icon: Icon(Icons.search_rounded, size: 18, color: isDark ? Colors.white38 : Colors.black38),
          hintText: "Cari nama barang, kode, lokasi, atau penanggung jawab...",
          hintStyle: GoogleFonts.outfit(
            color: isDark ? Colors.white38 : Colors.black38,
            fontSize: 13,
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 12),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear_rounded, size: 16),
                  onPressed: () {
                    _searchController.clear();
                    setState(() => _searchQuery = '');
                  },
                )
              : null,
        ),
      ),
    );
  }

  // Filter Chips
  Widget _buildFilterChips(bool isDark) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: [
          _buildChip("Semua Kondisi", '', isDark),
          const SizedBox(width: 8),
          _buildChip("🟢 Kondisi Baik", 'Baik', isDark),
          const SizedBox(width: 8),
          _buildChip("🟡 Rusak Ringan", 'Rusak Ringan', isDark),
          const SizedBox(width: 8),
          _buildChip("🔴 Rusak Berat", 'Rusak Berat', isDark),
        ],
      ),
    );
  }

  Widget _buildChip(String label, String value, bool isDark) {
    final isSelected = _filterKondisi == value;
    return InkWell(
      onTap: () => setState(() => _filterKondisi = value),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF10B981)
              : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF10B981)
                : (isDark ? Colors.white.withOpacity(0.08) : const Color(0xFFE2E8F0)),
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.outfit(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected
                ? Colors.white
                : (isDark ? Colors.white70 : const Color(0xFF475569)),
          ),
        ),
      ),
    );
  }

  // Item Card
  Widget _buildItemCard(dynamic item, bool isDark) {
    final nama = item['nama_barang'] ?? '-';
    final kode = item['kode_barang'];
    final jumlah = item['jumlah'] ?? 1;
    final satuan = item['satuan'] ?? 'Unit';
    final kondisi = item['kondisi'] ?? 'Baik';
    final lokasi = item['lokasi'];
    final pj = item['penanggung_jawab'];
    final keterangan = item['keterangan'];

    Color statusColor;
    Color statusBg;
    if (kondisi == 'Baik') {
      statusColor = const Color(0xFF10B981);
      statusBg = const Color(0xFF10B981).withOpacity(0.12);
    } else if (kondisi == 'Rusak Ringan') {
      statusColor = const Color(0xFFF59E0B);
      statusBg = const Color(0xFFF59E0B).withOpacity(0.12);
    } else {
      statusColor = const Color(0xFFEF4444);
      statusBg = const Color(0xFFEF4444).withOpacity(0.12);
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      nama,
                      style: GoogleFonts.outfit(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    if (kode != null && kode.toString().isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white.withOpacity(0.08) : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          kode.toString(),
                          style: GoogleFonts.robotoMono(
                            fontSize: 10,
                            fontWeight: FontWeight.w500,
                            color: isDark ? Colors.white60 : const Color(0xFF64748B),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),

              // Status Pill
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusBg,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: statusColor.withOpacity(0.3)),
                ),
                child: Text(
                  kondisi,
                  style: GoogleFonts.outfit(
                    color: statusColor,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Metadata Row (Qty, Lokasi, PJ)
          Wrap(
            spacing: 12,
            runSpacing: 6,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.layers_rounded, size: 14, color: Color(0xFF10B981)),
                  const SizedBox(width: 4),
                  Text(
                    "$jumlah $satuan",
                    style: GoogleFonts.outfit(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white70 : const Color(0xFF334155),
                    ),
                  ),
                ],
              ),
              if (lokasi != null && lokasi.toString().isNotEmpty)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.location_on_rounded, size: 14, color: Color(0xFF3B82F6)),
                    const SizedBox(width: 4),
                    Text(
                      lokasi.toString(),
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        color: isDark ? Colors.white60 : const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              if (pj != null && pj.toString().isNotEmpty)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.person_rounded, size: 14, color: Color(0xFF8B5CF6)),
                    const SizedBox(width: 4),
                    Text(
                      pj.toString(),
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        color: isDark ? Colors.white60 : const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
            ],
          ),

          if (keterangan != null && keterangan.toString().isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              keterangan.toString(),
              style: GoogleFonts.outfit(
                fontSize: 11,
                fontStyle: FontStyle.italic,
                color: isDark ? Colors.white38 : Colors.black45,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildEmptyView(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Column(
          children: [
            Icon(Icons.inventory_2_outlined, size: 48, color: isDark ? Colors.white24 : Colors.black26),
            const SizedBox(height: 12),
            Text(
              "Tidak ada barang ditemukan",
              style: GoogleFonts.outfit(
                color: isDark ? Colors.white70 : const Color(0xFF334155),
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              _searchQuery.isNotEmpty
                  ? "Tidak ada item yang cocok dengan pencarian."
                  : "Belum ada catatan inventaris untuk kategori ini.",
              style: GoogleFonts.outfit(
                color: isDark ? Colors.white38 : Colors.black45,
                fontSize: 12,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorView(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Column(
          children: [
            const Icon(Icons.error_outline_rounded, size: 40, color: Colors.redAccent),
            const SizedBox(height: 12),
            Text(
              "Gagal memuat inventaris",
              style: GoogleFonts.outfit(
                color: isDark ? Colors.white : const Color(0xFF0F172A),
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              _errorMessage ?? '',
              style: GoogleFonts.outfit(color: Colors.redAccent, fontSize: 12),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadData,
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
              child: const Text("Coba Lagi"),
            ),
          ],
        ),
      ),
    );
  }
}
