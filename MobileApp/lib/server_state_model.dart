import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:minecraft_on_demand/utils/env.dart';

enum ServerState { none, pending, running, stopping, stopped }

abstract class ServerStateListener {
  void onServerStateChange(ServerState serverState);
}

class ServerStateModel {
  List<ServerStateListener> _listeners = [];
  final _pollPeriod = new Duration(seconds: 5);
  Timer? _timer;

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
    _listeners.forEach((listener) {
      listener.onServerStateChange(serverState);
    });
  }

  void _getServerStatus() async {
    ServerState serverState = ServerState.none;

    try {
      var uri = Env.getServerStatusUri();
      final response = await http.get(Uri.parse(uri));

      print('response=$response');
      if (response.statusCode == 200) {
        print('response=${response.body}');
        final json = jsonDecode(response.body);
        final state = json["State"];
        if (state != null) {
          final name = state["Name"];
          print("state is: $name");
          serverState = ServerState.values.byName(name);
          print("state is: $serverState");
        } else {
          print("State is unknown");
        }
      }
    } finally {
      _notifyListeners(serverState);
    }
  }

  void _startPollingForStatus() {
    _timer = Timer.periodic(_pollPeriod, (_) => _getServerStatus());
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

  Future<void> _postMessage(String action) async {
    try {
      final uri = Uri.parse(Env.getServerStatusUri());

      final data = {'action': action};
      final body = json.encode(data);

      var response = await http.post(uri,
          headers: {"Content-Type": "application/json"}, body: body);

      print('response=$response');
      if (response.statusCode == 200) {
        print('response=${response.body}');
      } else {
        print("State is unknown");
      }
    } catch (error) {
      print("Error: $error");
    }
  }
}
