const isProduction = false;

export class Env {
  static envName() {
    return isProduction ? 'Production' : 'Test';
  }

  static getServerStatusUri() {
    return isProduction
      ? 'https://api.minecraft.goatsinlace.com/0_0_1/instanceState'
      : 'https://api.minecraft.goatsinlace.com/0_0_1/instanceState';
  }

  static getLoginUri() {
    return 'https://auth.cognito.goatsinlace.com/oauth2/authorize';
  }

  static getLogoutUri() {
    return 'https://auth.cognito.goatsinlace.com/logout';
  }

  static getClientId() {
    return '58i7e8qoje8blu5lpmtdkajjlu';
  }

  static getLoginRedirectUri() {
    return isProduction
      ? 'https://www.minecraft.goatsinlace.com/login'
      : 'http://localhost:3000/login';
  }

  static getLogoutRedirectUri() {
    return isProduction
      ? 'https://www.minecraft.goatsinlace.com/logout'
      : 'http://localhost:3000/logout';
  }

  static getTokenEndpoint() {
    return 'https://auth.cognito.goatsinlace.com/oauth2/token';
  }  
}