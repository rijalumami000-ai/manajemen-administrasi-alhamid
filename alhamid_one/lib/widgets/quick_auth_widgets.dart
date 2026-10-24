import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../services/theme_manager.dart';

/// Service to manage quick authentication modes (Biometric, Face, PIN, Pattern, Password)
class QuickAuthService {
  static const _storage = FlutterSecureStorage();

  static const keyBiometric = 'biometric_enabled';
  static const keyFace = 'face_enabled';
  static const keyPin = 'quick_pin_code';
  static const keyPinEnabled = 'pin_enabled';
  static const keyPattern = 'quick_pattern_code';
  static const keyPatternEnabled = 'pattern_enabled';
  static const keyPassword = 'quick_passcode_code';
  static const keyPasswordEnabled = 'quick_password_enabled';

  static const keySavedUsername = 'saved_username';
  static const keySavedPassword = 'saved_password';

  static Future<bool> hasSavedCredentials() async {
    final u = await _storage.read(key: keySavedUsername);
    final p = await _storage.read(key: keySavedPassword);
    return u != null && p != null && u.isNotEmpty && p.isNotEmpty;
  }

  static Future<Map<String, bool>> getStatus() async {
    final bio = await _storage.read(key: keyBiometric) == 'true';
    final face = await _storage.read(key: keyFace) == 'true';
    final pin = await _storage.read(key: keyPinEnabled) == 'true';
    final pattern = await _storage.read(key: keyPatternEnabled) == 'true';
    final password = await _storage.read(key: keyPasswordEnabled) == 'true';

    return {
      'biometric': bio,
      'face': face,
      'pin': pin,
      'pattern': pattern,
      'password': password,
    };
  }

  // --- PIN ---
  static Future<bool> isPinSet() async {
    final pin = await _storage.read(key: keyPin);
    return pin != null && pin.length == 6;
  }

  static Future<void> savePin(String pin) async {
    await _storage.write(key: keyPin, value: pin);
    await _storage.write(key: keyPinEnabled, value: 'true');
  }

  static Future<void> removePin() async {
    await _storage.delete(key: keyPin);
    await _storage.delete(key: keyPinEnabled);
  }

  static Future<bool> verifyPin(String inputPin) async {
    final savedPin = await _storage.read(key: keyPin);
    return savedPin != null && savedPin == inputPin;
  }

  // --- PATTERN ---
  static Future<bool> isPatternSet() async {
    final pattern = await _storage.read(key: keyPattern);
    return pattern != null && pattern.isNotEmpty;
  }

  static Future<void> savePattern(String pattern) async {
    await _storage.write(key: keyPattern, value: pattern);
    await _storage.write(key: keyPatternEnabled, value: 'true');
  }

  static Future<void> removePattern() async {
    await _storage.delete(key: keyPattern);
    await _storage.delete(key: keyPatternEnabled);
  }

  static Future<bool> verifyPattern(String inputPattern) async {
    final savedPattern = await _storage.read(key: keyPattern);
    return savedPattern != null && savedPattern == inputPattern;
  }

  // --- QUICK PASSWORD / PASSCODE ---
  static Future<bool> isPasswordSet() async {
    final pass = await _storage.read(key: keyPassword);
    return pass != null && pass.isNotEmpty;
  }

  static Future<void> savePassword(String pass) async {
    await _storage.write(key: keyPassword, value: pass);
    await _storage.write(key: keyPasswordEnabled, value: 'true');
  }

  static Future<void> removePassword() async {
    await _storage.delete(key: keyPassword);
    await _storage.delete(key: keyPasswordEnabled);
  }

  static Future<bool> verifyPassword(String inputPass) async {
    final savedPass = await _storage.read(key: keyPassword);
    // Also accept account saved password if quick passcode is empty
    if (savedPass == null || savedPass.isEmpty) {
      final accPass = await _storage.read(key: keySavedPassword);
      return accPass != null && accPass == inputPass;
    }
    return savedPass == inputPass;
  }

  // --- FACE & BIOMETRIC ---
  static Future<void> setBiometric(bool enabled) async {
    if (enabled) {
      await _storage.write(key: keyBiometric, value: 'true');
    } else {
      await _storage.delete(key: keyBiometric);
    }
  }

