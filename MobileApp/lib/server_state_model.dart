import 'dart:async';
import 'dart:convert';
import 'dart:developer';
import 'package:http/http.dart' as http;
import 'package:minecraft_on_demand/abstract_login_model.dart';
import 'package:minecraft_on_demand/utils/env.dart';

enum ServerState { none, pending, running, stopping, stopped }

abstract class ServerStateListener {
  void onServerStateChange(ServerState serverState);
}

class ServerStateModel {
  final List<ServerStateListener> _listeners = [];
  final _pollPeriod = const Duration(seconds: 5);
  ServerState _serverState = ServerState.none;
  DateTime _serverStopDateTime = DateTime.now();
  Timer? _timer;
  String? _instanceId;
  final AbstractLoginModel _loginModel;

  ServerStateModel(AbstractLoginModel loginModel) : _loginModel = loginModel;

  void addListener(ServerStateListener serverStateListener) {
    _listeners.add(serverStateListener);
    if (_listeners.length == 1) {
      _startPollingForStatus();
    }
  }

  bool removeListener(ServerStateListener serverStateListener) {
    bool wasRegistered = _listeners.remove(serverStateListener);
    if (_listeners.isEmpty) {
      _stopPollingForStatus();
    }
    return wasRegistered;
  }

  void _notifyListeners(ServerState serverState) {
    for (var listener in _listeners) {
      listener.onServerStateChange(serverState);
    }
  }

  void _getServerState() async {
    ServerState previousServerState = _serverState;
    DateTime previousServerStopDateTime = _serverStopDateTime;

    try {
      var uri = Env.getServerStatusUri();
      final headers = {
        "Authorization": "Bearer ${_loginModel.getAccessToken()}"
      };
      final response = await http.get(Uri.parse(uri), headers: headers);

      log('response=$response');
      if (response.statusCode == 200) {
        log('response=${response.body}');
        final json = jsonDecode(response.body);
        _instanceId = json["instanceId"];
        final state = json["state"];
        if (state != null) {
          final name = state["Name"];
          log("state is: $name");
          _serverState = ServerState.values.byName(name);
          log("state is: $_serverState");
        } else {
          log("State is unknown");
        }
        final serverStopTime = json["serverStopTime"];
        if (serverStopTime != null) {
          _serverStopDateTime = DateTime.parse(serverStopTime);
          log("_serverStopDateTime is $_serverStopDateTime");
        }
      }
    } finally {
      if (_serverState != previousServerState ||
          _serverStopDateTime != previousServerStopDateTime) {
        _notifyListeners(_serverState);
      }
    }
  }

  void _startPollingForStatus() {
    _timer = Timer.periodic(_pollPeriod, (_) => _getServerState());
  }

  void _stopPollingForStatus() {
    _timer?.cancel();
  }

  Future<void> stopServer() async {
    _postMessage("stop");
  }

  Future<void> startServer() async {
    _postMessage("start");
  }

  Future<void> extendServer() async {
    _postMessage("extend");
  }

  DateTime getServerStopDateTime() => _serverStopDateTime;

  Future<void> _postMessage(String action) async {
    try {
      final uri = Uri.parse(Env.getServerStatusUri());

      final data = {
        'action': action,
        'instanceId': _instanceId,
        'deleteStopRule': true
      };
      final body = json.encode(data);

      var response = await http.post(uri,
          headers: {"Content-Type": "application/json"}, body: body);

      log('response=$response');
      if (response.statusCode == 200) {
        log('response=${response.body}');
      } else {
        log("State is unknown");
      }
    } catch (error) {
      log("Error: $error");
    }
  }
}
