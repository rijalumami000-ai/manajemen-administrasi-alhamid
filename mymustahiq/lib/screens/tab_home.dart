import 'dart:async';
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
  late Timer _timer;
  DateTime _currentTime = DateTime.now();
  int? _pressedShortcutIndex;

  @override
  void initState() {
    super.initState();
    // Update live clock every second without any locale dependency crashes
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _currentTime = DateTime.now();
        });
      }
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  // Crash-proof Indonesian time greeting
  String _getTimeGreeting() {
    final hour = _currentTime.hour;
    if (hour >= 3 && hour < 11) return "Selamat Pagi";
    if (hour >= 11 && hour < 15) return "Selamat Siang";
    if (hour >= 15 && hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  }

  // 100% zero-dependency, crash-proof native Indonesian date formatter
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

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: EdgeInsets.only(
          top: topPadding + 8,
          bottom: 110, // clearance for bottom navigation bar
          left: 18,
          right: 18,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ─── 1. EXECUTIVE HERO SPACE (Clean, Modern, No AI-Slop) ──────────
            _buildExecutiveHeroCard(context, isDark),

            const SizedBox(height: 22),

            // ─── 2. PROFESSIONAL GREETING & PLATFORM IDENTITY ─────────────────
            _buildGreetingHeader(context, isDark),

            const SizedBox(height: 22),

            // ─── 3. SECTION TITLE: MODUL & LAYANAN CEPAT ──────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Row(
                children: [
                  Container(
                    width: 4,
                    height: 18,
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    "Layanan & Modul Utama",
                    style: GoogleFonts.outfit(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: context.titleColor,
                      letterSpacing: -0.2,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.04),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      "6 Modul Aktif",
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // ─── 4. EXECUTIVE SHORTCUT LAUNCHER TILES (3x2 Balanced Bento Grid)
            _buildShortcutGrid(context, isDark),

            const SizedBox(height: 24),

            // ─── 5. INSTITUTIONAL FOOTER BADGE (Pesantren Al-Hamid) ────────────
            _buildInstitutionalCard(context, isDark),
          ],
        ),
      ),
    );
  }

  // ─── HERO CARD: EXECUTIVE DIGITAL COCKPIT ─────────────────────────────────
  Widget _buildExecutiveHeroCard(BuildContext context, bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? [
                  const Color(0xFF0F172A),
                  const Color(0xFF0B1120),
                  const Color(0xFF064E3B).withOpacity(0.35),
                ]
              : [
                  Colors.white,
                  const Color(0xFFF8FAFC),
                  const Color(0xFFECFDF5),
                ],
        ),
        border: Border.all(
          color: isDark
              ? const Color(0xFF334155).withOpacity(0.6)
              : const Color(0xFFE2E8F0),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: isDark
                ? Colors.black.withOpacity(0.4)
                : const Color(0xFF0F172A).withOpacity(0.07),
            blurRadius: 28,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Status Chips
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // System Online indicator
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF064E3B).withOpacity(0.6)
                      : const Color(0xFFD1FAE5),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: const Color(0xFF10B981).withOpacity(isDark ? 0.4 : 0.3),
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: const BoxDecoration(
                        color: Color(0xFF10B981),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Color(0xFF10B981),
                            blurRadius: 6,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      "SISTEM AKTIF",
                      style: GoogleFonts.outfit(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w700,
                        color: isDark ? const Color(0xFF6EE7B7) : const Color(0xFF047857),
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),

              // Academic Semester Chip
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: isDark
                      ? Colors.white.withOpacity(0.06)
                      : Colors.black.withOpacity(0.04),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isDark ? Colors.white.withOpacity(0.1) : Colors.black.withOpacity(0.06),
                    width: 1,
                  ),
                ),
                child: Text(
                  "Semester Genap • 2025/2026",
                  style: GoogleFonts.outfit(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 18),

          // Centerpiece: Big Digital Live Clock & Date
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
              const SizedBox(width: 6),
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

          const SizedBox(height: 4),

          // Crash-proof Indonesian Date
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

          const SizedBox(height: 16),

          // Divider
          Container(
            height: 1,
            color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.06),
          ),

          const SizedBox(height: 12),

          // Bottom Quick System Glance Strip
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildGlanceMetric(
                label: "Pesantren",
                value: "Al-Hamid",
                isDark: isDark,
              ),
              Container(width: 1, height: 24, color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.06)),
              _buildGlanceMetric(
                label: "Madrasah",
                value: "Diniyah",
                isDark: isDark,
              ),
              Container(width: 1, height: 24, color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.06)),
              _buildGlanceMetric(
                label: "Database",
                value: "VPS Online",
                valueColor: const Color(0xFF10B981),
                isDark: isDark,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildGlanceMetric({
    required String label,
    required String value,
    Color? valueColor,
    required bool isDark,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: GoogleFonts.outfit(
            fontSize: 9.5,
            fontWeight: FontWeight.w600,
            color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 1),
        Text(
          value,
          style: GoogleFonts.outfit(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: valueColor ?? (isDark ? const Color(0xFFE2E8F0) : const Color(0xFF1E293B)),
          ),
        ),
      ],
    );
  }

  // ─── GREETING HEADER ──────────────────────────────────────────────────────
  Widget _buildGreetingHeader(BuildContext context, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                "Assalamu'alaikum",
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF10B981),
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
          const SizedBox(height: 3),
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
            "Pusat kendali operasional akademik, santri, dan tata usaha pesantren.",
            style: GoogleFonts.outfit(
              fontSize: 12.5,
              fontWeight: FontWeight.w400,
              color: context.bodyColor,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  // ─── 3x2 BALANCED BENTO SHORTCUT MATRIX ───────────────────────────────────
  Widget _buildShortcutGrid(BuildContext context, bool isDark) {
    final shortcuts = [
      _ShortcutItem(
        icon: Icons.school_rounded,
        title: "Akademik",
        subtitle: "Jadwal & Nilai",
        gradientStart: const Color(0xFF2563EB),
        gradientEnd: const Color(0xFF1D4ED8),
        onTap: () => widget.onNavigateTab(1),
      ),
      _ShortcutItem(
        icon: Icons.meeting_room_rounded,
        title: "Kelasku",
        subtitle: "Presensi & Bab",
        gradientStart: const Color(0xFF059669),
        gradientEnd: const Color(0xFF047857),
        onTap: () => widget.onNavigateTab(2),
      ),
      _ShortcutItem(
        icon: Icons.badge_rounded,
        title: "Administrasi",
        subtitle: "Buku & Surat",
        gradientStart: const Color(0xFF7C3AED),
        gradientEnd: const Color(0xFF6D28D9),
        onTap: () => widget.onNavigateTab(3),
      ),
      _ShortcutItem(
        icon: Icons.forum_rounded,
        title: "Chat Asatidz",
        subtitle: "Ruang Diskusi",
        gradientStart: const Color(0xFF0284C7),
        gradientEnd: const Color(0xFF0369A1),
        badgeCount: widget.unreadChats,
        onTap: widget.onOpenChat,
      ),
      _ShortcutItem(
        icon: Icons.notifications_active_rounded,
        title: "Notifikasi",
        subtitle: "Pemberitahuan",
        gradientStart: const Color(0xFFE11D48),
        gradientEnd: const Color(0xFFBE123C),
        badgeCount: widget.unreadNotifications,
        onTap: widget.onOpenNotifications,
      ),
      _ShortcutItem(
        icon: Icons.person_rounded,
        title: "Akun Profil",
        subtitle: "Ustadz & Akses",
        gradientStart: const Color(0xFFD97706),
        gradientEnd: const Color(0xFFB45309),
        onTap: () => widget.onNavigateTab(4),
      ),
    ];

    return Column(
      children: [
        // Row 1: Akademik, Kelasku, Administrasi
        Row(
          children: [
            Expanded(child: _buildBentoShortcutTile(0, shortcuts[0], context, isDark)),
            const SizedBox(width: 10),
            Expanded(child: _buildBentoShortcutTile(1, shortcuts[1], context, isDark)),
            const SizedBox(width: 10),
            Expanded(child: _buildBentoShortcutTile(2, shortcuts[2], context, isDark)),
          ],
        ),

        const SizedBox(height: 10),

        // Row 2: Chat, Notifikasi, Akun Profil
        Row(
          children: [
            Expanded(child: _buildBentoShortcutTile(3, shortcuts[3], context, isDark)),
            const SizedBox(width: 10),
            Expanded(child: _buildBentoShortcutTile(4, shortcuts[4], context, isDark)),
            const SizedBox(width: 10),
            Expanded(child: _buildBentoShortcutTile(5, shortcuts[5], context, isDark)),
          ],
        ),
      ],
    );
  }

  // Individual Bento Tile with Micro-press Physics and Executive Dual-Tone Badge
  Widget _buildBentoShortcutTile(
    int index,
    _ShortcutItem item,
    BuildContext context,
    bool isDark,
  ) {
    final isPressed = _pressedShortcutIndex == index;

    return GestureDetector(
      onTapDown: (_) => setState(() => _pressedShortcutIndex = index),
      onTapUp: (_) {
        setState(() => _pressedShortcutIndex = null);
        item.onTap();
      },
      onTapCancel: () => setState(() => _pressedShortcutIndex = null),
      child: AnimatedScale(
        scale: isPressed ? 0.94 : 1.0,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOutCubic,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
          decoration: BoxDecoration(
            color: isDark
                ? const Color(0xFF131D2E).withOpacity(0.85)
                : Colors.white,
            borderRadius: BorderRadius.circular(20),
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
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Icon Badge with Accent Linear Gradient & Soft Glow
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 48,
                    height: 48,
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
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Icon(
                        item.icon,
                        size: 24,
                        color: Colors.white,
                      ),
                    ),
                  ),

                  // Unread Badge Pill
                  if (item.badgeCount > 0)
                    Positioned(
                      top: -4,
                      right: -4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEF4444),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: isDark ? const Color(0xFF0F172A) : Colors.white,
                            width: 1.5,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFEF4444).withOpacity(0.5),
                              blurRadius: 6,
                            ),
                          ],
                        ),
                        constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
                        child: Text(
                          item.badgeCount > 99 ? '99+' : '${item.badgeCount}',
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              ),

              const SizedBox(height: 10),

              // Title
              Text(
                item.title,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.outfit(
                  color: context.titleColor,
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.2,
                ),
              ),

              const SizedBox(height: 2),

              // Subtitle
              Text(
                item.subtitle,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.outfit(
                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── INSTITUTIONAL IDENTITY FOOTER ─────────────────────────────────────────
  Widget _buildInstitutionalCard(BuildContext context, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark
            ? Colors.white.withOpacity(0.04)
            : Colors.black.withOpacity(0.02),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark
              ? Colors.white.withOpacity(0.06)
              : Colors.black.withOpacity(0.05),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.verified_rounded,
              color: Color(0xFF10B981),
              size: 22,
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
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: context.titleColor,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  "Madrasah Diniyah Takmiliyah Wustha & Ulya • Jalur Resmi",
                  style: GoogleFonts.outfit(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w500,
                    color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
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

class _ShortcutItem {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color gradientStart;
  final Color gradientEnd;
  final int badgeCount;
  final VoidCallback onTap;

  _ShortcutItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.gradientStart,
    required this.gradientEnd,
    this.badgeCount = 0,
    required this.onTap,
  });
}
