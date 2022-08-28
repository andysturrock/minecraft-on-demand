const bool isProduction = true; //bool.fromEnvironment('dart.vm.product');

/// Class to store environment (ie dev, prod) versions of variables.
/// TODO make much more flexible and configurable.
/// Should use something like
/// https://itnext.io/flutter-1-17-no-more-flavors-no-more-ios-schemas-command-argument-that-solves-everything-8b145ed4285d
class Env {
  static envName() {
    return isProduction ? 'Production' : 'Test';
  }

  static String getServerStatusUri() {
    return isProduction
        ? 'https://api.minecraft.goatsinlace.com/0_0_1/instanceState'
        : 'https://api.minecraft.dev.goatsinlace.com/0_0_1/instanceState';
  }

  static String getClientId() {
    // Change your client id here.  It is not secret.
    return isProduction
        ? '7gqqcticojcg87vjd7lf6q4mdk'
        : '7gqqcticojcg87vjd7lf6q4mdk';
  }

  static String getDiscoveryUrl() {
    return isProduction
        ? 'https://auth.cognito.goatsinlace.com/.well-known/openid-configuration'
        : 'https://auth.cognito.goatsinlace.com/.well-known/openid-configuration';
  }

  static String getRedirectUrl() {
    return isProduction
        ? 'com.goatsinlace.minecraft://loggedin'
        : 'com.goatsinlace.minecraft://loggedin';
  }

  static String getSignoutUrl() {
    return isProduction
        ? 'com.goatsinlace.minecraft://loggedout'
        : 'com.goatsinlace.minecraft://loggedout';
  }

  static String getAuthorizationEndpoint() {
    return isProduction
        ? 'https://auth.cognito.goatsinlace.com/oauth2/authorize'
        : 'https://auth.cognito.goatsinlace.com/oauth2/authorize';
  }
  //https://auth.cognito.goatsinlace.com/oauth2/authorize?response_type=code&client_id=7og9tibhv7vqc50irak6jt8b9b&redirect_uri=com.goatsinlace.minecraft://loggedin

  static String getEndSessionEndpoint() {
    return isProduction
        ? 'https://auth.cognito.goatsinlace.com/logout'
        : 'https://auth.cognito.goatsinlace.com/logout';
  }
  //https://auth.cognito.goatsinlace.com/logout?client_id=7og9tibhv7vqc50irak6jt8b9b&logout_uri=com.goatsinlace.minecraft://loggedout

  static String getTokenEndpoint() {
    return isProduction
        ? 'https://auth.cognito.goatsinlace.com/oauth2/token'
        : 'https://auth.cognito.goatsinlace.com/oauth2/token';
  }

  static Uri getEndSessionUri() {
    return isProduction
        ? Uri.https('auth.cognito.goatsinlace.com', 'logout')
        : Uri.https('auth.cognito.goatsinlace.com', 'logout');
  }
}
