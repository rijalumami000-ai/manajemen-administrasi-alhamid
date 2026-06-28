import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../services/api_service.dart';
import '../services/theme_manager.dart';

class ScanKartuUjianScreen extends StatefulWidget {
  const ScanKartuUjianScreen({super.key});

  @override
  State<ScanKartuUjianScreen> createState() => _ScanKartuUjianScreenState();
}

class _ScanKartuUjianScreenState extends State<ScanKartuUjianScreen> with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  final TextEditingController _codeController = TextEditingController();
  final MobileScannerController _scannerController = MobileScannerController();

  late AnimationController _scannerAnimController;
  late Animation<double> _animation;

  bool _isLoading = false;
  bool _isScanCooldown = false;
  String? _errorMessage;
  Map<String, dynamic>? _scanResult;

  @override
  void initState() {
    super.initState();
    _scannerAnimController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _animation = Tween<double>(begin: 0.1, end: 0.9).animate(_scannerAnimController);
  }

  @override
  void dispose() {
    _scannerAnimController.dispose();
    _codeController.dispose();
    _scannerController.dispose();
    super.dispose();
  }

  Future<void> _performScan(String code) async {
    if (code.trim().isEmpty) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _scanResult = null;
    });

    try {
      final res = await _apiService.scanKartuUjian(code.trim());
      setState(() {
        _scanResult = res;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.scaffoldBg,
      appBar: AppBar(
        backgroundColor: context.isDarkMode ? const Color(0xFF0D1527) : Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: context.titleColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Scan Kartu Ujian',
          style: GoogleFonts.outfit(color: context.titleColor, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Scanner Viewfinder Card
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: context.cardBg,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: context.borderColor),
              ),
              child: Column(
                children: [
                  Text(
                    'ARAHKAN KAMERA KE QR KARTU UJIAN',
                    style: GoogleFonts.outfit(
                      color: context.subTitleColor,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Animated Scanner Viewfinder Box with Live Camera
                  Container(
                    width: 220,
                    height: 220,
                    decoration: BoxDecoration(
                      color: context.isDarkMode ? const Color(0xFF070B13) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF10B981).withOpacity(0.5), width: 2),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(18),
                      child: Stack(
                        children: [
                          MobileScanner(
                            controller: _scannerController,
                            onDetect: (capture) {
                              if (_isLoading || _isScanCooldown) return;
                              final List<Barcode> barcodes = capture.barcodes;
                              for (final barcode in barcodes) {
                                final String? code = barcode.rawValue;
                                if (code != null && code.trim().isNotEmpty) {
                                  _isScanCooldown = true;
                                  _performScan(code).then((_) {
                                    Future.delayed(const Duration(seconds: 3), () {
                                      if (mounted) setState(() => _isScanCooldown = false);
                                    });
                                  });
                                  break;
                                }
                              }
                            },
                          ),
                          // Corners Overlay
                          Positioned(
                            top: 10, left: 10,
                            child: Container(width: 20, height: 20, decoration: const BoxDecoration(border: Border(top: BorderSide(color: Color(0xFF10B981), width: 3), left: BorderSide(color: Color(0xFF10B981), width: 3)))),
                          ),
                          Positioned(
                            top: 10, right: 10,
                            child: Container(width: 20, height: 20, decoration: const BoxDecoration(border: Border(top: BorderSide(color: Color(0xFF10B981), width: 3), right: BorderSide(color: Color(0xFF10B981), width: 3)))),
                          ),
                          Positioned(
                            bottom: 10, left: 10,
                            child: Container(width: 20, height: 20, decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFF10B981), width: 3), left: BorderSide(color: Color(0xFF10B981), width: 3)))),
                          ),
                          Positioned(
                            bottom: 10, right: 10,
                            child: Container(width: 20, height: 20, decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFF10B981), width: 3), right: BorderSide(color: Color(0xFF10B981), width: 3)))),
                          ),
                          // Laser Anim Overlay
                          AnimatedBuilder(
                            animation: _animation,
                            builder: (context, child) {
                              return Positioned(
                                top: _animation.value * 200,
                                left: 20,
                                right: 20,
                                child: Container(
                                  height: 3,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF10B981),
                                    boxShadow: [
                                      BoxShadow(
                                        color: const Color(0xFF10B981).withOpacity(0.8),
                                        blurRadius: 8,
                                        spreadRadius: 2,
                                      )
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Atau Masukkan Nomor Peserta / NIS Santri secara manual di bawah ini:',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 12),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _codeController,
                          style: GoogleFonts.outfit(color: context.titleColor, fontSize: 14, fontWeight: FontWeight.bold),
                          decoration: InputDecoration(
                            hintText: 'Masukkan QR / NIS...',
                            hintStyle: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 13),
                            filled: true,
                            fillColor: context.inputBg,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                          ),
                          onSubmitted: _performScan,
                        ),
                      ),
                      const SizedBox(width: 10),
                      ElevatedButton(
                        onPressed: _isLoading ? null : () => _performScan(_codeController.text),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: _isLoading
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Icon(Icons.search_rounded, size: 22),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Scan Result Card
            if (_errorMessage != null)
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.redAccent.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.redAccent.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 28),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: GoogleFonts.outfit(color: Colors.redAccent, fontSize: 14, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),

            if (_scanResult != null && _scanResult!['santri'] != null)
              _buildDigitalKartuUjian(_scanResult!),
          ],
        ),
      ),
    );
  }

  Widget _buildDigitalKartuUjian(Map<String, dynamic> data) {
    final santri = data['santri'] as Map<String, dynamic>;
    final tahunAjaran = data['tahunAjaran'] ?? '-';
    final semester = data['semester'] ?? '-';

    final nama = santri['nama'] ?? '-';
    final nis = santri['nis'] ?? '-';
    final noPeserta = santri['no_peserta'] ?? '-';
    final kelas = santri['kelas'] ?? '-';
    final fotoUrl = santri['foto_url'];
    final urutanDiKelas = santri['urutan_di_kelas'] ?? 1;

    final baseUrl = 'https://alhamidcintamulya.my.id';
    final fullFotoUrl = fotoUrl != null && fotoUrl.isNotEmpty
        ? (fotoUrl.startsWith('http') ? fotoUrl : '$baseUrl$fotoUrl')
        : null;

    return Container(
      decoration: BoxDecoration(
        color: context.cardBg,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF10B981), width: 2),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF10B981).withOpacity(0.15),
            blurRadius: 20,
            offset: const Offset(0, 8),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Card Header Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: const BoxDecoration(
              color: Color(0xFF064E3B),
              borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
            ),
            child: Row(
              children: [
                const Icon(Icons.verified_rounded, color: Color(0xFF34D399), size: 24),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'KARTU PESERTA UJIAN',
                        style: GoogleFonts.outfit(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold, letterSpacing: 1),
                      ),
                      Text(
                        'T.A $tahunAjaran • Semester $semester',
                        style: GoogleFonts.outfit(color: const Color(0xFFA7F3D0), fontSize: 11),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'AKTIF',
                    style: GoogleFonts.outfit(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900),
                  ),
                ),
              ],
            ),
          ),

          // Card Content
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Foto Santri
                Container(
                  width: 80,
                  height: 100,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    color: context.isDarkMode ? Colors.white.withOpacity(0.08) : const Color(0xFFE2E8F0),
                    border: Border.all(color: context.borderColor, width: 1.5),
                    image: fullFotoUrl != null
                        ? DecorationImage(image: NetworkImage(fullFotoUrl), fit: BoxFit.cover)
                        : null,
                  ),
                  child: fullFotoUrl == null
                      ? Icon(Icons.person_rounded, size: 48, color: context.subTitleColor)
                      : null,
                ),
                const SizedBox(width: 16),

                // Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        nama,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.outfit(color: context.titleColor, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 6),
                      _buildCardItemRow('NO. PESERTA', noPeserta, isPrimary: true),
                      const SizedBox(height: 4),
                      _buildCardItemRow('NIS', nis),
                      const SizedBox(height: 4),
                      _buildCardItemRow('KELAS', 'Kelas $kelas (Meja #$urutanDiKelas)'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCardItemRow(String label, String value, {bool isPrimary = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 80,
          child: Text(
            label,
            style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 10, fontWeight: FontWeight.bold),
          ),
        ),
        Text(': ', style: GoogleFonts.outfit(color: context.subTitleColor, fontSize: 10)),
        Expanded(
          child: Text(
            value,
            style: GoogleFonts.outfit(
              color: isPrimary ? const Color(0xFF10B981) : context.titleColor,
              fontSize: isPrimary ? 13 : 12,
              fontWeight: isPrimary ? FontWeight.w900 : FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}
