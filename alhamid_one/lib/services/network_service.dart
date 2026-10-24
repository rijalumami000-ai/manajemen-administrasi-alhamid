import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';

class NetworkService {
  static final NetworkService _instance = NetworkService._internal();
  factory NetworkService() => _instance;
  NetworkService._internal();

  final Connectivity _connectivity = Connectivity();
  final StreamController<bool> _connectionChangeController = StreamController<bool>.broadcast();
  final StreamController<ConnectivityResult> _typeChangeController = StreamController<ConnectivityResult>.broadcast();
  
  bool _isOnline = true;
  ConnectivityResult _currentType = ConnectivityResult.wifi;

  bool get isOnline => _isOnline;
  ConnectivityResult get currentType => _currentType;
  Stream<bool> get onConnectionChange => _connectionChangeController.stream;
  Stream<ConnectivityResult> get onTypeChange => _typeChangeController.stream;

  Future<void> initialize() async {
    final result = await _connectivity.checkConnectivity();
    _updateStatus(result);
    _connectivity.onConnectivityChanged.listen((results) {
      _updateStatus(results);
    });
  }

  void _updateStatus(List<ConnectivityResult> results) {
    bool previousStatus = _isOnline;
    ConnectivityResult previousType = _currentType;
    
    if (results.isEmpty || results.contains(ConnectivityResult.none)) {
      _isOnline = false;
      _currentType = ConnectivityResult.none;
    } else if (results.contains(ConnectivityResult.wifi)) {
      _isOnline = true;
      _currentType = ConnectivityResult.wifi;
    } else if (results.contains(ConnectivityResult.mobile)) {
      _isOnline = true;
      _currentType = ConnectivityResult.mobile;
    } else if (results.contains(ConnectivityResult.ethernet)) {
      _isOnline = true;
      _currentType = ConnectivityResult.ethernet;
    } else {
      _isOnline = true;
      _currentType = results.first;
    }

    if (previousStatus != _isOnline) {
      _connectionChangeController.add(_isOnline);
      print('🌐 [Network] Connection status changed: ${_isOnline ? "Online" : "Offline"} ($_currentType)');
    }
    if (previousType != _currentType) {
      _typeChangeController.add(_currentType);
    }
  }
}
