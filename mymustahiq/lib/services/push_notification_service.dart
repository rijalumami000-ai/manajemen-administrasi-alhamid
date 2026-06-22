import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'api_service.dart';

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

      // 3. Configure Android heads-up channel
      const AndroidNotificationChannel channel = AndroidNotificationChannel(
        'high_importance_channel', // id
        'High Importance Notifications', // name
        description: 'This channel is used for important notifications.', // description
        importance: Importance.max,
        playSound: true,
      );

      await _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channel);

      // 4. Initialize Local Notifications Plugin
      const AndroidInitializationSettings initializationSettingsAndroid =
          AndroidInitializationSettings('@mipmap/ic_launcher');

      const InitializationSettings initializationSettings = InitializationSettings(
        android: initializationSettingsAndroid,
      );

      await _localNotifications.initialize(
        initializationSettings,
        onDidReceiveNotificationResponse: (NotificationResponse response) {
          // Handle foreground notification tap if needed
        },
      );

      // 5. Handle foreground notification delivery
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        RemoteNotification? notification = message.notification;
        AndroidNotification? android = message.notification?.android;

        if (notification != null && android != null) {
          _localNotifications.show(
            notification.hashCode,
            notification.title,
            notification.body,
            NotificationDetails(
              android: AndroidNotificationDetails(
                channel.id,
                channel.name,
                channelDescription: channel.description,
                icon: android.smallIcon ?? '@mipmap/ic_launcher',
                importance: Importance.max,
                priority: Priority.high,
                playSound: true,
              ),
            ),
          );
        }
      });

      // 6. Handle background/terminated message clicks
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        // App opened from background notification
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
}
