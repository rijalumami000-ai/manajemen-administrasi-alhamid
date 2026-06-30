import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'services/api_service.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/splash_screen.dart';

import 'services/theme_manager.dart';
import 'services/push_notification_service.dart';
import 'services/network_service.dart';

import 'widgets/glass_background.dart';

void main() async {
  WidgetsBinding widgetsBinding = WidgetsFlutterBinding.ensureInitialized();
  FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);

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
    WidgetsBinding.instance.addPostFrameCallback((_) {
      FlutterNativeSplash.remove();
    });
  }

  Future<void> _checkTokenValidity() async {
    final startTime = DateTime.now();
    bool authenticated = false;

    print('🔑 [Auth] Checking token validity...');
    final token = await _apiService.getToken();
    if (token != null) {
      try {
        final dashboard = await _apiService.getDashboard();
        authenticated = true;
        print('🔑 [Auth] Active User Info: ${dashboard['guruInfo']?['nama'] ?? 'Unknown'}.');
      } catch (e) {
        print('🔑 [Auth] Error or token invalid: $e');
        authenticated = false;
      }
    } else {
      authenticated = false;
    }

    // Hold native splash screen for exactly 5 seconds total (5000 ms)
    final elapsed = DateTime.now().difference(startTime).inMilliseconds;
    if (elapsed < 5000) {
      await Future.delayed(Duration(milliseconds: 5000 - elapsed));
    }

    if (mounted) {
      setState(() {
        _isAuthenticated = authenticated;
        _checkingAuth = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_checkingAuth) {
      return const SplashScreen();
    }

    return _isAuthenticated ? const DashboardScreen() : const LoginScreen();
  }
}
