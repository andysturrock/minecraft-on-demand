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
          <p></p>
          <a href="itms-services://?action=download-manifest&url=https://www.minecraft.goatsinlace.com/manifest.plist" download>Install iOS App</a>
          <p></p>
          <a href="https://www.minecraft.goatsinlace.com/minecraft-on-demand.apk" download>Install Android App</a>
        </div> :
        <p className="Home-para">Please log in</p>
      }
    </>
  );
}


