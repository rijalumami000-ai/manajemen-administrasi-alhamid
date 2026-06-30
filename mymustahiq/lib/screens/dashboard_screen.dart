import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../services/theme_manager.dart';
import '../services/api_service.dart';
import 'tab_akademik.dart';
import 'tab_kelasku.dart';
import 'tab_administratif.dart';
import 'tab_akun.dart';
import 'notifications_screen.dart';
import 'chat_rooms_screen.dart';
import '../services/push_notification_service.dart';
import '../services/network_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentIndex = 1; // Default to "Kelasku" tab
  int _unreadNotifications = 0;
  int _unreadChats = 0;
  final ApiService _apiService = ApiService();

  final List<Widget> _tabs = const [
    TabAkademik(),
    TabKelasku(),
    TabAdministratif(),
    TabAkun(),
  ];

  static const _tabTitles = [
    'Akademik',
    'Kelasku',
    'Administratif',
    'Akun Saya',
  ];

  @override
  void initState() {
    super.initState();
    _fetchUnreadNotificationsCount();
    _fetchUnreadChatsCount();
    PushNotificationService().registerDeviceToken();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkAndShowWelcomeDialog();
    });
  }

  Future<void> _checkAndShowWelcomeDialog() async {
    const storage = FlutterSecureStorage();
    final welcomeShown = await storage.read(key: 'welcome_dialog_shown');
    if (welcomeShown != 'true') {
      if (!mounted) return;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) {
          return Dialog(
            backgroundColor: context.cardBg,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
              side: BorderSide(color: context.borderColor),
            ),
            child: Container(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Image.asset(
                      'assets/images/logo.png',
                      height: 60,
                      width: 60,
                      errorBuilder: (context, error, stackTrace) =>
                          const Icon(Icons.star_rounded, color: Color(0xFF10B981), size: 40),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Ahlan wa Sahlan!',
                    style: GoogleFonts.outfit(
                      color: context.titleColor,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Selamat datang di aplikasi MyMustahiq.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.outfit(
                      color: const Color(0xFF10B981),
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Aplikasi ini dirancang khusus untuk mempermudah ustadz dan mustahiq dalam mengelola administrasi kelas, jadwal mengajar, input nilai santri, serta koordinasi obrolan secara terintegrasi.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.outfit(
                      color: context.bodyColor,
                      fontSize: 13,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        await storage.write(key: 'welcome_dialog_shown', value: 'true');
                        if (context.mounted) {
                          Navigator.pop(context);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF064E3B),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        elevation: 0,
                      ),
                      child: Text(
                        'MULAI JELAJAHI',
                        style: GoogleFonts.outfit(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
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

  Future<void> _fetchUnreadNotificationsCount() async {
    try {
      final list = await _apiService.getNotifications();
      final count = list.where((n) => n['is_read'] == false).length;
      if (mounted) {
        setState(() {
          _unreadNotifications = count;
        });
      }
    } catch (e) {
      // Ignore background fetch error
    }
  }

  Future<void> _fetchUnreadChatsCount() async {
    try {
      final res = await _apiService.getChatRooms();
      final rooms = res['rooms'] as List<dynamic>? ?? [];
      int unreadCount = 0;
      
      final dashboard = await _apiService.getDashboard();
      final currentGuruId = dashboard['user']?['guru_id'] ?? dashboard['user']?['id'];
      
      const storage = FlutterSecureStorage();

      for (var room in rooms) {
        final lastMsg = room['last_message'];
        if (lastMsg != null) {
          final senderId = lastMsg['sender_id'];
          if (senderId != currentGuruId) {
            final kelasId = room['kelas_id'];
            final lastMsgTimeStr = lastMsg['created_at'];
            if (lastMsgTimeStr != null) {
              final lastMsgTime = DateTime.tryParse(lastMsgTimeStr.toString());
              if (lastMsgTime != null) {
                final lastReadStr = await storage.read(key: 'chat_room_last_read_$kelasId');
                if (lastReadStr == null) {
                  unreadCount++;
                } else {
                  final lastRead = DateTime.tryParse(lastReadStr);
                  if (lastRead == null || lastMsgTime.isAfter(lastRead)) {
                    unreadCount++;
                  }
                }
              }
            }
          }
        }
      }
      if (mounted) {
        setState(() {
          _unreadChats = unreadCount;
        });
      }
    } catch (_) {
      // Ignore background fetch error
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.scaffoldBg,
      appBar: AppBar(
        backgroundColor: context.isDarkMode ? const Color(0xFF0D1527) : Colors.white.withOpacity(0.45),
        elevation: 0,
        centerTitle: true,
        title: const SizedBox.shrink(), // Removed the page title next to chat icon as requested
        leading: Padding(
          padding: const EdgeInsets.all(10.0),
          child: Container(
            decoration: BoxDecoration(
              color: context.isDarkMode ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.04),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Image.asset(
              'assets/images/logo.png',
              fit: BoxFit.contain,
              errorBuilder: (context, error, stackTrace) =>
                  const Icon(Icons.menu_book_rounded, color: Color(0xFF10B981), size: 20),
            ),
          ),
        ),
        actions: [
          StreamBuilder<bool>(
            stream: NetworkService().onConnectionChange,
            initialData: NetworkService().isOnline,
            builder: (context, snapshot) {
              final isOnline = snapshot.data ?? true;
              return Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: (isOnline ? const Color(0xFF10B981) : Colors.redAccent).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: (isOnline ? const Color(0xFF10B981) : Colors.redAccent).withOpacity(0.3),
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: isOnline ? const Color(0xFF10B981) : Colors.redAccent,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      isOnline ? 'Online' : 'Offline',
                      style: GoogleFonts.outfit(
                        color: isOnline ? const Color(0xFF10B981) : Colors.redAccent,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () async {
              await Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const ChatRoomsScreen()),
              );
              _fetchUnreadChatsCount();
            },
            child: Center(
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Icon(
                    Icons.chat_bubble_outline_rounded,
                    color: context.titleColor,
                    size: 22,
                  ),
                  if (_unreadChats > 0)
                    Positioned(
                      right: -3,
                      top: -3,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(
                          color: Colors.redAccent,
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 10,
                          minHeight: 10,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 16),
          GestureDetector(
            onTap: () async {
              await Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const NotificationsScreen()),
              );
              _fetchUnreadNotificationsCount();
            },
            child: Center(
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Icon(
                    Icons.notifications_rounded,
                    color: context.titleColor,
                    size: 24,
                  ),
                  if (_unreadNotifications > 0)
                    Positioned(
                      right: -3,
                      top: -3,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(
                          color: Colors.redAccent,
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 14,
                          minHeight: 14,
                        ),
                        child: Text(
                          '$_unreadNotifications',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 8,
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
          const SizedBox(width: 12),
        ],
      ),
      body: Stack(
        children: [
          // Subtle ambient glow
          if (context.isDarkMode)
            Positioned(
              top: -80,
              right: -80,
              child: Container(
                width: 280,
                height: 280,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFF064E3B).withOpacity(0.12),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
          // Tab content
          SafeArea(
            child: IndexedStack(
              index: _currentIndex,
              children: _tabs,
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        color: Colors.transparent,
        child: SafeArea(
          child: Padding(
            padding: context.isDarkMode 
                ? EdgeInsets.zero 
                : const EdgeInsets.fromLTRB(16, 4, 16, 12),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(context.isDarkMode ? 0 : 24),
              child: BackdropFilter(
                filter: ui.ImageFilter.blur(
                  sigmaX: context.isDarkMode ? 0 : 15.0,
                  sigmaY: context.isDarkMode ? 0 : 15.0,
                ),
                child: Container(
                  decoration: BoxDecoration(
                    color: context.isDarkMode 
                        ? const Color(0xFF0D1527) 
                        : Colors.white.withOpacity(0.55),
                    borderRadius: BorderRadius.circular(context.isDarkMode ? 0 : 24),
                    border: Border.all(
                      color: context.isDarkMode 
                          ? context.borderColor 
                          : Colors.white.withOpacity(0.65),
                      width: context.isDarkMode ? 1 : 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(context.isDarkMode ? 0.3 : 0.03),
                        blurRadius: 20,
                        offset: const Offset(0, -4),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildNavItem(0, Icons.school_rounded, 'Akademik'),
                      _buildNavItem(1, Icons.class_rounded, 'Kelasku'),
                      _buildNavItem(2, Icons.admin_panel_settings_rounded, 'Administratif'),
                      _buildNavItem(3, Icons.person_rounded, 'Akun'),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final isActive = _currentIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: EdgeInsets.symmetric(
          horizontal: isActive ? 16 : 12,
          vertical: 8,
        ),
        decoration: BoxDecoration(
          color: isActive
              ? (context.isDarkMode
                  ? const Color(0xFF064E3B).withOpacity(0.3)
                  : const Color(0xFF10B981).withOpacity(0.12))
              : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 22,
              color: isActive ? const Color(0xFF10B981) : const Color(0xFF64748B),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: GoogleFonts.outfit(
                color: isActive ? const Color(0xFF10B981) : const Color(0xFF64748B),
                fontSize: 10,
                fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
