import 'dart:developer';
import 'package:flutter/services.dart';
import 'package:flutter_appauth/flutter_appauth.dart';
import 'package:minecraft_on_demand/abstract_login_model.dart';
import 'package:minecraft_on_demand/utils/env.dart';

class LoginModel extends AbstractLoginModel {
  bool _loggedIn = false;
  final FlutterAppAuth _appAuth = const FlutterAppAuth();
  String? _accessToken;
  String? _idToken;

  final String _clientId = Env.getClientId();
  final String _redirectUrl = Env.getRedirectUrl();

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
  Future<void> signOut() async {
    try {
      // TODO cannot get this to work with Cognito.  I'll raise an issue.
      final endSessionResponse = await _appAuth.endSession(EndSessionRequest(
          idTokenHint: _idToken,
          postLogoutRedirectUrl: Env.getSignoutUrl(),
          additionalParameters: {
            "client_id": _clientId,
            "redirect_uri": Env.getRedirectUrl(),
            "response_type": "code"
          }));

      log('endSessionResponse.state: ${endSessionResponse?.state}');
      _loggedIn = false;
    } on PlatformException catch (error) {
      log("Caught $error");
    } catch (error) {
      log("Caught $error");
    }
  }

  @override
  getAccessToken() => _accessToken;
  @override
  get loggedIn => _loggedIn;

  void _processAuthTokenResponse(AuthorizationTokenResponse response) {
    log("response = $response");
    _accessToken = response.accessToken;
    _idToken = response.idToken;
    log("response.accessToken = ${response.accessToken}");
    log("response.idToken = ${response.idToken}");
    log("response.refreshToken = ${response.refreshToken}");
    log("response.accessTokenExpirationDateTime = ${response.accessTokenExpirationDateTime!.toIso8601String()}");
  }
}
