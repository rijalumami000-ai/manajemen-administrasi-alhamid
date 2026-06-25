import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';

class NetworkService {
  static final NetworkService _instance = NetworkService._internal();
  factory NetworkService() => _instance;
  NetworkService._internal();

  final Connectivity _connectivity = Connectivity();
  final StreamController<bool> _connectionChangeController = StreamController<bool>.broadcast();
  bool _isOnline = true;

  bool get isOnline => _isOnline;
  Stream<bool> get onConnectionChange => _connectionChangeController.stream;

  Future<void> initialize() async {
    final result = await _connectivity.checkConnectivity();
    _updateStatus(result);
    _connectivity.onConnectivityChanged.listen((results) {
      _updateStatus(results);
    });
  }

  void _updateStatus(List<ConnectivityResult> results) {
    bool previousStatus = _isOnline;
    
    if (results.isEmpty || results.contains(ConnectivityResult.none)) {
      _isOnline = false;
    } else {
      _isOnline = true;
    }

    if (previousStatus != _isOnline) {
      _connectionChangeController.add(_isOnline);
      print('🌐 [Network] Connection status changed: ${_isOnline ? "Online" : "Offline"}');
    }
  }
}
