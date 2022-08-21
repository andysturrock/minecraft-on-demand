const bool isProduction = true; //bool.fromEnvironment('dart.vm.product');

/// Class to store environment (ie dev, prod) versions of variables.
/// TODO make much more flexible and configurable.
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
        ? '2vkshcnjnfm5d1tnjtkkg734k7'
        : '2vkshcnjnfm5d1tnjtkkg734k7';
  }

  static String getRedirectUrl() {
    return isProduction
        ? 'com.goatsinlace.minecraft://loggedin'
        : 'com.goatsinlace.minecraft://loggedin';
  }

  static String getDiscoveryUrl() {
    return isProduction
        ? 'https://auth.minecraft.goatsinlace.com/.well-known/openid-configuration'
        : 'https://auth.minecraft.goatsinlace.com/.well-known/openid-configuration';
  }

  static String getPostLogoutRedirectUrl() {
    return isProduction
        ? 'com.goatsinlace.minecraft://loggedout'
        : 'com.goatsinlace.minecraft://loggedout';
  }

  static String getAuthorizationEndpoint() {
    return isProduction
        ? 'https://auth.minecraft.goatsinlace.com/oauth2/authorize'
        : 'https://auth.minecraft.goatsinlace.com/oauth2/authorize';
  }

  static String getTokenEndpoint() {
    return isProduction
        ? 'https://auth.minecraft.goatsinlace.com/oauth2/token'
        : 'https://auth.minecraft.goatsinlace.com/oauth2/token';
  }

  static String getEndSessionEndpoint() {
    return isProduction
        ? 'https://auth.minecraft.goatsinlace.com/oauth2/logout'
        : 'https://auth.minecraft.goatsinlace.com/oauth2/logout';
  }
}
