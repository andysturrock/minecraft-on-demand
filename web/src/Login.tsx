import './App.css';
import LoginLogoutButton from './LoginLogoutButton';
import {NavigateFunction, useLocation, useNavigate} from "react-router-dom";
import {AuthController} from './AuthController';
import {useEffect, useState} from 'react';
import React from 'react';

// export default function Login() {
//   console.log("In <Login>");
//   const location = useLocation();
//   const navigate = useNavigate();
//   useEffect(() => {
//     async function fetchData() {
//       await AuthController.exchangeCodeForToken(location.search);
//       navigate('/');
//     }
//     fetchData();
//   }, [location.search, navigate]);


//   return <p className="App-para">Please wait...</p>;
// }


interface LoginProps {
  navigate: NavigateFunction;
  search: string;
}
class _Login extends React.Component<LoginProps> {
  _state = "none";

  async componentDidMount() {
    // TODO this is to prevent a weird situation that I can't work out where we get called twice.
    // The second call to exchangeCodeForToken() will always fail because the code_verifier has
    // been removed from session storage, and even if it hasn't then Cognito will return an error
    // on the second time because we have already exchanged this code.
    if(this._state == "none") {
      this._state = "logging in";
      await AuthController.exchangeCodeForToken(location.search);
    }
    this.props.navigate('/');
  }

  render() {
    return <p className="App-para">Please wait...</p>;
  }
}

export function Login() {
  const search = useLocation().search;
  const navigate = useNavigate();
  return <_Login search={search} navigate={navigate} />;
}