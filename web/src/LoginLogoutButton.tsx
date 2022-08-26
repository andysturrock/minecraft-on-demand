import React, {useState} from "react";
import './App.css';
import {Link, NavigateFunction} from 'react-router-dom';
import styled from "styled-components";
import LoginLogoutController from "./LoginLogoutController";
import {useNavigate} from "react-router-dom";

class LoginLogoutButton extends React.Component {
  private _loginUri = 'https://auth.cognito.goatsinlace.com/oauth2/authorize';
  private _clientId = '3lrpn3o73mu30plbseb9b7kens';
  private _redirectUri = 'http://localhost:3000/loggedin';

  private _button = styled.button`
  background-color: black;
  color: white;
  font-size: 20px;
  padding: 10px 60px;
  border-radius: 5px;
  margin: 10px 0px;
  cursor: pointer;
`;

  // private loggedIn() {
  //   return (
  //     <div>
  //       <Link to={{pathname: this.createCompleteLoginUrl().toString()}} className="btn btn-primary">Login</Link>
  //     </div>
  //   );
  // }
  // private loggedOut() {
  //   return (
  //     <div>
  //       <Link to={{pathname: this.createCompleteLoginUrl().toString()}} className="btn btn-primary">Login</Link>
  //     </div>
  //   );
  // }

  private async _login() {
    // const navigate = useNavigate();
    window.location.replace(await LoginLogoutController.getLoginUrl());
    // navigate(LoginLogoutController.getLoginUrl());
    // this.props.navigate(LoginLogoutController.getLoginUrl());
  }

  private _logout() {
    window.location.replace(LoginLogoutController.getLogoutUrl());
  }

  render() {
    // return LoginLogoutController.loggedIn? this.loggedIn() : this.loggedOut();
    // return (
    //   <this._button onClick={this._login.bind(this)}>
    //     Login
    //   </this._button>
    // );
    return LoginLogoutController.loggedIn? (
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
