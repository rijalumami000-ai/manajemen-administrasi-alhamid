# Keep raw sound files and notification resources from being stripped or renamed by R8
-keepclassmembers class * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}
-keep class com.dexterous.flutterlocalnotifications.** { *; }
-keep class io.flutter.plugins.firebase.messaging.** { *; }
-keep class com.google.firebase.messaging.** { *; }