  static Future<void> setFace(bool enabled) async {
    if (enabled) {
      await _storage.write(key: keyFace, value: 'true');
    } else {
      await _storage.delete(key: keyFace);
    }
  }
}

// ============================================================================
// 1. PIN AUTHENTICATION BOTTOM SHEET (VERIFY & SETUP)
// ============================================================================
class PinAuthSheet extends StatefulWidget {
  final bool isSetup;
  final VoidCallback? onSuccess;
  final ValueChanged<String>? onPinSaved;

  const PinAuthSheet({
    super.key,
    this.isSetup = false,
    this.onSuccess,
    this.onPinSaved,
  });

  static Future<bool?> showVerify(BuildContext context) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => PinAuthSheet(
        isSetup: false,
        onSuccess: () => Navigator.pop(ctx, true),
      ),
    );
  }

  static Future<bool?> showSetup(BuildContext context) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => PinAuthSheet(
        isSetup: true,
        onPinSaved: (pin) async {
          await QuickAuthService.savePin(pin);
          if (ctx.mounted) Navigator.pop(ctx, true);
        },
      ),
    );
  }

  @override
  State<PinAuthSheet> createState() => _PinAuthSheetState();
}

class _PinAuthSheetState extends State<PinAuthSheet> with SingleTickerProviderStateMixin {
  String _enteredPin = '';
  String _firstPin = '';
  int _step = 1; // 1: enter/create, 2: confirm (setup only)
  bool _isError = false;
  String _errorText = '';

  late AnimationController _shakeController;

  @override
  void initState() {
    super.initState();
    _shakeController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _shakeController.dispose();
    super.dispose();
  }

  void _triggerError(String msg) {
    setState(() {
      _isError = true;
      _errorText = msg;
      _enteredPin = '';
    });
    _shakeController.forward(from: 0.0).then((_) {
      if (mounted) {
        Future.delayed(const Duration(milliseconds: 800), () {
          if (mounted) {
            setState(() {
              _isError = false;
            });
          }
        });
      }
    });
  }

  void _handleNumberPress(String num) {
    if (_enteredPin.length >= 6) return;

    setState(() {
      _enteredPin += num;
      _isError = false;
    });

    if (_enteredPin.length == 6) {
      _onPinComplete(_enteredPin);
    }
  }

  void _handleBackspace() {
    if (_enteredPin.isNotEmpty) {
      setState(() {
        _enteredPin = _enteredPin.substring(0, _enteredPin.length - 1);
        _isError = false;
      });
    }
  }

