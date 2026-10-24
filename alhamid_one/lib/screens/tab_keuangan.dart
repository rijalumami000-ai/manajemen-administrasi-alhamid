import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../services/theme_manager.dart';
import '../services/api_service.dart';

class TabKeuangan extends StatefulWidget {
  const TabKeuangan({super.key});

  @override
  State<TabKeuangan> createState() => _TabKeuanganState();
}

class _TabKeuanganState extends State<TabKeuangan> {
  final ApiService _apiService = ApiService();

  // Active Menu: 'makan' (SPP Makan) | 'madin' (SPP Madin)
  String _activeMenu = 'makan';

  // Filters
  int? _selectedTahunAjaranId;
  String _selectedTahunAjaranKode = '';
  int _selectedBulan = DateTime.now().month;
  int _selectedTahun = DateTime.now().year;
  int? _selectedKelasId;
  String _selectedKelasNama = 'Semua Kelas';
  String _searchQuery = '';

  // Data
  List<dynamic> _tahunAjaranList = [];
  List<dynamic> _kelasList = [];
  Map<String, dynamic>? _summary;
  List<dynamic> _santriList = [];
  bool _isLoading = true;
  String? _errorMessage;

  final TextEditingController _searchController = TextEditingController();

  static const List<String> _namaBulan = [
    '',
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember'
  ];

