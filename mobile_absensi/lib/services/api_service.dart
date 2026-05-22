import 'dart:io';
import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  // Ganti IP ini dengan IP Local Komputer Anda (Server)
  // Contoh: http://192.168.1.10:3000
  static const String baseUrl = "https://alhamidcintamulya.my.id/api";
  
  final Dio _dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  final _storage = const FlutterSecureStorage();

  // Singleton pattern
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal() {
    // Bypass verifikasi sertifikat SSL untuk menjamin koneksi HTTPS stabil
    _dio.httpClientAdapter = IOHttpClientAdapter()
      ..createHttpClient = () {
        final client = HttpClient();
        client.badCertificateCallback = (X509Certificate cert, String host, int port) => true;
        return client;
      };

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        String? token = await _storage.read(key: 'accessToken');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) async {
        if (e.response?.statusCode == 401) {
          // Logika refresh token bisa ditambahkan di sini
        }
        return handler.next(e);
      },
    ));
  }

  // Login
  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'username': username,
        'password': password,
      });
      
      if (response.statusCode == 200) {
        await _storage.write(key: 'accessToken', value: response.data['accessToken']);
        return response.data;
      }
      throw Exception('Gagal login');
    } catch (e) {
      rethrow;
    }
  }

  // Submit Scan Wajah
  Future<Map<String, dynamic>> submitFaceScan({
    required List<double> faceDescriptor,
    required String sholat,
  }) async {
    try {
      final response = await _dio.post('/absensi-sholat/scan', data: {
        'faceDescriptor': faceDescriptor,
        'sholat': sholat,
      });
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  // Submit Scan Wajah Gambar (Untuk Mobile Native)
  Future<Map<String, dynamic>> submitFaceScanImage({
    required String imagePath,
    required String sholat,
  }) async {
    try {
      final formData = FormData.fromMap({
        'sholat': sholat,
        'image': await MultipartFile.fromFile(imagePath, filename: 'face.jpg'),
      });

      final response = await _dio.post('/absensi-sholat/scan-image', data: formData);
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  // Ambil Data Profil
  Future<Map<String, dynamic>> getProfile() async {
    try {
      final response = await _dio.get('/auth/me');
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  // Ambil Absensi Hari Ini
  Future<List<dynamic>> getTodayAttendance() async {
    try {
      final response = await _dio.get('/absensi-sholat/today');
      return response.data as List<dynamic>;
    } catch (e) {
      rethrow;
    }
  }

  // Logout
  Future<void> logout() async {
    await _storage.delete(key: 'accessToken');
  }

  // Ping Server untuk indikator koneksi
  Future<bool> pingServer() async {
    try {
      final response = await _dio.get(
        '/absensi-sholat/today',
        options: Options(
          connectTimeout: const Duration(seconds: 3),
          receiveTimeout: const Duration(seconds: 3),
        ),
      );
      return response.statusCode == 200;
    } catch (e) {
      if (e is DioException) {
        // Jika server memberikan respon HTTP (misalnya 401 Unauthorized), berarti server ONLINE & merespon!
        if (e.response != null) {
          return true;
        }
      }
      return false;
    }
  }
}
