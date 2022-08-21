import 'dart:developer';
import 'package:flutter_appauth/flutter_appauth.dart';
import 'package:minecraft_on_demand/abstract_login_model.dart';
import 'package:minecraft_on_demand/utils/env.dart';

class LoginModel extends AbstractLoginModel {
  bool _loggedIn = false;
  final FlutterAppAuth _appAuth = const FlutterAppAuth();
  String? _accessToken;

  final String _clientId = Env.getClientId();
  final String _redirectUrl = Env.getRedirectUrl();
  final List<String> _scopes = <String>[
    'openid',
    'profile',
    'email',
    'offline_access',
    'api'
  ];
  final AuthorizationServiceConfiguration _serviceConfiguration =
      AuthorizationServiceConfiguration(
    authorizationEndpoint: Env.getAuthorizationEndpoint(),
    tokenEndpoint: Env.getTokenEndpoint(),
    endSessionEndpoint: Env.getEndSessionEndpoint(),
  );

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
          // scopes: _scopes,
          scopes: ['openid'],
          preferEphemeralSession: preferEphemeralSession,
        ),
      );

      if (result != null) {
        _processAuthTokenResponse(result);
        _loggedIn = true;
      }
    } catch (error) {
      log("Error signing in: $error");
    }
  }

  @override
  getAccessToken() => _accessToken;
  @override
  get loggedIn => _loggedIn;

  void _processAuthTokenResponse(AuthorizationTokenResponse response) {
    _accessToken = response.accessToken;
    log("response.accessToken = ${response.accessToken}");
    log("response.idToken = ${response.idToken}");
    log("response.refreshToken = ${response.refreshToken}");
    log("response.accessTokenExpirationDateTime = ${response.accessTokenExpirationDateTime!.toIso8601String()}");
  }
}
