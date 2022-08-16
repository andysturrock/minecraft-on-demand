import 'package:flutter/material.dart';
import 'package:minecraft_on_demand/server_state_model.dart';
import 'package:provider/provider.dart';

class ExtendTimeButton extends StatefulWidget {
  const ExtendTimeButton({Key? key}) : super(key: key);

  @override
  State<ExtendTimeButton> createState() => _ExtendTimeButtonButtonState();
}

class _ExtendTimeButtonButtonState extends State<ExtendTimeButton>
    with ServerStateListener {
  String _buttonText = "Getting current stop time...";
  bool _buttonIsClickable = true;
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
    await _model?.extendServer();
  }

  @override
  void onServerStateChange(ServerState serverState) {
    final serverStopDateTime = _model?.getServerStopDateTime();
    switch (serverState) {
      case ServerState.running:
        setState(() {
          _buttonText = serverStopDateTime != null
              ? "Server will stop at ${serverStopDateTime.toLocal()}.\nPress to request more time."
              : "Press to request more time.";
          _buttonIsClickable = true;
        });
        break;
      case ServerState.pending:
      case ServerState.stopping:
      case ServerState.stopped:
        setState(() {
          _buttonText = "";
          _buttonIsClickable = false;
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