import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ThemeManager extends ChangeNotifier {
  static final ThemeManager _instance = ThemeManager._internal();
  factory ThemeManager() => _instance;
  ThemeManager._internal();

  final _storage = const FlutterSecureStorage();
  ThemeMode _themeMode = ThemeMode.dark;

  ThemeMode get themeMode => _themeMode;
  bool get isDarkMode => _themeMode == ThemeMode.dark;

  Future<void> init() async {
    final mode = await _storage.read(key: 'theme_mode');
    if (mode == 'light') {
      _themeMode = ThemeMode.light;
    } else {
      _themeMode = ThemeMode.dark;
    }
    notifyListeners();
  }

  Future<void> toggleTheme(bool isDark) async {
    _themeMode = isDark ? ThemeMode.dark : ThemeMode.light;
    await _storage.write(key: 'theme_mode', value: isDark ? 'dark' : 'light');
    notifyListeners();
  }
}

extension ThemeContext on BuildContext {
  bool get isDarkMode => Theme.of(this).brightness == Brightness.dark;
  
  Color get scaffoldBg => isDarkMode ? const Color(0xFF070B13) : const Color(0xFFF4FBF8);
  Color get cardBg => isDarkMode ? const Color(0xFF131C2E).withOpacity(0.85) : Colors.white.withOpacity(0.88);
  Color get surfaceBg => isDarkMode ? const Color(0xFF0D1527).withOpacity(0.85) : const Color(0xFFF1F5F9).withOpacity(0.88);
  Color get inputBg => isDarkMode ? const Color(0xFF131B2E).withOpacity(0.85) : const Color(0xFFF1F5F9).withOpacity(0.88);
  
  Color get titleColor => isDarkMode ? Colors.white : const Color(0xFF0F172A);
  Color get bodyColor => isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF334155);
  Color get subTitleColor => isDarkMode ? const Color(0xFF64748B) : const Color(0xFF475569);
  Color get borderColor => isDarkMode ? Colors.white.withOpacity(0.08) : const Color(0xFFCBD5E1);
}
