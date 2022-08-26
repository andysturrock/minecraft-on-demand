import './App.css';
import axios, {AxiosRequestConfig} from 'axios';
import qs from 'qs';
import randomstring from 'randomstring';
import {encode as base64encode} from "base64-arraybuffer";

class LoginLogoutController  {
  private static _loggedIn = false;
  private static _loginUri = 'https://auth.cognito.goatsinlace.com/oauth2/authorize';
  private static _logoutUri = 'https://auth.cognito.goatsinlace.com/logout';
  private static _clientId = '3lrpn3o73mu30plbseb9b7kens';
  private static _loginRedirectUri = 'http://localhost:3000/login';
  private static _logoutRedirectUri = 'http://localhost:3000/logout';
  private static _tokenEndpoint = 'https://auth.cognito.goatsinlace.com/oauth2/token';
  private static _accessToken = '';
  private static _codeVerifier = LoginLogoutController._createCodeVerifier();
  private static _codeChallenge = LoginLogoutController._createCodeChallenge(LoginLogoutController._codeVerifier);

  static async getLoginUrl() {
    const url = new URL(LoginLogoutController._loginUri);
    url.searchParams.append("client_id", LoginLogoutController._clientId);
    url.searchParams.append("response_type", "code");
    url.searchParams.append("redirect_uri", LoginLogoutController._loginRedirectUri);
    url.searchParams.append("scope", "openid");
    url.searchParams.append("code_challenge_method", "S256");
    url.searchParams.append("code_challenge", await LoginLogoutController._codeChallenge);
    
    return url;
  }

  static getLogoutUrl() {
    const url = new URL(LoginLogoutController._logoutUri);
    url.searchParams.append("client_id", LoginLogoutController._clientId);
    url.searchParams.append("logout_uri", LoginLogoutController._logoutRedirectUri);

    return url;
  }

  static async login(search: string) {
    console.log(`got search: ${search}`);
    const code = search.replace('?code=','');

    await LoginLogoutController._exchangeCodeForToken(code);
    LoginLogoutController._loggedIn = true;
  }

  static logout() {
    LoginLogoutController._loggedIn = false;
  }

  static get loggedIn() {
    return LoginLogoutController._loggedIn;
  }

  static get accessToken() {
    return LoginLogoutController._accessToken;
  }

  private static _createCodeVerifier() {
    return randomstring.generate(128);
  }

  private static async _createCodeChallenge(codeVerifier: string) {
    // encode as UTF-8
    const data = new TextEncoder().encode(codeVerifier); 
    // Create sha-265 hash
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    // Create Base64 encoded version
    const base64Digest = base64encode(digest);
    // Now the Base64 URL encoded version
    return base64Digest
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  private static async _exchangeCodeForToken(code: string) {
    console.log(`got code: ${code}`);

    const axiosRequestConfig: AxiosRequestConfig = {
      method: 'post',
      url: LoginLogoutController._tokenEndpoint,
      data: qs.stringify({
        client_id: this._clientId,
        grant_type: "authorization_code",
        code_verifier: LoginLogoutController._codeVerifier,
        code,
        redirect_uri: LoginLogoutController._loginRedirectUri
      }),
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    };
    const result = await axios(axiosRequestConfig);
    console.log(`token exchange result = ${JSON.stringify(result)}`);
  }
}

export default LoginLogoutController;
