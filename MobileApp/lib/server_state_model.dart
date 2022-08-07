import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:minecraft_on_demand/utils/env.dart';

enum ServerState { none, pending, running, stopping, stopped }

abstract class ServerStateListener {
  void onServerStateChange(ServerState serverState);
}

// TODO: ec2_instance_state_get: undefined
// ec2_instance_state_get: {
//    KeyName: 'minecraft-ubuntu',
//    LaunchTime: 2022-08-07T13:57:48.000Z,
//    State: { Code: 64, Name: 'stopping' }
// stopped, stopping, pending
// }

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
}
