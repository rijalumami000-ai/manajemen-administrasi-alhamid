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
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal mengambil data dashboard.');
      }
      rethrow;
    }
  }

  // Get Students List for class
  Future<Map<String, dynamic>> getStudents(int? kelasId, {int? tahunAjaranId, String? semester}) async {
    try {
      final queryParams = <String>[];
      if (kelasId != null) queryParams.add('kelas_id=$kelasId');
      if (tahunAjaranId != null) queryParams.add('tahun_ajaran_id=$tahunAjaranId');
      if (semester != null) queryParams.add('semester=$semester');
      
      final queryString = queryParams.isNotEmpty ? '?${queryParams.join('&')}' : '';
      final response = await _dio.get('/my-mustahiq/santri$queryString');
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal mengambil data santri.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal mengambil data santri.');
      }
      rethrow;
    }
  }

  // Get all active classes list directly (skips homeroom fallback)
  Future<Map<String, dynamic>> getClasses({int? tahunAjaranId, String? semester}) async {
    try {
      final queryParams = <String>['force_classes=true'];
      if (tahunAjaranId != null) queryParams.add('tahun_ajaran_id=$tahunAjaranId');
      if (semester != null) queryParams.add('semester=$semester');
      
      final queryString = '?${queryParams.join('&')}';
      final response = await _dio.get('/my-mustahiq/santri$queryString');
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal mengambil daftar kelas.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal mengambil daftar kelas.');
      }
      rethrow;
    }
  }

  // Get Detailed Student Info (Profile, Grades, Achievements, Violations)
  Future<Map<String, dynamic>> getStudentDetail(int santriId, {int? tahunAjaranId, String? semester}) async {
    try {
      final queryParams = <String>[];
      if (tahunAjaranId != null) queryParams.add('tahun_ajaran_id=$tahunAjaranId');
      if (semester != null) queryParams.add('semester=$semester');
      final queryString = queryParams.isNotEmpty ? '?${queryParams.join('&')}' : '';
      
      final response = await _dio.get('/my-mustahiq/santri/$santriId/detail$queryString');
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal mengambil detail santri.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal mengambil detail santri.');
      }
      rethrow;
    }
  }

  // Get Schedule for class
  Future<Map<String, dynamic>> getSchedule(int kelasId, {int? tahunAjaranId, String? semester}) async {
    try {
      final queryParams = <String>['kelas_id=$kelasId'];
      if (tahunAjaranId != null) queryParams.add('tahun_ajaran_id=$tahunAjaranId');
      if (semester != null) queryParams.add('semester=$semester');
      final queryString = '?${queryParams.join('&')}';
      
      final response = await _dio.get('/my-mustahiq/jadwal$queryString');
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal mengambil jadwal pelajaran.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal mengambil jadwal pelajaran.');
      }
      rethrow;
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
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal mengambil data struktur.');
      }
      rethrow;
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

  // Get all Mustahiq list
  Future<Map<String, dynamic>> getMustahiqList() async {
    try {
      final response = await _dio.get('/my-mustahiq/mustahiq');
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal mengambil daftar mustahiq.');
    } catch (e) {
      throw Exception('Tidak dapat memuat daftar mustahiq.');
    }
  }

  // Get all Munawib list
  Future<Map<String, dynamic>> getMunawibList() async {
    try {
      final response = await _dio.get('/my-mustahiq/munawib');
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal mengambil daftar munawib.');
    } catch (e) {
      throw Exception('Tidak dapat memuat daftar munawib.');
    }
  }

  // --- NEW ACADEMIC YEAR / TIM SOAL / INPUT NILAI METHODS ---

  // Get list of all academic years
  Future<Map<String, dynamic>> getTahunAjaranList() async {
    try {
      final response = await _dio.get('/my-mustahiq/tahun-ajaran');
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal mengambil daftar tahun ajaran.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal mengambil daftar tahun ajaran.');
      }
      rethrow;
    }
  }

  // Get metadata (classes and courses) for Tim Soal
  Future<Map<String, dynamic>> getTimSoalData({int? tahunAjaranId}) async {
    try {
      final path = tahunAjaranId != null 
          ? '/my-mustahiq/tim-soal/data?tahun_ajaran_id=$tahunAjaranId' 
          : '/my-mustahiq/tim-soal/data';
      final response = await _dio.get(path);
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal mengambil data kelas/pelajaran.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal mengambil data tim soal.');
      }
      rethrow;
    }
  }

  // Get list of existing exam questions
  Future<Map<String, dynamic>> getTimSoalList({int? kelasId, String? semester, int? tahunAjaranId}) async {
    try {
      final queryParams = <String>[];
      if (kelasId != null) queryParams.add('kelas_id=$kelasId');
      if (semester != null) queryParams.add('semester=$semester');
      if (tahunAjaranId != null) queryParams.add('tahun_ajaran_id=$tahunAjaranId');
      
      final queryString = queryParams.isNotEmpty ? '?${queryParams.join('&')}' : '';
      final response = await _dio.get('/my-mustahiq/tim-soal/list$queryString');
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal mengambil daftar soal.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal mengambil daftar soal.');
      }
      rethrow;
    }
  }

  // Save exam question
  Future<Map<String, dynamic>> saveTimSoal({
    int? id,
    required int kelasId,
    required int mataPelajaranId,
    int? tahunAjaranId,
    required String semester,
    required String tipeUjian,
    required String kontenSoal,
  }) async {
    try {
      final response = await _dio.post('/my-mustahiq/tim-soal/simpan', data: {
        if (id != null) 'id': id,
        'kelas_id': kelasId,
        'mata_pelajaran_id': mataPelajaranId,
        if (tahunAjaranId != null) 'tahun_ajaran_id': tahunAjaranId,
        'semester': semester,
        'tipe_ujian': tipeUjian,
        'konten_soal': kontenSoal,
      });
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal menyimpan soal.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal menyimpan soal.');
      }
      throw Exception('Tidak dapat menyimpan soal.');
    }
  }

  // Delete exam question
  Future<Map<String, dynamic>> deleteTimSoal(int id) async {
    try {
      final response = await _dio.delete('/my-mustahiq/tim-soal/$id');
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal menghapus soal.');
    } catch (e) {
      throw Exception('Tidak dapat menghapus soal.');
    }
  }

  // Get student list and existing grades for grade entry
  Future<Map<String, dynamic>> getInputNilaiSantri({
    required int kelasId,
    int? tahunAjaranId,
    String? semester,
  }) async {
    try {
      final queryParams = <String>['kelas_id=$kelasId'];
      if (tahunAjaranId != null) queryParams.add('tahun_ajaran_id=$tahunAjaranId');
      if (semester != null) queryParams.add('semester=$semester');
      final queryString = '?${queryParams.join('&')}';
      
      final response = await _dio.get('/my-mustahiq/input-nilai/santri$queryString');
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal mengambil data input nilai.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal mengambil data input nilai.');
      }
      rethrow;
    }
  }

  // Save entered grades bulk
  Future<Map<String, dynamic>> saveInputNilai({
    required int tahunAjaranId,
    required int kategoriEvaluasiId,
    required List<Map<String, dynamic>> data,
  }) async {
    try {
      final response = await _dio.post('/my-mustahiq/input-nilai/simpan', data: {
        'tahun_ajaran_id': tahunAjaranId,
        'kategori_evaluasi_id': kategoriEvaluasiId,
        'data': data,
      });
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal menyimpan nilai.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal menyimpan nilai.');
      }
      throw Exception('Tidak dapat menyimpan nilai.');
    }
  }

  // Get Buku Induk Santri list
  Future<List<dynamic>> getBukuInduk({String? gender, String? search}) async {
    try {
      final queryParams = <String>[];
      if (gender != null && gender.isNotEmpty) queryParams.add('jenis_kelamin=$gender');
      if (search != null && search.isNotEmpty) queryParams.add('search=$search');
      final queryString = queryParams.isNotEmpty ? '?${queryParams.join('&')}' : '';
      
      final response = await _dio.get('/my-mustahiq/buku-induk$queryString');
      if (response.statusCode == 200) {
        return response.data as List<dynamic>;
      }
      throw Exception('Gagal mengambil data buku induk.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal mengambil data buku induk.');
      }
      rethrow;
    }
  }

  // Get In-App Notifications
  Future<List<dynamic>> getNotifications() async {
    try {
      final response = await _dio.get('/my-mustahiq/notifications');
      if (response.statusCode == 200) {
        return response.data as List<dynamic>;
      }
      throw Exception('Gagal mengambil data notifikasi.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal mengambil data notifikasi.');
      }
      rethrow;
    }
  }

  // Mark all notifications as read
  Future<Map<String, dynamic>> markNotificationsAsRead() async {
    try {
      final response = await _dio.post('/my-mustahiq/notifications/read-all');
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal menandai semua notifikasi.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal menandai semua notifikasi.');
      }
      rethrow;
    }
  }

  // Mark single notification as read
  Future<Map<String, dynamic>> markNotificationAsReadSingle(int id) async {
    try {
      final response = await _dio.post('/my-mustahiq/notifications/read/$id');
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal menandai notifikasi.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal menandai notifikasi.');
      }
      rethrow;
    }
  }

  // Delete single notification
  Future<Map<String, dynamic>> deleteNotification(int id) async {
    try {
      final response = await _dio.delete('/my-mustahiq/notifications/$id');
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal menghapus notifikasi.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal menghapus notifikasi.');
      }
      rethrow;
    }
  }

  // Clear all notifications
  Future<Map<String, dynamic>> clearAllNotifications() async {
    try {
      final response = await _dio.delete('/my-mustahiq/notifications/clear-all');
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal menghapus semua riwayat notifikasi.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal menghapus semua riwayat notifikasi.');
      }
      rethrow;
    }
  }

  // Register FCM Token
  Future<Map<String, dynamic>> registerFcmToken(String token, {String? deviceInfo}) async {
    try {
      final response = await _dio.post('/my-mustahiq/register-fcm', data: {
        'token': token,
        'deviceInfo': deviceInfo ?? '',
      });
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal mendaftarkan token FCM.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal mendaftarkan token FCM.');
      }
      rethrow;
    }
  }

  // --- CLASS GROUP CHAT METHODS ---

  // Get list of group chat rooms (classes associated with this teacher)
  Future<Map<String, dynamic>> getChatRooms() async {
    try {
      final response = await _dio.get('/my-mustahiq/chats/rooms');
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal mengambil daftar ruang obrolan.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal mengambil daftar ruang obrolan.');
      }
      rethrow;
    }
  }

  // Get messages for a specific class room
  Future<List<dynamic>> getChatMessages(int kelasId) async {
    try {
      final response = await _dio.get('/my-mustahiq/chats/rooms/$kelasId/messages');
      if (response.statusCode == 200) {
        return response.data as List<dynamic>;
      }
      throw Exception('Gagal mengambil pesan obrolan.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal mengambil pesan obrolan.');
      }
      rethrow;
    }
  }

  // Send a message in a specific class room
  Future<Map<String, dynamic>> sendChatMessage(int kelasId, String message) async {
    try {
      final response = await _dio.post('/my-mustahiq/chats/rooms/$kelasId/messages', data: {
        'message': message,
      });
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal mengirim pesan.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal mengirim pesan.');
      }
      rethrow;
    }
  }

  // Delete a message for self
  Future<Map<String, dynamic>> deleteChatMessageForSelf(int messageId) async {
    try {
      final response = await _dio.delete('/my-mustahiq/chats/messages/$messageId/delete-self');
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Gagal menghapus pesan.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal menghapus pesan.');
      }
      rethrow;
    }
  }

  // Get Muhafadzoh Score Guidelines / Info
  Future<List<dynamic>> getMuhafadzohInfo({int? tahunAjaranId, String? semester}) async {
    try {
      final Map<String, dynamic> queryParams = {};
      if (tahunAjaranId != null) {
        queryParams['tahun_ajaran_id'] = tahunAjaranId;
      }
      if (semester != null) {
        queryParams['semester'] = semester;
      }

      final response = await _dio.get(
        '/my-mustahiq/muhafadzoh-info',
        queryParameters: queryParams,
      );
      if (response.statusCode == 200) {
        if (response.data is List) {
          return response.data as List<dynamic>;
        } else {
          throw Exception('Format data tidak valid dari server (bukan JSON List).');
        }
      }
      throw Exception('Gagal mengambil data ketentuan nilai Muhafadzoh.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal mengambil ketentuan nilai.');
      }
      rethrow;
    }
  }

  // Get Qiroatul Kitab Maqro Info
  Future<List<dynamic>> getQiroahMaqro({int? tahunAjaranId, String? semester}) async {
    try {
      final Map<String, dynamic> queryParams = {};
      if (tahunAjaranId != null) {
        queryParams['tahun_ajaran_id'] = tahunAjaranId;
      }
      if (semester != null) {
        queryParams['semester'] = semester;
      }

      final response = await _dio.get(
        '/my-mustahiq/qiroah-maqro',
        queryParameters: queryParams,
      );
      if (response.statusCode == 200) {
        if (response.data is List) {
          return response.data as List<dynamic>;
        } else {
          throw Exception('Format data tidak valid dari server (bukan JSON List).');
        }
      }
      throw Exception('Gagal mengambil data Maqro Qiroatul Kitab.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal mengambil Maqro Qiroatul Kitab.');
      }
      rethrow;
    }
  }

  // Get Taftisyul Kutub Materi Info
  Future<List<dynamic>> getTaftisyMateri({required int kelasId, int? tahunAjaranId, String? semester}) async {
    try {
      final Map<String, dynamic> queryParams = {
        'kelas_id': kelasId,
      };
      if (tahunAjaranId != null) {
        queryParams['tahun_ajaran_id'] = tahunAjaranId;
      }
      if (semester != null) {
        queryParams['semester'] = semester;
      }

      final response = await _dio.get(
        '/my-mustahiq/taftisy-materi',
        queryParameters: queryParams,
      );
      if (response.statusCode == 200) {
        if (response.data is List) {
          return response.data as List<dynamic>;
        } else {
          throw Exception('Format data tidak valid dari server (bukan JSON List).');
        }
      }
      throw Exception('Gagal mengambil data batasan Taftisyul Kutub.');
    } catch (e) {
      if (e is DioException && e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Gagal mengambil batasan Taftisyul Kutub.');
      }
      rethrow;
    }
  }
}


