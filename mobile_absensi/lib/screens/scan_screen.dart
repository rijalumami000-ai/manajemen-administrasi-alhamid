import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:camera/camera.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:lottie/lottie.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:dio/dio.dart';
import 'package:image/image.dart' as img;
import '../services/face_detector_service.dart';
import '../services/api_service.dart';

class ScanScreen extends StatefulWidget {
  const ScanScreen({super.key});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  CameraController? _cameraController;
  final FaceDetectorService _faceDetectorService = FaceDetectorService();
  final ApiService _apiService = ApiService();
  final FlutterTts _flutterTts = FlutterTts();
  final AudioPlayer _audioPlayer = AudioPlayer();
  
  bool _isProcessing = false;
  String _statusMessage = "Arahkan wajah ke kamera";
  String _selectedSholat = "Subuh";
  bool _isShowingSuccess = false;
  Map<String, dynamic>? _successSantriData;
  CameraLensDirection _currentLensDirection = CameraLensDirection.front;

  // Liveness Detection Variables
  bool _isEyeClosed = false;
  int _blinkCount = 0;
  final int _requiredBlinks = 1; // 1 kedipan sudah sangat aman & responsif di HP

  // Server Connection Status
  bool _isServerConnected = true;
  Timer? _connectionTimer;

  final List<String> _sholatOptions = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];

  // Audio URL Assets (Mixkit royalty-free fast response short sounds)
  static const String _successSoundUrl = "https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav";
  static const String _failureSoundUrl = "https://assets.mixkit.co/active_storage/sfx/2573/2573-84.wav";

  @override
  void initState() {
    super.initState();
    _determineInitialSholat();
    _initializeTts();
    _initializeCamera();
    _startServerConnectionPing();
  }

  void _determineInitialSholat() {
    final hour = DateTime.now().hour;
    if (hour >= 4 && hour < 6) {
      _selectedSholat = 'Subuh';
    } else if (hour >= 11 && hour < 14) {
      _selectedSholat = 'Dzuhur';
    } else if (hour >= 15 && hour < 17) {
      _selectedSholat = 'Ashar';
    } else if (hour >= 17 && hour < 19) {
      _selectedSholat = 'Maghrib';
    } else if (hour >= 19 && hour < 21) {
      _selectedSholat = 'Isya';
    } else {
      _selectedSholat = 'Subuh'; // Default
    }
  }

  Future<void> _initializeTts() async {
    await _flutterTts.setLanguage("id-ID");
    await _flutterTts.setPitch(1.0);
    await _flutterTts.setSpeechRate(0.5);
  }

  Future<void> _initializeCamera() async {
    final cameras = await availableCameras();
    final targetCamera = cameras.firstWhere(
      (camera) => camera.lensDirection == _currentLensDirection,
      orElse: () => cameras.first,
    );

    _cameraController = CameraController(
      targetCamera,
      ResolutionPreset.medium,
      enableAudio: false,
    );

    try {
      await _cameraController!.initialize();
      if (!mounted) return;
      setState(() {});

      _startStream(targetCamera);
    } catch (e) {
      debugPrint("Gagal menginisialisasi kamera: $e");
      setState(() => _statusMessage = "Gagal memuat kamera");
    }
  }

  Future<void> _toggleCameraDirection() async {
    if (_cameraController == null) return;
    
    try {
      await _cameraController!.stopImageStream();
    } catch (e) {
      debugPrint("Gagal menginisialisasi/menghentikan stream: $e");
    }
    
    await _cameraController!.dispose();
    
    setState(() {
      _cameraController = null;
      _currentLensDirection = _currentLensDirection == CameraLensDirection.front
          ? CameraLensDirection.back
          : CameraLensDirection.front;
    });
    
    await _initializeCamera();
  }

  void _startStream(CameraDescription camera) {
    if (_cameraController == null || !_cameraController!.value.isInitialized) return;
    
    _cameraController!.startImageStream((image) {
      if (_isProcessing || _isShowingSuccess || !_isServerConnected) return;
      _processCameraImage(image, camera);
    });
  }

  // Real-Time Server Ping Loop
  void _startServerConnectionPing() {
    _checkServerConnection();
    _connectionTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      _checkServerConnection();
    });
  }

  Future<void> _checkServerConnection() async {
    final connected = await _apiService.pingServer();
    if (!mounted) return;
    
    if (_isServerConnected != connected) {
      setState(() {
        _isServerConnected = connected;
        if (!connected) {
          _statusMessage = "🔴 Hubungan ke server terputus!";
        } else {
          _statusMessage = "Arahkan wajah ke kamera";
        }
      });
    }
  }

  // Play Sound Utility
  Future<void> _playSound(String url) async {
    try {
      await _audioPlayer.stop();
      await _audioPlayer.play(UrlSource(url));
    } catch (e) {
      debugPrint("Error playing sound: $e");
    }
  }

  Future<void> _processCameraImage(CameraImage image, CameraDescription camera) async {
    if (!_isServerConnected) {
      _isProcessing = false;
      return;
    }
    
    _isProcessing = true;
    try {
      final faces = await _faceDetectorService.getFacesFromImage(image, camera);
      
      if (faces.isNotEmpty && !_isShowingSuccess) {
        final face = faces.first;
        
        // Membaca probabilitas kelopak mata terbuka (ML Kit Classification)
        final leftOpen = face.leftEyeOpenProbability ?? 1.0;
        final rightOpen = face.rightEyeOpenProbability ?? 1.0;
        final ear = (leftOpen + rightOpen) / 2.0;

        // State Machine Pelacakan Kedipan Mata
        if (ear < 0.25) {
          _isEyeClosed = true;
          setState(() {
            _statusMessage = "Mata terpejam... Buka untuk absen!";
          });
        } else if (_isEyeClosed && ear > 0.75) {
          _isEyeClosed = false;
          _blinkCount++;
          
          // Feedback fisik getaran pendek (haptic click) saat kedipan terdeteksi
          HapticFeedback.selectionClick();

          setState(() {
            _statusMessage = "Kedipan terdeteksi! ($_blinkCount/$_requiredBlinks)";
          });

          if (_blinkCount >= _requiredBlinks) {
            _blinkCount = 0; // reset untuk scan berikutnya
            
            // Berhenti memproses frame baru selama pemindaian server
            setState(() {
              _statusMessage = "Liveness OK! Mengidentifikasi...";
            });

            // Hentikan stream kamera untuk kestabilan selama mengambil foto
            await _cameraController!.stopImageStream();
            
            // Ambil foto kualitas tinggi
            final xFile = await _cameraController!.takePicture();
            
            // Perbaiki rotasi & orientasi gambar di Background Isolate (Thread Terpisah) sebelum dikirim
            // agar server production (VPS) menerima gambar tegak sempurna tanpa membekukan UI Utama (Bypass ANR)
            try {
              await compute(_processImageRotationInBackground, xFile.path);
              debugPrint("Sukses memperbaiki rotasi gambar di background Isolate.");
            } catch (e) {
              debugPrint("Gagal memproses rotasi gambar lokal di Isolate: $e");
            }
            
            // Kirim gambar ke server
            final result = await _apiService.submitFaceScanImage(
              imagePath: xFile.path,
              sholat: _selectedSholat,
            );

            if (result['success'] == true) {
              final match = result['match'];
              await _handleAttendanceSuccess(match);
            } else {
              _handleAttendanceFailure("Wajah tidak dikenali");
            }
          }
        } else {
          // Wajah terdeteksi, minta santri berkedip
          setState(() {
            _statusMessage = "Kedipkan mata Anda untuk konfirmasi";
          });
        }
        
        // Lepas lock pemrosesan frame jika belum memenuhi syarat kedipan
        if (_blinkCount < _requiredBlinks) {
          _isProcessing = false;
          return;
        }
      } else {
        // Jika tidak ada wajah dalam frame, reset status kedipan
        setState(() {
          _statusMessage = _isServerConnected 
              ? "Arahkan wajah ke dalam bingkai" 
              : "🔴 Server offline! Periksa koneksi jaringan.";
          _isEyeClosed = false;
          _blinkCount = 0;
        });
        _isProcessing = false;
        return;
      }
    } catch (e) {
      debugPrint("Error processing image: $e");
      String errorMsg = "Kesalahan jaringan / server";
      if (e is DioException) {
        final statusCode = e.response?.statusCode;
        final data = e.response?.data;
        
        if (data != null) {
          if (data is Map) {
            errorMsg = data['message'] ?? data['error'] ?? errorMsg;
          } else if (data is String) {
            try {
              final decoded = jsonDecode(data);
              if (decoded is Map) {
                errorMsg = decoded['message'] ?? decoded['error'] ?? errorMsg;
              }
            } catch (_) {
              if (data.isNotEmpty && data.length < 80) {
                errorMsg = data;
              }
            }
          }
        }
        
        // Fallback cerdas berdasarkan HTTP Status Code jika pesan bawaan masih berupa info developer yang panjang
        if (errorMsg == "Kesalahan jaringan / server" || errorMsg.contains("RequestOptions.validateStatus") || errorMsg.contains("status code of 404")) {
          if (statusCode == 404) {
            errorMsg = "Wajah tidak dikenali";
          } else if (statusCode == 400) {
            errorMsg = "Wajah tidak terdeteksi pada gambar";
          } else if (statusCode == 401) {
            errorMsg = "Sesi masuk habis. Silakan masuk kembali.";
          } else if (statusCode == 403) {
            errorMsg = "Akses ditolak oleh server";
          } else if (statusCode == 500) {
            errorMsg = "Server sedang sibuk / error internal.";
          }
        }
      }
      _handleAttendanceFailure(errorMsg);
    } finally {
      // Jika terjadi kegagalan absensi, tunda sebentar lalu nyalakan stream lagi
      if (!_isShowingSuccess && mounted && _isProcessing) {
        await Future.delayed(const Duration(seconds: 2));
        setState(() {
          _isProcessing = false;
          _blinkCount = 0;
          _isEyeClosed = false;
        });
        _restartStreamIfActive(camera);
      }
    }
  }

  void _restartStreamIfActive(CameraDescription camera) {
    if (!mounted || _isShowingSuccess || !_isServerConnected) return;
    try {
      _cameraController!.startImageStream((image) {
        if (_isProcessing || _isShowingSuccess || !_isServerConnected) return;
        _processCameraImage(image, camera);
      });
    } catch (_) {}
  }

  Future<void> _handleAttendanceSuccess(Map<String, dynamic> match) async {
    setState(() {
      _isShowingSuccess = true;
      _successSantriData = match;
      _statusMessage = "Presensi Berhasil!";
    });

    // 1. Getaran Haptic feedback yang mantap untuk sukses
    HapticFeedback.lightImpact();
    Future.delayed(const Duration(milliseconds: 100), () => HapticFeedback.lightImpact());

    // 2. Play efek suara sukses presensi biometrik
    _playSound(_successSoundUrl);

    // 3. Suara TTS Bahasa Indonesia pembaca nama santri
    final String textToSpeak = "${match['nama']} telah absen sholat $_selectedSholat";
    await _flutterTts.speak(textToSpeak);

    if (mounted) {
      _showSuccessOverlay(match);
    }
  }

  void _handleAttendanceFailure(String message) {
    if (!mounted) return;
    
    // 1. Getaran getar panjang sebagai peringatan gagal
    HapticFeedback.vibrate();

    // 2. Play suara buzzer gagal/ditolak
    _playSound(_failureSoundUrl);

    setState(() {
      _statusMessage = message;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline_rounded, color: Colors.white),
            const SizedBox(width: 10),
            Text("Presensi gagal: $message"),
          ],
        ),
        backgroundColor: Colors.redAccent,
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      ),
    );
  }

  void _showSuccessOverlay(Map<String, dynamic> match) {
    showGeneralDialog(
      context: context,
      barrierDismissible: false,
      barrierLabel: "Success",
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (context, anim1, anim2) {
        final String domain = ApiService.baseUrl.replaceAll("/api", "");
        final String photoUrl = match['foto_url'] != null ? "$domain${match['foto_url']}" : "";

        return WillPopScope(
          onWillPop: () async => false,
          child: Scaffold(
            backgroundColor: Colors.black.withOpacity(0.85),
            body: Center(
              child: Container(
                constraints: const BoxConstraints(maxWidth: 520), // diperbesar dari 420 ke 520
                child: Card(
                  elevation: 25,
                  color: const Color(0xFF131B2E),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(35), // radius melengkung lebih premium
                    side: BorderSide(
                      color: const Color(0xFF10B981).withOpacity(0.3), // glow border lebih kuat
                      width: 2.0,
                    ),
                  ),
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  child: Padding(
                    padding: const EdgeInsets.all(40.0), // Padding dalam diperbesar
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Lottie.network(
                          'https://lottie.host/82df23d7-2f3b-4861-8ff8-e692a7f53cf8/Tq1mCj9LwY.json',
                          height: 150, // Diperbesar dari 120 ke 150
                          width: 150,
                          repeat: false,
                          errorBuilder: (context, error, stackTrace) {
                            return const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 90);
                          },
                        ),
                        const SizedBox(height: 12),
                        Text(
                          "PRESENSI BERHASIL",
                          style: GoogleFonts.outfit(
                            fontSize: 20, // Diperbesar dari 16 ke 20
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF34D399),
                            letterSpacing: 2.5, // Spasi lebih anggun
                          ),
                        ),
                        const SizedBox(height: 25),
                        Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(
                              color: const Color(0xFF10B981).withOpacity(0.6),
                              width: 2.5, // Bingkai foto santri lebih tebal
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF10B981).withOpacity(0.20),
                                blurRadius: 20,
                                spreadRadius: 3,
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(21),
                            child: photoUrl.isNotEmpty
                                ? Image.network(
                                    photoUrl,
                                    height: 250, // Diperbesar dari 190 ke 250
                                    width: 190,  // Diperbesar dari 145 ke 190
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) => Container(
                                      height: 250,
                                      width: 190,
                                      color: const Color(0xFF0F172A),
                                      child: const Icon(Icons.person, size: 100, color: Color(0xFF64748B)),
                                    ),
                                  )
                                : Container(
                                    height: 250,
                                    width: 190,
                                    color: const Color(0xFF0F172A),
                                    child: const Icon(Icons.person, size: 100, color: Color(0xFF64748B)),
                                  ),
                          ),
                        ),
                        const SizedBox(height: 25),
                        Text(
                          match['nama'] ?? '-',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.outfit(
                            fontSize: 26, // Diperbesar dari 22 ke 26
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          "Kelas: ${match['kelas'] ?? '-'}",
                          style: GoogleFonts.outfit(
                            fontSize: 17, // Diperbesar dari 15 ke 17
                            color: const Color(0xFF94A3B8),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 10), // Padding diperbesar
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Text(
                            "Sholat: $_selectedSholat",
                            style: GoogleFonts.outfit(
                              fontSize: 16, // Diperbesar dari 14 ke 16
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF34D399),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );

    // Auto close setelah 4 detik dan restart camera stream
    Future.delayed(const Duration(seconds: 4), () async {
      if (mounted) {
        Navigator.of(context).pop();
        setState(() {
          _isShowingSuccess = false;
          _isProcessing = false;
          _blinkCount = 0;
          _isEyeClosed = false;
          _statusMessage = "Arahkan wajah ke kamera";
        });
        
        final cameras = await availableCameras();
        final frontCamera = cameras.firstWhere(
          (camera) => camera.lensDirection == CameraLensDirection.front,
        );
        _startStream(frontCamera);
      }
    });
  }

  void _promptPasscodeOverride(String newValue) {
    final TextEditingController passwordController = TextEditingController();
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return AlertDialog(
          title: const Text("Otorisasi Diperlukan"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("Masukkan kode akses untuk mengganti waktu sholat:"),
              const SizedBox(height: 15),
              TextField(
                controller: passwordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: "Kode Akses",
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                setState(() {}); // trigger UI rebuild to keep old value in dropdown
              },
              child: const Text("Batal"),
            ),
            ElevatedButton(
              onPressed: () {
                if (passwordController.text == "alhamidku123") {
                  setState(() {
                    _selectedSholat = newValue;
                  });
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text("Waktu sholat berhasil diubah"),
                      backgroundColor: Colors.green,
                    ),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text("Kode akses salah!"),
                      backgroundColor: Colors.redAccent,
                    ),
                  );
                }
              },
              child: const Text("Verifikasi"),
            ),
          ],
        );
      },
    );
  }

  @override
  void dispose() {
    _connectionTimer?.cancel();
    _cameraController?.dispose();
    _faceDetectorService.dispose();
    _flutterTts.stop();
    _audioPlayer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: Color(0xFF1B5E20)),
              SizedBox(height: 15),
              Text("Memuat kamera...", style: TextStyle(fontSize: 16, color: Colors.grey)),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF070B13), // Ultra deep space background
      appBar: AppBar(
        title: Text(
          "Scan Wajah Santri",
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        backgroundColor: const Color(0xFF131B2E).withOpacity(0.9),
        centerTitle: true,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Stack(
        children: [
          // Subtle Emerald-glow Orb (Top Left)
          Positioned(
            top: -100,
            left: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF10B981).withOpacity(0.12),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // Main Layout Wrapper
          Center(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Container(
                constraints: const BoxConstraints(maxWidth: 600), // Batas maksimal lebar untuk optimal di Tablet
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Glassmorphic Dropdown Selection Container
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF131B2E),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white.withOpacity(0.04)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            "Waktu Sholat:",
                            style: GoogleFonts.outfit(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          DropdownButton<String>(
                            value: _selectedSholat,
                            underline: const SizedBox(),
                            dropdownColor: const Color(0xFF131B2E),
                            icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF10B981)),
                            style: GoogleFonts.outfit(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF10B981),
                            ),
                            items: _sholatOptions.map((sholat) {
                              return DropdownMenuItem<String>(
                                value: sholat,
                                child: Text(sholat),
                              );
                            }).toList(),
                            onChanged: (value) {
                              if (value != null && value != _selectedSholat) {
                                _promptPasscodeOverride(value);
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Camera View Container with Subtle Emerald Glow
                    Container(
                      height: 400,
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(30),
                        border: Border.all(color: Colors.white.withOpacity(0.06)),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF10B981).withOpacity(0.08),
                            blurRadius: 20,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(30),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            CameraPreview(_cameraController!),
                            
                            // Scanning overlay ring
                            Center(
                              child: Container(
                                width: 260,
                                height: 320,
                                decoration: BoxDecoration(
                                  border: Border.all(
                                    color: !_isServerConnected 
                                        ? Colors.redAccent 
                                        : _isShowingSuccess 
                                            ? const Color(0xFF10B981)
                                            : const Color(0xFF10B981).withOpacity(0.8),
                                    width: 3,
                                  ),
                                  borderRadius: BorderRadius.circular(40),
                                ),
                              ),
                            ),

                            // Glassmorphic Liveness Status Badge (Pojok Kiri Atas)
                            Positioned(
                              top: 20,
                              left: 20,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                decoration: BoxDecoration(
                                  color: Colors.black.withOpacity(0.6),
                                  borderRadius: BorderRadius.circular(15),
                                  border: Border.all(color: Colors.white.withOpacity(0.2)),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 10,
                                      height: 10,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: !_isServerConnected
                                            ? Colors.grey
                                            : _blinkCount >= _requiredBlinks 
                                                ? Colors.green 
                                                : _blinkCount > 0 
                                                    ? Colors.orange 
                                                    : Colors.redAccent,
                                        boxShadow: [
                                          BoxShadow(
                                            color: (!_isServerConnected
                                                ? Colors.grey
                                                : _blinkCount >= _requiredBlinks 
                                                    ? Colors.green 
                                                    : _blinkCount > 0 
                                                        ? Colors.orange 
                                                        : Colors.redAccent).withOpacity(0.5),
                                            blurRadius: 6,
                                            spreadRadius: 2,
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      "Liveness: $_blinkCount/$_requiredBlinks Kedip",
                                      style: GoogleFonts.outfit(
                                        color: Colors.white,
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),

                            // Glassmorphic Server Status Badge (Pojok Kanan Atas)
                            Positioned(
                              top: 20,
                              right: 20,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                decoration: BoxDecoration(
                                  color: Colors.black.withOpacity(0.6),
                                  borderRadius: BorderRadius.circular(15),
                                  border: Border.all(color: Colors.white.withOpacity(0.2)),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 10,
                                      height: 10,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: _isServerConnected ? Colors.green : Colors.redAccent,
                                        boxShadow: [
                                          BoxShadow(
                                            color: (_isServerConnected ? Colors.green : Colors.redAccent).withOpacity(0.5),
                                            blurRadius: 6,
                                            spreadRadius: 2,
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      _isServerConnected ? "Server: Online" : "Server: Offline",
                                      style: GoogleFonts.outfit(
                                        color: Colors.white,
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),

                            // Scanning line animation if active & server online
                            if (!_isShowingSuccess && _isServerConnected)
                              const ScanningLineAnimation(),

                            // Server Offline Overlay Banner
                            if (!_isServerConnected)
                              Container(
                                color: Colors.black.withOpacity(0.75),
                                child: Center(
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.wifi_off_rounded, color: Colors.redAccent, size: 60),
                                      const SizedBox(height: 15),
                                      Text(
                                        "SERVER OFFLINE",
                                        style: GoogleFonts.outfit(
                                          color: Colors.redAccent,
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                          letterSpacing: 1.5,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 30),
                                        child: Text(
                                          "Menghubungkan kembali ke server ${ApiService.baseUrl.replaceAll("/api", "")}...",
                                          textAlign: TextAlign.center,
                                          style: GoogleFonts.outfit(
                                            color: Colors.white70,
                                            fontSize: 13,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),

                            // Processing loading state
                            if (_isProcessing && !_isShowingSuccess && _statusMessage == "Liveness OK! Mengidentifikasi...")
                              Container(
                                color: Colors.black54,
                                child: const Center(
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      CircularProgressIndicator(color: Colors.green),
                                      SizedBox(height: 15),
                                      Text(
                                        "Mengidentifikasi...",
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),

                            // Glassmorphic Camera Toggle Button (Pojok Kanan Bawah)
                            Positioned(
                              bottom: 20,
                              right: 20,
                              child: GestureDetector(
                                onTap: _toggleCameraDirection,
                                child: Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withOpacity(0.6),
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white.withOpacity(0.2)),
                                    boxShadow: [
                                      BoxShadow(
                                        color: const Color(0xFF10B981).withOpacity(0.3),
                                        blurRadius: 10,
                                        spreadRadius: 2,
                                      ),
                                    ],
                                  ),
                                  child: Icon(
                                    _currentLensDirection == CameraLensDirection.front
                                        ? Icons.camera_rear_rounded
                                        : Icons.camera_front_rounded,
                                    color: Colors.white,
                                    size: 24,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 25),

                    // Status message banner
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 15, horizontal: 20),
                      decoration: BoxDecoration(
                        color: !_isServerConnected
                            ? Colors.red.withOpacity(0.1)
                            : _isShowingSuccess 
                                ? const Color(0xFF10B981).withOpacity(0.12) 
                                : const Color(0xFF10B981).withOpacity(0.08),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: !_isServerConnected
                              ? Colors.red.withOpacity(0.3)
                              : _isShowingSuccess 
                                  ? const Color(0xFF10B981).withOpacity(0.3) 
                                  : const Color(0xFF10B981).withOpacity(0.2),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            !_isServerConnected
                                ? Icons.cloud_off_rounded
                                : _isShowingSuccess 
                                    ? Icons.check_circle_outline_rounded 
                                    : _blinkCount > 0 
                                        ? Icons.remove_red_eye_rounded 
                                        : Icons.face_retouching_natural_rounded,
                            color: !_isServerConnected 
                                ? Colors.redAccent 
                                : _isShowingSuccess 
                                    ? const Color(0xFF34D399) 
                                    : const Color(0xFF10B981),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              _statusMessage,
                              textAlign: TextAlign.center,
                              style: GoogleFonts.outfit(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: !_isServerConnected
                                    ? Colors.redAccent
                                    : _isShowingSuccess 
                                        ? const Color(0xFF34D399) 
                                        : const Color(0xFF10B981),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Tips Footer
                    Text(
                      "💡 Keamanan Tambahan: Posisikan wajah Anda tepat di dalam bingkai, lalu kedipkan mata sekali untuk presensi otomatis.",
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(fontSize: 13, color: const Color(0xFF64748B), height: 1.4),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Custom widget for moving scan line effect
class ScanningLineAnimation extends StatefulWidget {
  const ScanningLineAnimation({super.key});

  @override
  State<ScanningLineAnimation> createState() => _ScanningLineAnimationState();
}

class _ScanningLineAnimationState extends State<ScanningLineAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Positioned(
          top: 40 + (_controller.value * 320),
          left: 40,
          right: 40,
          child: Container(
            height: 2,
            decoration: BoxDecoration(
              color: Colors.green,
              boxShadow: [
                BoxShadow(
                  color: Colors.green.withOpacity(0.5),
                  blurRadius: 10,
                  spreadRadius: 2,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Fungsi helper tingkat-tinggi (top-level) untuk memproses rotasi gambar di Isolate terpisah (Background Thread)
/// guna menghindari UI freezing dan crash ANR (Application Not Responding)
Future<bool> _processImageRotationInBackground(String filePath) async {
  try {
    final file = File(filePath);
    if (!await file.exists()) return false;
    
    final bytes = await file.readAsBytes();
    final imageObj = img.decodeImage(bytes);
    if (imageObj != null) {
      final orientedImage = img.bakeOrientation(imageObj);
      final orientedBytes = img.encodeJpg(orientedImage, quality: 80); // quality 80 ideal untuk kompresi hemat bandwidth
      await file.writeAsBytes(orientedBytes);
      return true;
    }
  } catch (e) {
    debugPrint("Isolate Error processing rotation: $e");
  }
  return false;
}
