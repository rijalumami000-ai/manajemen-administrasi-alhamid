import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';
import '../services/network_service.dart';
import 'alumni_detail_screen.dart';

class AlumniListScreen extends StatefulWidget {
  final String tipe; // 'alumni' or 'pindah'
  final String title;

  const AlumniListScreen({
    super.key,
    required this.tipe,
    required this.title,
  });

  @override
  State<AlumniListScreen> createState() => _AlumniListScreenState();
}

class _AlumniListScreenState extends State<AlumniListScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _searchController = TextEditingController();

  late String _currentTipe;
  bool _isLoading = true;
  String? _errorMessage;
  List<dynamic> _alumniList = [];
  List<String> _tahunLulusList = [];
  String? _selectedTahunLulus;

  List<dynamic> _tahunAjaranList = [];
  Map<String, dynamic>? _selectedTahunAjaran;

  @override
  void initState() {
    super.initState();
    _currentTipe = widget.tipe;
    _loadFiltersAndData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String? get _apiTipe => _currentTipe == 'all' ? null : _currentTipe;

  Future<void> _loadFiltersAndData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    if (!NetworkService().isOnline) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'NO_INTERNET';
      });
      return;
    }

    try {
      // 1. Fetch academic years
      final taResult = await _apiService.getTahunAjaranList();
      final taList = taResult['tahunAjaran'] as List<dynamic>? ?? [];

      // 2. Fetch list of alumni/pindah with current filters
      final data = await _apiService.getAlumni(
        tipe: _apiTipe,
        search: _searchController.text.isNotEmpty ? _searchController.text : null,
        tahunLulus: _selectedTahunLulus,
        tahunAjaranId: _selectedTahunAjaran?['id'],
      );

      // 3. Extract unique graduation years from total alumni dataset for filter
      final rawAll = await _apiService.getAlumni(tipe: _apiTipe);
      final years = rawAll
          .map((a) => a['tahun_lulus']?.toString())
          .where((y) => y != null && y.isNotEmpty)
          .cast<String>()
          .toSet()
          .toList()
        ..sort((a, b) => b.compareTo(a)); // Newest first

      if (!mounted) return;
      setState(() {
        _tahunAjaranList = taList;
        _alumniList = data;
        _tahunLulusList = years;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final data = await _apiService.getAlumni(
        tipe: _apiTipe,
        search: _searchController.text.isNotEmpty ? _searchController.text : null,
        tahunLulus: _selectedTahunLulus,
        tahunAjaranId: _selectedTahunAjaran?['id'],
      );
      if (!mounted) return;
      setState(() {
        _alumniList = data;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  void _clearFilters() {
    _searchController.clear();
    setState(() {
      _selectedTahunLulus = null;
      _selectedTahunAjaran = null;
    });
    _fetchData();
  }

  Color _getCategoryColor(String? tipe) {
    switch (tipe) {
      case 'lulus_mts':
        return const Color(0xFF0284C7);
      case 'lulus_aliyah':
        return const Color(0xFF8B5CF6);
      case 'pindah':
        return const Color(0xFFF59E0B);
      case 'alumni':
      default:
        return const Color(0xFF10B981);
    }
  }

  String _getCategoryLabel(String? tipe) {
    switch (tipe) {
      case 'lulus_mts':
        return 'Lulus MTs';
      case 'lulus_aliyah':
        return 'Lulus Aliyah';
      case 'pindah':
        return 'Pindah / Mutasi';
      case 'alumni':
      default:
        return 'Alumni Diniyah';
    }
  }

  Widget _buildCategoryChips(bool isDark) {
    final categories = [
      {'key': 'all', 'label': 'Semua Data', 'color': const Color(0xFF64748B)},
      {'key': 'alumni', 'label': 'Alumni Diniyah', 'color': const Color(0xFF10B981)},
      {'key': 'lulus_mts', 'label': 'Lulus MTs', 'color': const Color(0xFF0284C7)},
      {'key': 'lulus_aliyah', 'label': 'Lulus Aliyah', 'color': const Color(0xFF8B5CF6)},
      {'key': 'pindah', 'label': 'Pindah / Mutasi', 'color': const Color(0xFFF59E0B)},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Row(
        children: categories.map((cat) {
          final isSelected = _currentTipe == cat['key'];
          final Color col = cat['color'] as Color;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () {
                setState(() => _currentTipe = cat['key'] as String);
                _fetchData();
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                decoration: BoxDecoration(
                  color: isSelected
                      ? col
                      : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isSelected ? col : (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                  ),
                ),
                child: Text(
                  cat['label'] as String,
                  style: GoogleFonts.outfit(
                    color: isSelected ? Colors.white : (isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569)),
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
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
          widget.title,
          style: GoogleFonts.outfit(
            color: headingColor,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: headingColor),
            onPressed: _fetchData,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter section
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
            child: Column(
              children: [
                // Search bar
                TextField(
                  controller: _searchController,
                  onChanged: (_) => _fetchData(),
                  style: GoogleFonts.inter(color: context.titleColor, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Cari nama atau NIS...',
                    hintStyle: GoogleFonts.inter(color: context.subTitleColor, fontSize: 13),
                    prefixIcon: Icon(Icons.search_rounded, color: context.subTitleColor),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: Icon(Icons.clear_rounded, color: context.subTitleColor),
                            onPressed: () {
                              _searchController.clear();
                              _fetchData();
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: context.inputBg,
                    contentPadding: const EdgeInsets.symmetric(vertical: 14),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                // Dropdown filters
                Row(
                  children: [
                    // Graduation Year Dropdown
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: context.inputBg,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: context.borderColor),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedTahunLulus,
                            hint: Text(
                              widget.tipe == 'pindah' ? 'Tahun Keluar' : 'Tahun Lulus',
                              style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 12),
                            ),
                            dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                            isExpanded: true,
                            style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13, fontWeight: FontWeight.w500),
                            items: _tahunLulusList.map((y) {
                              return DropdownMenuItem<String>(
                                value: y,
                                child: Text('Tahun $y'),
                              );
                            }).toList(),
                            onChanged: (val) {
                              setState(() => _selectedTahunLulus = val);
                              _fetchData();
                            },
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    // Academic Year Dropdown
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: context.inputBg,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: context.borderColor),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<Map<String, dynamic>>(
                            value: _selectedTahunAjaran,
                            hint: Text(
                              'Tahun Ajaran',
                              style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 12),
                            ),
                            dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                            isExpanded: true,
                            style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13, fontWeight: FontWeight.w500),
                            items: _tahunAjaranList.map<DropdownMenuItem<Map<String, dynamic>>>((ta) {
                              return DropdownMenuItem<Map<String, dynamic>>(
                                value: ta as Map<String, dynamic>,
                                child: Text(ta['kode'] ?? '-'),
                              );
                            }).toList(),
                            onChanged: (val) {
                              setState(() => _selectedTahunAjaran = val);
                              _fetchData();
                            },
                          ),
                        ),
                      ),
                    ),
                    if (_selectedTahunLulus != null || _selectedTahunAjaran != null || _searchController.text.isNotEmpty) ...[
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(Icons.filter_alt_off_rounded, color: Colors.redAccent),
                        onPressed: _clearFilters,
                        tooltip: 'Bersihkan Filter',
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),

          // Category Chips Bar
          _buildCategoryChips(isDark),

          // List content
          Expanded(
            child: _isLoading
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
                            ],
                          ),
                        ),
                      )
                    : _alumniList.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.people_outline_rounded,
                                  size: 64,
                                  color: context.subTitleColor.withOpacity(0.4),
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'Tidak ada data ditemukan',
                                  style: GoogleFonts.outfit(
                                    color: context.subTitleColor,
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : ListView.separated(
                            physics: const BouncingScrollPhysics(),
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                            itemCount: _alumniList.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final item = _alumniList[index] as Map<String, dynamic>;
                              final nama = item['nama'] ?? '-';
                              final nis = item['nis'] ?? '-';
                              final kelas = item['kelas_terakhir'] ?? '-';
                              final tahun = item['tahun_lulus']?.toString() ?? '-';
                              final itemTipe = item['tipe']?.toString();
                              final itemColor = _getCategoryColor(itemTipe);
                              final itemLabel = _getCategoryLabel(itemTipe);

                              final rawFoto = item['foto_url']?.toString();
                              final hasFoto = rawFoto != null && rawFoto.trim().isNotEmpty;
                              final fullFoto = hasFoto ? _apiService.getFullImageUrl(rawFoto) : null;

                              return Container(
                                decoration: BoxDecoration(
                                  color: context.cardBg,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: context.borderColor),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(isDark ? 0.2 : 0.02),
                                      blurRadius: 8,
                                      offset: const Offset(0, 3),
                                    ),
                                  ],
                                ),
                                child: ListTile(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  leading: CircleAvatar(
                                    radius: 22,
                                    backgroundColor: itemColor.withOpacity(0.12),
                                    backgroundImage: fullFoto != null ? NetworkImage(fullFoto) : null,
                                    child: fullFoto == null
                                        ? Text(
                                            (nama.isNotEmpty ? nama[0] : '?').toUpperCase(),
                                            style: GoogleFonts.outfit(
                                              color: itemColor,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          )
                                        : null,
                                  ),
                                  title: Text(
                                    nama,
                                    style: GoogleFonts.outfit(
                                      color: context.titleColor,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                  subtitle: Padding(
                                    padding: const EdgeInsets.only(top: 4.0),
                                    child: Text(
                                      'NIS: $nis | Kelas: $kelas',
                                      style: GoogleFonts.outfit(
                                        color: context.subTitleColor,
                                        fontSize: 11,
                                      ),
                                    ),
                                  ),
                                  trailing: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: itemColor.withOpacity(0.12),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          itemLabel,
                                          style: GoogleFonts.outfit(
                                            color: itemColor,
                                            fontSize: 9.5,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        itemTipe == 'pindah' ? 'Keluar: $tahun' : 'Lulus: $tahun',
                                        style: GoogleFonts.outfit(
                                          color: context.subTitleColor,
                                          fontSize: 9.5,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => AlumniDetailScreen(
                                          alumniId: item['id'] as int,
                                          title: itemTipe == 'pindah'
                                              ? 'Profil Siswa Pindah'
                                              : (itemTipe == 'lulus_mts'
                                                  ? 'Profil Lulusan MTs'
                                                  : (itemTipe == 'lulus_aliyah'
                                                      ? 'Profil Lulusan Aliyah'
                                                      : 'Profil Alumni Diniyah')),
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}
