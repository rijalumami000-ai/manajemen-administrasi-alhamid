import 'dart:io';
import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
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
    // Bypass SSL certificate verification for local development/staging stability
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
          // Access token expired or invalid, clear it
          await _storage.delete(key: 'accessToken');
        }
        return handler.next(e);
      },
    ));
  }

  // Set or change baseUrl dynamically (useful if running local server)
  void setBaseUrl(String newUrl) {
    _dio.options.baseUrl = newUrl;
  }

  Future<String?> getToken() async {
    return await _storage.read(key: 'accessToken');
  }

  // Login
  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await _dio.post('/my-mustahiq/login', data: {
        'username': username,
        'password': password,
      });
      
      if (response.statusCode == 200) {
        await _storage.write(key: 'accessToken', value: response.data['accessToken']);
        return response.data;
      }
      throw Exception('Gagal login. Periksa kembali username dan password Anda.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        final errorMsg = e.response?.data['error'] ?? 'Terjadi kesalahan saat login.';
        throw Exception(errorMsg);
      }
      throw Exception('Tidak dapat terhubung ke server.');
    }
  }

  // Dashboard Overview
  Future<Map<String, dynamic>> getDashboard() async {
    try {
      final response = await _dio.get('/my-mustahiq/dashboard');
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal mengambil data dashboard.');
    } catch (e) {
      throw Exception('Koneksi bermasalah atau sesi Anda telah berakhir.');
    }
  }

  // Get Students List for class
  Future<Map<String, dynamic>> getStudents(int? kelasId) async {
    try {
      final path = kelasId != null ? '/my-mustahiq/santri?kelas_id=$kelasId' : '/my-mustahiq/santri';
      final response = await _dio.get(path);
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal mengambil data santri.');
    } catch (e) {
      throw Exception('Tidak dapat memuat data santri.');
    }
  }

  // Get all active classes list directly (skips homeroom fallback)
  Future<Map<String, dynamic>> getClasses() async {
    try {
      final response = await _dio.get('/my-mustahiq/santri?force_classes=true');
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal mengambil daftar kelas.');
    } catch (e) {
      throw Exception('Tidak dapat memuat daftar kelas.');
    }
  }

  // Get Detailed Student Info (Profile, Grades, Achievements, Violations)
  Future<Map<String, dynamic>> getStudentDetail(int santriId) async {
    try {
      final response = await _dio.get('/my-mustahiq/santri/$santriId/detail');
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal mengambil detail santri.');
    } catch (e) {
      throw Exception('Tidak dapat memuat rincian santri.');
    }
  }

  // Get Schedule for class
  Future<Map<String, dynamic>> getSchedule(int kelasId) async {
    try {
      final response = await _dio.get('/my-mustahiq/jadwal?kelas_id=$kelasId');
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal mengambil jadwal pelajaran.');
    } catch (e) {
      throw Exception('Tidak dapat memuat jadwal.');
    }
  }

  // Get Organization Structure (madrasah_diniyah / panitia_ujian)
  Future<List<dynamic>> getStructure(String tipe) async {
    try {
      final response = await _dio.get('/my-mustahiq/struktur?tipe=$tipe');
      if (response.statusCode == 200) {
        return response.data as List<dynamic>;
      }
      throw Exception('Gagal mengambil data struktur organisasi.');
    } catch (e) {
      throw Exception('Tidak dapat memuat struktur.');
    }
  }

  // Logout
  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout');
    } catch (_) {}
    await _storage.delete(key: 'accessToken');
  }

  // Ping Server to check online status
  Future<bool> pingServer() async {
    try {
      final response = await _dio.get(
        '/auth/me',
        options: Options(
          connectTimeout: const Duration(seconds: 3),
          receiveTimeout: const Duration(seconds: 3),
        ),
      );
      return response.statusCode == 200;
    } catch (e) {
      if (e is DioException && e.response != null) {
        // Even if unauthorized, the server responded!
        return true;
      }
      return false;
    }
  }

  // Format image URL by removing /api from the dynamic baseUrl
  String getFullImageUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    final currentBase = _dio.options.baseUrl;
    final cleanBase = currentBase.endsWith('/api')
        ? currentBase.substring(0, currentBase.length - 4)
        : currentBase.replaceAll('/api', '');
    return '$cleanBase$path';
  }

  // Change Password
  Future<Map<String, dynamic>> changePassword(String oldPassword, String newPassword) async {
    try {
      final response = await _dio.post('/my-mustahiq/change-password', data: {
        'oldPassword': oldPassword,
        'newPassword': newPassword,
      });
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal memperbarui password.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal memperbarui password.');
      }
      throw Exception('Tidak dapat terhubung ke server.');
    }
  }
}