  Future<void> _onPinComplete(String pin) async {
    if (!widget.isSetup) {
      // Verify mode
      final valid = await QuickAuthService.verifyPin(pin);
      if (valid) {
        widget.onSuccess?.call();
      } else {
        _triggerError('PIN yang Anda masukkan salah.');
      }
    } else {
      // Setup mode
      if (_step == 1) {
        setState(() {
          _firstPin = pin;
          _enteredPin = '';
          _step = 2;
        });
      } else {
        if (pin == _firstPin) {
          widget.onPinSaved?.call(pin);
        } else {
          _triggerError('Konfirmasi PIN tidak cocok. Ulangi kembali.');
          setState(() {
            _step = 1;
            _firstPin = '';
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;

    String title;
    String subtitle;
    if (!widget.isSetup) {
      title = "Masukkan PIN Keamanan";
      subtitle = "Masukkan 6 digit PIN untuk masuk ke akun Anda";
    } else {
      if (_step == 1) {
        title = "Buat PIN Baru";
        subtitle = "Tentukan 6 digit angka rahasia Anda";
      } else {
        title = "Konfirmasi PIN Baru";
        subtitle = "Masukkan kembali 6 digit angka yang sama";
      }
    }

    return Container(
      decoration: BoxDecoration(
        color: context.scaffoldBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: Border.all(color: context.borderColor, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.6 : 0.15),
            blurRadius: 30,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 44,
            height: 5,
            decoration: BoxDecoration(
              color: Colors.grey.withOpacity(0.35),
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(height: 18),

          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.dialpad_rounded, color: Color(0xFF10B981), size: 22),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: context.titleColor,
                        ),
                      ),
                      Text(
                        subtitle,
                        style: GoogleFonts.outfit(fontSize: 12, color: context.subTitleColor),
                      ),
                    ],
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded, size: 22),
                color: context.subTitleColor,
                onPressed: () => Navigator.pop(context, false),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // PIN Indicators (6 Dots) with shake animation
          AnimatedBuilder(
            animation: _shakeController,
            builder: (context, child) {
              final offset = sin(_shakeController.value * pi * 4) * 12;
              return Transform.translate(
                offset: Offset(offset, 0),
                child: child,
              );
            },
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(6, (index) {
                final isFilled = index < _enteredPin.length;
                Color dotColor;
                if (_isError) {
                  dotColor = Colors.redAccent;
                } else if (isFilled) {
                  dotColor = const Color(0xFF10B981);
                } else {
                  dotColor = isDark ? Colors.white24 : Colors.grey.shade300;
                }

                return AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  margin: const EdgeInsets.symmetric(horizontal: 8),
                  width: isFilled ? 18 : 14,
                  height: isFilled ? 18 : 14,
                  decoration: BoxDecoration(
                    color: isFilled ? dotColor : Colors.transparent,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: dotColor,
                      width: 2.2,
                    ),
                    boxShadow: isFilled
                        ? [
                            BoxShadow(
                              color: dotColor.withOpacity(0.4),
                              blurRadius: 10,
                              spreadRadius: 1,
                            ),
                          ]
                        : null,
                  ),
                );
              }),
            ),
          ),

          if (_isError && _errorText.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              _errorText,
              style: GoogleFonts.outfit(
                color: Colors.redAccent,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],

          const SizedBox(height: 28),

          // Numeric Keypad (3x4)
          _buildNumericKeypad(context),
        ],
      ),
    );
  }

  Widget _buildNumericKeypad(BuildContext context) {
    final keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['C', '0', '⌫'],
    ];

    return Column(
      children: keys.map((row) {
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: row.map((key) {
              if (key == 'C') {
                return _buildKeyBtn(
                  context,
                  label: 'Clear',
                  onTap: () {
                    setState(() {
                      _enteredPin = '';
                      _isError = false;
                    });
                  },
                );
              }
              if (key == '⌫') {
                return _buildKeyBtn(
                  context,
                  icon: Icons.backspace_outlined,
                  onTap: _handleBackspace,
                );
              }
              return _buildKeyBtn(
                context,
                label: key,
                onTap: () => _handleNumberPress(key),
              );
            }).toList(),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildKeyBtn(
    BuildContext context, {
    String? label,
    IconData? icon,
    required VoidCallback onTap,
  }) {
    final isDark = context.isDarkMode;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(36),
        splashColor: const Color(0xFF10B981).withOpacity(0.2),
        highlightColor: const Color(0xFF10B981).withOpacity(0.1),
        child: Container(
          width: 72,
          height: 60,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B).withOpacity(0.6) : Colors.white.withOpacity(0.8),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: context.borderColor, width: 1.2),
          ),
          child: icon != null
              ? Icon(icon, size: 22, color: context.titleColor)
              : Text(
                  label!,
                  style: GoogleFonts.outfit(
                    fontSize: label.length > 2 ? 13 : 22,
                    fontWeight: FontWeight.bold,
                    color: label == 'Clear' ? Colors.orangeAccent : context.titleColor,
                  ),
                ),
        ),
      ),
    );
  }
}

// ============================================================================
// 2. PATTERN LOCK AUTHENTICATION BOTTOM SHEET (VERIFY & SETUP)
// ============================================================================
class PatternLockSheet extends StatefulWidget {
  final bool isSetup;
  final VoidCallback? onSuccess;
  final ValueChanged<String>? onPatternSaved;

  const PatternLockSheet({
    super.key,
    this.isSetup = false,
    this.onSuccess,
    this.onPatternSaved,
  });

