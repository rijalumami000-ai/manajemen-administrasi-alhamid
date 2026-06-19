import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

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

  @override
  void initState() {
    super.initState();
    _fetchClasses();
  }

  Future<void> _fetchClasses() async {
    setState(() {
      _isLoadingClasses = true;
      _errorMessage = null;
    });

    try {
      final res = await _apiService.getStudents(null);
      if (res['classes'] != null) {
        final list = List<Map<String, dynamic>>.from(res['classes']);
        setState(() {
          _classes = list;
          _isLoadingClasses = false;
        });

        if (list.isNotEmpty) {
          _selectClass(list[0]['id'], list[0]['name'] ?? list[0]['nama'] ?? '');
        }
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
      final res = await _apiService.getSchedule(kelasId);
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
    // Standard ordered Diniyah nights
    final orderMalam = [
      'Malam Sabtu',
      'Malam Minggu',
      'Malam Senin',
      'Malam Selasa',
      'Malam Rabu',
      'Malam Kamis',
      'Malam Jumat'
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF070B13),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D1527),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "Jadwal Pelajaran",
          style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          if (_classes.isNotEmpty)
            PopupMenuButton<Map<String, dynamic>>(
              icon: const Icon(Icons.class_rounded, color: Color(0xFF10B981)),
              color: const Color(0xFF131B2E),
              tooltip: 'Pilih Kelas',
              onSelected: (kelas) {
                _selectClass(kelas['id'], kelas['nama'] ?? '');
              },
              itemBuilder: (BuildContext context) {
                return _classes.map((kelas) {
                  return PopupMenuItem<Map<String, dynamic>>(
                    value: kelas,
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
      body: _isLoadingClasses
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
          : _errorMessage != null && _weeklySchedule.isEmpty
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
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Subheader Info
                    if (_selectedKelasNama.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        color: const Color(0xFF131C2E).withOpacity(0.4),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              "Jadwal Kelas: $_selectedKelasNama",
                              style: GoogleFonts.outfit(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              "T.A berjalan",
                              style: GoogleFonts.outfit(
                                color: const Color(0xFF10B981),
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
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
                                    style: GoogleFonts.outfit(color: const Color(0xFF64748B), fontSize: 14),
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
                                      color: const Color(0xFF131C2E),
                                      margin: const EdgeInsets.only(bottom: 20),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(20),
                                        side: BorderSide(color: Colors.white.withOpacity(0.03)),
                                      ),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.stretch,
                                        children: [
                                          // Day Title Banner
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFF064E3B).withOpacity(0.15),
                                              borderRadius: const BorderRadius.only(
                                                topLeft: Radius.circular(20),
                                                topRight: Radius.circular(20),
                                              ),
                                            ),
                                            child: Text(
                                              malamKey,
                                              style: GoogleFonts.outfit(
                                                color: const Color(0xFF34D399),
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
                                                              color: const Color(0xFF070B13),
                                                              borderRadius: BorderRadius.circular(12),
                                                              border: Border.all(color: Colors.white.withOpacity(0.04)),
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
                                                                    color: Colors.white,
                                                                    fontSize: 14,
                                                                    fontWeight: FontWeight.bold,
                                                                  ),
                                                                ),
                                                                const SizedBox(height: 2),
                                                                Text(
                                                                  "Pengampu: $ustadzName",
                                                                  style: GoogleFonts.outfit(
                                                                    color: const Color(0xFF64748B),
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
                                                        color: Colors.white.withOpacity(0.03),
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
                ),
    );
  }
}
