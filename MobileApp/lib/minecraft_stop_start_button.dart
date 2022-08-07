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
  ServerState _serverState = ServerState.none;
  String _buttonText = "Getting server status...";
  bool _buttonIsClickable = true;

  @override
  void initState() {
    super.initState();
    final model = context.read<ServerStateModel>();
    model.addListener(this);
  }

  @override
  void dispose() {
    final model = context.read<ServerStateModel>();
    model.removeListener(this);
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

  void onPressed() {
    _serverState = ServerState.starting;
    switch (_serverState) {
      case ServerState.none:
        setState(() {
          _buttonText = "Getting server status...";
          _buttonIsClickable = false;
        });
        break;
      case ServerState.starting:
        setState(() {
          _buttonText = "Server is starting...";
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
          _buttonText = "Server is stopped.  Press to start.";
          _buttonIsClickable = true;
        });
        break;
      default:
    }
  }

  @override
  void onServerStateChange(ServerState serverState) {
    print('State is now $serverState');
  }
}
