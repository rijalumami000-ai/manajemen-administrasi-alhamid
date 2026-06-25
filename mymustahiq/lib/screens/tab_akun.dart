import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';
import '../services/push_notification_service.dart';
import 'login_screen.dart';

class TabAkun extends StatefulWidget {
  const TabAkun({super.key});

  @override
  State<TabAkun> createState() => _TabAkunState();
}

class _TabAkunState extends State<TabAkun> {
  final ApiService _apiService = ApiService();
  final _storage = const FlutterSecureStorage();
  final _auth = LocalAuthentication();

  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic>? _guruInfo;

  // Password change controllers
  final _oldPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isChangingPassword = false;
  String? _passwordMessage;
  bool _passwordSuccess = false;
  bool _obscureOld = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;

  // Biometric & Dummy settings state
  bool _biometricEnabled = false;
  bool _biometricAvailable = false;
  bool _notificationsEnabled = true;
  String _selectedSound = 'default';

  @override
  void initState() {
    super.initState();
    _fetchProfile();
    _checkBiometricStatus();
    _loadSoundPreference();
  }

  Future<void> _loadSoundPreference() async {
    final sound = await _storage.read(key: 'notification_sound') ?? 'default';
    if (mounted) {
      setState(() {
        _selectedSound = sound;
      });
    }
  }