  static Future<bool?> showVerify(BuildContext context) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => PatternLockSheet(
        isSetup: false,
        onSuccess: () => Navigator.pop(ctx, true),
      ),
    );
  }

  static Future<bool?> showSetup(BuildContext context) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => PatternLockSheet(
        isSetup: true,
        onPatternSaved: (pattern) async {
          await QuickAuthService.savePattern(pattern);
          if (ctx.mounted) Navigator.pop(ctx, true);
        },
      ),
    );
  }

  @override
  State<PatternLockSheet> createState() => _PatternLockSheetState();
}

class _PatternLockSheetState extends State<PatternLockSheet> {
  final List<int> _selectedDots = [];
  Offset? _currentDragPos;
  bool _isError = false;
  String _firstPattern = '';
  int _step = 1; // 1: draw, 2: confirm
  String _hintText = '';

  @override
  void initState() {
    super.initState();
    _resetHint();
  }

  void _resetHint() {
    if (!widget.isSetup) {
      _hintText = "Tarik garis menghubungkan pola kunci Anda";
    } else {
      if (_step == 1) {
        _hintText = "Tarik pola baru (hubungkan minimal 4 titik)";
      } else {
        _hintText = "Tarik kembali pola yang sama untuk konfirmasi";
      }
    }
  }

  void _handleDotTouched(int dotIndex) {
    if (!_selectedDots.contains(dotIndex)) {
      setState(() {
        _selectedDots.add(dotIndex);
        _isError = false;
      });
    }
  }

  Future<void> _handlePatternFinish() async {
    if (_selectedDots.length < 4) {
      setState(() {
        _isError = true;
        _hintText = "Pola terlalu pendek. Hubungkan minimal 4 titik.";
      });
      _clearDotsAfterDelay();
      return;
    }

    final patternCode = _selectedDots.join('-');

    if (!widget.isSetup) {
      final valid = await QuickAuthService.verifyPattern(patternCode);
      if (valid) {
        widget.onSuccess?.call();
      } else {
        setState(() {
          _isError = true;
          _hintText = "Pola salah. Silakan coba lagi.";
        });
        _clearDotsAfterDelay();
      }
    } else {
      // Setup
      if (_step == 1) {
        setState(() {
          _firstPattern = patternCode;
          _step = 2;
          _selectedDots.clear();
          _currentDragPos = null;
          _hintText = "Tarik kembali pola yang sama untuk konfirmasi";
        });
      } else {
        if (patternCode == _firstPattern) {
          widget.onPatternSaved?.call(patternCode);
        } else {
          setState(() {
            _isError = true;
            _step = 1;
            _firstPattern = '';
            _hintText = "Konfirmasi pola tidak cocok. Silakan ulangi.";
          });
          _clearDotsAfterDelay();
        }
      }
    }
  }

