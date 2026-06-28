import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:audioplayers/audioplayers.dart';
import 'api_service.dart';
import '../screens/notifications_screen.dart';
import '../screens/chat_detail_screen.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

class PushNotificationService {
  static final PushNotificationService _instance = PushNotificationService._internal();
  factory PushNotificationService() => _instance;
  PushNotificationService._internal();

  FirebaseMessaging? _fcm;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;

    try {
      // 1. Initialize Firebase Core
      await Firebase.initializeApp();

      // 2. Initialize FCM instance
      _fcm = FirebaseMessaging.instance;

      // 3. Request permission (FCM)
      await _fcm!.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      // 3. Configure Android heads-up channels
      const AndroidNotificationChannel defaultChannel = AndroidNotificationChannel(
        'high_importance_channel', // id
        'High Importance Notifications', // name
        description: 'This channel is used for important notifications.',
        importance: Importance.max,
        playSound: true,
      );

      const AndroidNotificationChannel chimeChannel = AndroidNotificationChannel(
        'chime_importance_channel', // id
        'Chime Notifications', // name
        description: 'This channel is used for chime sound notifications.',
        importance: Importance.max,
        playSound: true,
        sound: RawResourceAndroidNotificationSound('chime'),
      );

      const AndroidNotificationChannel bellChannel = AndroidNotificationChannel(
        'bell_importance_channel', // id
        'Bell Notifications', // name
        description: 'This channel is used for bell sound notifications.',
        importance: Importance.max,
        playSound: true,
        sound: RawResourceAndroidNotificationSound('bell'),
      );

      const AndroidNotificationChannel jadwalChannel = AndroidNotificationChannel(
        'jadwal_importance_channel', // id
        'Jadwal Notifications', // name
        description: 'This channel is used for schedule voice notifications.',
        importance: Importance.max,
        playSound: true,
        sound: RawResourceAndroidNotificationSound('jadwal'),
      );

      const AndroidNotificationChannel pesanMasukChannel = AndroidNotificationChannel(
        'pesan_masuk_importance_channel', // id
        'Pesan Masuk Notifications', // name
        description: 'This channel is used for incoming message voice notifications.',
        importance: Importance.max,
        playSound: true,
        sound: RawResourceAndroidNotificationSound('pesan_masuk'),
      );

      final androidNotificationPlugin = _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
      if (androidNotificationPlugin != null) {
        await androidNotificationPlugin.createNotificationChannel(defaultChannel);
        await androidNotificationPlugin.createNotificationChannel(chimeChannel);
        await androidNotificationPlugin.createNotificationChannel(bellChannel);
        await androidNotificationPlugin.createNotificationChannel(jadwalChannel);
        await androidNotificationPlugin.createNotificationChannel(pesanMasukChannel);
      }

      // 4. Initialize Local Notifications Plugin
      const AndroidInitializationSettings initializationSettingsAndroid =
          AndroidInitializationSettings('@mipmap/ic_launcher');

      const InitializationSettings initializationSettings = InitializationSettings(
        android: initializationSettingsAndroid,
      );

      await _localNotifications.initialize(
        settings: initializationSettings,
        onDidReceiveNotificationResponse: (NotificationResponse response) {
          // Handle foreground notification tap
          final payload = response.payload;
          if (payload != null && payload.isNotEmpty) {
            try {
              final Map<String, dynamic> data = jsonDecode(payload);
              _handleNotificationData(data);
              return;
            } catch (e) {
              print('Error parsing local notification payload: $e');
            }
          }
          _navigateToNotificationsScreen();
        },
      );

      // 5. Handle foreground notification delivery
      FirebaseMessaging.onMessage.listen((RemoteMessage message) async {
        RemoteNotification? notification = message.notification;

        if (notification != null) {
          // Read user sound preference & category
          const storage = FlutterSecureStorage();
          final soundPref = await storage.read(key: 'notification_sound') ?? 'default';

          String targetChannelId = 'high_importance_channel';
          String targetChannelName = 'High Importance Notifications';
          AndroidNotificationSound? customSound;

          final category = message.data['category'] ?? '';
          final title = notification.title ?? 'Notifikasi MyMustahiq';

          if (soundPref == 'chime') {
            targetChannelId = 'chime_importance_channel';
            targetChannelName = 'Chime Notifications';
            customSound = const RawResourceAndroidNotificationSound('chime');
          } else if (soundPref == 'bell') {
            targetChannelId = 'bell_importance_channel';
            targetChannelName = 'Bell Notifications';
            customSound = const RawResourceAndroidNotificationSound('bell');
          } else if (soundPref == 'jadwal' || category.toLowerCase().contains('jadwal') || title.toLowerCase().contains('jadwal')) {
            targetChannelId = 'jadwal_importance_channel';
            targetChannelName = 'Jadwal Notifications';
            customSound = const RawResourceAndroidNotificationSound('jadwal');
          } else if (soundPref == 'pesan_masuk' || category.toLowerCase().contains('chat') || category.toLowerCase().contains('pesan') || title.toLowerCase().contains('pesan')) {
            targetChannelId = 'pesan_masuk_importance_channel';
            targetChannelName = 'Pesan Masuk Notifications';
            customSound = const RawResourceAndroidNotificationSound('pesan_masuk');
          }

          _localNotifications.show(
            id: notification.hashCode,
            title: notification.title,
            body: notification.body,
            notificationDetails: NotificationDetails(
              android: AndroidNotificationDetails(
                targetChannelId,
                targetChannelName,
                channelDescription: 'Notification channel with selected sound preference.',
                icon: '@mipmap/ic_launcher',
                importance: Importance.max,
                priority: Priority.high,
                playSound: true,
                sound: customSound,
                visibility: NotificationVisibility.public,
                ticker: title,
              ),
            ),
            payload: jsonEncode(message.data),
          );
        }
      });

      // 6. Handle background/terminated message clicks
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        // App opened from background notification
        _handleNotificationClick(message);
      });

      // 7. Check if app was opened from terminated state via a notification click
      _fcm!.getInitialMessage().then((RemoteMessage? message) {
        if (message != null) {
          _handleNotificationClick(message);
        }
      });

      _initialized = true;
      print('✓ FCM PushNotificationService initialized successfully.');
    } catch (e) {
      print('⚠ Bypassed FCM Initialization (No Active Config/Keys): $e');
    }
  }

  Future<void> registerDeviceToken() async {
    try {
      // Safely fetch Firebase token if initialized
      if (_fcm == null) {
        print('⚠ FCM token registration skipped: Firebase Messaging is not initialized.');
        return;
      }
      String? token = await _fcm!.getToken();
      if (token != null) {
        final apiService = ApiService();
        String deviceInfo = Platform.isAndroid ? 'Android' : 'iOS';
        await apiService.registerFcmToken(token, deviceInfo: deviceInfo);
        print('FCM Token registered on server successfully: $token');
      }
    } catch (e) {
      print('⚠ FCM Token Registration Bypassed/Failed: $e');
    }
  }

  void _handleNotificationClick(RemoteMessage message) {
    _handleNotificationData(message.data);
  }

  void _handleNotificationData(Map<String, dynamic> data) {
    final category = data['category'];
    if (category == 'Chat') {
      final kelasIdStr = data['kelas_id'];
      final kelasNama = data['kelas_nama'] ?? 'Obrolan';
      if (kelasIdStr != null) {
        final kelasId = int.tryParse(kelasIdStr);
        if (kelasId != null) {
          navigatorKey.currentState?.push(
            MaterialPageRoute(
              builder: (context) => ChatDetailScreen(
                kelasId: kelasId,
                kelasNama: kelasNama,
              ),
            ),
          );
          return;
        }
      }
    }
    _navigateToNotificationsScreen();
  }

  void _navigateToNotificationsScreen() {
    navigatorKey.currentState?.push(
      MaterialPageRoute(builder: (context) => const NotificationsScreen()),
    );
  }

  Future<void> playTestSound(String soundName) async {
    try {
      if (soundName == 'default') {
        String channelId = 'high_importance_channel';
        await _localNotifications.show(
          id: 999,
          title: 'MyMustahiq',
          body: 'Tes Nada Notifikasi: Sistem (Default)',
          notificationDetails: NotificationDetails(
            android: AndroidNotificationDetails(
              channelId,
              'High Importance Notifications',
              importance: Importance.max,
              priority: Priority.high,
              playSound: true,
            ),
          ),
        );
      } else {
        final player = AudioPlayer();
        await player.play(AssetSource('sounds/$soundName.wav'));
      }
    } catch (e) {
      print('Error playing test sound: $e');
    }
  }
}
