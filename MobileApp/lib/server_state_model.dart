enum ServerState { none, starting, running, stopping, stopped }

abstract class ServerStateListener {
  void onServerStateChange(ServerState serverState);
}

class ServerStateModel {
  List<ServerStateListener> _listeners = [];

  void addListener(ServerStateListener serverStateListener) {
    _listeners.add(serverStateListener);
  }

  bool removeListener(ServerStateListener serverStateListener) {
    return _listeners.remove(serverStateListener);
  }

  void _notifiyListeners(ServerState serverState) {
    _listeners.forEach((listener) {
      listener.onServerStateChange(serverState);
    });
  }
}
