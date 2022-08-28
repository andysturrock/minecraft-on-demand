import React from "react";
import styled from "styled-components";
import {AuthController} from "./AuthController";

class LoginLogoutButton extends React.Component {

  private _button = styled.button`
  background-color: black;
  color: white;
  font-size: 20px;
  padding: 10px 60px;
  border-radius: 5px;
  margin: 10px 0px;
  cursor: pointer;
`;

  private async _login() {
    const codeVerifier = AuthController.createCodeVerifier();
    AuthController.saveCodeVerifier(codeVerifier);
    window.location.replace(await AuthController.getLoginUrl(codeVerifier));
  }

  private _logout() {
    window.location.replace(AuthController.getLogoutUrl());
  }

  render() {
    return AuthController.loggedIn? (
      <this._button onClick={this._logout.bind(this)}>
        Logout
      </this._button>

    ) : (
      <this._button onClick={this._login.bind(this)}>
        Login
      </this._button>
    );
  }
}

export default LoginLogoutButton;
