import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'scan_screen.dart';
import 'recap_screen.dart';
import 'login_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Menghitung sholat saat ini untuk ditampilkan di panel status
    final hour = DateTime.now().hour;
    String currentSholat = 'Subuh';
    if (hour >= 4 && hour < 6) {
      currentSholat = 'Subuh';
    } else if (hour >= 11 && hour < 14) {
      currentSholat = 'Dzuhur';
    } else if (hour >= 15 && hour < 17) {
      currentSholat = 'Ashar';
    } else if (hour >= 17 && hour < 19) {
      currentSholat = 'Maghrib';
    } else if (hour >= 19 && hour < 21) {
      currentSholat = 'Isya';
    } else {
      currentSholat = 'Subuh';
    }

    final String todayDate = _formatDateIndonesian(DateTime.now());

    return Scaffold(
      backgroundColor: const Color(0xFF070B13), // Ultra deep space background
      body: Stack(
        children: [
          // 1. Top Green-glow Orb (Brand Al-Hamid Emerald)
          Positioned(
            top: -150,
            right: -100,
            child: Container(
              width: 450,
              height: 450,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF10B981).withOpacity(0.18),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // 2. Bottom Navy-glow Orb
          Positioned(
            bottom: -100,
            left: -150,
            child: Container(
              width: 400,
              height: 400,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF3B82F6).withOpacity(0.10),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // 3. Scrollable Main Layout
          SafeArea(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Center(
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 600), // Batasi lebar maksimal di tablet
                  padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 10.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                    const SizedBox(height: 20),

                    // Top Custom Header Row
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
                                fontSize: 15,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              "Ustadz Pengawas",
                              style: GoogleFonts.outfit(
                                color: Colors.white,
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        // Log Out Icon Button
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.04),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white.withOpacity(0.06)),
                          ),
                          child: IconButton(
                            icon: const Icon(Icons.logout_rounded, color: Colors.redAccent, size: 22),
                            onPressed: () {
                              // Konfirmasi Logout
                              showDialog(
                                context: context,
                                builder: (context) => AlertDialog(
                                  backgroundColor: const Color(0xFF131B2E),
                                  title: Text("Logout", style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
                                  content: Text("Apakah Anda yakin ingin keluar dari aplikasi?", style: GoogleFonts.outfit(color: const Color(0xFF94A3B8))),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.pop(context),
                                      child: Text("Batal", style: GoogleFonts.outfit(color: const Color(0xFF64748B))),
                                    ),
                                    ElevatedButton(
                                      onPressed: () {
                                        Navigator.pop(context);
                                        Navigator.pushReplacement(
                                          context,
                                          MaterialPageRoute(builder: (context) => const LoginScreen()),
                                        );
                                      },
                                      style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
                                      child: Text("Logout", style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 30),

                    // Modern glassmorphic Panoramic Banner Card
                    Container(
                      padding: const EdgeInsets.all(24.0),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.07),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: const Color(0xFF10B981).withOpacity(0.15),
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
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    todayDate.toUpperCase(),
                                    style: GoogleFonts.outfit(
                                      color: const Color(0xFF34D399),
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 1.2,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  "Biometric Portal",
                                  style: GoogleFonts.outfit(
                                    color: Colors.white,
                                    fontSize: 24,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: -0.5,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  "Ponpes Al-Hamid Cintamulya",
                                  style: GoogleFonts.outfit(
                                    color: const Color(0xFF94A3B8),
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          // Glowing School Badge Image/Icon (Menggunakan logo resmi Al-Hamid)
                          Container(
                            width: 68,
                            height: 68,
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.08),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: const Color(0xFF10B981).withOpacity(0.3),
                                width: 1.5,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF10B981).withOpacity(0.2),
                                  blurRadius: 12,
                                  spreadRadius: 1,
                                ),
                              ],
                            ),
                            child: ClipOval(
                              child: Image.asset(
                                'assets/images/school_logo.png',
                                fit: BoxFit.contain,
                                errorBuilder: (context, error, stackTrace) {
                                  return const Icon(
                                    Icons.school_rounded,
                                    size: 32,
                                    color: Color(0xFF10B981),
                                  );
                                },
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 35),

                    // Section Title
                    Text(
                      "PILIH LAYANAN UTAMA",
                      style: GoogleFonts.outfit(
                        color: const Color(0xFF475569),
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(height: 15),

                    // Layanan Card 1: SCAN WAJAH (Glow Emerald)
                    _buildFeatureCard(
                      context,
                      title: "SCAN WAJAH SANTRI",
                      subtitle: "Mulai presensi kehadiran sholat santri secara biometrik cerdas.",
                      icon: Icons.face_retouching_natural_rounded,
                      badge: "LIVENESS AKTIF",
                      badgeColor: const Color(0xFF10B981),
                      gradientColors: [const Color(0xFF10B981), const Color(0xFF047857)],
                      shadowColor: const Color(0xFF10B981).withOpacity(0.3),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const ScanScreen()),
                        );
                      },
                    ),
                    const SizedBox(height: 20),

                    // Layanan Card 2: REKAP HARI INI (Glow Blue)
                    _buildFeatureCard(
                      context,
                      title: "REKAP ABSENSI HARI INI",
                      subtitle: "Pantau jurnal log kehadiran santri yang masuk ke server saat ini.",
                      icon: Icons.assessment_rounded,
                      badge: "REAL-TIME SYNC",
                      badgeColor: const Color(0xFF3B82F6),
                      gradientColors: [const Color(0xFF3B82F6), const Color(0xFF1D4ED8)],
                      shadowColor: const Color(0xFF3B82F6).withOpacity(0.3),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const RecapScreen()),
                        );
                      },
                    ),
                    const SizedBox(height: 35),

                    // Quick Stats & Status Panel (Tambahan Super Pintar)
                    Text(
                      "STATUS PERANGKAT & JADWAL",
                      style: GoogleFonts.outfit(
                        color: const Color(0xFF475569),
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(height: 15),

                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: const Color(0xFF131B2E),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white.withOpacity(0.04)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _buildStatusItem(
                            icon: Icons.access_time_filled_rounded,
                            iconColor: Colors.amberAccent,
                            label: "Waktu Aktif",
                            value: currentSholat,
                          ),
                          Container(width: 1, height: 40, color: Colors.white.withOpacity(0.08)),
                          _buildStatusItem(
                            icon: Icons.sensors_rounded,
                            iconColor: const Color(0xFF10B981),
                            label: "Koneksi",
                            value: "Online",
                          ),
                          Container(width: 1, height: 40, color: Colors.white.withOpacity(0.08)),
                          _buildStatusItem(
                            icon: Icons.computer_rounded,
                            iconColor: const Color(0xFF6366F1),
                            label: "ID Kiosk",
                            value: "KIOSK-01",
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 40),
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

  // Feature Card Builder
  Widget _buildFeatureCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required String badge,
    required Color badgeColor,
    required List<Color> gradientColors,
    required Color shadowColor,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: shadowColor,
            blurRadius: 20,
            offset: const Offset(0, 8),
            spreadRadius: -8,
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(24),
          child: Container(
            padding: const EdgeInsets.all(28.0),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: gradientColors,
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.white.withOpacity(0.12), width: 1.5),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Header Inside Card
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Icon(icon, size: 30, color: Colors.white),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.white.withOpacity(0.2)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: badgeColor,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            badge,
                            style: GoogleFonts.outfit(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.0,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 25),

                // Text Content
                Text(
                  title,
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  subtitle,
                  style: GoogleFonts.outfit(
                    color: Colors.white.withOpacity(0.8),
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Status Item Builder
  Widget _buildStatusItem({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
  }) {
    return Column(
      children: [
        Icon(icon, color: iconColor, size: 20),
        const SizedBox(height: 8),
        Text(
          label,
          style: GoogleFonts.outfit(
            color: const Color(0xFF64748B),
            fontSize: 11,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: GoogleFonts.outfit(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  // Indonesian Date Formatter Utility
  String _formatDateIndonesian(DateTime date) {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const days = [
      'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
    ];
    
    final dayName = days[date.weekday % 7];
    final day = date.day;
    final monthName = months[date.month - 1];
    final year = date.year;

    return "$dayName, $day $monthName $year";
  }
}
