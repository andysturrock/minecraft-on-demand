import 'package:flutter/material.dart';
import 'package:minecraft_on_demand/minecraft_stop_start_button.dart';
import 'package:minecraft_on_demand/server_state_model.dart';
import 'package:provider/provider.dart';

void main() {
  runApp(MultiProvider(providers: [
    Provider<ServerStateModel>(create: (_) => ServerStateModel()),
  ], child: const MyApp()));
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Minecraft on demand',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const MinecraftStopStartButton(),
    );
  }
}
