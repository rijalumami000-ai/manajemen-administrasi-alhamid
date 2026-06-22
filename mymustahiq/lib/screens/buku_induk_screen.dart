import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';
import 'santri_detail_screen.dart';

class BukuIndukScreen extends StatefulWidget {
  const BukuIndukScreen({super.key});

  @override
  State<BukuIndukScreen> createState() => _BukuIndukScreenState();
}

class _BukuIndukScreenState extends State<BukuIndukScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _searchController = TextEditingController();
  
  bool _isLoading = true;
  String? _errorMessage;
  List<dynamic> _santriList = [];
  
  String _selectedGender = ''; // '' = Semua, 'Laki-laki' = Putra, 'Perempuan' = Putri

  @override
  void initState() {
    super.initState();
    _fetchBukuInduk();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchBukuInduk() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final genderParam = _selectedGender.isNotEmpty ? _selectedGender : null;
      final searchParam = _searchController.text.isNotEmpty ? _searchController.text : null;
      final data = await _apiService.getBukuInduk(gender: genderParam, search: searchParam);
      
      setState(() {
        _santriList = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  // Groups the flat list into map of { tahun_masuk: [santri] }
  Map<String, List<dynamic>> _groupSantriByTahun() {
    final Map<String, List<dynamic>> grouped = {};
    for (var santri in _santriList) {
      final String tahun = (santri['tahun_masuk']?.toString() ?? 'Tidak Diketahui');
      if (!grouped.containsKey(tahun)) {
        grouped[tahun] = [];
      }
      grouped[tahun]!.add(santri);
    }
    return grouped;
  }

  @override
  Widget build(BuildContext context) {
    final groupedData = _groupSantriByTahun();
    final sortedYears = groupedData.keys.toList()
      ..sort((a, b) {
        if (a == 'Tidak Diketahui') return 1;
        if (b == 'Tidak Diketahui') return -1;
        return b.compareTo(a); // Descending order of years
      });

    return Scaffold(
      backgroundColor: context.scaffoldBg,
      appBar: AppBar(
        backgroundColor: context.isDarkMode ? const Color(0xFF0D1527) : Colors.white.withOpacity(0.45),
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.titleColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "Buku Induk Santri",
          style: GoogleFonts.outfit(
            color: context.titleColor,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
      ),
      body: Column(
        children: [
          // Filter & Search Bar Area
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Search Field
                TextField(
                  controller: _searchController,
                  onChanged: (val) => _fetchBukuInduk(),
                  style: GoogleFonts.inter(color: context.titleColor, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Cari nama atau NIS santri...',
                    hintStyle: GoogleFonts.inter(color: context.subTitleColor, fontSize: 13),
                    prefixIcon: Icon(Icons.search_rounded, color: context.subTitleColor),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: Icon(Icons.clear_rounded, color: context.subTitleColor),
                            onPressed: () {
                              _searchController.clear();
                              _fetchBukuInduk();
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
                const SizedBox(height: 14),
                // Gender Chip Filters
                Row(
                  children: [
                    _buildFilterChip('', 'Semua'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Laki-laki', 'Putra'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Perempuan', 'Putri'),
                  ],
                ),
              ],
            ),
          ),

          // Total counts banner
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "DAFTAR BUKU INDUK",
                  style: GoogleFonts.outfit(
                    color: context.subTitleColor,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                  ),
                ),
                Text(
                  "${_santriList.length} Santri",
                  style: GoogleFonts.outfit(
                    color: const Color(0xFFEC4899), // Pink to match Buku Induk accent
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Main list
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: Color(0xFFEC4899),
                    ),
                  )
                : _errorMessage != null
                    ? _buildErrorWidget()
                    : _santriList.isEmpty
                        ? _buildEmptyWidget()
                        : ListView.builder(
                            physics: const BouncingScrollPhysics(),
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                            itemCount: sortedYears.length,
                            itemBuilder: (context, index) {
                              final year = sortedYears[index];
                              final list = groupedData[year]!;
                              return _buildYearSection(year, list);
                            },
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String value, String label) {
    final isSelected = _selectedGender == value;
    final accentColor = const Color(0xFFEC4899);
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedGender = value;
        });
        _fetchBukuInduk();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? accentColor.withOpacity(context.isDarkMode ? 0.2 : 0.12)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? accentColor : context.borderColor,
            width: 1.5,
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.outfit(
            color: isSelected ? accentColor : context.subTitleColor,
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded, color: Colors.amber, size: 48),
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(color: context.titleColor, fontSize: 14),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _fetchBukuInduk,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFEC4899),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: Text('Coba Lagi', style: GoogleFonts.outfit(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyWidget() {
    return Center(
      child: Text(
        "Tidak ada data santri ditemukan.",
        style: GoogleFonts.outfit(
          color: context.bodyColor,
          fontSize: 14,
        ),
      ),
    );
  }

  Widget _buildYearSection(String year, List<dynamic> students) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Year Header
        Padding(
          padding: const EdgeInsets.only(top: 16, bottom: 8),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFEC4899).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  "Tahun Masuk: $year",
                  style: GoogleFonts.outfit(
                    color: const Color(0xFFEC4899),
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Divider(
                  color: context.borderColor,
                  thickness: 1,
                ),
              ),
            ],
          ),
        ),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: students.length,
          itemBuilder: (context, index) {
            final student = students[index];
            return _buildStudentCard(student);
          },
        ),
      ],
    );
  }

  Widget _buildStudentCard(dynamic student) {
    final name = student['nama'] ?? '';
    final nis = student['nis'] ?? '';
    final kelas = student['kelas_diniyah'] ?? student['kelas_sekolah'] ?? '-';
    final kamar = student['nama_kamar'] ?? '-';
    final photo = student['foto_url'];
    final gender = student['jenis_kelamin'] ?? 'Laki-laki';
    
    // Biometric statuses
    final isFace = student['is_face_registered'] == true;
    final isQr = student['qr_code'] != null && student['qr_code'].toString().isNotEmpty;
    final isNfc = student['nfc_uid'] != null && student['nfc_uid'].toString().isNotEmpty;
    final isFinger = student['fingerprint_id'] != null && student['fingerprint_id'].toString().isNotEmpty;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: context.cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: context.borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(context.isDarkMode ? 0.2 : 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => SantriDetailScreen(
                santriId: student['id'],
              ),
            ),
          );
        },
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              // Avatar photo or default icon
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.06),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: ClipOval(
                  child: photo != null && photo.toString().isNotEmpty
                      ? Image.network(
                          _apiService.getFullImageUrl(photo),
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) =>
                              _buildDefaultAvatar(gender),
                        )
                      : _buildDefaultAvatar(gender),
                ),
              ),
              const SizedBox(width: 16),

              // Student details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: GoogleFonts.outfit(
                        color: context.titleColor,
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      "NIS: $nis | Kelas: $kelas",
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 11,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "Kamar: $kamar",
                      style: GoogleFonts.outfit(
                        color: const Color(0xFFEC4899).withOpacity(0.8),
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        _buildBiometricIcon(Icons.face_rounded, isFace, 'Wajah'),
                        const SizedBox(width: 6),
                        _buildBiometricIcon(Icons.qr_code_rounded, isQr, 'QR'),
                        const SizedBox(width: 6),
                        _buildBiometricIcon(Icons.contactless_rounded, isNfc, 'NFC'),
                        const SizedBox(width: 6),
                        _buildBiometricIcon(Icons.fingerprint_rounded, isFinger, 'Jari'),
                      ],
                    ),
                  ],
                ),
              ),

              Icon(
                Icons.arrow_forward_ios_rounded,
                color: context.subTitleColor.withOpacity(0.5),
                size: 16,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBiometricIcon(IconData icon, bool isActive, String label) {
    final activeColor = const Color(0xFF10B981);
    final inactiveColor = context.subTitleColor.withOpacity(0.3);
    return Tooltip(
      message: "$label: ${isActive ? 'Aktif' : 'Belum Terdaftar'}",
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: (isActive ? activeColor : inactiveColor).withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(
          icon,
          color: isActive ? activeColor : inactiveColor,
          size: 14,
        ),
      ),
    );
  }

  Widget _buildDefaultAvatar(String gender) {
    final isPutra = gender.toLowerCase() == 'putra' || gender.toLowerCase().startsWith('l');
    return Icon(
      isPutra ? Icons.face_rounded : Icons.face_3_rounded,
      size: 28,
      color: const Color(0xFFEC4899),
    );
  }
}
