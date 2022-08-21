import 'dart:developer';
import 'package:flutter_appauth/flutter_appauth.dart';
import 'package:minecraft_on_demand/abstract_login_model.dart';

/// From https://pub.dev/packages/flutter_appauth/example
class DemoLoginModel extends AbstractLoginModel {
  bool _loggedIn = false;
  final FlutterAppAuth _appAuth = const FlutterAppAuth();

  final String _clientId = 'interactive.public';
  final String _redirectUrl = 'com.duendesoftware.demo:/oauthredirect';
  final List<String> _scopes = <String>[
    'openid',
    'profile',
    'email',
    'offline_access',
    'api'
  ];
  final AuthorizationServiceConfiguration _serviceConfiguration =
      const AuthorizationServiceConfiguration(
    authorizationEndpoint: 'https://demo.duendesoftware.com/connect/authorize',
    tokenEndpoint: 'https://demo.duendesoftware.com/connect/token',
    endSessionEndpoint: 'https://demo.duendesoftware.com/connect/endsession',
  );
  String? _accessToken = "";

  @override
  String? getAccessToken() => _accessToken;

  @override
  get loggedIn => _loggedIn;

  @override
  Future<void> signInWithAutoCodeExchange(
      {bool preferEphemeralSession = false}) async {
    try {
      final AuthorizationTokenResponse? result =
          await _appAuth.authorizeAndExchangeCode(
        AuthorizationTokenRequest(
          _clientId,
          _redirectUrl,
          serviceConfiguration: _serviceConfiguration,
          scopes: _scopes,
          preferEphemeralSession: preferEphemeralSession,
        ),
      );

      if (result != null) {
        _processAuthTokenResponse(result);
        _loggedIn = true;
      }
    } catch (error) {
      log("Error logging in $error");
    }
  }

  void _processAuthTokenResponse(AuthorizationTokenResponse response) {
    _accessToken = response.accessToken;
    log("response.accessToken = ${response.accessToken}");
    log("response.idToken = ${response.idToken}");
    log("response.refreshToken = ${response.refreshToken}");
    log("response.accessTokenExpirationDateTime = ${response.accessTokenExpirationDateTime!.toIso8601String()}");
  }
}
