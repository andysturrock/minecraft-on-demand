import './App.css';
import LoginLogoutButton from './LoginLogoutButton';
import {useLocation} from "react-router-dom";
import {AuthController} from './AuthController';

export default function Home() {
  const location = useLocation();

  let myText:JSX.Element;
  
  switch(location.pathname) {
  case '/':
    myText = AuthController.loggedIn ? 
      <p className="App-para">Here is the content</p> : 
      <p className="App-para">Please log in</p> ;
    break;
  case '/logout':
    myText = <p className="App-para">Please log in</p>;
    AuthController.logout();
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
        <LoginLogoutButton/>
        <p className="App-para">Path = {location.pathname}</p>
        <MyText/>
      </header>
    </div>
  );
}


