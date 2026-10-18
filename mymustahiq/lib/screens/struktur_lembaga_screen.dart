import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/theme_manager.dart';
import '../services/api_service.dart';

class StrukturLembagaScreen extends StatefulWidget {
  final int initialTabIndex;
  const StrukturLembagaScreen({
    super.key,
    this.initialTabIndex = 0,
  });

  @override
  State<StrukturLembagaScreen> createState() => _StrukturLembagaScreenState();
}

class _StrukturLembagaScreenState extends State<StrukturLembagaScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final ApiService _apiService = ApiService();
  final Map<String, List<Map<String, dynamic>>> _liveApiData = {};
  List<dynamic> _tahunAjaranList = [];
  int? _selectedTahunAjaranId;
  bool _isLoadingApi = false;

  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedPondokCategory = 'ALL';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 5,
      vsync: this,
      initialIndex: widget.initialTabIndex.clamp(0, 4),
    );
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() {
          _searchController.clear();
          _searchQuery = '';
          _selectedPondokCategory = 'ALL';
        });
      }
    });
    _initTahunAjaranAndFetch();
  }

  Future<void> _initTahunAjaranAndFetch() async {
    try {
      final taData = await _apiService.getTahunAjaranList();
      if (taData['tahunAjaran'] != null && taData['tahunAjaran'] is List) {
        final list = (taData['tahunAjaran'] as List);
        _tahunAjaranList = list;
        final active = list.firstWhere((t) => t['is_active'] == true, orElse: () => null);
        if (active != null) {
          _selectedTahunAjaranId = active['id'] as int;
        } else if (list.isNotEmpty) {
          _selectedTahunAjaranId = list.first['id'] as int;
        }
      }
    } catch (_) {}
    _fetchLiveStructures();
  }

  Future<void> _fetchLiveStructures() async {
    if (!mounted) return;
    setState(() => _isLoadingApi = true);
    final keys = ['pmq', 'pondok', 'sambangan', 'haflah', 'psb'];
    for (final k in keys) {
      try {
        final res = await _apiService.getStructure(k, tahunAjaranId: _selectedTahunAjaranId);
        if (res.isNotEmpty) {
          final mapped = res.map<Map<String, dynamic>>((item) {
            final displayName = (item['guru_nama'] ?? item['nama_custom'] ?? '-').toString();
            final isHead = (item['no_urut'] == 1);
            return {
              'id': item['id'],
              'jabatan': item['jabatan']?.toString() ?? 'Pengurus',
              'nama': displayName,
              'kategori': item['kategori']?.toString() ?? '',
              'alamat': item['alamat']?.toString() ?? '',
              'status': isHead ? 'Pimpinan' : (item['kategori']?.toString().isNotEmpty == true ? item['kategori'] : 'Pengurus'),
              'bidang': item['keterangan']?.toString() ?? '-',
              'kontak': item['guru_no_hp']?.toString() ?? '-',
              'foto_url': item['guru_foto_url']?.toString(),
              'no_urut': item['no_urut'] ?? 999,
              'isHeader': isHead,
            };
          }).toList();
          if (mounted) {
            _liveApiData[k] = mapped;
          }
        }
      } catch (_) {}
    }
    if (mounted) setState(() => _isLoadingApi = false);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _launchWhatsApp(String phone) async {
    final cleanPhone = phone.replaceAll(RegExp(r'\D'), '');
    if (cleanPhone.isEmpty) return;
    final url = Uri.parse("https://wa.me/$cleanPhone");
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
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
          "Struktur Kepesantrenan",
          style: GoogleFonts.outfit(
            color: context.titleColor,
            fontWeight: FontWeight.bold,
            fontSize: 17,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: context.titleColor, size: 20),
            onPressed: _fetchLiveStructures,
            tooltip: "Muat Ulang Data",
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: const Color(0xFF3B82F6),
          indicatorWeight: 3,
          labelColor: const Color(0xFF3B82F6),
          unselectedLabelColor: context.subTitleColor,
          labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 13),
          unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.w500, fontSize: 13),
          tabs: const [
            Tab(text: "Struktur PMQ"),
            Tab(text: "Struktur Pondok"),
            Tab(text: "Panitia Sambangan"),
            Tab(text: "Panitia Haflah"),
            Tab(text: "Panitia PSB"),
          ],
        ),
      ),
      body: Column(
        children: [
          _buildTahunAjaranFilter(context, isDark),
          Expanded(
            child: _isLoadingApi
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(
                          width: 28,
                          height: 28,
                          child: CircularProgressIndicator(strokeWidth: 2.5, color: Color(0xFF3B82F6)),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          "Memuat susunan struktur...",
                          style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 13),
                        ),
                      ],
                    ),
                  )
                : TabBarView(
                    controller: _tabController,
                    children: [
                      // 1. PMQ
                      _buildStructureList('pmq', 'Pendidikan Murottilil Qur\'an (PMQ)', 'Lembaga khusus tahfidz dan tahsin Al-Qur\'an pesantren.', isDark),
                      // 2. Pondok
                      _buildStructureList('pondok', 'Pondok Pesantren Al-Hamid', 'Dewan Penyantun, Pengurus Putra, Putri & Jam\'iyyah Santri.', isDark),
                      // 3. Sambangan
                      _buildStructureList('sambangan', 'Panitia Sambangan Santri', 'Kepanitiaan acara kunjungan rutin wali santri bulanan.', isDark),
                      // 4. Haflah
                      _buildStructureList('haflah', 'Panitia Haflah Akhirussanah', 'Kepanitiaan wisuda santri dan pengajian akbar tahunan.', isDark),
                      // 5. PSB
                      _buildStructureList('psb', 'Panitia Penerimaan Santri Baru (PSB)', 'Kepanitiaan pendaftaran, seleksi berkas & tes santri baru.', isDark),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildTahunAjaranFilter(BuildContext context, bool isDark) {
    if (_tahunAjaranList.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF151F32) : const Color(0xFFF1F5F9),
        border: Border(
          bottom: BorderSide(
            color: isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.06),
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(Icons.calendar_today_rounded, size: 14, color: context.subTitleColor),
              const SizedBox(width: 8),
              Text(
                "Tahun Ajaran:",
                style: GoogleFonts.outfit(
                  color: context.subTitleColor,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.08),
              ),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<int?>(
                value: _selectedTahunAjaranId,
                isDense: true,
                icon: Icon(Icons.arrow_drop_down_rounded, color: context.subTitleColor, size: 22),
                style: GoogleFonts.outfit(
                  color: context.titleColor,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
                dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                items: [
                  const DropdownMenuItem<int?>(
                    value: null,
                    child: Text("Semua Tahun"),
                  ),
                  ..._tahunAjaranList.map((t) {
                    final id = t['id'] as int;
                    final kode = t['kode']?.toString() ?? '-';
                    final isActive = t['is_active'] == true;
                    return DropdownMenuItem<int?>(
                      value: id,
                      child: Text(isActive ? "$kode (Aktif)" : kode),
                    );
                  }),
                ],
                onChanged: (val) {
                  setState(() => _selectedTahunAjaranId = val);
                  _fetchLiveStructures();
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStructureList(String key, String title, String subtitle, bool isDark) {
    final rawList = _liveApiData[key] ?? [];

    // Extract categories
    final categories = <String>{};
    for (final item in rawList) {
      final kat = item['kategori']?.toString() ?? '';
      if (kat.isNotEmpty) categories.add(kat);
    }

    // Filter items
    final filteredList = rawList.where((item) {
      if (_selectedPondokCategory != 'ALL' && item['kategori'] != _selectedPondokCategory) {
        return false;
      }
      if (_searchQuery.trim().isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final nama = (item['nama'] ?? '').toString().toLowerCase();
        final jabatan = (item['jabatan'] ?? '').toString().toLowerCase();
        final alamat = (item['alamat'] ?? '').toString().toLowerCase();
        final bidang = (item['bidang'] ?? '').toString().toLowerCase();
        final kategori = (item['kategori'] ?? '').toString().toLowerCase();
        return nama.contains(q) || jabatan.contains(q) || alamat.contains(q) || bidang.contains(q) || kategori.contains(q);
      }
      return true;
    }).toList();

    // Group filtered items by kategori if categories exist
    final Map<String, List<Map<String, dynamic>>> grouped = {};
    if (categories.isNotEmpty && _selectedPondokCategory == 'ALL') {
      for (final item in filteredList) {
        final kat = item['kategori']?.toString() ?? 'Lainnya';
        grouped.putIfAbsent(kat, () => []).add(item);
      }
    }

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header info banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF131C2E) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: const Color(0xFF3B82F6).withOpacity(0.25),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                )
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF3B82F6).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.account_tree_rounded, color: Color(0xFF3B82F6), size: 24),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: GoogleFonts.outfit(
                          color: context.titleColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        subtitle,
                        style: GoogleFonts.outfit(
                          color: context.subTitleColor,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Search bar
          Container(
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF131C2E) : Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.08),
              ),
            ),
            child: TextField(
              controller: _searchController,
              onChanged: (val) => setState(() => _searchQuery = val),
              style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13),
              decoration: InputDecoration(
                hintText: "Cari nama pengurus, jabatan, daerah asal...",
                hintStyle: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 12),
                prefixIcon: Icon(Icons.search_rounded, color: context.subTitleColor, size: 20),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.close_rounded, size: 16),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
          ),

          // Category Pills Filter (if categories exist)
          if (categories.isNotEmpty) ...[
            const SizedBox(height: 10),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              child: Row(
                children: [
                  _buildCategoryChip("Semua (${rawList.length})", 'ALL', isDark),
                  ...categories.map((cat) {
                    final count = rawList.where((i) => i['kategori'] == cat).length;
                    return _buildCategoryChip("$cat ($count)", cat, isDark);
                  }),
                ],
              ),
            ),
          ],

          const SizedBox(height: 18),

          // Header List Title
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "SUSUNAN STRUKTUR PENGURUS",
                style: GoogleFonts.outfit(
                  color: context.subTitleColor,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFF3B82F6).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  "${filteredList.length} Personel",
                  style: GoogleFonts.outfit(
                    color: const Color(0xFF3B82F6),
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          if (filteredList.isEmpty)
            Container(
              padding: const EdgeInsets.all(32),
              alignment: Alignment.center,
              child: Column(
                children: [
                  Icon(Icons.search_off_rounded, size: 40, color: context.subTitleColor.withOpacity(0.5)),
                  const SizedBox(height: 10),
                  Text(
                    "Tidak ada data pengurus yang cocok.",
                    style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 13),
                  ),
                ],
              ),
            )
          else if (grouped.isNotEmpty)
            ...grouped.entries.map((entry) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 10, bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: const Color(0xFF3B82F6).withOpacity(0.15),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 4,
                              height: 14,
                              decoration: BoxDecoration(
                                color: const Color(0xFF3B82F6),
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              entry.key,
                              style: GoogleFonts.outfit(
                                color: isDark ? Colors.white : const Color(0xFF1E3A8A),
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        Text(
                          "${entry.value.length} Personel",
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF3B82F6),
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  ...entry.value.map((item) => _buildPersonCard(item, isDark)),
                ],
              );
            })
          else
            ...filteredList.map((item) => _buildPersonCard(item, isDark)),
        ],
      ),
    );
  }

  Widget _buildCategoryChip(String label, String value, bool isDark) {
    final isSelected = _selectedPondokCategory == value;
    return GestureDetector(
      onTap: () => setState(() => _selectedPondokCategory = value),
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF3B82F6)
              : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF3B82F6)
                : (isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.08)),
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.outfit(
            color: isSelected
                ? Colors.white
                : (isDark ? Colors.white70 : const Color(0xFF475569)),
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _buildPersonCard(Map<String, dynamic> item, bool isDark) {
    final bool isHeader = item['isHeader'] == true;
    final String nama = item['nama']?.toString() ?? '-';
    final String jabatan = item['jabatan']?.toString() ?? '-';
    final String alamat = item['alamat']?.toString() ?? '';
    final String bidang = item['bidang']?.toString() ?? '-';
    final String kontak = item['kontak']?.toString() ?? '-';
    final String? fotoUrl = item['foto_url']?.toString();
    final bool hasValidContact = kontak != '-' && kontak.trim().isNotEmpty;
    final bool isKoordinator = bidang.toLowerCase().contains('koordinator');

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131C2E) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isKoordinator
              ? const Color(0xFFF59E0B).withOpacity(0.4)
              : (isHeader
                  ? const Color(0xFF3B82F6).withOpacity(0.4)
                  : (isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.06))),
          width: (isHeader || isKoordinator) ? 1.4 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.2 : 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          )
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar
          if (fotoUrl != null && fotoUrl.isNotEmpty)
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                fotoUrl,
                width: 44,
                height: 44,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => _buildFallbackAvatar(nama, isHeader, isKoordinator),
              ),
            )
          else
            _buildFallbackAvatar(nama, isHeader, isKoordinator),

          const SizedBox(width: 12),

          // Main Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Role Badge & Status
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                      decoration: BoxDecoration(
                        color: isKoordinator
                            ? const Color(0xFFF59E0B).withOpacity(0.15)
                            : (isHeader
                                ? const Color(0xFF3B82F6).withOpacity(0.15)
                                : const Color(0xFF6366F1).withOpacity(0.1)),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        jabatan,
                        style: GoogleFonts.outfit(
                          color: isKoordinator
                              ? const Color(0xFFD97706)
                              : (isHeader ? const Color(0xFF2563EB) : const Color(0xFF4F46E5)),
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 5),

                // Person Name
                Text(
                  nama,
                  style: GoogleFonts.outfit(
                    color: context.titleColor,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),

                // Location Badge
                if (alamat.isNotEmpty && alamat != '-') ...[
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      const Icon(Icons.location_on_rounded, size: 12, color: Color(0xFFEC4899)),
                      const SizedBox(width: 3),
                      Text(
                        alamat,
                        style: GoogleFonts.outfit(
                          color: isDark ? const Color(0xFFF472B6) : const Color(0xFFDB2777),
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],

                // Role / Bidang / Keterangan
                if (bidang.isNotEmpty && bidang != '-') ...[
                  const SizedBox(height: 4),
                  Text(
                    bidang,
                    style: GoogleFonts.outfit(
                      color: context.subTitleColor,
                      fontSize: 11,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],

                // Contact if available
                if (hasValidContact) ...[
                  const SizedBox(height: 6),
                  GestureDetector(
                    onTap: () => _launchWhatsApp(kontak),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.phone_in_talk_rounded, size: 11, color: Color(0xFF10B981)),
                          const SizedBox(width: 4),
                          Text(
                            "Hubungi: $kontak",
                            style: GoogleFonts.outfit(
                              color: const Color(0xFF059669),
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFallbackAvatar(String name, bool isHeader, bool isKoordinator) {
    final clean = name.replaceAll(RegExp(r'^(Bpk\.|Ibu\.|Sdr\.|Sdri\.|Kyai|Umi|Ust\.|Usth\.)\s+', caseSensitive: false), '').trim();
    final initial = clean.isNotEmpty ? clean.substring(0, clean.length >= 2 ? 2 : 1).toUpperCase() : '?';

    Color bg = const Color(0xFF3B82F6).withOpacity(0.15);
    Color fg = const Color(0xFF2563EB);

    if (isKoordinator) {
      bg = const Color(0xFFF59E0B).withOpacity(0.18);
      fg = const Color(0xFFD97706);
    } else if (isHeader) {
      bg = const Color(0xFF10B981).withOpacity(0.18);
      fg = const Color(0xFF059669);
    }

    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
      ),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: GoogleFonts.outfit(
          color: fg,
          fontSize: 14,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}
