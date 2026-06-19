import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'services/api_service.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyMustahiqApp());
}

class MyMustahiqApp extends StatelessWidget {
  const MyMustahiqApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MyMustahiq',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF10B981),
        scaffoldBackgroundColor: const Color(0xFF070B13),
        textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme),
        useMaterial3: true,
      ),
      home: const AuthenticationWrapper(),
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
    final token = await _apiService.getToken();
    if (token == null) {
      if (mounted) {
        setState(() {
          _isAuthenticated = false;
          _checkingAuth = false;
        });
      }
      return;
    }

    try {
      // Test server connection and token validity by fetching dashboard
      await _apiService.getDashboard();
      if (mounted) {
        setState(() {
          _isAuthenticated = true;
          _checkingAuth = false;
        });
      }
    } catch (_) {
      // In case of error (expired token or server offline)
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
      return const Scaffold(
        backgroundColor: Color(0xFF070B13),
        body: Center(
          child: CircularProgressIndicator(
            color: Color(0xFF10B981),
          ),
        ),
      );
    }

    return _isAuthenticated ? const DashboardScreen() : const LoginScreen();
  }
}
