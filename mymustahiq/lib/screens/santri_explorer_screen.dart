import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../models/models.dart';
import 'santri_detail_screen.dart';

class SantriExplorerScreen extends StatefulWidget {
  final int? kelasId;
  const SantriExplorerScreen({super.key, this.kelasId});

  @override
  State<SantriExplorerScreen> createState() => _SantriExplorerScreenState();
}

class _SantriExplorerScreenState extends State<SantriExplorerScreen> {
  final ApiService _apiService = ApiService();
  final _searchController = TextEditingController();
  
  bool _isLoading = true;
  String? _errorMessage;
  
  List<Student> _allStudents = [];
  List<Student> _filteredStudents = [];
  List<Map<String, dynamic>> _availableClasses = [];
  int? _selectedKelasId;
  String _className = '';

  @override
  void initState() {
    super.initState();
    _selectedKelasId = widget.kelasId;
    _fetchStudentsData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchStudentsData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await _apiService.getStudents(_selectedKelasId);
      
      if (res['requires_class_selection'] == true) {
        setState(() {
          _availableClasses = List<Map<String, dynamic>>.from(res['classes']);
          _isLoading = false;
        });
      } else {
        final list = res['santri'] as List<dynamic>? ?? [];
        final students = list.map((item) => Student.fromJson(item)).toList();
        
        setState(() {
          _allStudents = students;
          _filteredStudents = students;
          _className = res['kelas']?['nama'] ?? '';
          _selectedKelasId = res['kelas']?['id'];
          _isLoading = false;
        });
        
        // If we don't have available classes yet, fetch them for the picker
        if (_availableClasses.isEmpty) {
          _fetchClassesListOnly();
        }
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchClassesListOnly() async {
    try {
      // Fetch without class_id to trigger selection and load available classes
      final res = await _apiService.getStudents(null);
      if (res['classes'] != null && mounted) {
        setState(() {
          _availableClasses = List<Map<String, dynamic>>.from(res['classes']);
        });
      }
    } catch (_) {}
  }

  void _onSearchChanged(String query) {
    setState(() {
      if (query.isEmpty) {
        _filteredStudents = _allStudents;
      } else {
        _filteredStudents = _allStudents
            .where((student) =>
                student.nama.toLowerCase().contains(query.toLowerCase()) ||
                student.nis.toLowerCase().contains(query.toLowerCase()))
            .toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final hasClassLoaded = _selectedKelasId != null && _className.isNotEmpty;

    return Scaffold(
      backgroundColor: const Color(0xFF070B13),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D1527),
        elevation: 0,
        title: Text(
          hasClassLoaded ? "Santri Kelas $_className" : "Pilih Kelas Diniyah",
          style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (_availableClasses.isNotEmpty)
            PopupMenuButton<int>(
              icon: const Icon(Icons.filter_list_rounded, color: Color(0xFF10B981)),
              color: const Color(0xFF131B2E),
              tooltip: 'Pilih Kelas',
              onSelected: (int kelasId) {
                setState(() {
                  _selectedKelasId = kelasId;
                  _searchController.clear();
                });
                _fetchStudentsData();
              },
              itemBuilder: (BuildContext context) {
                return _availableClasses.map((kelas) {
                  return PopupMenuItem<int>(
                    value: kelas['id'],
                    child: Text(
                      "Kelas ${kelas['nama']}",
                      style: GoogleFonts.outfit(
                        color: _selectedKelasId == kelas['id'] ? const Color(0xFF10B981) : Colors.white,
                        fontWeight: _selectedKelasId == kelas['id'] ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  );
                }).toList();
              },
            ),
        ],
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
                          style: GoogleFonts.outfit(color: Colors.white, fontSize: 15),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton(
                          onPressed: _fetchStudentsData,
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
                    // Class Selector (if no class loaded initially)
                    if (!hasClassLoaded && _availableClasses.isNotEmpty)
                      Expanded(
                        child: ListView.separated(
                          padding: const EdgeInsets.all(24),
                          itemCount: _availableClasses.length,
                          separatorBuilder: (context, index) => const SizedBox(height: 16),
                          itemBuilder: (context, index) {
                            final kelas = _availableClasses[index];
                            return ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                              tileColor: const Color(0xFF131C2E),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                                side: BorderSide(color: Colors.white.withOpacity(0.04)),
                              ),
                              title: Text(
                                "Kelas ${kelas['nama']}",
                                style: GoogleFonts.outfit(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              trailing: const Icon(Icons.arrow_forward_ios_rounded, color: Color(0xFF10B981), size: 16),
                              onTap: () {
                                setState(() {
                                  _selectedKelasId = kelas['id'];
                                });
                                _fetchStudentsData();
                              },
                            );
                          },
                        ),
                      )
                    else ...[
                      // Search Bar
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: TextField(
                          controller: _searchController,
                          onChanged: _onSearchChanged,
                          style: GoogleFonts.inter(color: Colors.white, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'Cari nama atau NIS santri...',
                            hintStyle: GoogleFonts.inter(color: const Color(0xFF475569), fontSize: 13),
                            prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF64748B)),
                            suffixIcon: _searchController.text.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.clear_rounded, color: Color(0xFF64748B)),
                                    onPressed: () {
                                      _searchController.clear();
                                      _onSearchChanged('');
                                    },
                                  )
                                : null,
                            filled: true,
                            fillColor: const Color(0xFF131B2E),
                            contentPadding: const EdgeInsets.symmetric(vertical: 14),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide.none,
                            ),
                          ),
                        ),
                      ),
                      
                      // Student Count Banner
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 4.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              "DAFTAR SANTRI BINAAN",
                              style: GoogleFonts.outfit(
                                color: const Color(0xFF475569),
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.2,
                              ),
                            ),
                            Text(
                              "${_filteredStudents.length} Santri",
                              style: GoogleFonts.outfit(
                                color: const Color(0xFF10B981),
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Students List
                      Expanded(
                        child: _filteredStudents.isEmpty
                            ? Center(
                                child: Text(
                                  _searchController.text.isEmpty
                                      ? "Tidak ada santri aktif di kelas ini."
                                      : "Santri tidak ditemukan.",
                                  style: GoogleFonts.outfit(
                                    color: const Color(0xFF64748B),
                                    fontSize: 14,
                                  ),
                                ),
                              )
                            : ListView.builder(
                                physics: const BouncingScrollPhysics(),
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                itemCount: _filteredStudents.length,
                                itemBuilder: (context, index) {
                                  final student = _filteredStudents[index];
                                  return Card(
                                    color: const Color(0xFF131C2E),
                                    margin: const EdgeInsets.only(bottom: 12),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      side: BorderSide(color: Colors.white.withOpacity(0.04)),
                                    ),
                                    elevation: 0,
                                    child: ListTile(
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                      leading: Container(
                                        width: 48,
                                        height: 48,
                                        decoration: BoxDecoration(
                                          color: Colors.white.withOpacity(0.05),
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: const Color(0xFF10B981).withOpacity(0.3),
                                          ),
                                        ),
                                        child: ClipOval(
                                          child: student.fotoUrl != null
                                              ? Image.network(
                                                  "${ApiService.baseUrl}${student.fotoUrl}",
                                                  fit: BoxFit.cover,
                                                  errorBuilder: (context, error, stackTrace) =>
                                                      _buildDefaultAvatar(student.jenisKelamin),
                                                )
                                              : _buildDefaultAvatar(student.jenisKelamin),
                                        ),
                                      ),
                                      title: Text(
                                        student.nama,
                                        style: GoogleFonts.outfit(
                                          color: Colors.white,
                                          fontSize: 15,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      subtitle: Padding(
                                        padding: const EdgeInsets.only(top: 4.0),
                                        child: Text(
                                          "NIS: ${student.nis} • Kamar: ${student.kamarNama}",
                                          style: GoogleFonts.outfit(
                                            color: const Color(0xFF94A3B8),
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                      trailing: const Icon(
                                        Icons.arrow_forward_ios_rounded,
                                        color: Color(0xFF475569),
                                        size: 14,
                                      ),
                                      onTap: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) => SantriDetailScreen(santriId: student.id),
                                          ),
                                        );
                                      },
                                    ),
                                  );
                                },
                              ),
                      ),
                    ],
                  ],
                ),
    );
  }

  Widget _buildDefaultAvatar(String gender) {
    final isPutra = gender.toLowerCase() == 'putra' || gender.toLowerCase().startsWith('l');
    return Icon(
      isPutra ? Icons.face_rounded : Icons.face_3_rounded,
      size: 26,
      color: const Color(0xFF10B981),
    );
  }
}
