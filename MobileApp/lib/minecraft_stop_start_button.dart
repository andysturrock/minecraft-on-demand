import 'package:flutter/material.dart';
import 'package:minecraft_on_demand/server_state_model.dart';
import 'package:provider/provider.dart';

class MinecraftStopStartButton extends StatefulWidget {
  const MinecraftStopStartButton({Key? key}) : super(key: key);

  @override
  State<MinecraftStopStartButton> createState() =>
      _MinecraftStopStartButtonState();
}

class _MinecraftStopStartButtonState extends State<MinecraftStopStartButton>
    with ServerStateListener {
  String _buttonText = "Getting server status...";
  bool _buttonIsClickable = true;
  ServerState _serverState = ServerState.none;
  ServerStateModel? _model;

  @override
  void initState() {
    super.initState();
    _model = context.read<ServerStateModel>();
    _model?.addListener(this);
  }

  @override
  void dispose() {
    _model?.removeListener(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final onPressedCallback = _buttonIsClickable ? onPressed : null;
    return MaterialButton(
      color: Colors.blue,
      shape: const CircleBorder(),
      onPressed: onPressedCallback,
      child: Padding(
        padding: const EdgeInsets.all(50),
        child: Text(
          _buttonText,
          style: const TextStyle(color: Colors.white, fontSize: 24),
        ),
      ),
    );
  }

  void onPressed() async {
    int? httpStatus = 500;
    switch (_serverState) {
      case ServerState.running:
        // Set the state to stopping immediately.
        // This disables this button and the extend time button.
        // Otherwise the kids click multiple times!
        _model?.notifyListeners(ServerState.stopping);
        httpStatus = await _model?.stopServer();
        break;
      case ServerState.stopped:
        // Set the state to pending immediately.
        // This disables this button and the extend time button.
        // Otherwise the kids click multiple times!
        _model?.notifyListeners(ServerState.pending);
        httpStatus = await _model?.startServer();
        break;
      default:
    }

    String errorText = '';
    switch (httpStatus) {
      case 200:
        break;
      case 403:
        errorText = "You don't have permission to do that.";
        break;
      case 500:
        errorText = "Failed to extend time.";
        break;
      default:
        break;
    }
    if (errorText != '') {
      showDialog<String>(
        context: context,
        builder: (BuildContext context) => AlertDialog(
          title: const Text('Error'),
          content: const Text("You don't have permission to do that."),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.pop(context, 'OK'),
              child: const Text('OK'),
            ),
          ],
        ),
      );
    }
  }

  @override
  void onServerStateChange(ServerState serverState) {
    _serverState = serverState;
    switch (serverState) {
      case ServerState.pending:
        setState(() {
          _buttonText = "Server is starting.  Please wait...";
          _buttonIsClickable = false;
        });
        break;
      case ServerState.running:
        setState(() {
          _buttonText = "Server is running.  Press to stop.";
          _buttonIsClickable = true;
        });
        break;
      case ServerState.stopping:
        setState(() {
          _buttonText = "Server is stopping.  Please wait...";
          _buttonIsClickable = false;
        });
        break;
      case ServerState.stopped:
        setState(() {
          _buttonText = "Server is stopped.  Press to start.";
          _buttonIsClickable = true;
        });
        break;
      case ServerState.none:
      default:
        setState(() {
          _buttonText = "Getting server status...";
          _buttonIsClickable = false;
        });
    }
  }
}
