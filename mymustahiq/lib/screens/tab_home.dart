import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/theme_manager.dart';

class TabHome extends StatefulWidget {
  final Function(int index) onNavigateTab;
  final VoidCallback onOpenChat;
  final VoidCallback onOpenNotifications;
  final int unreadChats;
  final int unreadNotifications;

  const TabHome({
    super.key,
    required this.onNavigateTab,
    required this.onOpenChat,
    required this.onOpenNotifications,
    this.unreadChats = 0,
    this.unreadNotifications = 0,
  });

  @override
  State<TabHome> createState() => _TabHomeState();
}

class _TabHomeState extends State<TabHome> with SingleTickerProviderStateMixin {
  late AnimationController _auroraController;
  late Timer _clockTimer;
  DateTime _currentTime = DateTime.now();
  int? _pressedShortcutIndex;

  @override
  void initState() {
    super.initState();
    // Smooth, slow ambient animation loop
    _auroraController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 12),
    )..repeat();

    // 1-second live clock update
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() {
          _currentTime = DateTime.now();
        });
      }
    });
  }

  @override
  void dispose() {
    _auroraController.dispose();
    _clockTimer.cancel();
    super.dispose();
  }

  String _getTimeGreeting() {
    final hour = _currentTime.hour;
    if (hour >= 3 && hour < 11) return "Selamat Pagi";
    if (hour >= 11 && hour < 15) return "Selamat Siang";
    if (hour >= 15 && hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  }

  String _formatIndonesianDate(DateTime dt) {
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNames = [
      '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    final dayName = dayNames[dt.weekday % 7];
    final monthName = monthNames[dt.month];
    return '$dayName, ${dt.day} $monthName ${dt.year}';
  }

  String _formatDigitalTime(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  String _formatDigitalSeconds(DateTime dt) {
    return dt.second.toString().padLeft(2, '0');
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;
    final topPadding = MediaQuery.of(context).padding.top + kToolbarHeight;
    final screenHeight = MediaQuery.of(context).size.height;

    // Hero Space height: gracefully proportional (~42% of screen)
    final heroHeight = (screenHeight * 0.42).clamp(290.0, 390.0);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: EdgeInsets.zero,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ─── 1. SEAMLESS HERO SPACE DENGAN ANIMASI ABSTRAK HIDUP ──────────
            // Menyatukan latar belakang abstrak bergerak dengan konten pembuka tanpa kotak/border
            SizedBox(
              height: heroHeight + topPadding,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  // Full Animated Abstract Aurora Waves Canvas
                  AnimatedBuilder(
                    animation: _auroraController,
                    builder: (context, child) {
                      return CustomPaint(
                        painter: _LivingAuroraPainter(
                          progress: _auroraController.value,
                          isDark: isDark,
                        ),
                      );
                    },
                  ),

                  // Bottom smooth fade out to completely blend into Home background
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 70,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            (isDark ? const Color(0xFF070B13) : const Color(0xFFF8FAFC)).withOpacity(0.0),
                            (isDark ? const Color(0xFF070B13) : const Color(0xFFF8FAFC)),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // Integrated Opening Content inside the Flowing Aurora
                  Padding(
                    padding: EdgeInsets.only(
                      top: topPadding + 10,
                      left: 24,
                      right: 24,
                      bottom: 16,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Pembuka: Assalamu'alaikum & Dynamic Greeting
                        Row(
                          children: [
                            Text(
                              "Assalamu'alaikum",
                              style: GoogleFonts.outfit(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF10B981),
                                letterSpacing: 0.2,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              "• ${_getTimeGreeting()}",
                              style: GoogleFonts.outfit(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: context.subTitleColor,
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 10),

                        // Centerpiece: Digital Clock & Crash-Proof Indonesian Date
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.baseline,
                          textBaseline: TextBaseline.alphabetic,
                          children: [
                            Text(
                              _formatDigitalTime(_currentTime),
                              style: GoogleFonts.outfit(
                                fontSize: 48,
                                fontWeight: FontWeight.w800,
                                color: context.titleColor,
                                letterSpacing: -1.5,
                                height: 1.0,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              ":${_formatDigitalSeconds(_currentTime)}",
                              style: GoogleFonts.outfit(
                                fontSize: 20,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF10B981),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              "WIB",
                              style: GoogleFonts.outfit(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: context.subTitleColor,
                                letterSpacing: 0.8,
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 6),

                        // Tanggal Indonesia Hari Ini
                        Row(
                          children: [
                            Icon(
                              Icons.calendar_today_rounded,
                              size: 13,
                              color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              _formatIndonesianDate(_currentTime),
                              style: GoogleFonts.outfit(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                letterSpacing: 0.1,
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 18),

                        // Headline & Sub-kalimat
                        Text(
                          "Selamat datang di Alhamid One",
                          style: GoogleFonts.outfit(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: context.titleColor,
                            letterSpacing: -0.4,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "Satu platform untuk seluruh kebutuhan pesantren",
                          style: GoogleFonts.outfit(
                            fontSize: 13,
                            fontWeight: FontWeight.w400,
                            color: context.bodyColor,
                            height: 1.35,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // ─── 2. TIGA SHORTCUT UTAMA (Akademik, Kelasku, Administrasi) ──────
            // Bersih tanpa sub-judul dan tanpa tombol Chat, Notifikasi, Akun
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: _buildThreeCoreShortcuts(context, isDark),
            ),

            const SizedBox(height: 32),

            // ─── 3. INSTITUTIONAL FOOTER (Tanpa Centang) ───────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: _buildCleanInstitutionalFooter(context, isDark),
            ),

            const SizedBox(height: 90), // Bottom navigation clearance
          ],
        ),
      ),
    );
  }

  // ─── TIGA SHORTCUT UTAMA BERSIH ───────────────────────────────────────────
  Widget _buildThreeCoreShortcuts(BuildContext context, bool isDark) {
    final items = [
      _CoreShortcut(
        title: "Akademik",
        icon: Icons.school_rounded,
        gradientStart: const Color(0xFF2563EB),
        gradientEnd: const Color(0xFF1D4ED8),
        onTap: () => widget.onNavigateTab(1),
      ),
      _CoreShortcut(
        title: "Kelasku",
        icon: Icons.meeting_room_rounded,
        gradientStart: const Color(0xFF059669),
        gradientEnd: const Color(0xFF047857),
        onTap: () => widget.onNavigateTab(2),
      ),
      _CoreShortcut(
        title: "Administrasi",
        icon: Icons.badge_rounded,
        gradientStart: const Color(0xFF7C3AED),
        gradientEnd: const Color(0xFF6D28D9),
        onTap: () => widget.onNavigateTab(3),
      ),
    ];

    return Row(
      children: List.generate(items.length, (index) {
        final item = items[index];
        final isPressed = _pressedShortcutIndex == index;

        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(
              left: index == 0 ? 0 : 6,
              right: index == items.length - 1 ? 0 : 6,
            ),
            child: GestureDetector(
              onTapDown: (_) => setState(() => _pressedShortcutIndex = index),
              onTapUp: (_) {
                setState(() => _pressedShortcutIndex = null);
                item.onTap();
              },
              onTapCancel: () => setState(() => _pressedShortcutIndex = null),
              child: AnimatedScale(
                scale: isPressed ? 0.93 : 1.0,
                duration: const Duration(milliseconds: 120),
                curve: Curves.easeOutCubic,
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 10),
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF131D2E).withOpacity(0.85)
                        : Colors.white,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF334155).withOpacity(0.5)
                          : const Color(0xFFE2E8F0),
                      width: 1.1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: isDark
                            ? Colors.black.withOpacity(0.25)
                            : const Color(0xFF64748B).withOpacity(0.08),
                        blurRadius: 14,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Curated Gradient Squircle Icon Badge
                      Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              item.gradientStart,
                              item.gradientEnd,
                            ],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: item.gradientStart.withOpacity(isDark ? 0.35 : 0.28),
                              blurRadius: 14,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Icon(
                            item.icon,
                            size: 25,
                            color: Colors.white,
                          ),
                        ),
                      ),

                      const SizedBox(height: 12),

                      // Clean Title (Tanpa sub-judul sesuai instruksi)
                      Text(
                        item.title,
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.outfit(
                          color: context.titleColor,
                          fontSize: 13.5,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.2,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      }),
    );
  }

  // ─── INSTITUTIONAL FOOTER BERSIH (TANPA CENTANG) ─────────────────────────
  Widget _buildCleanInstitutionalFooter(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: isDark
            ? Colors.white.withOpacity(0.03)
            : Colors.black.withOpacity(0.02),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark
              ? Colors.white.withOpacity(0.05)
              : Colors.black.withOpacity(0.04),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(9),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Image.asset(
              'assets/images/logo.png',
              width: 22,
              height: 22,
              errorBuilder: (_, _, _) => const Icon(
                Icons.account_balance_rounded,
                color: Color(0xFF10B981),
                size: 20,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Pondok Pesantren Al-Hamid Cinta Mulya",
                  style: GoogleFonts.outfit(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: context.titleColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CoreShortcut {
  final String title;
  final IconData icon;
  final Color gradientStart;
  final Color gradientEnd;
  final VoidCallback onTap;

  _CoreShortcut({
    required this.title,
    required this.icon,
    required this.gradientStart,
    required this.gradientEnd,
    required this.onTap,
  });
}

// ─── MESMERIZING LIVING AURORA MESH PAINTER (NO AI SLOP, NO TACKY DOODLES) ──
// Animasi abstrak gelombang cahaya harmonik yang mengalir hidup, menyatu dengan latar belakang
class _LivingAuroraPainter extends CustomPainter {
  final double progress;
  final bool isDark;

  _LivingAuroraPainter({required this.progress, required this.isDark});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final twoPi = math.pi * 2;

    // 1. Base Ambient Glow Orbs (Soft floating radial light gradients)
    final orb1X = w * (0.35 + 0.18 * math.sin(progress * twoPi));
    final orb1Y = h * (0.30 + 0.12 * math.cos(progress * twoPi));
    final orb1Radius = w * 0.55;

    final orb1Paint = Paint()
      ..shader = ui.Gradient.radial(
        Offset(orb1X, orb1Y),
        orb1Radius,
        [
          (isDark ? const Color(0xFF065F46) : const Color(0xFFA7F3D0)).withOpacity(isDark ? 0.38 : 0.45),
          (isDark ? const Color(0xFF042F2E) : const Color(0xFFCCFBF1)).withOpacity(isDark ? 0.15 : 0.20),
          Colors.transparent,
        ],
        [0.0, 0.55, 1.0],
      );
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), orb1Paint);

    final orb2X = w * (0.75 - 0.20 * math.cos(progress * twoPi));
    final orb2Y = h * (0.45 + 0.15 * math.sin(progress * twoPi));
    final orb2Radius = w * 0.50;

    final orb2Paint = Paint()
      ..shader = ui.Gradient.radial(
        Offset(orb2X, orb2Y),
        orb2Radius,
        [
          (isDark ? const Color(0xFF1E3A8A) : const Color(0xFFBAE6FD)).withOpacity(isDark ? 0.28 : 0.35),
          (isDark ? const Color(0xFF0F172A) : const Color(0xFFE0F2FE)).withOpacity(isDark ? 0.08 : 0.12),
          Colors.transparent,
        ],
        [0.0, 0.50, 1.0],
      );
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), orb2Paint);

    // 2. Harmonically Undulating Fluid Mesh Ribbons (Organic Sine Waves)
    _drawFluidRibbon(
      canvas,
      size,
      amplitude: 28,
      frequency: 1.2,
      phase: progress * twoPi,
      baseY: h * 0.48,
      gradientStart: (isDark ? const Color(0xFF10B981) : const Color(0xFF059669)).withOpacity(isDark ? 0.22 : 0.18),
      gradientEnd: (isDark ? const Color(0xFF06B6D4) : const Color(0xFF0284C7)).withOpacity(0.0),
    );

    _drawFluidRibbon(
      canvas,
      size,
      amplitude: 34,
      frequency: 0.9,
      phase: (progress * twoPi) + math.pi * 0.7,
      baseY: h * 0.62,
      gradientStart: (isDark ? const Color(0xFF0284C7) : const Color(0xFF38BDF8)).withOpacity(isDark ? 0.18 : 0.14),
      gradientEnd: (isDark ? const Color(0xFF8B5CF6) : const Color(0xFF818CF8)).withOpacity(0.0),
    );

    _drawFluidRibbon(
      canvas,
      size,
      amplitude: 22,
      frequency: 1.5,
      phase: (progress * twoPi) + math.pi * 1.3,
      baseY: h * 0.75,
      gradientStart: (isDark ? const Color(0xFF059669) : const Color(0xFF34D399)).withOpacity(isDark ? 0.15 : 0.12),
      gradientEnd: Colors.transparent,
    );
  }

  void _drawFluidRibbon(
    Canvas canvas,
    Size size, {
    required double amplitude,
    required double frequency,
    required double phase,
    required double baseY,
    required Color gradientStart,
    required Color gradientEnd,
  }) {
    final w = size.width;
    final path = Path();
    path.moveTo(0, baseY);

    const steps = 30;
    final dx = w / steps;

    for (int i = 0; i <= steps; i++) {
      final x = i * dx;
      final wave1 = math.sin((x / w * frequency * math.pi * 2) + phase) * amplitude;
      final wave2 = math.cos((x / w * frequency * 1.6 * math.pi) + phase * 0.8) * (amplitude * 0.4);
      final y = baseY + wave1 + wave2;

      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }

    path.lineTo(w, size.height);
    path.lineTo(0, size.height);
    path.close();

    final ribbonPaint = Paint()
      ..shader = ui.Gradient.linear(
        Offset(0, baseY - amplitude),
        Offset(0, size.height),
        [gradientStart, gradientEnd],
      );

    canvas.drawPath(path, ribbonPaint);
  }

  @override
  bool shouldRepaint(covariant _LivingAuroraPainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.isDark != isDark;
  }
}
