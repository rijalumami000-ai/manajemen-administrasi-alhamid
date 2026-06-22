import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';
import '../models/models.dart';

class TeacherListScreen extends StatefulWidget {
  final bool isMustahiq; // true for Mustahiq, false for Munawib

  const TeacherListScreen({super.key, required this.isMustahiq});

  @override
  State<TeacherListScreen> createState() => _TeacherListScreenState();
}

class _TeacherListScreenState extends State<TeacherListScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _searchController = TextEditingController();

  bool _isLoading = true;
  String? _errorMessage;
  List<Guru> _allTeachers = [];
  List<Guru> _filteredTeachers = [];
  String _activeYear = '';
  String _activeSemester = '';

  @override
  void initState() {
    super.initState();
    _fetchTeachersData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _sortMustahiq(List<Guru> teachers) {
    double getClassWeight(String? className) {
      if (className == null) return 999.0;
      final n = className.toLowerCase();
      if (n.contains('sifir')) return 0.0;
      if (n.startsWith('1') && !n.startsWith('10') && !n.startsWith('11') && !n.startsWith('12')) return 1.0;
      if (n.startsWith('sp') || n.contains(' sp')) return 1.5;
      if (n.startsWith('2')) return 2.0;
      if (n.startsWith('3')) return 3.0;
      if (n.startsWith('4')) return 4.0;
      if (n.startsWith('5')) return 5.0;
      if (n.startsWith('6')) return 6.0;
      if (n.startsWith('7')) return 7.0;
      if (n.startsWith('8')) return 8.0;
      if (n.startsWith('9')) return 9.0;
      if (n.startsWith('10')) return 10.0;
      if (n.startsWith('11')) return 11.0;
      if (n.startsWith('12')) return 12.0;
      return 99.0;
    }

    teachers.sort((a, b) {
      final weightA = getClassWeight(a.kelasBinaan);
      final weightB = getClassWeight(b.kelasBinaan);
      if (weightA != weightB) {
        return weightA.compareTo(weightB);
      }
      return a.nama.compareTo(b.nama);
    });
  }

  Future<void> _fetchTeachersData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = widget.isMustahiq
          ? await _apiService.getMustahiqList()
          : await _apiService.getMunawibList();

      final dataKey = widget.isMustahiq ? 'mustahiq' : 'munawib';
      final list = res[dataKey] as List<dynamic>? ?? [];
      final parsedList = list.map((item) => Guru.fromJson(item)).toList();
      final activeYear = res['tahunAjaran'] ?? '';
      final semester = res['semester'] ?? '';

      if (widget.isMustahiq) {
        _sortMustahiq(parsedList);
      }

      setState(() {
        _allTeachers = parsedList;
        _filteredTeachers = parsedList;
        _activeYear = activeYear;
        _activeSemester = semester;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  void _onSearchChanged(String query) {
    setState(() {
      if (query.isEmpty) {
        _filteredTeachers = _allTeachers;
      } else {
        _filteredTeachers = _allTeachers
            .where((teacher) =>
                teacher.nama.toLowerCase().contains(query.toLowerCase()) ||
                (teacher.nip != null &&
                    teacher.nip!.toLowerCase().contains(query.toLowerCase())))
            .toList();
      }
    });
  }

  void _copyToClipboard(String number, String name) {
    if (number.isEmpty || number == '-') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Nomor HP tidak tersedia.',
            style: GoogleFonts.outfit(color: Colors.white, fontSize: 13),
          ),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      return;
    }

    Clipboard.setData(ClipboardData(text: number));

    // Show a premium snackbar
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Nomor HP $name berhasil disalin!',
                style: GoogleFonts.outfit(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.isMustahiq ? "Daftar Mustahiq" : "Daftar Munawib";
    final description = widget.isMustahiq
        ? "Daftar asatidz/ustadzah wali kelas Diniyah aktif"
        : "Daftar asatidz/ustadzah guru mata pelajaran";

    return Scaffold(
      backgroundColor: context.scaffoldBg,
      appBar: AppBar(
        backgroundColor: context.isDarkMode ? const Color(0xFF0D1527) : Colors.white.withOpacity(0.45),
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.titleColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              title,
              style: GoogleFonts.outfit(color: context.titleColor, fontWeight: FontWeight.bold, fontSize: 16),
            ),
            if (_activeYear.isNotEmpty)
              Text(
                "T.A $_activeYear ($_activeSemester)",
                style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 11, fontWeight: FontWeight.w500),
              ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                color: Color(0xFF10B981),
              ),
            )
          : _errorMessage != null
              ? Center(
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
                          style: GoogleFonts.outfit(color: context.titleColor, fontSize: 15),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: _fetchTeachersData,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF064E3B),
                          ),
                          child: Text('Coba Lagi', style: GoogleFonts.outfit(color: Colors.white)),
                        ),
                      ],
                    ),
                  ),
                )
              : Column(
                  children: [
                    // Search Bar & Subtitle
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            description,
                            style: GoogleFonts.outfit(
                              color: context.subTitleColor,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextField(
                            controller: _searchController,
                            onChanged: _onSearchChanged,
                            style: GoogleFonts.inter(color: context.titleColor, fontSize: 14),
                            decoration: InputDecoration(
                              hintText: 'Cari nama atau NIP ustadz...',
                              hintStyle: GoogleFonts.inter(color: context.subTitleColor, fontSize: 13),
                              prefixIcon: Icon(Icons.search_rounded, color: context.subTitleColor),
                              suffixIcon: _searchController.text.isNotEmpty
                                  ? IconButton(
                                      icon: Icon(Icons.clear_rounded, color: context.subTitleColor),
                                      onPressed: () {
                                        _searchController.clear();
                                        _onSearchChanged('');
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
                        ],
                      ),
                    ),

                    // Teacher Count
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 4.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            "JUMLAH PENGAJAR",
                            style: GoogleFonts.outfit(
                              color: context.subTitleColor,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.2,
                            ),
                          ),
                          Text(
                            "${_filteredTeachers.length} Ustadz",
                            style: GoogleFonts.outfit(
                              color: const Color(0xFF10B981),
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),

                    // List of Teachers
                    Expanded(
                      child: _filteredTeachers.isEmpty
                          ? Center(
                              child: Text(
                                _searchController.text.isEmpty
                                    ? "Tidak ada data ustadz."
                                    : "Ustadz tidak ditemukan.",
                                style: GoogleFonts.outfit(
                                  color: context.bodyColor,
                                  fontSize: 14,
                                ),
                              ),
                            )
                          : ListView.builder(
                              physics: const BouncingScrollPhysics(),
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                              itemCount: _filteredTeachers.length,
                              itemBuilder: (context, index) {
                                final teacher = _filteredTeachers[index];
                                return _buildTeacherCard(teacher);
                              },
                            ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildTeacherCard(Guru teacher) {
    final hasImage = teacher.fotoUrl != null && teacher.fotoUrl!.isNotEmpty;
    
    // Split name to get initials
    final nameParts = teacher.nama.replaceFirst(RegExp(r'^(Ust\.|Ustz\.)\s*', caseSensitive: false), '').split(' ');
    final initials = nameParts.length > 1
        ? '${nameParts[0][0]}${nameParts[1][0]}'.toUpperCase()
        : nameParts[0].isNotEmpty
            ? nameParts[0][0].toUpperCase()
            : 'U';

    // Premium gradient background for initials avatar
    final List<Color> gradientColors = widget.isMustahiq
        ? [const Color(0xFF8B5CF6), const Color(0xFF6D28D9)] // Purple
        : [const Color(0xFF0D9488), const Color(0xFF0F766E)]; // Teal

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
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            // Photo or Initials Avatar
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
                child: hasImage
                    ? Image.network(
                        _apiService.getFullImageUrl(teacher.fotoUrl),
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) =>
                            _buildInitialsAvatar(initials, gradientColors),
                      )
                    : _buildInitialsAvatar(initials, gradientColors),
              ),
            ),
            const SizedBox(width: 16),

            // Text Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title / Name
                  Text(
                    teacher.nama,
                    style: GoogleFonts.outfit(
                      color: context.titleColor,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 2),

                  // NIP
                  if (teacher.nip != null && teacher.nip!.isNotEmpty) ...[
                    Text(
                      "NIP: ${teacher.nip}",
                      style: GoogleFonts.outfit(
                        color: context.subTitleColor,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 4),
                  ],

                  // Class Binaan Badge for Mustahiq
                  if (widget.isMustahiq) ...[
                    const SizedBox(height: 2),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF8B5CF6).withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        teacher.kelasBinaan != null
                            ? "Mustahiq Kelas ${teacher.kelasBinaan}"
                            : "Mustahiq Pendamping",
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF8B5CF6),
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 10),

            // Call/Copy Action Button
            IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: (widget.isMustahiq ? const Color(0xFF8B5CF6) : const Color(0xFF0D9488)).withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.copy_rounded,
                  color: widget.isMustahiq ? const Color(0xFF8B5CF6) : const Color(0xFF0D9488),
                  size: 18,
                ),
              ),
              tooltip: 'Salin No HP',
              onPressed: () => _copyToClipboard(teacher.noHp, teacher.nama),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInitialsAvatar(String initials, List<Color> colors) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: colors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      alignment: Alignment.center,
      child: Text(
        initials,
        style: GoogleFonts.outfit(
          color: Colors.white,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
