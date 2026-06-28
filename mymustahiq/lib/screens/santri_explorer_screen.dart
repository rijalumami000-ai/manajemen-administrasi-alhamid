import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';
import '../models/models.dart';
import 'santri_detail_screen.dart';
import '../services/network_service.dart';
import '../widgets/offline_widget.dart';

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
  String _activeYear = '';
  String _activeSemester = '';

  List<dynamic> _tahunAjaranList = [];
  Map<String, dynamic>? _selectedTahunAjaran;
  String _selectedSemester = 'Ganjil';

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

  void _sortClasses(List<Map<String, dynamic>> classes) {
    double getClassWeight(String name) {
      final n = name.toLowerCase();
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
      return 999.0;
    }

    classes.sort((a, b) {
      final nameA = (a['nama'] ?? '').toString();
      final nameB = (b['nama'] ?? '').toString();
      final weightA = getClassWeight(nameA);
      final weightB = getClassWeight(nameB);
      if (weightA != weightB) {
        return weightA.compareTo(weightB);
      }
      return nameA.compareTo(nameB);
    });
  }

  Future<void> _fetchStudentsData() async {
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
      if (_tahunAjaranList.isEmpty) {
        final taResult = await _apiService.getTahunAjaranList();
        _tahunAjaranList = taResult['tahunAjaran'] ?? [];
        _selectedSemester = taResult['activeSemester'] ?? 'Ganjil';
        if (_tahunAjaranList.isNotEmpty) {
          _selectedTahunAjaran = _tahunAjaranList.firstWhere(
            (ta) => ta['is_active'] == true,
            orElse: () => _tahunAjaranList.first,
          );
        }
      }

      final taId = _selectedTahunAjaran?['id'];

      if (_selectedKelasId == null) {
        // Fetch all classes list for the grid selector
        final res = await _apiService.getClasses(tahunAjaranId: taId, semester: _selectedSemester);
        final activeYear = res['tahunAjaran'] ?? '';
        final semester = res['semester'] ?? '';
        if (res['classes'] != null) {
          final list = List<Map<String, dynamic>>.from(res['classes']);
          _sortClasses(list);
          setState(() {
            _availableClasses = list;
            _activeYear = activeYear;
            _activeSemester = semester;
            _isLoading = false;
          });
        } else if (res['kelas'] != null) {
          // Fallback to single homeroom class from older server responses
          final singleKelas = res['kelas'];
          setState(() {
            _availableClasses = [
              {
                'id': singleKelas['id'],
                'nama': singleKelas['nama'],
              }
            ];
            _activeYear = activeYear;
            _activeSemester = semester;
            _isLoading = false;
          });
        } else {
          throw Exception('Gagal memuat daftar kelas.');
        }
      } else {
        // Fetch students of the selected class
        final res = await _apiService.getStudents(_selectedKelasId, tahunAjaranId: taId, semester: _selectedSemester);
        final list = res['santri'] as List<dynamic>? ?? [];
        final students = list.map((item) => Student.fromJson(item)).toList();
        
        setState(() {
          _allStudents = students;
          _filteredStudents = students;
          _className = res['kelas']?['nama'] ?? '';
          _selectedKelasId = res['kelas']?['id'];
          if (res['tahunAjaran'] != null) _activeYear = res['tahunAjaran'];
          if (res['semester'] != null) _activeSemester = res['semester'];
          _isLoading = false;
        });
        
        // Load available classes for quick switching (if not already loaded)
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
      final taId = _selectedTahunAjaran?['id'];
      final res = await _apiService.getClasses(tahunAjaranId: taId, semester: _selectedSemester);
      if (res['classes'] != null && mounted) {
        final list = List<Map<String, dynamic>>.from(res['classes']);
        _sortClasses(list);
        setState(() {
          _availableClasses = list;
          if (res['tahunAjaran'] != null) _activeYear = res['tahunAjaran'];
          if (res['semester'] != null) _activeSemester = res['semester'];
        });
      } else if (res['kelas'] != null && mounted) {
        setState(() {
          _availableClasses = [
            {
              'id': res['kelas']['id'],
              'nama': res['kelas']['nama'],
            }
          ];
          if (res['tahunAjaran'] != null) _activeYear = res['tahunAjaran'];
          if (res['semester'] != null) _activeSemester = res['semester'];
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
      backgroundColor: context.scaffoldBg,
      appBar: AppBar(
        backgroundColor: context.isDarkMode ? const Color(0xFF0D1527) : Colors.white.withOpacity(0.45),
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              hasClassLoaded ? "Santri Kelas $_className" : "Pilih Kelas Santri",
              style: GoogleFonts.outfit(color: context.titleColor, fontWeight: FontWeight.bold, fontSize: 16),
            ),
            if (_activeYear.isNotEmpty)
              Text(
                "T.A $_activeYear ($_activeSemester)",
                style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 11, fontWeight: FontWeight.w500),
              ),
          ],
        ),
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.titleColor, size: 20),
          onPressed: () {
            if (hasClassLoaded) {
              setState(() {
                _selectedKelasId = null;
                _className = '';
                _allStudents = [];
                _filteredStudents = [];
                _searchController.clear();
              });
              _fetchStudentsData();
            } else {
              Navigator.pop(context);
            }
          },
        ),
        actions: [
          if (hasClassLoaded && _availableClasses.isNotEmpty)
            PopupMenuButton<int>(
              icon: const Icon(Icons.filter_list_rounded, color: Color(0xFF10B981)),
              color: context.cardBg,
              tooltip: 'Pilih Kelas',
              onSelected: (int kelasId) {
                setState(() {
                  _selectedKelasId = kelasId;
                  _searchController.clear();
                });
                _fetchStudentsData();
              },
              itemBuilder: (BuildContext menuContext) {
                return _availableClasses.map((kelas) {
                  return PopupMenuItem<int>(
                    value: kelas['id'],
                    child: Text(
                      "Kelas ${kelas['nama']}",
                      style: GoogleFonts.outfit(
                        color: _selectedKelasId == kelas['id'] ? const Color(0xFF10B981) : context.titleColor,
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
          : _errorMessage != null && !hasClassLoaded
              ? (_errorMessage == 'NO_INTERNET'
                  ? OfflineWidget(onRetry: _fetchStudentsData)
                  : Center(
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
                              onPressed: _fetchStudentsData,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF064E3B),
                              ),
                              child: Text('Coba Lagi', style: GoogleFonts.outfit(color: Colors.white)),
                            ),
                          ],
                        ),
                      ),
                    ))
              : Column(
                  children: [
                    // Year & Semester Filter Bar
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                      color: context.isDarkMode ? const Color(0xFF0D1527) : Colors.white,
                      child: Row(
                        children: [
                          Expanded(
                            child: DropdownButton<Map<String, dynamic>>(
                              dropdownColor: context.isDarkMode ? const Color(0xFF1E293B) : Colors.white,
                              value: _selectedTahunAjaran,
                              isExpanded: true,
                              underline: const SizedBox(),
                              style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13, fontWeight: FontWeight.bold),
                              items: _tahunAjaranList.map<DropdownMenuItem<Map<String, dynamic>>>((ta) {
                                return DropdownMenuItem<Map<String, dynamic>>(
                                  value: ta as Map<String, dynamic>,
                                  child: Text("T.A: ${ta['kode']}"),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) {
                                  setState(() {
                                    _selectedTahunAjaran = val;
                                    _selectedKelasId = null; // Reset to class picker
                                    _className = '';
                                    _allStudents = [];
                                    _filteredStudents = [];
                                    _availableClasses = [];
                                  });
                                  _fetchStudentsData();
                                }
                              },
                            ),
                          ),
                          const SizedBox(width: 24),
                          Expanded(
                            child: DropdownButton<String>(
                              dropdownColor: context.isDarkMode ? const Color(0xFF1E293B) : Colors.white,
                              value: _selectedSemester,
                              isExpanded: true,
                              underline: const SizedBox(),
                              style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13, fontWeight: FontWeight.bold),
                              items: const [
                                DropdownMenuItem(value: "Ganjil", child: Text("Sem: Ganjil")),
                                DropdownMenuItem(value: "Genap", child: Text("Sem: Genap")),
                              ],
                              onChanged: (val) {
                                if (val != null) {
                                  setState(() {
                                    _selectedSemester = val;
                                    _selectedKelasId = null; // Reset to class picker
                                    _className = '';
                                    _allStudents = [];
                                    _filteredStudents = [];
                                    _availableClasses = [];
                                  });
                                  _fetchStudentsData();
                                }
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1, thickness: 1),

                    // LANDING: Class Grid View Selector
                    if (!hasClassLoaded && _availableClasses.isNotEmpty)
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.all(20.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    "Pilih Kelas Santri",
                                    style: GoogleFonts.outfit(
                                      color: context.titleColor,
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  if (_activeYear.isNotEmpty)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF10B981).withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        "T.A $_activeYear ($_activeSemester)",
                                        style: GoogleFonts.outfit(
                                          color: const Color(0xFF10B981),
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                "Pilih kelas di bawah untuk menjelajah data dan profil lengkap santri.",
                                style: GoogleFonts.outfit(
                                  color: context.subTitleColor,
                                  fontSize: 12,
                                ),
                              ),
                              const SizedBox(height: 20),
                              Expanded(
                                child: GridView.builder(
                                  physics: const BouncingScrollPhysics(),
                                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: 3,
                                    crossAxisSpacing: 12,
                                    mainAxisSpacing: 12,
                                    childAspectRatio: 1.6,
                                  ),
                                  itemCount: _availableClasses.length,
                                  itemBuilder: (context, index) {
                                    final kelas = _availableClasses[index];
                                    final namaKelas = kelas['nama'] ?? '';
                                    final isSelected = _selectedKelasId == kelas['id'];

                                    return GestureDetector(
                                      onTap: () {
                                        setState(() {
                                          _selectedKelasId = kelas['id'];
                                        });
                                        _fetchStudentsData();
                                      },
                                      child: AnimatedContainer(
                                        duration: const Duration(milliseconds: 200),
                                        decoration: BoxDecoration(
                                          color: isSelected ? const Color(0xFF10B981) : context.cardBg,
                                          borderRadius: BorderRadius.circular(14),
                                          border: Border.all(
                                            color: isSelected ? const Color(0xFF10B981) : context.borderColor,
                                            width: isSelected ? 2 : 1,
                                          ),
                                          boxShadow: isSelected
                                              ? [BoxShadow(color: const Color(0xFF10B981).withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 4))]
                                              : [],
                                        ),
                                        alignment: Alignment.center,
                                        child: Text(
                                          namaKelas,
                                          style: GoogleFonts.outfit(
                                            color: isSelected ? Colors.white : context.titleColor,
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
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
                      )
                    else ...[
                      // INSIDE CLASS: Search Bar
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
                        child: TextField(
                          controller: _searchController,
                          onChanged: _onSearchChanged,
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
                      ),
                      
                      // Count Banner
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 4.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              "DAFTAR SANTRI AKTIF",
                              style: GoogleFonts.outfit(
                                color: context.subTitleColor,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.2,
                              ),
                            ),
                            Text(
                              "${_filteredStudents.length} Santri",
                              style: GoogleFonts.outfit(
                                color: const Color(0xFF10B981),
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),

                      // INSIDE CLASS: Student Grid Cards View
                      Expanded(
                        child: _filteredStudents.isEmpty
                            ? Center(
                                child: Text(
                                  _searchController.text.isEmpty
                                      ? "Tidak ada santri aktif di kelas ini."
                                      : "Santri tidak ditemukan.",
                                  style: GoogleFonts.outfit(
                                    color: context.bodyColor,
                                    fontSize: 14,
                                  ),
                                ),
                              )
                            : GridView.builder(
                                physics: const BouncingScrollPhysics(),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 2,
                                  crossAxisSpacing: 12,
                                  mainAxisSpacing: 12,
                                  childAspectRatio: 0.8,
                                ),
                                itemCount: _filteredStudents.length,
                                itemBuilder: (context, index) {
                                  final student = _filteredStudents[index];
                                  return Card(
                                    color: context.cardBg,
                                    margin: EdgeInsets.zero,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(20),
                                      side: BorderSide(color: context.borderColor),
                                    ),
                                    elevation: 0,
                                    child: InkWell(
                                      onTap: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) => SantriDetailScreen(
                                              santriId: student.id,
                                              tahunAjaranId: _selectedTahunAjaran?['id'],
                                              semester: _selectedSemester,
                                            ),
                                          ),
                                        );
                                      },
                                      borderRadius: BorderRadius.circular(20),
                                      child: Padding(
                                        padding: const EdgeInsets.all(12.0),
                                        child: Column(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            // Avatar
                                            Container(
                                              width: 56,
                                              height: 56,
                                              decoration: BoxDecoration(
                                                color: context.isDarkMode 
                                                    ? Colors.white.withOpacity(0.05) 
                                                    : const Color(0xFF10B981).withOpacity(0.12),
                                                shape: BoxShape.circle,
                                                border: Border.all(
                                                  color: const Color(0xFF10B981).withOpacity(
                                                    context.isDarkMode ? 0.3 : 0.5,
                                                  ),
                                                  width: 2,
                                                ),
                                              ),
                                              child: ClipOval(
                                                child: student.fotoUrl != null && student.fotoUrl!.isNotEmpty
                                                    ? Image.network(
                                                        _apiService.getFullImageUrl(student.fotoUrl),
                                                        fit: BoxFit.cover,
                                                        errorBuilder: (context, error, stackTrace) =>
                                                            _buildDefaultAvatar(student.jenisKelamin),
                                                      )
                                                    : _buildDefaultAvatar(student.jenisKelamin),
                                              ),
                                            ),
                                            const SizedBox(height: 12),
                                            // Name
                                            Text(
                                              student.nama,
                                              style: GoogleFonts.outfit(
                                                color: context.titleColor,
                                                fontSize: 13,
                                                fontWeight: FontWeight.bold,
                                              ),
                                              textAlign: TextAlign.center,
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                            const SizedBox(height: 4),
                                            // NIS
                                            Text(
                                              "NIS: ${student.nis}",
                                              style: GoogleFonts.outfit(
                                                color: context.subTitleColor,
                                                fontSize: 10,
                                              ),
                                              textAlign: TextAlign.center,
                                            ),
                                            const SizedBox(height: 2),
                                            // Room
                                            Text(
                                              student.kamarNama,
                                              style: GoogleFonts.outfit(
                                                color: const Color(0xFF10B981),
                                                fontSize: 10,
                                                fontWeight: FontWeight.w600,
                                              ),
                                              textAlign: TextAlign.center,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ],
                                        ),
                                      ),
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
      size: 28,
      color: const Color(0xFF10B981),
    );
  }
}