  @override
  void dispose() {
    _oldPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _fetchProfile() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await _apiService.getDashboard();
      setState(() {
        _guruInfo = res['guruInfo'];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _checkBiometricStatus() async {
    try {
      final canCheck = await _auth.canCheckBiometrics;
      final isSupported = await _auth.isDeviceSupported();
      final biometricPref = await _storage.read(key: 'biometric_enabled');

      if (mounted) {
        setState(() {
          _biometricAvailable = canCheck && isSupported;
          _biometricEnabled = biometricPref == 'true';
        });
      }
    } catch (_) {}
  }

  Future<void> _toggleBiometric(bool value) async {
    if (value) {
      try {
        final didAuth = await _auth.authenticate(
          localizedReason: 'Aktifkan login biometrik untuk MyMustahiq',
          options: const AuthenticationOptions(biometricOnly: true),
        );
        if (didAuth) {
          await _storage.write(key: 'biometric_enabled', value: 'true');
          setState(() => _biometricEnabled = true);
          _showToast('Login biometrik berhasil diaktifkan.', Colors.teal);
        }
      } catch (e) {
        _showToast('Gagal mengaktifkan biometrik: ${e.toString()}', Colors.redAccent);
      }
    } else {
      await _storage.delete(key: 'biometric_enabled');
      setState(() => _biometricEnabled = false);
      _showToast('Login biometrik dinonaktifkan.', Colors.amber);
    }
  }

  void _showToast(String msg, Color color) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: GoogleFonts.outfit(color: Colors.white, fontSize: 13)),
        backgroundColor: color.withOpacity(0.9),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  Future<void> _handleChangePassword(StateSetter modalSetState) async {
    final oldPw = _oldPasswordController.text.trim();
    final newPw = _newPasswordController.text.trim();
    final confirmPw = _confirmPasswordController.text.trim();

    if (oldPw.isEmpty || newPw.isEmpty || confirmPw.isEmpty) {
      modalSetState(() {
        _passwordMessage = 'Semua field wajib diisi.';
        _passwordSuccess = false;
      });
      return;
    }

    if (newPw.length < 6) {
      modalSetState(() {
        _passwordMessage = 'Password baru minimal 6 karakter.';
        _passwordSuccess = false;
      });
      return;
    }

    if (newPw != confirmPw) {
      modalSetState(() {
        _passwordMessage = 'Konfirmasi password tidak cocok.';
        _passwordSuccess = false;
      });
      return;
    }

    modalSetState(() {
      _isChangingPassword = true;
      _passwordMessage = null;
    });

    try {
      final res = await _apiService.changePassword(oldPw, newPw);
      
      // Update secure storage saved credentials for biometric login compatibility
      final savedUser = await _storage.read(key: 'saved_username');
      if (savedUser != null) {
        await _storage.write(key: 'saved_password', value: newPw);
      }

      modalSetState(() {
        _passwordMessage = res['message'] ?? 'Password berhasil diperbarui.';
        _passwordSuccess = true;
        _isChangingPassword = false;
      });

      _oldPasswordController.clear();
      _newPasswordController.clear();
      _confirmPasswordController.clear();

      Future.delayed(const Duration(seconds: 1), () {
        if (mounted) Navigator.pop(context);
        _showToast("Password berhasil diperbarui.", Colors.teal);
      });
    } catch (e) {
      modalSetState(() {
        _passwordMessage = e.toString().replaceFirst('Exception: ', '');
        _passwordSuccess = false;
        _isChangingPassword = false;
      });
    }
  }

  void _showChangePasswordDialog() {
    _passwordMessage = null;
    _passwordSuccess = false;
    _oldPasswordController.clear();
    _newPasswordController.clear();
    _confirmPasswordController.clear();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: context.cardBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, modalSetState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
                top: 24,
                left: 24,
                right: 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Ubah Password',
                        style: GoogleFonts.outfit(
                          color: context.titleColor,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      IconButton(
                        icon: Icon(Icons.close_rounded, color: context.subTitleColor),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  
                  _buildPasswordField(
                    controller: _oldPasswordController,
                    label: 'Password Lama',
                    obscure: _obscureOld,
                    onToggle: () => modalSetState(() => _obscureOld = !_obscureOld),
                  ),
                  const SizedBox(height: 14),
                  _buildPasswordField(
                    controller: _newPasswordController,
                    label: 'Password Baru',
                    obscure: _obscureNew,
                    onToggle: () => modalSetState(() => _obscureNew = !_obscureNew),
                  ),
                  const SizedBox(height: 14),
                  _buildPasswordField(
                    controller: _confirmPasswordController,
                    label: 'Konfirmasi Password Baru',
                    obscure: _obscureConfirm,
                    onToggle: () => modalSetState(() => _obscureConfirm = !_obscureConfirm),
                  ),
                  const SizedBox(height: 16),

                  if (_passwordMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _passwordSuccess
                            ? const Color(0xFF10B981).withOpacity(0.1)
                            : Colors.redAccent.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: _passwordSuccess
                              ? const Color(0xFF10B981).withOpacity(0.3)
                              : Colors.redAccent.withOpacity(0.3),
                        ),
                      ),
                      child: Text(
                        _passwordMessage!,
                        style: GoogleFonts.outfit(
                          color: _passwordSuccess ? const Color(0xFF10B981) : Colors.redAccent,
                          fontSize: 12,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  ElevatedButton(
                    onPressed: _isChangingPassword ? null : () => _handleChangePassword(modalSetState),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF064E3B),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      side: BorderSide(color: const Color(0xFF10B981).withOpacity(0.4)),
                    ),
                    child: _isChangingPassword
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : Text(
                            'SIMPAN PASSWORD',
                            style: GoogleFonts.outfit(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.8,
                            ),
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  String _getSoundNameLabel(String sound) {
    switch (sound) {
      case 'chime':
        return 'Chime (Ting-ting)';
      case 'bell':
        return 'Bell (Kring-kring)';
      default:
        return 'Sistem (Default)';
    }
  }

  void _showSoundSelectionDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Dialog(
              backgroundColor: context.cardBg,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(color: context.borderColor),
              ),
              child: Padding(
                padding: const EdgeInsets.all(22.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Pilih Nada Dering',
                          style: GoogleFonts.outfit(
                            color: context.titleColor,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        IconButton(
                          icon: Icon(Icons.close_rounded, color: context.subTitleColor),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Divider(color: context.borderColor, height: 1),
                    const SizedBox(height: 12),
                    _buildSoundOption(setModalState, 'default', 'Sistem (Default)', 'Nada dering bawaan perangkat'),
                    _buildSoundOption(setModalState, 'chime', 'Chime (Ting-ting)', 'Nada chime pendek dan cerah'),
                    _buildSoundOption(setModalState, 'bell', 'Bell (Kring-kring)', 'Nada bell berdering tradisional'),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildSoundOption(StateSetter setModalState, String key, String title, String subtitle) {
    final isSelected = _selectedSound == key;
    return ListTile(
      onTap: () async {
        await _storage.write(key: 'notification_sound', value: key);
        if (mounted) {
          setState(() {
            _selectedSound = key;
          });
        }
        setModalState(() {});
        // Play sound preview
        await PushNotificationService().playTestSound(key);
      },
      contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: (isSelected ? const Color(0xFF10B981) : Colors.grey).withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(
          isSelected ? Icons.music_note_rounded : Icons.music_off_outlined,
          color: isSelected ? const Color(0xFF10B981) : context.subTitleColor,
          size: 20,
        ),
      ),
      title: Text(
        title,
        style: GoogleFonts.outfit(
          color: context.titleColor,
          fontSize: 14,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: GoogleFonts.outfit(
          color: context.subTitleColor,
          fontSize: 11,
        ),
      ),
      trailing: isSelected
          ? const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 22)
          : null,
    );
  }

  void _showFeedbackDialog() {
    final controller = TextEditingController();
    bool isSending = false;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Dialog(
              backgroundColor: context.cardBg,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(color: context.borderColor),
              ),
              child: Padding(
                padding: const EdgeInsets.all(22.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Kotak Saran & Masukan',
                          style: GoogleFonts.outfit(
                            color: context.titleColor,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        IconButton(
                          icon: Icon(Icons.close_rounded, color: context.subTitleColor),
                          onPressed: isSending ? null : () => Navigator.pop(context),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Divider(color: context.borderColor, height: 1),
                    const SizedBox(height: 12),
                    Text(
                      'Tulis saran, keluhan, masukan, atau kendala Anda terkait aplikasi di bawah ini untuk kami tindaklanjuti di web admin.',
                      style: GoogleFonts.outfit(
                        color: context.bodyColor,
                        fontSize: 12,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: controller,
                      maxLines: 4,
                      maxLength: 500,
                      enabled: !isSending,
                      style: GoogleFonts.outfit(color: context.titleColor, fontSize: 13),
                      decoration: InputDecoration(
                        hintText: 'Tulis masukan Anda di sini...',
                        hintStyle: GoogleFonts.outfit(color: context.subTitleColor.withOpacity(0.6), fontSize: 13),
                        filled: true,
                        fillColor: context.cardBg.withOpacity(0.5),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: context.borderColor),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Color(0xFF10B981)),
                        ),
                        contentPadding: const EdgeInsets.all(12),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: isSending
                            ? null
                            : () async {
                                final text = controller.text.trim();
                                if (text.isEmpty) {
                                  _showToast('Saran tidak boleh kosong.', Colors.amber);
                                  return;
                                }

                                setModalState(() {
                                  isSending = true;
                                });

                                try {
                                  await _apiService.submitSuggestion(text);
                                  if (context.mounted) {
                                    Navigator.pop(context);
                                  }
                                  _showToast('Saran Anda berhasil dikirim. Terima kasih!', const Color(0xFF10B981));
                                } catch (e) {
                                  setModalState(() {
                                    isSending = false;
                                  });
                                  _showToast('Gagal mengirim saran: ${e.toString().replaceFirst('Exception: ', '')}', Colors.redAccent);
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF064E3B),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                        child: isSending
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : Text(
                                'KIRIM SARAN',
                                style: GoogleFonts.outfit(
                                  color: Colors.white,
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
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
      },
    );
  }

  void _showFAQDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          backgroundColor: context.cardBg,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(color: context.borderColor),
          ),
          child: Container(
            constraints: const BoxConstraints(maxHeight: 500),
            padding: const EdgeInsets.all(22.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'FAQ & Bantuan',
                      style: GoogleFonts.outfit(
                        color: context.titleColor,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.close_rounded, color: context.subTitleColor),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Divider(color: context.borderColor, height: 1),
                const SizedBox(height: 12),
                Expanded(
                  child: ListView(
                    physics: const BouncingScrollPhysics(),
                    children: [
                      _buildFAQItem(
                        "Bagaimana cara mengaktifkan Biometrik?",
                        "Anda dapat mengaktifkan login sidik jari/wajah dengan menyalakan toggle 'Login Biometrik' di halaman Akun ini. Pastikan Anda sudah login manual sukses minimal satu kali di perangkat ini.",
                      ),
                      _buildFAQItem(
                        "Kenapa data Santri tidak muncul?",
                        "Pastikan koneksi internet stabil. Jika masalah berlanjut, hubungi Administrator untuk memastikan tahun ajaran aktif telah dikonfigurasi di sistem pusat.",
                      ),
                      _buildFAQItem(
                        "Bagaimana cara mengganti kata sandi?",
                        "Klik opsi 'Ubah Password' di menu pengaturan akun ini, masukkan password lama Anda, dan isi password baru minimal 6 karakter.",
                      ),
                      _buildFAQItem(
                        "Bagaimana jika aplikasi log out otomatis?",
                        "Untuk keamanan data santri, token login akan kedaluwarsa setelah beberapa waktu jika aplikasi tidak digunakan. Anda cukup masuk kembali atau gunakan login biometrik cepat.",
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildFAQItem(String q, String a) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            q,
            style: GoogleFonts.outfit(
              color: const Color(0xFF10B981),
              fontSize: 13,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            a,
            style: GoogleFonts.outfit(
              color: context.bodyColor,
              fontSize: 12,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleLogout() async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: context.cardBg,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          "Logout",
          style: GoogleFonts.outfit(color: context.titleColor, fontWeight: FontWeight.bold),
        ),
        content: Text(
          "Apakah Anda yakin ingin keluar dari akun?",
          style: GoogleFonts.outfit(color: context.bodyColor),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text("Batal", style: GoogleFonts.outfit(color: context.subTitleColor)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await _apiService.logout();
              if (mounted) {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (context) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text(
              "Logout",
              style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Center(child: CircularProgressIndicator(color: const Color(0xFF10B981)));
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline_rounded, color: Colors.amber, size: 48),
              const SizedBox(height: 16),
              Text(_errorMessage!, textAlign: TextAlign.center, style: GoogleFonts.outfit(color: context.titleColor, fontSize: 15)),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _fetchProfile,
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF064E3B)),
                child: Text('Coba Lagi', style: GoogleFonts.outfit(color: Colors.white)),
              ),
            ],
          ),
        ),
      );
    }

    final name = _guruInfo?['nama'] ?? '-';
    final nip = _guruInfo?['nip'] ?? '-';
    final phone = _guruInfo?['no_hp'] ?? '-';
    final jabatan = _guruInfo?['jabatan'] ?? '-';
    final photo = _guruInfo?['foto_url'];

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ===== 1. PROFILE CARD (Premium Glassmorphism) =====
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: context.isDarkMode
                      ? [
                          const Color(0xFF064E3B).withOpacity(0.12),
                          const Color(0xFF131B2E).withOpacity(0.8),
                        ]
                      : [
                          const Color(0xFFECFDF5),
                          context.cardBg,
                        ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: const Color(0xFF10B981).withOpacity(context.isDarkMode ? 0.15 : 0.3),
                ),
              ),
              child: Row(
                children: [
                  // Avatar
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withOpacity(0.05),
                      border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3), width: 1.5),
                    ),
                    child: ClipOval(
                      child: photo != null
                          ? Image.network(
                              _apiService.getFullImageUrl(photo),
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) =>
                                  Icon(Icons.person_rounded, color: context.subTitleColor, size: 32),
                            )
                          : Icon(Icons.person_rounded, color: context.subTitleColor, size: 32),
                    ),
                  ),
                  const SizedBox(width: 16),
                  // User Details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: GoogleFonts.outfit(
                            color: context.titleColor,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          "NIP: $nip  •  HP: $phone",
                          style: GoogleFonts.outfit(
                            color: context.bodyColor,
                            fontSize: 11,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            jabatan,
                            style: GoogleFonts.outfit(
                              color: const Color(0xFF10B981),
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // ===== 2. GROUP 1: KEAMANAN & PENGATURAN AKUN =====
            _buildSectionHeader("PENGATURAN AKUN"),
            Container(
              decoration: BoxDecoration(
                color: context.cardBg,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: context.borderColor),
              ),
              child: Column(
                children: [
                  // Change Password Tile
                  _buildListTile(
                    icon: Icons.lock_outline_rounded,
                    title: "Ubah Password",
                    subtitle: "Perbarui kata sandi akun Diniyah",
                    color: const Color(0xFF3B82F6),
                    onTap: _showChangePasswordDialog,
                  ),
                  _buildDivider(),

                  // Biometrics Toggle Tile
                  if (_biometricAvailable) ...[
                    _buildSwitchTile(
                      icon: Icons.fingerprint_rounded,
                      title: "Login Biometrik",
                      subtitle: "Masuk aman dengan sidik jari/wajah",
                      color: const Color(0xFF10B981),
                      value: _biometricEnabled,
                      onChanged: _toggleBiometric,
                    ),
                    _buildDivider(),
                  ],

                  // Theme Selection
                  _buildSwitchTile(
                    icon: Icons.dark_mode_outlined,
                    title: "Mode Gelap",
                    subtitle: "Tampilan visual kontras tinggi",
                    color: const Color(0xFF8B5CF6),
                    value: ThemeManager().isDarkMode,
                    onChanged: (val) {
                      setState(() {
                        ThemeManager().toggleTheme(val);
                      });
                      _showToast(val ? "Mode Gelap aktif" : "Mode Terang aktif", const Color(0xFF8B5CF6));
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // ===== 3. GROUP 2: PREFERENSI & BANTUAN =====
            _buildSectionHeader("PREFERENSI & LAYANAN"),
            Container(
              decoration: BoxDecoration(
                color: context.cardBg,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: context.borderColor),
              ),
              child: Column(
                children: [
                  // Notifications Switch (Dummy)
                  _buildSwitchTile(
                    icon: Icons.notifications_none_rounded,
                    title: "Notifikasi KBM",
                    subtitle: "Terima info KBM & pengumuman",
                    color: const Color(0xFFEC4899),
                    value: _notificationsEnabled,
                    onChanged: (val) {
                      setState(() {
                        _notificationsEnabled = val;
                      });
                      _showToast("Pengaturan notifikasi diperbarui", const Color(0xFFEC4899));
                    },
                  ),
                  _buildDivider(),

                  // Sound setting tile
                  _buildListTile(
                    icon: Icons.music_note_rounded,
                    title: "Nada Dering Notifikasi",
                    subtitle: _getSoundNameLabel(_selectedSound),
                    color: const Color(0xFF8B5CF6),
                    onTap: _showSoundSelectionDialog,
                  ),
                  _buildDivider(),

                  // Kotak Saran Tile
                  _buildListTile(
                    icon: Icons.rate_review_outlined,
                    title: "Kotak Saran & Masukan",
                    subtitle: "Kirim masukan/saran pengembangan aplikasi",
                    color: const Color(0xFF10B981),
                    onTap: _showFeedbackDialog,
                  ),
                  _buildDivider(),

                  // FAQ and Help
                  _buildListTile(
                    icon: Icons.help_outline_rounded,
                    title: "FAQ & Pusat Bantuan",
                    subtitle: "Pertanyaan umum & panduan aplikasi",
                    color: const Color(0xFFF59E0B),
                    onTap: _showFAQDialog,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // ===== 4. GROUP 3: LOGOUT ACTION =====
            _buildListTile(
              icon: Icons.logout_rounded,
              title: "Keluar Akun",
              subtitle: "Keluar dari sesi portal aktif saat ini",
              color: Colors.redAccent,
              isDestructive: true,
              onTap: _handleLogout,
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String label) {
    return Padding(
      padding: const EdgeInsets.only(left: 4.0, bottom: 8.0),
      child: Text(
        label,
        style: GoogleFonts.outfit(
          color: context.subTitleColor,
          fontSize: 10,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.5,
        ),
      ),
    );
  }

  Widget _buildListTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
    bool isDestructive = false,
  }) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: color, size: 22),
      ),
      title: Text(
        title,
        style: GoogleFonts.outfit(
          color: isDestructive ? Colors.redAccent : context.titleColor,
          fontSize: 14,
          fontWeight: FontWeight.bold,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: GoogleFonts.outfit(color: context.bodyColor, fontSize: 11),
      ),
      trailing: isDestructive
          ? null
          : Icon(Icons.chevron_right_rounded, color: context.subTitleColor, size: 20),
    );
  }

  Widget _buildSwitchTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return SwitchListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      title: Text(
        title,
        style: GoogleFonts.outfit(
          color: context.titleColor,
          fontSize: 14,
          fontWeight: FontWeight.bold,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: GoogleFonts.outfit(color: context.bodyColor, fontSize: 11),
      ),
      secondary: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: color, size: 22),
      ),
      value: value,
      onChanged: onChanged,
      activeColor: const Color(0xFF10B981),
    );
  }

  Widget _buildDivider() {
    return Divider(
      color: context.borderColor,
      height: 1,
      indent: 64,
    );
  }

  Widget _buildPasswordField({
    required TextEditingController controller,
    required String label,
    required bool obscure,
    required VoidCallback onToggle,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscure,
      style: GoogleFonts.inter(color: context.titleColor, fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 13),
        filled: true,
        fillColor: context.isDarkMode ? const Color(0xFF070B13) : context.inputBg,
        prefixIcon: Icon(Icons.lock_outline_rounded, color: context.subTitleColor, size: 18),
        suffixIcon: IconButton(
          icon: Icon(
            obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
            color: context.subTitleColor,
            size: 18,
          ),
          onPressed: onToggle,
        ),
        contentPadding: const EdgeInsets.symmetric(vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF10B981), width: 1),
        ),
      ),
    );
  }
}
