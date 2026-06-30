import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  late AnimationController _logoController;
  late Animation<double> _logoScale;
  late Animation<double> _logoFade;

  late AnimationController _glowController;
  late Animation<double> _glowScale;

  late AnimationController _progressController;
  late Animation<double> _progressValue;

  String _loadingText = 'Menghubungkan ke server...';
  Timer? _statusTimer;

  @override
  void initState() {
    super.initState();

    // 1. Logo scale and fade-in entry animation
    _logoController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    
    _logoScale = Tween<double>(begin: 0.7, end: 1.0).animate(
      CurvedAnimation(parent: _logoController, curve: Curves.elasticOut),
    );
    
    _logoFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _logoController, curve: const Interval(0.0, 0.6, curve: Curves.easeIn)),
    );

    _logoController.forward();

    // 2. Background glow breathing animation
    _glowController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat(reverse: true);

    _glowScale = Tween<double>(begin: 0.9, end: 1.15).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeInOut),
    );

    // 3. Smooth loading bar filling up over 5 seconds
    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    );

    _progressValue = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _progressController, curve: Curves.linear),
    );

    _progressController.forward();

    // 4. Dynamic status text timer
    _statusTimer = Timer(const Duration(milliseconds: 1500), () {
      if (mounted) {
        setState(() {
          _loadingText = 'Memuat data ustadz...';
        });
      }
      _statusTimer = Timer(const Duration(milliseconds: 1500), () {
        if (mounted) {
          setState(() {
            _loadingText = 'Menyelaraskan jadwal...';
          });
        }
        _statusTimer = Timer(const Duration(milliseconds: 1200), () {
          if (mounted) {
            setState(() {
              _loadingText = 'Hampir selesai...';
            });
          }
        });
      });
    });
  }

  @override
  void dispose() {
    _logoController.dispose();
    _glowController.dispose();
    _progressController.dispose();
    _statusTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF070B13),
      body: Stack(
        children: [
          // Background Glow Circle 1 (Top Right)
          Positioned(
            top: -100,
            right: -100,
            child: AnimatedBuilder(
              animation: _glowScale,
              builder: (context, child) {
                return Container(
                  width: 350 * _glowScale.value,
                  height: 350 * _glowScale.value,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFF10B981).withOpacity(0.06),
                  ),
                );
              },
            ),
          ),

          // Background Glow Circle 2 (Bottom Left)
          Positioned(
            bottom: -150,
            left: -150,
            child: AnimatedBuilder(
              animation: _glowScale,
              builder: (context, child) {
                return Container(
                  width: 400 * _glowScale.value,
                  height: 400 * _glowScale.value,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFF065F46).withOpacity(0.04),
                  ),
                );
              },
            ),
          ),

          // Content Wrapper
          SafeArea(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Spacer(flex: 3),

                  // App Logo & Glow
                  FadeTransition(
                    opacity: _logoFade,
                    child: ScaleTransition(
                      scale: _logoScale,
                      child: Container(
                        width: 140,
                        height: 140,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(30),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF10B981).withOpacity(0.25),
                              blurRadius: 25,
                              spreadRadius: 2,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(30),
                          child: Image.asset(
                            'assets/images/logo.png',
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Title (MyMustahiq)
                  FadeTransition(
                    opacity: _logoFade,
                    child: Text(
                      'MyMustahiq',
                      style: GoogleFonts.outfit(
                        color: Colors.white,
                        fontSize: 30,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Subtitle container (Manajemen Administrasi Pesantren)
                  FadeTransition(
                    opacity: _logoFade,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.08),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: const Color(0xFF10B981).withOpacity(0.2),
                          width: 0.8,
                        ),
                      ),
                      child: Text(
                        'Manajemen Administrasi Pesantren',
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF10B981),
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),
                  ),

                  const Spacer(flex: 2),

                  // Animated Loading Bar
                  Container(
                    width: 220,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(2),
                    ),
                    child: AnimatedBuilder(
                      animation: _progressValue,
                      builder: (context, child) {
                        return Align(
                          alignment: Alignment.centerLeft,
                          child: Container(
                            width: 220 * _progressValue.value,
                            height: 4,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF10B981), Color(0xFF34D399)],
                              ),
                              borderRadius: BorderRadius.circular(2),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF10B981).withOpacity(0.3),
                                  blurRadius: 6,
                                  spreadRadius: 1,
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Dynamic Loading Status Text
                  SizedBox(
                    height: 20,
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 300),
                      transitionBuilder: (child, anim) => FadeTransition(
                        opacity: anim,
                        child: child,
                      ),
                      child: Text(
                        _loadingText,
                        key: ValueKey<String>(_loadingText),
                        style: GoogleFonts.outfit(
                          color: Colors.white70.withOpacity(0.6),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),

                  const Spacer(flex: 3),

                  // Footer Text
                  Text(
                    'PESANTREN AL-HAMID',
                    style: GoogleFonts.outfit(
                      color: Colors.white38,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
