import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'services/api_service.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';

import 'services/theme_manager.dart';
import 'services/push_notification_service.dart';
import 'services/network_service.dart';

import 'widgets/glass_background.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ThemeManager().init();
  await PushNotificationService().initialize();
  await NetworkService().initialize();
  runApp(const MyMustahiqApp());
}

class MyMustahiqApp extends StatelessWidget {
  const MyMustahiqApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: ThemeManager(),
      builder: (context, _) {
        return MaterialApp(
          navigatorKey: navigatorKey,
          title: 'MyMustahiq',
          debugShowCheckedModeBanner: false,
          themeMode: ThemeManager().themeMode,
          theme: ThemeData(
            brightness: Brightness.light,
            primaryColor: const Color(0xFF10B981),
            scaffoldBackgroundColor: Colors.transparent,
            cardColor: Colors.white.withOpacity(0.55),
            textTheme: GoogleFonts.outfitTextTheme(ThemeData.light().textTheme),
            useMaterial3: true,
          ),
          darkTheme: ThemeData(
            brightness: Brightness.dark,
            primaryColor: const Color(0xFF10B981),
            scaffoldBackgroundColor: const Color(0xFF070B13),
            cardColor: const Color(0xFF131C2E),
            textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme),
            useMaterial3: true,
          ),
          builder: (context, child) {
            return GlassBackground(child: child ?? const SizedBox());
          },
          home: const AuthenticationWrapper(),
        );
      },
    );
  }
}

class AuthenticationWrapper extends StatefulWidget {
  const AuthenticationWrapper({super.key});

  @override
  State<AuthenticationWrapper> createState() => _AuthenticationWrapperState();
}

class _AuthenticationWrapperState extends State<AuthenticationWrapper> {
  final ApiService _apiService = ApiService();
  bool _checkingAuth = true;
  bool _isAuthenticated = false;

  @override
  void initState() {
    super.initState();
    _checkTokenValidity();
  }