  void _clearDotsAfterDelay() {
    Future.delayed(const Duration(milliseconds: 700), () {
      if (mounted) {
        setState(() {
          _selectedDots.clear();
          _currentDragPos = null;
          _isError = false;
          _resetHint();
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDarkMode;

    return Container(
      decoration: BoxDecoration(
        color: context.scaffoldBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: Border.all(color: context.borderColor, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.6 : 0.15),
            blurRadius: 30,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 44,
            height: 5,
            decoration: BoxDecoration(
              color: Colors.grey.withOpacity(0.35),
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(height: 18),

          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.pattern_rounded, color: Color(0xFF10B981), size: 22),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.isSetup
                            ? (_step == 1 ? "Atur Kunci Pola" : "Konfirmasi Pola")
                            : "Buka dengan Pola",
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: context.titleColor,
                        ),
                      ),
                      Text(
                        _hintText,
                        style: GoogleFonts.outfit(
                          fontSize: 12,
                          color: _isError ? Colors.redAccent : context.subTitleColor,
                          fontWeight: _isError ? FontWeight.w600 : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded, size: 22),
                color: context.subTitleColor,
                onPressed: () => Navigator.pop(context, false),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // 3x3 Pattern Canvas
          Center(
            child: SizedBox(
              width: 280,
              height: 280,
              child: GestureDetector(
                onPanStart: (details) {
                  _findDot(details.localPosition);
                },
                onPanUpdate: (details) {
                  setState(() {
                    _currentDragPos = details.localPosition;
                  });
                  _findDot(details.localPosition);
                },
                onPanEnd: (details) {
                  setState(() {
                    _currentDragPos = null;
                  });
                  _handlePatternFinish();
                },
                child: CustomPaint(
                  size: const Size(280, 280),
                  painter: _PatternPainter(
                    selectedDots: _selectedDots,
                    currentDragPos: _currentDragPos,
                    isError: _isError,
                    isDark: isDark,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: () {
              setState(() {
                _selectedDots.clear();
                _currentDragPos = null;
                _isError = false;
                _resetHint();
              });
            },
            child: Text(
              'Reset Pola',
              style: GoogleFonts.outfit(color: Colors.orangeAccent, fontSize: 13, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  void _findDot(Offset pos) {
    const double size = 280;
    const double padding = 35;
    const double spacing = (size - 2 * padding) / 2;

    for (int r = 0; r < 3; r++) {
      for (int c = 0; c < 3; c++) {
        final dotPos = Offset(padding + c * spacing, padding + r * spacing);
        final distance = (pos - dotPos).distance;
        if (distance < 28) {
          final dotIndex = r * 3 + c;
          _handleDotTouched(dotIndex);
          return;
        }
      }
    }
  }
}

class _PatternPainter extends CustomPainter {
  final List<int> selectedDots;
  final Offset? currentDragPos;
  final bool isError;
  final bool isDark;

  _PatternPainter({
    required this.selectedDots,
    required this.currentDragPos,
    required this.isError,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    const double padding = 35;
    final double spacing = (size.width - 2 * padding) / 2;

    final dotPositions = <int, Offset>{};
    for (int r = 0; r < 3; r++) {
      for (int c = 0; c < 3; c++) {
        final index = r * 3 + c;
        dotPositions[index] = Offset(padding + c * spacing, padding + r * spacing);
      }
    }

    final activeColor = isError ? Colors.redAccent : const Color(0xFF10B981);
    final idleColor = isDark ? Colors.white24 : Colors.grey.shade300;

    // 1. Draw connecting lines
    final linePaint = Paint()
      ..color = activeColor.withOpacity(0.85)
      ..strokeWidth = 4.5
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    if (selectedDots.length > 1) {
      final path = Path();
      path.moveTo(dotPositions[selectedDots[0]]!.dx, dotPositions[selectedDots[0]]!.dy);
      for (int i = 1; i < selectedDots.length; i++) {
        final pos = dotPositions[selectedDots[i]]!;
        path.lineTo(pos.dx, pos.dy);
      }
      canvas.drawPath(path, linePaint);
    }

    // Line to current finger
    if (selectedDots.isNotEmpty && currentDragPos != null) {
      final lastPos = dotPositions[selectedDots.last]!;
      canvas.drawLine(lastPos, currentDragPos!, linePaint);
    }

    // 2. Draw 9 dots
    for (int i = 0; i < 9; i++) {
      final pos = dotPositions[i]!;
      final isSelected = selectedDots.contains(i);

      if (isSelected) {
        // Outer glow circle
        final glowPaint = Paint()
          ..color = activeColor.withOpacity(0.2)
          ..style = PaintingStyle.fill;
        canvas.drawCircle(pos, 26, glowPaint);

        // Outer border
        final ringPaint = Paint()
          ..color = activeColor
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2.0;
        canvas.drawCircle(pos, 22, ringPaint);

        // Inner solid dot
        final centerPaint = Paint()
          ..color = activeColor
          ..style = PaintingStyle.fill;
        canvas.drawCircle(pos, 8, centerPaint);
      } else {
        // Idle dot
        final idlePaint = Paint()
          ..color = idleColor
          ..style = PaintingStyle.fill;
        canvas.drawCircle(pos, 6, idlePaint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _PatternPainter oldDelegate) => true;
}

// ============================================================================
// 3. QUICK PASSWORD / PASSCODE BOTTOM SHEET (VERIFY & SETUP)
// ============================================================================
class PasswordAuthSheet extends StatefulWidget {
  final bool isSetup;
  final VoidCallback? onSuccess;
  final ValueChanged<String>? onPasswordSaved;

  const PasswordAuthSheet({
    super.key,
    this.isSetup = false,
    this.onSuccess,
    this.onPasswordSaved,
  });

  static Future<bool?> showVerify(BuildContext context) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => PasswordAuthSheet(
        isSetup: false,
        onSuccess: () => Navigator.pop(ctx, true),
      ),
    );
  }

  static Future<bool?> showSetup(BuildContext context) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => PasswordAuthSheet(
        isSetup: true,
        onPasswordSaved: (pass) async {
          await QuickAuthService.savePassword(pass);
          if (ctx.mounted) Navigator.pop(ctx, true);
        },
      ),
    );
  }

  @override
  State<PasswordAuthSheet> createState() => _PasswordAuthSheetState();
}

class _PasswordAuthSheetState extends State<PasswordAuthSheet> {
  final _passController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _obscure = true;
  String? _errorText;
  bool _isLoading = false;

  @override
  void dispose() {
    _passController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    final pass = _passController.text.trim();
    if (pass.isEmpty) {
      setState(() => _errorText = 'Sandi tidak boleh kosong');
      return;
    }

    if (!widget.isSetup) {
      setState(() => _isLoading = true);
      final valid = await QuickAuthService.verifyPassword(pass);
      setState(() => _isLoading = false);
      if (valid) {
        widget.onSuccess?.call();
      } else {
        setState(() => _errorText = 'Sandi salah. Coba lagi.');
      }
    } else {
      final confirm = _confirmController.text.trim();
      if (pass != confirm) {
        setState(() => _errorText = 'Konfirmasi sandi tidak cocok.');
        return;
      }
      widget.onPasswordSaved?.call(pass);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: BoxDecoration(
          color: context.scaffoldBg,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          border: Border.all(color: context.borderColor, width: 1.5),
        ),
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.grey.withOpacity(0.35),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.key_rounded, color: Color(0xFF10B981), size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.isSetup ? "Atur Sandi Cepat" : "Masuk dengan Sandi",
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: context.titleColor,
                        ),
                      ),
                      Text(
                        widget.isSetup
                            ? "Buat sandi khusus untuk masuk cepat ke aplikasi"
                            : "Masukkan sandi cepat akun Anda",
                        style: GoogleFonts.outfit(fontSize: 12, color: context.subTitleColor),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 22),
                  onPressed: () => Navigator.pop(context, false),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Password Field
            TextField(
              controller: _passController,
              obscureText: _obscure,
              style: GoogleFonts.outfit(color: context.titleColor, fontSize: 15),
              decoration: InputDecoration(
                hintText: widget.isSetup ? 'Sandi Baru' : 'Masukkan Sandi',
                hintStyle: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 14),
                filled: true,
                fillColor: context.inputBg,
                prefixIcon: const Icon(Icons.lock_outline_rounded, color: Color(0xFF10B981), size: 20),
                suffixIcon: IconButton(
                  icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility, color: context.subTitleColor),
                  onPressed: () => setState(() => _obscure = !_obscure),
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide(color: context.borderColor),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: Color(0xFF10B981), width: 1.5),
                ),
              ),
            ),

            if (widget.isSetup) ...[
              const SizedBox(height: 12),
              TextField(
                controller: _confirmController,
                obscureText: _obscure,
                style: GoogleFonts.outfit(color: context.titleColor, fontSize: 15),
                decoration: InputDecoration(
                  hintText: 'Konfirmasi Sandi Baru',
                  hintStyle: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 14),
                  filled: true,
                  fillColor: context.inputBg,
                  prefixIcon: const Icon(Icons.lock_reset_rounded, color: Color(0xFF10B981), size: 20),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide(color: context.borderColor),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: Color(0xFF10B981), width: 1.5),
                  ),
                ),
              ),
            ],

            if (_errorText != null) ...[
              const SizedBox(height: 10),
              Text(
                _errorText!,
                style: GoogleFonts.outfit(color: Colors.redAccent, fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ],

            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isLoading ? null : _handleSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF064E3B),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                side: BorderSide(color: const Color(0xFF10B981).withOpacity(0.5)),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : Text(
                      widget.isSetup ? 'SIMPAN SANDI' : 'VERIFIKASI & MASUK',
                      style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 1),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