  @override
  void initState() {
    super.initState();
    _loadInitialFilters();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialFilters() async {
    try {
      setState(() => _isLoading = true);
      final taList = await _apiService.getTahunAjaran();
      final kRes = await _apiService.getClasses();
      final List<dynamic> rawClasses = (kRes['classes'] as List<dynamic>?) ?? [];

      _tahunAjaranList = taList;
      _kelasList = rawClasses.where((k) => k['jenis'] == 'Diniyah').toList();

      final activeTa = taList.firstWhere(
        (t) => t['is_active'] == true,
        orElse: () => taList.isNotEmpty ? taList.last : null,
      );

      if (activeTa != null) {
        _selectedTahunAjaranId = activeTa['id'];
        _selectedTahunAjaranKode = activeTa['kode'] ?? '';
      }

      await _fetchReport();
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _fetchReport() async {
    if (_selectedTahunAjaranId == null) return;

    try {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });

      final res = await _apiService.getLaporanSPPBulanan(
        tahunAjaranId: _selectedTahunAjaranId!,
        bulan: _selectedBulan,
        tahun: _selectedTahun,
        kelasId: _selectedKelasId,
      );

      if (mounted) {
        setState(() {
          _summary = res['summary'] as Map<String, dynamic>?;
          _santriList = (res['per_santri'] as List<dynamic>?) ?? [];
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

  String _formatRp(num? amount) {
    if (amount == null) return 'Rp 0';
    final formatter = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);
    return formatter.format(amount);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;

    // Filter santri by search query
    final filteredSantri = _santriList.where((s) {
      if (_searchQuery.trim().isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      final nama = (s['nama'] ?? '').toString().toLowerCase();
      final nis = (s['nis'] ?? '').toString().toLowerCase();
      final kelas = (s['nama_kelas_diniyah'] ?? '').toString().toLowerCase();
      return nama.contains(q) || nis.contains(q) || kelas.contains(q);
    }).toList();

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: RefreshIndicator(
        onRefresh: _fetchReport,
        color: const Color(0xFF10B981),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Section
              _buildHeader(context, isDark),
              const SizedBox(height: 20),

              // Menu Switcher (SPP Makan vs SPP Madin)
              _buildMenuSwitcher(isDark),
              const SizedBox(height: 18),

              // Filters Row (TA, Bulan, Kelas)
              _buildFiltersRow(context, isDark),
              const SizedBox(height: 16),

              // Search Bar
              _buildSearchBar(isDark),
              const SizedBox(height: 20),

              // Content Body
              if (_isLoading)
                _buildLoadingState()
              else if (_errorMessage != null)
                _buildErrorState(isDark)
              else ...[
                // Statistik Kelunasan Hero Card
                _buildStatistikKelunasanCard(isDark, filteredSantri.length),
                const SizedBox(height: 22),

                // Subtitle List Section
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _activeMenu == 'makan'
                          ? "Daftar Kelunasan SPP Makan"
                          : "Daftar Kelunasan SPP Madin",
                      style: GoogleFonts.outfit(
                        color: context.titleColor,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      "${filteredSantri.length} Santri",
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Santri List
                if (filteredSantri.isEmpty)
                  _buildEmptyState(isDark)
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: filteredSantri.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      return _buildSantriCard(context, filteredSantri[index], isDark);
                    },
                  ),
              ],
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  // Header
  Widget _buildHeader(BuildContext context, bool isDark) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Keuangan Santri",
                style: GoogleFonts.outfit(
                  color: context.titleColor,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                "Laporan SPP Makan, SPP Madin, & statistik kelunasan santri.",
                style: GoogleFonts.outfit(
                  color: context.subTitleColor,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFF10B981).withOpacity(0.12),
            borderRadius: BorderRadius.circular(14),
          ),
          child: const Icon(Icons.account_balance_wallet_rounded, color: Color(0xFF10B981), size: 24),
        ),
      ],
    );
  }

  // Menu Switcher (SPP Makan vs SPP Madin)
  Widget _buildMenuSwitcher(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildSwitcherButton(
              id: 'makan',
              label: 'Laporan SPP Makan',
              icon: Icons.restaurant_rounded,
              color: const Color(0xFFF59E0B),
              isDark: isDark,
            ),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: _buildSwitcherButton(
              id: 'madin',
              label: 'Laporan SPP Madin',
              icon: Icons.menu_book_rounded,
              color: const Color(0xFF10B981),
              isDark: isDark,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSwitcherButton({
    required String id,
    required String label,
    required IconData icon,
    required Color color,
    required bool isDark,
  }) {
    final isSelected = _activeMenu == id;
    return GestureDetector(
      onTap: () {
        if (!isSelected) {
          setState(() => _activeMenu = id);
        }
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? (isDark ? const Color(0xFF1E293B) : Colors.white)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.06),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  )
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? color : (isDark ? Colors.white60 : Colors.black45),
            ),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                label,
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isSelected
                      ? (isDark ? Colors.white : const Color(0xFF0F172A))
                      : (isDark ? Colors.white60 : Colors.black54),
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Filters Row
  Widget _buildFiltersRow(BuildContext context, bool isDark) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: [
          // Filter Tahun Ajaran
          _buildFilterChip(
            icon: Icons.calendar_today_rounded,
            label: _selectedTahunAjaranKode.isNotEmpty ? _selectedTahunAjaranKode : 'Tahun Ajaran',
            onTap: () => _showTahunAjaranPicker(context, isDark),
            isDark: isDark,
          ),
          const SizedBox(width: 8),

          // Filter Bulan
          _buildFilterChip(
            icon: Icons.date_range_rounded,
            label: "${_namaBulan[_selectedBulan]} $_selectedTahun",
            onTap: () => _showBulanPicker(context, isDark),
            isDark: isDark,
          ),
          const SizedBox(width: 8),

          // Filter Kelas
          _buildFilterChip(
            icon: Icons.class_rounded,
            label: _selectedKelasNama,
            onTap: () => _showKelasPicker(context, isDark),
            isDark: isDark,
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDark ? Colors.white.withOpacity(0.08) : const Color(0xFFE2E8F0),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: const Color(0xFF10B981)),
            const SizedBox(width: 6),
            Text(
              label,
              style: GoogleFonts.outfit(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isDark ? Colors.white70 : const Color(0xFF334155),
              ),
            ),
            const SizedBox(width: 4),
            Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: isDark ? Colors.white38 : Colors.black38),
          ],
        ),
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
          hintText: "Cari santri, NIS, atau kelas...",
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

  // Hero Statistik Kelunasan
  Widget _buildStatistikKelunasanCard(bool isDark, int displayedSantri) {
    final isMakan = _activeMenu == 'makan';

    final target = isMakan
        ? NumberFormat().parse((_summary?['target_makan'] ?? 0).toString())
        : NumberFormat().parse((_summary?['target_madin'] ?? 0).toString());

    final terkumpul = isMakan
        ? NumberFormat().parse((_summary?['terkumpul_makan'] ?? 0).toString())
        : NumberFormat().parse((_summary?['terkumpul_madin'] ?? 0).toString());

    final lunasCount = isMakan
        ? (_summary?['santri_lunas_makan'] ?? 0) as int
        : (_summary?['santri_lunas_madin'] ?? 0) as int;

    final bebasCount = isMakan
        ? (_summary?['santri_bebas_makan'] ?? 0) as int
        : (_summary?['santri_bebas_madin'] ?? 0) as int;

    final totalSantri = (_summary?['total_santri'] ?? displayedSantri) as int;
    final belumLunasCount = (totalSantri - lunasCount - bebasCount).clamp(0, totalSantri);

    final realisasiPct = target > 0 ? ((terkumpul / target) * 100).round() : 0;
    final sisa = (target - terkumpul).clamp(0, target);

    final brandColor = isMakan ? const Color(0xFFF59E0B) : const Color(0xFF10B981);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? [
                  brandColor.withOpacity(0.18),
                  const Color(0xFF0F172A),
                ]
              : [
                  brandColor.withOpacity(0.08),
                  Colors.white,
                ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: brandColor.withOpacity(0.25),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: brandColor.withOpacity(0.06),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: brandColor.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      isMakan ? Icons.pie_chart_rounded : Icons.analytics_rounded,
                      color: brandColor,
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Statistik Kelunasan ${isMakan ? 'SPP Makan' : 'SPP Madin'}",
                        style: GoogleFonts.outfit(
                          color: context.titleColor,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        "${_namaBulan[_selectedBulan]} $_selectedTahun • $_selectedKelasNama",
                        style: GoogleFonts.outfit(
                          color: context.subTitleColor,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: brandColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  "$realisasiPct%",
                  style: GoogleFonts.outfit(
                    color: brandColor,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: target > 0 ? (terkumpul / target).clamp(0.0, 1.0).toDouble() : 0.0,
              backgroundColor: isDark ? Colors.white12 : const Color(0xFFE2E8F0),
              valueColor: AlwaysStoppedAnimation<Color>(brandColor),
              minHeight: 8,
            ),
          ),
          const SizedBox(height: 16),

          // Nominal Breakdown
          Row(
            children: [
              Expanded(
                child: _buildMetricCol(
                  label: "Terkumpul",
                  value: _formatRp(terkumpul),
                  valueColor: const Color(0xFF10B981),
                  isDark: isDark,
                ),
              ),
              Container(width: 1, height: 32, color: isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
              Expanded(
                child: _buildMetricCol(
                  label: "Target Tagihan",
                  value: _formatRp(target),
                  valueColor: context.titleColor,
                  isDark: isDark,
                ),
              ),
              Container(width: 1, height: 32, color: isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
              Expanded(
                child: _buildMetricCol(
                  label: "Tunggakan",
                  value: _formatRp(sisa),
                  valueColor: const Color(0xFFEF4444),
                  isDark: isDark,
                ),
              ),
            ],
          ),
          const Divider(height: 24, thickness: 0.8),

          // Santri Status Pills
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatusPill(
                icon: Icons.check_circle_rounded,
                label: "Lunas",
                count: lunasCount,
                color: const Color(0xFF10B981),
                isDark: isDark,
              ),
              _buildStatusPill(
                icon: Icons.pending_actions_rounded,
                label: "Belum Lunas",
                count: belumLunasCount,
                color: const Color(0xFFEF4444),
                isDark: isDark,
              ),
              if (bebasCount > 0)
                _buildStatusPill(
                  icon: Icons.verified_user_rounded,
                  label: "Bebas",
                  count: bebasCount,
                  color: const Color(0xFF6366F1),
                  isDark: isDark,
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCol({
    required String label,
    required String value,
    required Color valueColor,
    required bool isDark,
  }) {
    return Column(
      children: [
        Text(
          label,
          style: GoogleFonts.outfit(
            color: isDark ? Colors.white54 : const Color(0xFF64748B),
            fontSize: 10,
            fontWeight: FontWeight.w500,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: GoogleFonts.outfit(
            color: valueColor,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
          textAlign: TextAlign.center,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _buildStatusPill({
    required IconData icon,
    required String label,
    required int count,
    required Color color,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 5),
          Text(
            "$label: ",
            style: GoogleFonts.outfit(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: isDark ? Colors.white70 : const Color(0xFF334155),
            ),
          ),
          Text(
            "$count",
            style: GoogleFonts.outfit(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  // Santri Card
  Widget _buildSantriCard(BuildContext context, dynamic santri, bool isDark) {
    final isMakan = _activeMenu == 'makan';
    final nama = santri['nama'] ?? '-';
    final nis = santri['nis'] ?? '-';
    final kelas = santri['nama_kelas_diniyah'] ?? '-';

    final status = isMakan ? (santri['status_makan'] ?? 'belum_lunas') : (santri['status_madin'] ?? 'belum_lunas');
    final nominalTagihan = isMakan
        ? NumberFormat().parse((santri['nominal_tagihan_makan'] ?? 0).toString())
        : NumberFormat().parse((santri['nominal_tagihan_madin'] ?? 0).toString());
    final nominalDibayar = isMakan
        ? NumberFormat().parse((santri['nominal_dibayar_makan'] ?? 0).toString())
        : NumberFormat().parse((santri['nominal_dibayar_madin'] ?? 0).toString());

    final isLunas = status == 'lunas';
    final isBebas = status == 'dibebaskan';

    Color statusColor;
    String statusText;
    IconData statusIcon;

    if (isLunas) {
      statusColor = const Color(0xFF10B981);
      statusText = "LUNAS";
      statusIcon = Icons.check_circle_rounded;
    } else if (isBebas) {
      statusColor = const Color(0xFF6366F1);
      statusText = "BEBAS";
      statusIcon = Icons.verified_user_rounded;
    } else {
      statusColor = const Color(0xFFEF4444);
      statusText = "BELUM LUNAS";
      statusIcon = Icons.pending_actions_rounded;
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
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Avatar
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isLunas
                    ? [const Color(0xFF10B981), const Color(0xFF059669)]
                    : [const Color(0xFFEF4444), const Color(0xFFDC2626)],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            alignment: Alignment.center,
            child: Text(
              nama.isNotEmpty ? nama[0].toUpperCase() : 'S',
              style: GoogleFonts.outfit(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  nama,
                  style: GoogleFonts.outfit(
                    color: context.titleColor,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFF3B82F6).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        "Kelas $kelas",
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF3B82F6),
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      "NIS: $nis",
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
                if (!isLunas && !isBebas && nominalTagihan > 0) ...[
                  const SizedBox(height: 4),
                  Text(
                    "Kurang: ${_formatRp(nominalTagihan - nominalDibayar)}",
                    style: GoogleFonts.outfit(
                      color: const Color(0xFFEF4444),
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),

          // Status Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: statusColor.withOpacity(0.3),
                width: 1,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(statusIcon, size: 12, color: statusColor),
                const SizedBox(width: 4),
                Text(
                  statusText,
                  style: GoogleFonts.outfit(
                    color: statusColor,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Modals / Pickers
  void _showTahunAjaranPicker(BuildContext context, bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Pilih Tahun Ajaran",
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 12),
                Flexible(
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: _tahunAjaranList.length,
                    itemBuilder: (context, index) {
                      final ta = _tahunAjaranList[index];
                      final isSelected = ta['id'] == _selectedTahunAjaranId;
                      return ListTile(
                        title: Text(
                          "${ta['kode']} ${ta['is_active'] == true ? '★ (Aktif)' : ''}",
                          style: GoogleFonts.outfit(
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                            color: isSelected ? const Color(0xFF10B981) : (isDark ? Colors.white : Colors.black),
                          ),
                        ),
                        trailing: isSelected ? const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981)) : null,
                        onTap: () {
                          Navigator.pop(context);
                          setState(() {
                            _selectedTahunAjaranId = ta['id'];
                            _selectedTahunAjaranKode = ta['kode'] ?? '';
                          });
                          _fetchReport();
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showBulanPicker(BuildContext context, bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Pilih Bulan",
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 12),
                Flexible(
                  child: GridView.builder(
                    shrinkWrap: true,
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      childAspectRatio: 2.5,
                      mainAxisSpacing: 8,
                      crossAxisSpacing: 8,
                    ),
                    itemCount: 12,
                    itemBuilder: (context, index) {
                      final bulanIdx = index + 1;
                      final isSelected = _selectedBulan == bulanIdx;
                      return InkWell(
                        onTap: () {
                          Navigator.pop(context);
                          setState(() => _selectedBulan = bulanIdx);
                          _fetchReport();
                        },
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: isSelected
                                ? const Color(0xFF10B981)
                                : (isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFF1F5F9)),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            _namaBulan[bulanIdx],
                            style: GoogleFonts.outfit(
                              fontSize: 12,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                              color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showKelasPicker(BuildContext context, bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Filter Per Kelas",
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 12),
                ListTile(
                  title: Text(
                    "Semua Kelas",
                    style: GoogleFonts.outfit(
                      fontWeight: _selectedKelasId == null ? FontWeight.bold : FontWeight.w500,
                      color: _selectedKelasId == null ? const Color(0xFF10B981) : (isDark ? Colors.white : Colors.black),
                    ),
                  ),
                  trailing: _selectedKelasId == null ? const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981)) : null,
                  onTap: () {
                    Navigator.pop(context);
                    setState(() {
                      _selectedKelasId = null;
                      _selectedKelasNama = 'Semua Kelas';
                    });
                    _fetchReport();
                  },
                ),
                const Divider(height: 1),
                Flexible(
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: _kelasList.length,
                    itemBuilder: (context, index) {
                      final k = _kelasList[index];
                      final isSelected = k['id'] == _selectedKelasId;
                      return ListTile(
                        title: Text(
                          "Kelas ${k['nama']}",
                          style: GoogleFonts.outfit(
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                            color: isSelected ? const Color(0xFF10B981) : (isDark ? Colors.white : Colors.black),
                          ),
                        ),
                        trailing: isSelected ? const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981)) : null,
                        onTap: () {
                          Navigator.pop(context);
                          setState(() {
                            _selectedKelasId = k['id'];
                            _selectedKelasNama = "Kelas ${k['nama']}";
                          });
                          _fetchReport();
                        },
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // States
  Widget _buildLoadingState() {
    return const Center(
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: 60),
        child: CircularProgressIndicator(color: Color(0xFF10B981)),
      ),
    );
  }

  Widget _buildErrorState(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Column(
          children: [
            const Icon(Icons.error_outline_rounded, size: 40, color: Colors.redAccent),
            const SizedBox(height: 12),
            Text(
              "Gagal memuat laporan keuangan",
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
              onPressed: _fetchReport,
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
              child: const Text("Coba Lagi"),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Column(
          children: [
            Icon(Icons.inbox_rounded, size: 48, color: isDark ? Colors.white24 : Colors.black26),
            const SizedBox(height: 12),
            Text(
              "Tidak ada data santri",
              style: GoogleFonts.outfit(
                color: isDark ? Colors.white70 : const Color(0xFF334155),
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              "Belum ada catatan tagihan SPP untuk filter yang dipilih.",
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
}
