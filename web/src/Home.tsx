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
        <div><ServerControl></ServerControl>
          <a href="itms-services://?action=download-manifest&url=https://www.minecraft.goatsinlace.com/manifest.plist">Install iOS App</a>
          <a href="https://www.minecraft.goatsinlace.com/minecraft-on-demand.apk">Install Android App</a>
        </div> : 
        <p className="Home-para">Please log in</p>
      }
    </>
  );
}


