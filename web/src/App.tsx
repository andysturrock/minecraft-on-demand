import './App.css';
import LoginLogoutButton from './LoginLogoutButton';
import {useLocation, useNavigate} from "react-router-dom";
import LoginLogoutController from './LoginLogoutController';
import {useState} from 'react';
import React from 'react';

export default function App() {
  const location = useLocation();

  let myText:JSX.Element;
  
  switch(location.pathname) {
  // case '/login':
  //   myText = <p className="App-para">Please wait...</p>;
  //   LoginLogoutController.login(location.search).then(() => window.location.replace("/"));
  //   break;
  case '/':
    // if(LoginLogoutController.loggedIn)
    myText = LoginLogoutController.loggedIn ? 
      <p className="App-para">Here is the content</p> : 
      <p className="App-para">Please log in</p> ;
    break;
  case '/logout':
    myText = <p className="App-para">Please log in</p>;
    LoginLogoutController.logout();
    window.location.replace("/");
    break;
  default:
    myText = <p className="App-para">No idea</p>;
    break;
  }

  function MyText() {
    return myText;
  }

  return (
    <div className="App">
      <header className="App-header">
        {/* <LoginLogoutButton/> */}
        <p className="App-para">Path = {location.pathname}</p>
        <MyText/>
      </header>
    </div>
  );
}


