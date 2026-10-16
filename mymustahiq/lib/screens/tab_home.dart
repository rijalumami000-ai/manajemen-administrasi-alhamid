import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
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
  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 7),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  String _getTimeGreeting() {
    final hour = DateTime.now().hour;
    if (hour >= 3 && hour < 11) return "Selamat Pagi";
    if (hour >= 11 && hour < 15) return "Selamat Siang";
    if (hour >= 15 && hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;
    final screenHeight = MediaQuery.of(context).size.height;
    // Kurang sedikit dari setengah layar: ~38% - 40% dari tinggi layar
    final heroHeight = (screenHeight * 0.38).clamp(240.0, 360.0);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: EdgeInsets.zero,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ─── 1. RUANG KOSONG HERO VISUAL (Ukuran < setengah layar) ───────────
            SizedBox(
              height: heroHeight,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  // Animated Serene Islamic Geometry & Ambient Glow Canvas
                  AnimatedBuilder(
                    animation: _animController,
                    builder: (context, child) {
                      return CustomPaint(
                        painter: _SereneHeroPainter(
                          progress: _animController.value,
                          isDark: isDark,
                        ),
                      );
                    },
                  ),

                  // Floating Content Badge inside the Hero Space
                  SafeArea(
                    bottom: false,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Ambient Breathing Emblem
                          AnimatedBuilder(
                            animation: _animController,
                            builder: (context, child) {
                              final floatOffset = math.sin(_animController.value * math.pi * 2) * 4;
                              return Transform.translate(
                                offset: Offset(0, floatOffset),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? const Color(0xFF0D2818).withOpacity(0.55)
                                        : Colors.white.withOpacity(0.65),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: isDark
                                          ? const Color(0xFF10B981).withOpacity(0.25)
                                          : const Color(0xFF10B981).withOpacity(0.2),
                                      width: 1,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: const Color(0xFF10B981).withOpacity(isDark ? 0.12 : 0.08),
                                        blurRadius: 20,
                                        spreadRadius: 1,
                                      ),
                                    ],
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Container(
                                        width: 8,
                                        height: 8,
                                        decoration: const BoxDecoration(
                                          color: Color(0xFF10B981),
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        "Pondok Pesantren Al-Hamid Cinta Mulya",
                                        style: GoogleFonts.outfit(
                                          color: isDark ? const Color(0xFF6EE7B7) : const Color(0xFF065F46),
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          letterSpacing: 0.3,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),

                          const SizedBox(height: 18),

                          // Live Clock & Serenity Quotation
                          StreamBuilder(
                            stream: Stream.periodic(const Duration(seconds: 1)),
                            builder: (context, snapshot) {
                              final now = DateTime.now();
                              final timeStr = DateFormat('HH:mm').format(now);
                              final dateStr = DateFormat('EEEE, d MMMM yyyy', 'id_ID').format(now);

                              return Column(
                                children: [
                                  Text(
                                    timeStr,
                                    style: GoogleFonts.outfit(
                                      fontSize: 42,
                                      fontWeight: FontWeight.w700,
                                      color: context.titleColor,
                                      letterSpacing: -1,
                                      height: 1.05,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    dateStr,
                                    style: GoogleFonts.outfit(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                      color: context.subTitleColor,
                                    ),
                                  ),
                                ],
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Bottom subtle fade to blend with greeting section
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 36,
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
                ],
              ),
            ),

            // ─── 2. UCAPAN SELAMAT DATANG ───────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        "Assalamu'alaikum",
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF10B981),
                          letterSpacing: 0.2,
                        ),
                      ),
                      const SizedBox(width: 6),
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
                  const SizedBox(height: 4),
                  Text(
                    "Selamat datang di Alhamid One",
                    style: GoogleFonts.outfit(
                      fontSize: 21,
                      fontWeight: FontWeight.w800,
                      color: context.titleColor,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "Satu platform untuk seluruh kebutuhan pesantren",
                    style: GoogleFonts.outfit(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: context.bodyColor,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // ─── 3. TOMBOL SHORTCUT (Maksimal 4 per baris, Frame Glass) ─────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  // Row 1: Akademik, Kelasku, Administratif, Akun (4 item)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildShortcutButton(
                        context: context,
                        icon: Icons.school_rounded,
                        label: 'Akademik',
                        iconColor: const Color(0xFF3B82F6),
                        onTap: () => widget.onNavigateTab(1),
                      ),
                      _buildShortcutButton(
                        context: context,
                        icon: Icons.class_rounded,
                        label: 'Kelasku',
                        iconColor: const Color(0xFF10B981),
                        onTap: () => widget.onNavigateTab(2),
                      ),
                      _buildShortcutButton(
                        context: context,
                        icon: Icons.admin_panel_settings_rounded,
                        label: 'Administratif',
                        iconColor: const Color(0xFF6366F1),
                        onTap: () => widget.onNavigateTab(3),
                      ),
                      _buildShortcutButton(
                        context: context,
                        icon: Icons.person_rounded,
                        label: 'Akun',
                        iconColor: const Color(0xFF8B5CF6),
                        onTap: () => widget.onNavigateTab(4),
                      ),
                    ],
                  ),

                  const SizedBox(height: 18),

                  // Row 2: Chat, Notifikasi (2 item, rapi & proporsional)
                  Row(
                    children: [
                      _buildShortcutButton(
                        context: context,
                        icon: Icons.chat_bubble_outline_rounded,
                        label: 'Chat',
                        iconColor: const Color(0xFF06B6D4),
                        badgeCount: widget.unreadChats,
                        onTap: widget.onOpenChat,
                      ),
                      const SizedBox(width: 14),
                      _buildShortcutButton(
                        context: context,
                        icon: Icons.notifications_rounded,
                        label: 'Notifikasi',
                        iconColor: const Color(0xFFF43F5E),
                        badgeCount: widget.unreadNotifications,
                        onTap: widget.onOpenNotifications,
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 36),
          ],
        ),
      ),
    );
  }

  // ─── FRAME KOTAK EFEK GLASS/BLUR UNTUK ICON SHORTCUT ────────────────────────
  Widget _buildShortcutButton({
    required BuildContext context,
    required IconData icon,
    required String label,
    required Color iconColor,
    required VoidCallback onTap,
    int badgeCount = 0,
  }) {
    final isDark = context.isDarkMode;

    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Glass/Translucent Effect Frame
            ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: BackdropFilter(
                filter: ui.ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                child: Container(
                  width: 58,
                  height: 58,
                  decoration: BoxDecoration(
                    color: isDark
                        ? iconColor.withOpacity(0.12)
                        : iconColor.withOpacity(0.09),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: isDark
                          ? iconColor.withOpacity(0.32)
                          : iconColor.withOpacity(0.24),
                      width: 1.2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: iconColor.withOpacity(isDark ? 0.2 : 0.12),
                        blurRadius: 14,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Stack(
                    clipBehavior: Clip.none,
                    alignment: Alignment.center,
                    children: [
                      Icon(
                        icon,
                        size: 26,
                        color: iconColor,
                      ),
                      if (badgeCount > 0)
                        Positioned(
                          top: 4,
                          right: 4,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.redAccent,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                            child: Text(
                              badgeCount > 99 ? '99+' : '$badgeCount',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            // Label
            Text(
              label,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.outfit(
                color: context.titleColor,
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── CUSTOM PAINTER: SERENE ISLAMIC GEOMETRY & AMBIENT NUR ──────────────────
class _SereneHeroPainter extends CustomPainter {
  final double progress;
  final bool isDark;

  _SereneHeroPainter({required this.progress, required this.isDark});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // 1. Subtle radial ambient glow in the center-top
    final glowPaint = Paint()
      ..shader = ui.Gradient.radial(
        Offset(w * 0.5, h * 0.35),
        w * 0.65,
        [
          (isDark ? const Color(0xFF0F3A22) : const Color(0xFFD1FAE5)).withOpacity(0.55),
          (isDark ? const Color(0xFF070B13) : const Color(0xFFF0FDF8)).withOpacity(0.0),
        ],
      );
    canvas.drawRect(Rect.fromLTWH(0, 0, w, h), glowPaint);

    // 2. Floating subtle Nur/Star particles
    final rnd = math.Random(42);
    final particlePaint = Paint()..style = PaintingStyle.fill;

    for (int i = 0; i < 22; i++) {
      final basePx = rnd.nextDouble() * w;
      final basePy = rnd.nextDouble() * h;
      final speed = 0.5 + rnd.nextDouble();
      final currentY = (basePy - (progress * 30 * speed)) % h;
      final alpha = (0.2 + 0.4 * math.sin((progress + rnd.nextDouble()) * math.pi * 2)).clamp(0.05, 0.75);

      particlePaint.color = (isDark ? const Color(0xFF6EE7B7) : const Color(0xFF10B981)).withOpacity(alpha);
      final radius = 1.0 + rnd.nextDouble() * 1.8;
      canvas.drawCircle(Offset(basePx, currentY), radius, particlePaint);
    }

    // 3. Elegant Sacred Arch/Dome Silhouette (Subtle curved lines)
    final archPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..color = (isDark ? const Color(0xFF10B981) : const Color(0xFF059669)).withOpacity(0.14);

    final centerX = w * 0.5;
    final archTopY = h * 0.16 + math.sin(progress * math.pi * 2) * 3;
    final archWidth = w * 0.42;

    final path = Path();
    path.moveTo(centerX - archWidth, h * 0.95);
    path.lineTo(centerX - archWidth, h * 0.45);
    path.cubicTo(
      centerX - archWidth, archTopY + 20,
      centerX - 20, archTopY,
      centerX, archTopY - 14,
    );
    path.cubicTo(
      centerX + 20, archTopY,
      centerX + archWidth, archTopY + 20,
      centerX + archWidth, h * 0.45,
    );
    path.lineTo(centerX + archWidth, h * 0.95);

    canvas.drawPath(path, archPaint);

    // Secondary inner arch
    final innerPath = Path();
    final innerW = archWidth * 0.82;
    final innerTopY = archTopY + 18;
    innerPath.moveTo(centerX - innerW, h * 0.95);
    innerPath.lineTo(centerX - innerW, h * 0.5);
    innerPath.cubicTo(
      centerX - innerW, innerTopY + 16,
      centerX - 16, innerTopY,
      centerX, innerTopY - 10,
    );
    innerPath.cubicTo(
      centerX + 16, innerTopY,
      centerX + innerW, innerTopY + 16,
      centerX + innerW, h * 0.5,
    );
    innerPath.lineTo(centerX + innerW, h * 0.95);

    archPaint.strokeWidth = 0.8;
    archPaint.color = archPaint.color.withOpacity(0.08);
    canvas.drawPath(innerPath, archPaint);
  }

  @override
  bool shouldRepaint(covariant _SereneHeroPainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.isDark != isDark;
  }
}
