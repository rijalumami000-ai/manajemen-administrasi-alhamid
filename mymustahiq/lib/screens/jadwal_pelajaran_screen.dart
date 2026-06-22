import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';

class JadwalPelajaranScreen extends StatefulWidget {
  const JadwalPelajaranScreen({super.key});

  @override
  State<JadwalPelajaranScreen> createState() => _JadwalPelajaranScreenState();
}

class _JadwalPelajaranScreenState extends State<JadwalPelajaranScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoadingClasses = true;
  bool _isLoadingSchedule = false;
  String? _errorMessage;
  
  List<Map<String, dynamic>> _classes = [];
  int? _selectedKelasId;
  String _selectedKelasNama = '';
  
  Map<String, List<dynamic>> _weeklySchedule = {};
  String _activeYear = '';
  String _activeSemester = '';

  List<dynamic> _tahunAjaranList = [];
  Map<String, dynamic>? _selectedTahunAjaran;
  String _selectedSemester = 'Ganjil';

  @override
  void initState() {
    super.initState();
    _fetchClasses();
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

  Future<void> _fetchClasses() async {
    setState(() {
      _isLoadingClasses = true;
      _errorMessage = null;
    });

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
      final res = await _apiService.getClasses(tahunAjaranId: taId, semester: _selectedSemester);
      final activeYear = res['tahunAjaran'] ?? '';
      final semester = res['semester'] ?? '';

      if (res['classes'] != null) {
        final list = List<Map<String, dynamic>>.from(res['classes']);
        _sortClasses(list);
        setState(() {
          _classes = list;
          _activeYear = activeYear;
          _activeSemester = semester;
          _isLoadingClasses = false;
        });
      } else if (res['kelas'] != null) {
        // Fallback to single homeroom class from older server responses
        final singleKelas = res['kelas'];
        final list = [
          {
            'id': singleKelas['id'],
            'nama': singleKelas['nama'],
          }
        ];
        setState(() {
          _classes = list;
          _activeYear = activeYear;
          _activeSemester = semester;
          _isLoadingClasses = false;
        });
      } else {
        throw Exception('Gagal memuat daftar kelas.');
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoadingClasses = false;
      });
    }
  }

  Future<void> _selectClass(int kelasId, String kelasNama) async {
    setState(() {
      _selectedKelasId = kelasId;
      _selectedKelasNama = kelasNama;
      _isLoadingSchedule = true;
      _weeklySchedule = {};
    });

    try {
      final taId = _selectedTahunAjaran?['id'];
      final res = await _apiService.getSchedule(kelasId, tahunAjaranId: taId, semester: _selectedSemester);
      final list = res['jadwal'] as List<dynamic>? ?? [];
      
      // Group by "malam"
      final Map<String, List<dynamic>> grouped = {};
      for (var item in list) {
        final String malam = item['malam'] ?? 'Lainnya';
        if (!grouped.containsKey(malam)) {
          grouped[malam] = [];
        }
        grouped[malam]!.add(item);
      }

      // Sort jam_ke inside each day group
      grouped.forEach((key, val) {
        val.sort((a, b) => (a['jam_ke'] ?? 1).compareTo(b['jam_ke'] ?? 1));
      });

      setState(() {
        _weeklySchedule = grouped;
        _isLoadingSchedule = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoadingSchedule = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final orderMalam = [
      'Malam Ahad',
      'Malam Senin',
      'Malam Selasa',
      'Malam Rabu',
      'Malam Kamis',
      'Malam Sabtu',
      'Malam Jumat'
    ];

    final isClassSelected = _selectedKelasId != null;

    return Scaffold(
      backgroundColor: context.scaffoldBg,
      appBar: AppBar(
        backgroundColor: context.isDarkMode ? const Color(0xFF0D1527) : Colors.white.withOpacity(0.45),
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.titleColor, size: 20),
          onPressed: () {
            if (isClassSelected) {
              setState(() {
                _selectedKelasId = null;
                _selectedKelasNama = '';
                _weeklySchedule = {};
              });
            } else {
              Navigator.pop(context);
            }
          },
        ),
        title: Text(
          isClassSelected ? "Jadwal Kelas $_selectedKelasNama" : "Jadwal Pelajaran",
          style: GoogleFonts.outfit(color: context.titleColor, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: Column(
        children: [
          // Year & Semester Filter Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
            color: context.cardBg,
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
                        child: Text("Tahun Ajaran: ${ta['kode']}"),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setState(() {
                          _selectedTahunAjaran = val;
                        });
                        _fetchClasses().then((_) {
                          if (isClassSelected) {
                            _selectClass(_selectedKelasId!, _selectedKelasNama);
                          }
                        });
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, thickness: 1),

          Expanded(
            child: _isLoadingClasses
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
                : _errorMessage != null && !isClassSelected
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
                                onPressed: _fetchClasses,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF064E3B),
                                ),
                                child: Text('Coba Lagi', style: GoogleFonts.outfit(color: Colors.white)),
                              ),
                            ],
                          ),
                        ),
                      )
                    : !isClassSelected
                        ? _buildClassGrid()
                        : _buildScheduleView(orderMalam),
          ),
        ],
      ),
    );
  }

  Widget _buildClassGrid() {
    if (_classes.isEmpty) {
      return Center(
        child: Text(
          "Tidak ada kelas aktif.",
          style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 14),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Pilih Kelas Diniyah",
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
                    "T.A $_activeYear",
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
            "Pilih salah satu kelas di bawah untuk melihat rincian jadwal mingguan.",
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
                crossAxisCount: 2,
                crossAxisSpacing: 14,
                mainAxisSpacing: 14,
                childAspectRatio: 1.1,
              ),
              itemCount: _classes.length,
              itemBuilder: (context, index) {
                final kelas = _classes[index];
                final namaKelas = kelas['nama'] ?? '';
                
                // Deterministic gradient based on index and theme mode
                final List<Color> cardColors = context.isDarkMode
                    ? (index % 3 == 0
                        ? [const Color(0xFF064E3B).withOpacity(0.4), const Color(0xFF022C22).withOpacity(0.6)]
                        : index % 3 == 1
                            ? [const Color(0xFF1E3A8A).withOpacity(0.4), const Color(0xFF172554).withOpacity(0.6)]
                            : [const Color(0xFF78350F).withOpacity(0.4), const Color(0xFF451A03).withOpacity(0.6)])
                    : (index % 3 == 0
                        ? [const Color(0xFFECFDF5), const Color(0xFFD1FAE5)]
                        : index % 3 == 1
                            ? [const Color(0xFFEFF6FF), const Color(0xFFDBEAFE)]
                            : [const Color(0xFFFFFBEB), const Color(0xFFFEF3C7)]);

                final Color accentColor = index % 3 == 0
                    ? const Color(0xFF10B981)
                    : index % 3 == 1
                        ? const Color(0xFF3B82F6)
                        : const Color(0xFFF59E0B);

                return GestureDetector(
                  onTap: () => _selectClass(kelas['id'], namaKelas),
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: cardColors,
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: accentColor.withOpacity(context.isDarkMode ? 0.2 : 0.6),
                        width: 1.2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(context.isDarkMode ? 0.2 : 0.04),
                          blurRadius: 6,
                          offset: const Offset(0, 3),
                        )
                      ],
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: context.isDarkMode ? Colors.white.withOpacity(0.06) : Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            boxShadow: context.isDarkMode
                                ? null
                                : [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.05),
                                      blurRadius: 4,
                                      offset: const Offset(0, 1),
                                    )
                                  ],
                          ),
                          child: Icon(
                            Icons.school_rounded,
                            color: accentColor,
                            size: 18,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          "Kelas $namaKelas",
                          style: GoogleFonts.outfit(
                            color: context.titleColor,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Row(
                          children: [
                            Text(
                              "Lihat Jadwal",
                              style: GoogleFonts.outfit(
                                color: accentColor,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Icon(
                              Icons.arrow_forward_rounded,
                              color: accentColor,
                              size: 10,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScheduleView(List<String> orderMalam) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Subheader Info
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          color: context.isDarkMode ? const Color(0xFF131C2E).withOpacity(0.4) : context.surfaceBg,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Jadwal Kelas Diniyah: $_selectedKelasNama",
                style: GoogleFonts.outfit(
                  color: context.titleColor,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                "T.A Berjalan",
                style: GoogleFonts.outfit(
                  color: const Color(0xFF10B981),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        
        // Main Schedules
        Expanded(
          child: _isLoadingSchedule
              ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
              : _weeklySchedule.isEmpty
                  ? Center(
                      child: Text(
                        "Tidak ada jadwal pelajaran untuk kelas ini.",
                        style: GoogleFonts.outfit(color: context.bodyColor, fontSize: 14),
                      ),
                    )
                  : ListView.builder(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.all(20),
                      itemCount: orderMalam.length,
                      itemBuilder: (context, index) {
                        final malamKey = orderMalam[index];
                        final dayList = _weeklySchedule[malamKey];
                        
                        // Don't render empty days
                        if (dayList == null || dayList.isEmpty) return const SizedBox();

                        return Card(
                          color: context.cardBg,
                          margin: const EdgeInsets.only(bottom: 20),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                            side: BorderSide(color: context.borderColor),
                          ),
                          elevation: 0,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              // Day Title Banner
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF10B981).withOpacity(context.isDarkMode ? 0.15 : 0.08),
                                  borderRadius: const BorderRadius.only(
                                    topLeft: Radius.circular(20),
                                    topRight: Radius.circular(20),
                                  ),
                                ),
                                child: Text(
                                  malamKey,
                                  style: GoogleFonts.outfit(
                                    color: context.isDarkMode ? const Color(0xFF34D399) : const Color(0xFF065F46),
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.0,
                                  ),
                                ),
                              ),
                              
                              // Sessions in Day
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                child: Column(
                                  children: dayList.map<Widget>((session) {
                                    final mapelName = session['mata_pelajaran_nama'] ?? '-';
                                    final ustadzName = session['guru_nama'] ?? '-';
                                    final jamKe = session['jam_ke'] ?? 1;
                                    return Column(
                                      children: [
                                        Padding(
                                          padding: const EdgeInsets.symmetric(vertical: 12),
                                          child: Row(
                                            children: [
                                              // Session Indicator
                                              Container(
                                                width: 38,
                                                height: 38,
                                                alignment: Alignment.center,
                                                decoration: BoxDecoration(
                                                  color: context.surfaceBg,
                                                  borderRadius: BorderRadius.circular(12),
                                                  border: Border.all(color: context.borderColor),
                                                ),
                                                child: Text(
                                                  "$jamKe",
                                                  style: GoogleFonts.outfit(
                                                    color: const Color(0xFFF59E0B),
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 16),
                                              // Subject Details
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Text(
                                                      mapelName,
                                                      style: GoogleFonts.outfit(
                                                        color: context.titleColor,
                                                        fontSize: 14,
                                                        fontWeight: FontWeight.bold,
                                                      ),
                                                    ),
                                                    const SizedBox(height: 2),
                                                    Text(
                                                      "Pengampu: $ustadzName",
                                                      style: GoogleFonts.outfit(
                                                        color: context.bodyColor,
                                                        fontSize: 12,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        // Divider if not last
                                        if (dayList.last != session)
                                          Divider(
                                            color: context.borderColor,
                                            height: 1,
                                          ),
                                      ],
                                    );
                                  }).toList(),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }
}
