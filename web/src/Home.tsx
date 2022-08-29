import './css/Home.css';
import LoginLogoutButton from './LoginLogoutButton';
import {AuthController} from './AuthController';
import ServerControl from './ServerControl';

export default function Home() {
  return (
    <>
      <div className="Home-fixed-topright">
        <LoginLogoutButton/>
      </div>
      {AuthController.loggedIn ? 
        <ServerControl></ServerControl> : 
        <p className="Home-para">Please log in</p>
      }
    </>
  );
}


