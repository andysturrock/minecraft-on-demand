import axios, {AxiosRequestConfig} from 'axios';
import qs from 'qs';
import {encode as base64encode} from "base64-arraybuffer";

export class AuthController  {
  private static _loggedIn = false;
  private static _loginUri = 'https://auth.cognito.goatsinlace.com/oauth2/authorize';
  private static _logoutUri = 'https://auth.cognito.goatsinlace.com/logout';
  private static _clientId = '58i7e8qoje8blu5lpmtdkajjlu';
  private static _loginRedirectUri = 'http://localhost:3000/login';
  private static _logoutRedirectUri = 'http://localhost:3000/logout';
  private static _tokenEndpoint = 'https://auth.cognito.goatsinlace.com/oauth2/token';
  private static _idToken = '';
  private static _accessToken = '';
  private static _refreshToken = '';

  static async getLoginUrl(codeVerifier: string) {
    const codeChallenge = await AuthController._createCodeChallenge(codeVerifier);

    const url = new URL(AuthController._loginUri);
    url.searchParams.append("client_id", AuthController._clientId);
    url.searchParams.append("response_type", "code");
    url.searchParams.append("redirect_uri", AuthController._loginRedirectUri);
    url.searchParams.append("scope", "openid");
    url.searchParams.append("code_challenge_method", "S256");
    url.searchParams.append("code_challenge", codeChallenge);
    
    return url;
  }

  static getLogoutUrl() {
    const url = new URL(AuthController._logoutUri);
    url.searchParams.append("client_id", AuthController._clientId);
    url.searchParams.append("logout_uri", AuthController._logoutRedirectUri);

    return url;
  }

  static async exchangeCodeForToken(search: string) {
    const codeVerifier = AuthController.loadCodeVerifier();
    if(codeVerifier === null) {
      throw new Error("code verifier not found in session storage");
    }
    const code = search.replace('?code=','');

    await AuthController._exchangeCodeForToken(code, codeVerifier);
    AuthController._loggedIn = true;
  }

  static logout() {
    AuthController._loggedIn = false;
  }

  static get loggedIn() {
    return AuthController._loggedIn;
  }

  static get idToken() {
    return AuthController._idToken;
  }

  static get accessToken() {
    return AuthController._accessToken;
  }

  static get refreshToken() {
    return AuthController._refreshToken;
  }

  /**
   * Creates code_verifier string of specified length.
   * @param length length of string.  Should be between 43 and 128 for PKCE use.  Defaults to 128.
   * @returns String of random characters suitable for use as a code_verifier.
   */
  static createCodeVerifier(length = 128) {
    // Allowed chars are: [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
    const allowedChars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const allowedCharsLength = allowedChars.length;

    let output = '';
    for(let index = 0; index < length; index++) {
      const randomIndex = Math.floor(Math.random() * allowedCharsLength);
      output += allowedChars[randomIndex];
    }

    return output;
  }

  /**
   * Saves string to session storage.  Note there is a slim chance of a XSS attack - see https://pragmaticwebsecurity.com/talks/xssoauth.html.
   * @param code Code to save.
   * @param key Key to use to save the code.  Defaults to "pkce_code_verifier".
   */
  static saveCodeVerifier(code: string, key = "pkce_code_verifier") {
    sessionStorage.setItem(key, code);
  }

  /**
   * Loads string from session storage.  Note there is a slim chance of a XSS attack - see https://pragmaticwebsecurity.com/talks/xssoauth.html.
   * @param key Key to load from.  Defaults to "pkce_code_verifier".
   * @param removeItem Whether to remove the item on retrieval.  Defaults to true.
   * @returns .
   */
  static loadCodeVerifier(key = "pkce_code_verifier", removeItem = true) {
    const code = sessionStorage.getItem(key);
    if(removeItem) {
      sessionStorage.removeItem(key);
    }
    return code;
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

  private static async _exchangeCodeForToken(code: string, codeVerifier: string) {

    const axiosRequestConfig: AxiosRequestConfig = {
      method: 'post',
      url: AuthController._tokenEndpoint,
      data: qs.stringify({
        client_id: this._clientId,
        grant_type: "authorization_code",
        code_verifier: codeVerifier,
        code,
        redirect_uri: AuthController._loginRedirectUri
      }),
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    };
    try {
      const result = await axios(axiosRequestConfig);
      AuthController._idToken = result.data.id_token;
      AuthController._accessToken = result.data.access_token;
      AuthController._refreshToken = result.data.refresh_token;
      // console.log(`token exchange result = ${JSON.stringify(result)}`);
    } catch (error) {
      console.log(`Caught error = ${JSON.stringify(error)}`);
    }
  }
}

