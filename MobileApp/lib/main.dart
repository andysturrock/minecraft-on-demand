import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:minecraft_on_demand/abstract_login_model.dart';
import 'package:minecraft_on_demand/demo_login_model.dart';
import 'package:minecraft_on_demand/extend_time_button.dart';
import 'package:minecraft_on_demand/login_model.dart';
import 'package:minecraft_on_demand/minecraft_stop_start_button.dart';
import 'package:minecraft_on_demand/server_state_model.dart';
import 'package:provider/provider.dart';

void main() {
  final loginModel = LoginModel();
  runApp(MultiProvider(providers: [
    Provider<ServerStateModel>(create: (_) => ServerStateModel(loginModel)),
    Provider<AbstractLoginModel>(create: (_) => loginModel),
  ], child: const MyApp()));
}

class MyApp extends StatefulWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  @override
  Widget build(BuildContext context) {
    final loginModel = context.read<AbstractLoginModel>();

    var loginButton = ElevatedButton(
      style: ElevatedButton.styleFrom(
        // Foreground color
        onPrimary: Theme.of(context).colorScheme.onPrimary,
        // Background color
        primary: Theme.of(context).colorScheme.primary,
      ).copyWith(elevation: ButtonStyleButton.allOrNull(0.0)),
      onPressed: () async {
        await loginModel.signInWithAutoCodeExchange();
        setState(() {});
      },
      child: const Text('Login'),
    );

    var children = loginModel.loggedIn
        ? [
            const Expanded(child: MinecraftStopStartButton()),
            const Expanded(
              child: ExtendTimeButton(),
            )
          ]
        : [Center(child: loginButton)];
    return MaterialApp(
        title: 'Minecraft on demand',
        theme: ThemeData(
          primarySwatch: Colors.blue,
        ),
        home: Scaffold(
            appBar: AppBar(
              title: const Text('Minecraft On Demand'),
              centerTitle: true,
            ),
            body: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: children,
            ),
            drawer: Drawer(
                child: ListView(
              padding: EdgeInsets.zero,
              children: [
                const DrawerHeader(
                  decoration: BoxDecoration(
                    color: Colors.blue,
                  ),
                  child: Text('Log in and out'),
                ),
                ListTile(
                  title: const Text('Login'),
                  onTap: () async {
                    await loginModel.signInWithAutoCodeExchange();
                    setState(() {});
                    if (!mounted) return;
                    // Navigator.pop(context);
                  },
                ),
                ListTile(
                  title: const Text('Logout'),
                  onTap: () async {
                    await loginModel.signOut();
                    setState(() {});
                    if (!mounted) return;
                    // Navigator.pop(context);
                  },
                ),
              ],
            ))));
  }
}
