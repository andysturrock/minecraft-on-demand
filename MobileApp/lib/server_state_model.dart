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
    // Tell the new listener about the current state
    serverStateListener.onServerStateChange(_serverState);
  }

  bool removeListener(ServerStateListener serverStateListener) {
    bool wasRegistered = _listeners.remove(serverStateListener);
    if (_listeners.isEmpty) {
      _stopPollingForStatus();
    }
    return wasRegistered;
  }

  void notifyListeners(ServerState serverState) {
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

      log("accesstoken = ${_loginModel.getAccessToken()}");

      if (response.statusCode == 200) {
        log('response=${response.body}');
        final json = jsonDecode(response.body);
        _instanceId = json["instanceId"];
        final state = json["state"];
        if (state != null) {
          final name = state["Name"];
          _serverState = ServerState.values.byName(name);
          log("state is: $_serverState");
        } else {
          log("State is unknown");
          _serverState = ServerState.none;
        }
        final serverStopTime = json["serverStopTime"];
        if (serverStopTime != null) {
          _serverStopDateTime = DateTime.parse(serverStopTime);
          log("_serverStopDateTime is $_serverStopDateTime");
        }
      } else {
        log("Got unexpected response code from server: ${response.statusCode}");
        log("Response body: ${response.body}");
        _serverState = ServerState.none;
      }
    } finally {
      if (_serverState != previousServerState ||
          _serverStopDateTime != previousServerStopDateTime) {
        notifyListeners(_serverState);
      }
    }
  }

  void _startPollingForStatus() {
    _timer = Timer.periodic(_pollPeriod, (_) => _getServerState());
  }

  void _stopPollingForStatus() {
    _timer?.cancel();
  }

  Future<int> stopServer() async {
    return _postMessage("stop");
  }

  Future<int> startServer() async {
    return _postMessage("start");
  }

  Future<int> extendServer() async {
    return _postMessage("extend");
  }

  DateTime getServerStopDateTime() => _serverStopDateTime;

  Future<int> _postMessage(String action) async {
    try {
      final uri = Uri.parse(Env.getServerStatusUri());

      final data = {
        'action': action,
        'instanceId': _instanceId,
        'deleteStopRule': true
      };
      final body = json.encode(data);

      final headers = {
        "Authorization": "Bearer ${_loginModel.getAccessToken()}",
        "Content-Type": "application/json"
      };

      var response = await http.post(uri, headers: headers, body: body);

      if (response.statusCode == 200) {
        log('REST call returned status 200 ${response.body}');
      } else {
        log("Call to start server failed ${response.statusCode}, ${response.body}");
      }

      // Do a quick refresh of the state rather than wait for the next poll.
      _getServerState();
      return response.statusCode;
    } catch (error) {
      log("Error: $error");
      return 500;
    }
  }
}
