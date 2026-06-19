import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import 'santri_explorer_screen.dart';
import 'jadwal_pelajaran_screen.dart';
import 'struktur_organisasi_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic>? _data;

  @override
  void initState() {
    super.initState();
    _fetchDashboardData();
  }

  Future<void> _fetchDashboardData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await _apiService.getDashboard();
      setState(() {
        _data = res;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _handleLogout() async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF131B2E),
        title: Text(
          "Logout",
          style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: Text(
          "Apakah Anda yakin ingin keluar?",
          style: GoogleFonts.outfit(color: const Color(0xFF94A3B8)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text("Batal", style: GoogleFonts.outfit(color: const Color(0xFF64748B))),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await _apiService.logout();
              if (mounted) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (context) => const LoginScreen()),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            child: Text(
              "Logout",
              style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Current Indonesian date format
    final days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    final months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    final now = DateTime.now();
    final todayStr = "${days[now.weekday % 7]}, ${now.day} ${months[now.month - 1]} ${now.year}";

    final guruName = _data?['guruInfo']?['nama'] ?? _data?['user']?['full_name'] ?? 'Ustadz';
    final role = _data?['guruInfo']?['jabatan'] ?? 'Mustahiq Diniyah';
    final activeYear = _data?['tahunAjaran']?['kode'] ?? '-';
    final kelasMustahiq = _data?['kelasMustahiq'];
    final totalSantri = _data?['totalSantriKelas'] ?? 0;
    final listJadwal = _data?['jadwalMengajar'] as List<dynamic>? ?? [];

    return Scaffold(
      backgroundColor: const Color(0xFF070B13),
      body: Stack(
        children: [
          // Glowing Orbs
          Positioned(
            top: -100,
            right: -100,
            child: Container(
              width: 350,
              height: 350,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF064E3B).withOpacity(0.2),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          SafeArea(
            child: _isLoading
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
                              const Icon(Icons.wifi_off_rounded, color: Colors.amber, size: 64),
                              const SizedBox(height: 16),
                              Text(
                                _errorMessage!,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.outfit(color: Colors.white, fontSize: 16),
                              ),
                              const SizedBox(height: 24),
                              ElevatedButton(
                                onPressed: _fetchDashboardData,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF064E3B),
                                ),
                                child: Text('Coba Lagi', style: GoogleFonts.outfit(color: Colors.white)),
                              ),
                            ],
                          ),
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _fetchDashboardData,
                        color: const Color(0xFF10B981),
                        backgroundColor: const Color(0xFF131B2E),
                        child: SingleChildScrollView(
                          physics: const BouncingScrollPhysics(),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                const SizedBox(height: 10),
                                
                                // Header row
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          "Assalamu'alaikum,",
                                          style: GoogleFonts.outfit(
                                            color: const Color(0xFF94A3B8),
                                            fontSize: 14,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          guruName,
                                          style: GoogleFonts.outfit(
                                            color: Colors.white,
                                            fontSize: 20,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        Text(
                                          role,
                                          style: GoogleFonts.outfit(
                                            color: const Color(0xFF10B981),
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                    // Log Out Button
                                    Container(
                                      decoration: BoxDecoration(
                                        color: Colors.white.withOpacity(0.03),
                                        shape: BoxShape.circle,
                                        border: Border.all(color: Colors.white.withOpacity(0.06)),
                                      ),
                                      child: IconButton(
                                        icon: const Icon(Icons.logout_rounded, color: Colors.redAccent, size: 20),
                                        onPressed: _handleLogout,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 25),

                                // Glassmorphic Banner Card
                                Container(
                                  padding: const EdgeInsets.all(22.0),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF064E3B).withOpacity(0.08),
                                    borderRadius: BorderRadius.circular(24),
                                    border: Border.all(
                                      color: const Color(0xFF10B981).withOpacity(0.18),
                                      width: 1.5,
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFF10B981).withOpacity(0.2),
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              child: Text(
                                                todayStr.toUpperCase(),
                                                style: GoogleFonts.outfit(
                                                  color: const Color(0xFF34D399),
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.bold,
                                                  letterSpacing: 1.1,
                                                ),
                                              ),
                                            ),
                                            const SizedBox(height: 12),
                                            Text(
                                              "Tahun Ajaran Aktif",
                                              style: GoogleFonts.outfit(
                                                color: const Color(0xFF94A3B8),
                                                fontSize: 13,
                                              ),
                                            ),
                                            Text(
                                              activeYear,
                                              style: GoogleFonts.outfit(
                                                color: Colors.white,
                                                fontSize: 22,
                                                fontWeight: FontWeight.w900,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Container(
                                        width: 60,
                                        height: 60,
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withOpacity(0.05),
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: const Color(0xFF10B981).withOpacity(0.2),
                                          ),
                                        ),
                                        child: Image.asset(
                                          'assets/images/school_logo.png',
                                          fit: BoxFit.contain,
                                          errorBuilder: (context, error, stackTrace) =>
                                              const Icon(Icons.school_rounded, color: Color(0xFF10B981), size: 30),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 30),

                                // Wali Kelas (Mustahiq) Section
                                if (kelasMustahiq != null) ...[
                                  Text(
                                    "BINAAN MUSTAHIQ",
                                    style: GoogleFonts.outfit(
                                      color: const Color(0xFF475569),
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 1.5,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  GestureDetector(
                                    onTap: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => SantriExplorerScreen(kelasId: kelasMustahiq['id']),
                                        ),
                                      );
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.all(20),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF131C2E),
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(color: Colors.white.withOpacity(0.05)),
                                      ),
                                      child: Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.all(12),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFF10B981).withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(16),
                                            ),
                                            child: const Icon(Icons.class_rounded, color: Color(0xFF10B981), size: 28),
                                          ),
                                          const SizedBox(width: 16),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  "Kelas ${kelasMustahiq['nama']}",
                                                  style: GoogleFonts.outfit(
                                                    color: Colors.white,
                                                    fontSize: 18,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                                Text(
                                                  "Ketuk untuk lihat daftar santri",
                                                  style: GoogleFonts.outfit(
                                                    color: const Color(0xFF64748B),
                                                    fontSize: 12,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.end,
                                            children: [
                                              Text(
                                                "$totalSantri",
                                                style: GoogleFonts.outfit(
                                                  color: const Color(0xFFD97706),
                                                  fontSize: 22,
                                                  fontWeight: FontWeight.w900,
                                                ),
                                              ),
                                              Text(
                                                "Santri",
                                                style: GoogleFonts.outfit(
                                                  color: const Color(0xFF94A3B8),
                                                  fontSize: 11,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 30),
                                ],

                                // Menu Grid
                                Text(
                                  "LAYANAN AKADEMIK",
                                  style: GoogleFonts.outfit(
                                    color: const Color(0xFF475569),
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                GridView.count(
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  crossAxisCount: 3,
                                  mainAxisSpacing: 16,
                                  crossAxisSpacing: 16,
                                  childAspectRatio: 0.9,
                                  children: [
                                    _buildMenuItem(
                                      icon: Icons.people_alt_rounded,
                                      label: "Santri Diniyah",
                                      color: const Color(0xFF10B981),
                                      onTap: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(builder: (context) => const SantriExplorerScreen()),
                                        );
                                      },
                                    ),
                                    _buildMenuItem(
                                      icon: Icons.calendar_today_rounded,
                                      label: "Jadwal Kelas",
                                      color: const Color(0xFF3B82F6),
                                      onTap: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(builder: (context) => const JadwalPelajaranScreen()),
                                        );
                                      },
                                    ),
                                    _buildMenuItem(
                                      icon: Icons.account_tree_rounded,
                                      label: "Struktur Organisasi",
                                      color: const Color(0xFF8B5CF6),
                                      onTap: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(builder: (context) => const StrukturOrganisasiScreen()),
                                        );
                                      },
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 30),

                                // Jadwal Mengajar Ustadz Section
                                Text(
                                  "JADWAL MENGAJAR HARI INI",
                                  style: GoogleFonts.outfit(
                                    color: const Color(0xFF475569),
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                listJadwal.isEmpty
                                    ? Container(
                                        padding: const EdgeInsets.all(24),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF131B2E),
                                          borderRadius: BorderRadius.circular(20),
                                          border: Border.all(color: Colors.white.withOpacity(0.04)),
                                        ),
                                        child: Center(
                                          child: Text(
                                            "Tidak ada jadwal mengajar di semester/tahun ajaran aktif.",
                                            textAlign: TextAlign.center,
                                            style: GoogleFonts.outfit(
                                              color: const Color(0xFF64748B),
                                              fontSize: 13,
                                            ),
                                          ),
                                        ),
                                      )
                                    : ListView.separated(
                                        shrinkWrap: true,
                                        physics: const NeverScrollableScrollPhysics(),
                                        itemCount: listJadwal.length,
                                        separatorBuilder: (context, index) => const SizedBox(height: 12),
                                        itemBuilder: (context, index) {
                                          final item = listJadwal[index];
                                          return Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFF131B2E),
                                              borderRadius: BorderRadius.circular(16),
                                              border: Border.all(color: Colors.white.withOpacity(0.04)),
                                            ),
                                            child: Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Expanded(
                                                  child: Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      Text(
                                                        item['mata_pelajaran_nama'] ?? '-',
                                                        style: GoogleFonts.outfit(
                                                          color: Colors.white,
                                                          fontSize: 15,
                                                          fontWeight: FontWeight.bold,
                                                        ),
                                                      ),
                                                      const SizedBox(height: 4),
                                                      Text(
                                                        "Kelas ${item['kelas_nama']} • ${item['malam']}",
                                                        style: GoogleFonts.outfit(
                                                          color: const Color(0xFF94A3B8),
                                                          fontSize: 12,
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                                  decoration: BoxDecoration(
                                                    color: const Color(0xFFD97706).withOpacity(0.15),
                                                    borderRadius: BorderRadius.circular(8),
                                                  ),
                                                  child: Text(
                                                    "Jam ${item['jam_ke']}",
                                                    style: GoogleFonts.outfit(
                                                      color: const Color(0xFFF59E0B),
                                                      fontSize: 12,
                                                      fontWeight: FontWeight.bold,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          );
                                        },
                                      ),
                                const SizedBox(height: 30),
                              ],
                            ),
                          ),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF131C2E),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withOpacity(0.04)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 10),
            Text(
              label,
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
