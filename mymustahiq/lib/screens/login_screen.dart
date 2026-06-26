import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';
import 'dashboard_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;
  String? _errorMessage;

  final ApiService _apiService = ApiService();
  final _storage = const FlutterSecureStorage();
  final _auth = LocalAuthentication();
  bool _biometricAvailable = false;
  bool _biometricEnabled = false;

  @override
  void initState() {
    super.initState();
    _checkBiometricLogin();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _checkBiometricLogin() async {
    try {
      final canCheck = await _auth.canCheckBiometrics;
      final isSupported = await _auth.isDeviceSupported();
      final bioPref = await _storage.read(key: 'biometric_enabled');

      if (mounted) {
        setState(() {
          _biometricAvailable = canCheck && isSupported;
          _biometricEnabled = bioPref == 'true';
        });
      }
    } catch (_) {}
  }

  Future<void> _handleLogin() async {
    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();

    if (username.isEmpty || password.isEmpty) {
      setState(() {
        _errorMessage = 'Username dan password wajib diisi.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await _apiService.login(username, password);
      // Save credentials securely for biometric auto-login
      await _storage.write(key: 'saved_username', value: username);
      await _storage.write(key: 'saved_password', value: password);
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const DashboardScreen()),
        );
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _handleBiometricLogin() async {
    try {
      final didAuth = await _auth.authenticate(
        localizedReason: 'Login ke MyMustahiq menggunakan biometrik',
        biometricOnly: true,
      );

      if (!didAuth) return;

      // Retrieve saved credentials
      final savedUser = await _storage.read(key: 'saved_username');
      final savedPass = await _storage.read(key: 'saved_password');

      if (savedUser == null || savedPass == null) {
        setState(() {
          _errorMessage = 'Silakan login manual terlebih dahulu, lalu aktifkan biometrik di menu Akun.';
        });
        return;
      }

      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });

      await _apiService.login(savedUser, savedPass);
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const DashboardScreen()),
        );
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;
    return Scaffold(
      backgroundColor: context.scaffoldBg,
      body: Stack(
        children: [
          // Background Emerald Glow
          Positioned(
            top: -100,
            left: -100,
            child: Container(
              width: 350,
              height: 350,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF064E3B).withOpacity(isDark ? 0.3 : 0.08),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          
          // Background Gold Glow
          Positioned(
            bottom: -100,
            right: -100,
            child: Container(
              width: 350,
              height: 350,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFFD97706).withOpacity(isDark ? 0.15 : 0.04),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 28.0),
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 450),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // App Logo
                        Hero(
                          tag: 'app_logo',
                          child: Container(
                            height: 100,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isDark ? Colors.white.withOpacity(0.05) : Colors.black.withOpacity(0.02),
                              border: Border.all(
                                color: const Color(0xFF064E3B).withOpacity(isDark ? 0.3 : 0.1),
                                width: 2,
                              ),
                            ),
                            child: Image.asset(
                              'assets/images/logo.png',
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) {
                                return const Icon(
                                  Icons.menu_book_rounded,
                                  size: 50,
                                  color: Color(0xFF10B981),
                                );
                              },
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Title & Subtitle
                        Text(
                          'MyMustahiq',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.outfit(
                            color: context.titleColor,
                            fontSize: 32,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Portal Khusus Guru Diniyah Al-Hamid',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.outfit(
                            color: context.subTitleColor,
                            fontSize: 15,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                        const SizedBox(height: 40),

                        // Error Banner
                        if (_errorMessage != null) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: Colors.redAccent.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: Colors.redAccent.withOpacity(0.3)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 20),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    _errorMessage!,
                                    style: GoogleFonts.outfit(
                                      color: Colors.redAccent,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),
                        ],

                        // Username Card/Input
                        Text(
                          'USERNAME',
                          style: GoogleFonts.outfit(
                            color: context.subTitleColor,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.5,
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _usernameController,
                          style: GoogleFonts.inter(color: context.titleColor, fontSize: 15),
                          decoration: InputDecoration(
                            hintText: 'Masukkan username Diniyah Anda',
                            hintStyle: GoogleFonts.inter(color: context.subTitleColor, fontSize: 14),
                            filled: true,
                            fillColor: context.inputBg,
                            prefixIcon: Icon(Icons.person_outline_rounded, color: context.subTitleColor),
                            contentPadding: const EdgeInsets.symmetric(vertical: 18),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: BorderSide.none,
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: const BorderSide(color: Color(0xFF10B981), width: 1.5),
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Password Card/Input
                        Text(
                          'PASSWORD',
                          style: GoogleFonts.outfit(
                            color: context.subTitleColor,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.5,
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          style: GoogleFonts.inter(color: context.titleColor, fontSize: 15),
                          decoration: InputDecoration(
                            hintText: 'Masukkan password Anda',
                            hintStyle: GoogleFonts.inter(color: context.subTitleColor, fontSize: 14),
                            filled: true,
                            fillColor: context.inputBg,
                            prefixIcon: Icon(Icons.lock_outline_rounded, color: context.subTitleColor),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                color: context.subTitleColor,
                              ),
                              onPressed: () {
                                setState(() {
                                  _obscurePassword = !_obscurePassword;
                                });
                              },
                            ),
                            contentPadding: const EdgeInsets.symmetric(vertical: 18),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: BorderSide.none,
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(16),
                              borderSide: const BorderSide(color: Color(0xFF10B981), width: 1.5),
                            ),
                          ),
                        ),
                        const SizedBox(height: 35),

                        // Login Button Row (+ Biometric)
                        Row(
                          children: [
                            // Main Login Button
                            Expanded(
                              child: Container(
                                height: 56,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(16),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF10B981).withOpacity(isDark ? 0.3 : 0.1),
                                      blurRadius: 20,
                                      offset: const Offset(0, 4),
                                      spreadRadius: -5,
                                    ),
                                  ],
                                ),
                                child: ElevatedButton(
                                  onPressed: _isLoading ? null : _handleLogin,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF064E3B),
                                    foregroundColor: Colors.white,
                                    elevation: 0,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    side: BorderSide(
                                      color: const Color(0xFF10B981).withOpacity(0.5),
                                      width: 1.5,
                                    ),
                                  ),
                                  child: _isLoading
                                      ? const SizedBox(
                                          width: 24,
                                          height: 24,
                                          child: CircularProgressIndicator(
                                            color: Colors.white,
                                            strokeWidth: 2.5,
                                          ),
                                        )
                                      : Text(
                                          'MASUK SISTEM',
                                          style: GoogleFonts.outfit(
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                            letterSpacing: 1.2,
                                          ),
                                        ),
                                ),
                              ),
                            ),

                            // Biometric Button
                            if (_biometricAvailable && _biometricEnabled) ...[
                              const SizedBox(width: 12),
                              Container(
                                height: 56,
                                width: 56,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: const Color(0xFF10B981).withOpacity(isDark ? 0.4 : 0.2),
                                    width: 1.5,
                                  ),
                                  color: context.inputBg,
                                ),
                                child: IconButton(
                                  onPressed: _isLoading ? null : _handleBiometricLogin,
                                  icon: const Icon(
                                    Icons.fingerprint_rounded,
                                    color: Color(0xFF10B981),
                                    size: 28,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 30),

                        // Footer Text
                        Text(
                          'Madrasah Diniyah Al-Hamid Cintamulya\nMasa Depan Cerdas & Berakhlak Mulia',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.outfit(
                            color: context.subTitleColor,
                            fontSize: 12,
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
