import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'services/api_service.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';

import 'services/theme_manager.dart';
import 'services/push_notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ThemeManager().init();
  await PushNotificationService().initialize();
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
          title: 'MyMustahiq',
          debugShowCheckedModeBanner: false,
          themeMode: ThemeManager().themeMode,
          theme: ThemeData(
            brightness: Brightness.light,
            primaryColor: const Color(0xFF10B981),
            scaffoldBackgroundColor: const Color(0xFFF8FAFC),
            cardColor: Colors.white,
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
      return Scaffold(
        backgroundColor: context.scaffoldBg,
        body: const Center(
          child: CircularProgressIndicator(
            color: Color(0xFF10B981),
          ),
        ),
      );
    }

    return _isAuthenticated ? const DashboardScreen() : const LoginScreen();
  }
}
