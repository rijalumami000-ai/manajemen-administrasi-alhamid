import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class StrukturOrganisasiScreen extends StatefulWidget {
  const StrukturOrganisasiScreen({super.key});

  @override
  State<StrukturOrganisasiScreen> createState() => _StrukturOrganisasiScreenState();
}

class _StrukturOrganisasiScreenState extends State<StrukturOrganisasiScreen> with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  late TabController _tabController;

  bool _isLoading = true;
  String? _errorMessage;
  
  List<dynamic> _diniyahList = [];
  List<dynamic> _panitiaList = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchStructureData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchStructureData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final diniyah = await _apiService.getStructure('madrasah_diniyah');
      final panitia = await _apiService.getStructure('panitia_ujian');

      setState(() {
        _diniyahList = diniyah;
        _panitiaList = panitia;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
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
          "Struktur Organisasi",
          style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF10B981),
          labelColor: Colors.white,
          unselectedLabelColor: const Color(0xFF64748B),
          labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14),
          unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.normal, fontSize: 14),
          tabs: const [
            Tab(text: "Madrasah Diniyah"),
            Tab(text: "Panitia Semester"),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF10B981)))
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
                          onPressed: _fetchStructureData,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF064E3B),
                          ),
                          child: Text('Coba Lagi', style: GoogleFonts.outfit(color: Colors.white)),
                        ),
                      ],
                    ),
                  ),
                )
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildStructureList(_diniyahList, const Color(0xFF10B981)),
                    _buildStructureList(_panitiaList, const Color(0xFFD97706)),
                  ],
                ),
    );
  }

  Widget _buildStructureList(List<dynamic> list, Color badgeColor) {
    if (list.isEmpty) {
      return Center(
        child: Text(
          "Struktur belum terkonfigurasi.",
          style: GoogleFonts.outfit(color: const Color(0xFF64748B), fontSize: 14),
        ),
      );
    }

    return ListView.builder(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final item = list[index];
        final name = item['guru_nama'] ?? item['nama_custom'] ?? 'Belum Diisi';
        final role = item['jabatan'] ?? 'Staf';
        final phone = item['guru_no_hp'] ?? '-';
        final photo = item['guru_foto_url'];

        return Container(
          margin: const EdgeInsets.only(bottom: 20),
          child: IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Timeline Connector Dot/Line
                Column(
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: badgeColor,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                    ),
                    if (index < list.length - 1)
                      Expanded(
                        child: Container(
                          width: 2,
                          color: badgeColor.withOpacity(0.3),
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 20),
                
                // Content Card
                Expanded(
                  child: Card(
                    color: const Color(0xFF131C2E),
                    margin: EdgeInsets.zero,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                      side: BorderSide(color: Colors.white.withOpacity(0.04)),
                    ),
                    elevation: 0,
                    child: Padding(
                      padding: const EdgeInsets.all(18.0),
                      child: Row(
                        children: [
                          // Teacher Photo
                          Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.05),
                              shape: BoxShape.circle,
                              border: Border.all(color: badgeColor.withOpacity(0.3), width: 1),
                            ),
                            child: ClipOval(
                              child: photo != null
                                  ? Image.network(
                                      "${ApiService.baseUrl}$photo",
                                      fit: BoxFit.cover,
                                      errorBuilder: (context, error, stackTrace) =>
                                          const Icon(Icons.person_rounded, color: Color(0xFF64748B), size: 28),
                                    )
                                  : const Icon(Icons.person_rounded, color: Color(0xFF64748B), size: 28),
                            ),
                          ),
                          const SizedBox(width: 16),
                          
                          // Position & Details
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  role,
                                  style: GoogleFonts.outfit(
                                    color: badgeColor,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  name,
                                  style: GoogleFonts.outfit(
                                    color: Colors.white,
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                if (phone != '-' && phone.toString().trim().isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    "No. HP: $phone",
                                    style: GoogleFonts.outfit(
                                      color: const Color(0xFF64748B),
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