  Future<void> _checkTokenValidity() async {
    print('🔑 [Auth] Checking token validity...');
    final token = await _apiService.getToken();
    if (token == null) {
      print('🔑 [Auth] No stored token found. Directing to login screen.');
      if (mounted) {
        setState(() {
          _isAuthenticated = false;
          _checkingAuth = false;
        });
      }
      return;
    }

    print('🔑 [Auth] Token found: ${token.substring(0, token.length > 10 ? 10 : token.length)}... Testing connection and validity...');
    try {
      // Test server connection and token validity by fetching dashboard
      final start = DateTime.now();
      final dashboard = await _apiService.getDashboard();
      final duration = DateTime.now().difference(start);
      print('🔑 [Auth] Connection successful! Dashboard fetched in ${duration.inMilliseconds}ms.');
      print('🔑 [Auth] Active User Info: ${dashboard['guruInfo']?['nama'] ?? 'Unknown'}. Opening dashboard...');
      if (mounted) {
        setState(() {
          _isAuthenticated = true;
          _checkingAuth = false;
        });
      }
    } catch (e) {
      print('🔑 [Auth] Error or token invalid (server offline/expired): $e');
      print('🔑 [Auth] Directing to login screen as fallback.');
      if (mounted) {
        setState(() {
          // Fallback to login screen
          _isAuthenticated = false;
          _checkingAuth = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_checkingAuth) {
      return const InAppSplashScreen();
    }

    return _isAuthenticated ? const DashboardScreen() : const LoginScreen();
  }
}

class InAppSplashScreen extends StatefulWidget {
  const InAppSplashScreen({super.key});

  @override
  State<InAppSplashScreen> createState() => _InAppSplashScreenState();
}

class _InAppSplashScreenState extends State<InAppSplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _mainController;
  late AnimationController _shimmerController;
  late AnimationController _pulseController;

  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<double> _slideAnimation;
  late Animation<double> _taglineFade;
  late Animation<double> _progressAnimation;

  @override
  void initState() {
    super.initState();

    _mainController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    );

    _shimmerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.0, 0.5, curve: Curves.easeOut),
      ),
    );

    _scaleAnimation = Tween<double>(begin: 0.6, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.0, 0.6, curve: Curves.elasticOut),
      ),
    );

    _slideAnimation = Tween<double>(begin: 40.0, end: 0.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.3, 0.8, curve: Curves.easeOutCubic),
      ),
    );

    _taglineFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.5, 1.0, curve: Curves.easeOut),
      ),
    );

    _progressAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _mainController,
        curve: const Interval(0.4, 1.0, curve: Curves.easeInOut),
      ),
    );

    _mainController.forward();
  }

  @override
  void dispose() {
    _mainController.dispose();
    _shimmerController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Scaffold(
      backgroundColor: const Color(0xFF070B13),
      body: Stack(
        fit: StackFit.expand,
        children: [
          // ── Background gradient fill ──
          Container(
            decoration: const BoxDecoration(
              gradient: RadialGradient(
                center: Alignment(0.0, -0.3),
                radius: 1.2,
                colors: [
                  Color(0xFF0D1B2A),
                  Color(0xFF070B13),
                ],
              ),
            ),
          ),

          // ── Top-right large glow ──
          Positioned(
            top: -size.height * 0.15,
            right: -size.width * 0.25,
            child: AnimatedBuilder(
              animation: _pulseController,
              builder: (context, child) => Opacity(
                opacity: 0.04 + _pulseController.value * 0.04,
                child: Container(
                  width: size.width * 0.9,
                  height: size.width * 0.9,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        const Color(0xFF10B981),
                        const Color(0xFF10B981).withOpacity(0.0),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          // ── Bottom-left glow ──
          Positioned(
            bottom: -size.height * 0.15,
            left: -size.width * 0.3,
            child: AnimatedBuilder(
              animation: _pulseController,
              builder: (context, child) => Opacity(
                opacity: 0.03 + _pulseController.value * 0.03,
                child: Container(
                  width: size.width * 0.8,
                  height: size.width * 0.8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        const Color(0xFF0EA5E9),
                        const Color(0xFF0EA5E9).withOpacity(0.0),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          // ── Center content ──
          Center(
            child: AnimatedBuilder(
              animation: _mainController,
              builder: (context, child) {
                return Opacity(
                  opacity: _fadeAnimation.value,
                  child: Transform.translate(
                    offset: Offset(0, _slideAnimation.value * 0.5),
                    child: child,
                  ),
                );
              },
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo container with glow ring
                  AnimatedBuilder(
                    animation: _mainController,
                    builder: (context, child) => Transform.scale(
                      scale: _scaleAnimation.value,
                      child: child,
                    ),
                    child: AnimatedBuilder(
                      animation: _pulseController,
                      builder: (context, _) => Container(
                        width: 150,
                        height: 150,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(40),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF10B981).withOpacity(
                                  0.25 + _pulseController.value * 0.2),
                              blurRadius: 40 + _pulseController.value * 20,
                              spreadRadius: 5,
                            ),
                            BoxShadow(
                              color: const Color(0xFF10B981)
                                  .withOpacity(0.08),
                              blurRadius: 80,
                              spreadRadius: 20,
                            ),
                          ],
                          border: Border.all(
                            color: const Color(0xFF10B981).withOpacity(
                                0.2 + _pulseController.value * 0.15),
                            width: 2,
                          ),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(38),
                          child: Image.asset(
                            'assets/images/app_icon.png',
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 36),

                  // App name with shimmer
                  AnimatedBuilder(
                    animation: _shimmerController,
                    builder: (context, _) {
                      return ShaderMask(
                        shaderCallback: (bounds) {
                          return LinearGradient(
                            colors: const [
                              Color(0xFFFFFFFF),
                              Color(0xFF10B981),
                              Color(0xFFFFFFFF),
                            ],
                            stops: [
                              (_shimmerController.value - 0.3)
                                  .clamp(0.0, 1.0),
                              _shimmerController.value,
                              (_shimmerController.value + 0.3)
                                  .clamp(0.0, 1.0),
                            ],
                          ).createShader(bounds);
                        },
                        child: Text(
                          'MyMustahiq',
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontSize: 36,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 12),

                  // Tagline badge
                  AnimatedBuilder(
                    animation: _mainController,
                    builder: (context, child) => Opacity(
                      opacity: _taglineFade.value,
                      child: Transform.translate(
                        offset: Offset(0, _slideAnimation.value),
                        child: child,
                      ),
                    ),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 6),
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: const Color(0xFF10B981).withOpacity(0.3),
                        ),
                        borderRadius: BorderRadius.circular(20),
                        color: const Color(0xFF10B981).withOpacity(0.08),
                      ),
                      child: Text(
                        'Manajemen Administrasi Pesantren',
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF10B981),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Bottom: progress + pesantren name ──
          Positioned(
            bottom: 60,
            left: 40,
            right: 40,
            child: AnimatedBuilder(
              animation: _mainController,
              builder: (context, child) => Opacity(
                opacity: _taglineFade.value,
                child: child,
              ),
              child: Column(
                children: [
                  // Progress bar
                  AnimatedBuilder(
                    animation: _progressAnimation,
                    builder: (context, _) => Column(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: Stack(
                            children: [
                              Container(
                                width: 180,
                                height: 3,
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.07),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                              ),
                              Container(
                                width: 180 * _progressAnimation.value,
                                height: 3,
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [
                                      Color(0xFF10B981),
                                      Color(0xFF34D399),
                                    ],
                                  ),
                                  borderRadius: BorderRadius.circular(4),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF10B981)
                                          .withOpacity(0.6),
                                      blurRadius: 6,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          'Memuat data ustadz...',
                          style: GoogleFonts.outfit(
                            color: Colors.white.withOpacity(0.3),
                            fontSize: 12,
                            letterSpacing: 0.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),
                  Text(
                    '✦  PESANTREN AL-HAMID  ✦',
                    style: GoogleFonts.outfit(
                      color: Colors.white.withOpacity(0.12),
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 3.0,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

