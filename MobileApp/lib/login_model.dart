import 'dart:developer';
import 'package:flutter/services.dart';
import 'package:flutter_appauth/flutter_appauth.dart';
import 'package:minecraft_on_demand/abstract_login_model.dart';
import 'package:minecraft_on_demand/utils/env.dart';

class LoginModel extends AbstractLoginModel {
  bool _loggedIn = false;
  final FlutterAppAuth _appAuth = const FlutterAppAuth();
  String? _accessToken;

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
      // Using this set of params redirects back to login screen
      // which is confusing

      // await _appAuth.endSession(EndSessionRequest(
      //     postLogoutRedirectUrl: Env.getSignoutUrl(),
      //     idTokenHint: _idToken,
      //     additionalParameters: {
      //       "client_id": _clientId,
      //       "redirect_uri": Env.getRedirectUrl(),
      //       "response_type": "code"
      //     },
      //     serviceConfiguration: _serviceConfiguration));

      // This set does actually log the user out, and then throws
      // an exception, which we can swallow below.
      // So it sort of works, but not very cleanly.
      await _appAuth.endSession(EndSessionRequest(additionalParameters: {
        "client_id": _clientId,
        "logout_uri": Env.getSignoutUrl(),
      }, serviceConfiguration: _serviceConfiguration));
      _loggedIn = false;
    } on PlatformException catch (error) {
      log("Caught $error");
      // May or may not have actually logged out, but better to force
      // re-login rather than leaving the user stuck.
      _loggedIn = false;
    } catch (error) {
      log("Caught $error");
      // Ditto from above
      _loggedIn = false;
    }
  }

  @override
  getAccessToken() => _accessToken;
  @override
  get loggedIn => _loggedIn;

  void _processAuthTokenResponse(AuthorizationTokenResponse response) {
    _accessToken = response.accessToken;
    log("response.accessToken = ${response.accessToken}");
    // log("response.idToken = ${response.idToken}");
    // log("response.refreshToken = ${response.refreshToken}");
    // log("response.accessTokenExpirationDateTime = ${response.accessTokenExpirationDateTime!.toIso8601String()}");
  }
}
