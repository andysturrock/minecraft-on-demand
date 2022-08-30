import axios, {AxiosError, AxiosRequestConfig} from 'axios';
import React from 'react';
import styled, {css} from "styled-components";
import {AuthController} from './AuthController';
import {Env} from './utils/env';
import './css/ServerControl.css';

enum ServerState {none, pending, running, stopping, stopped }
type ServerControlState = {
  instanceId: string;
  launchTime: Date;
  serverState: ServerState;
  serverStopTime: Date;
  extendButtonDisabled: boolean;
};
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ServerControlProps {
}
export default class ServerControl extends React.Component<ServerControlProps, ServerControlState> {
  _interval?: number;

  constructor(props: ServerControlProps) {
    super(props);
    const serverControlState: ServerControlState = {
      instanceId: 'unknown',
      launchTime: new Date(),
      serverState: ServerState.none,
      serverStopTime: new Date(),
      extendButtonDisabled: true
    };
    this.state = serverControlState;
  }

  async componentDidMount() {
    await this._getServerState();

    this._interval = window.setInterval(async () => {
      this._getServerState();
    }, 5000);
  }

  componentWillUnmount() {
    clearInterval(this._interval);
  }

  async _getServerState() {
    const uri = Env.getServerStatusUri();
    const axiosRequestConfig :AxiosRequestConfig = {
      headers: {
        "Authorization": `Bearer ${AuthController.accessToken}`
      }
    };
    try {
      const result = await axios.get(uri, axiosRequestConfig);
      // console.debug(`result = ${JSON.stringify(result)}`);
      const serverState = ServerState[result.data.state.Name as keyof typeof ServerState];
      const extendButtonDisabled = (serverState != ServerState.running);
      const serverControlState: ServerControlState = {
        instanceId: result.data.instanceId,
        launchTime: new Date(result.data.launchTime),
        serverState,
        serverStopTime: new Date(result.data.serverStopTime),
        extendButtonDisabled: extendButtonDisabled
      };
      this.setState(serverControlState);
    }
    catch (error) {
      const err = error as AxiosError;
      console.error(`Error getting server status: ${JSON.stringify(err)}`);
      console.log(`code: ${err.code}`);
      if(err.response) {
        console.log(err.response.status);
        console.log(err.response.data);
      }
    }
  }

  render() {
    const stopStartButtonData = {
      text: '',
      disabled: true,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      action: () => {}
    };
    switch(this.state.serverState) {
    case ServerState.running:
      stopStartButtonData.text = "Stop";
      stopStartButtonData.disabled = false;
      stopStartButtonData.action = this._stopServer;
      break;
    case ServerState.stopped:
      stopStartButtonData.text = "Start";
      stopStartButtonData.disabled = false;
      stopStartButtonData.action = this._startServer;
      break;
    case ServerState.stopping:
    case ServerState.pending:
    case ServerState.none:
    default:
      stopStartButtonData.text = "Wait...";
      stopStartButtonData.disabled = true;
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      stopStartButtonData.action = () => {};
      break;
    }

    return (
      <>
        <ul className="black">
          <li>Server Instance Id: {this.state.instanceId}</li>
          <li>Server Launch Time: {this.state.launchTime.toLocaleTimeString()}</li>
          <li>Server State: {ServerState[this.state.serverState]}</li>
          <li>Server Stop Time: {this.state.serverStopTime.toLocaleTimeString()}</li>
        </ul>
        <this._stopStartButton onClick={stopStartButtonData.action.bind(this)} disabled={stopStartButtonData.disabled}>
          {stopStartButtonData.text}
        </this._stopStartButton>

        { this.state.serverState == ServerState.running ? 
          <this._extendButton onClick={this._extendServer.bind(this)} disabled={this.state.extendButtonDisabled}>
          Extend stop time
          </this._extendButton> :
          <></>
        }
      </>
    );
  }

  private async _startServer() {
    // Immediately set the state to pending, mainly to disable the button.
    // Stop the kids pressing it multiple times!
    const serverControlState: ServerControlState = this.state;
    serverControlState.serverState = ServerState.pending;
    this.setState(serverControlState);
    console.log('Starting server...');
    await this._post('start');
    // If the POST fails, the button will be re-enabled here.
    await this._getServerState();
  }

  private async _stopServer() {
    // Immediately set the state to stopping, mainly to disable the button.
    // Stop the kids pressing it multiple times!
    const serverControlState: ServerControlState = this.state;
    serverControlState.serverState = ServerState.stopping;
    this.setState(serverControlState);
    console.log('Stopping server...');
    await this._post('stop');
    // If the POST fails, the button will be re-enabled here.
    await this._getServerState();
  }

  private async _extendServer() {
    // Immediately disable the button.
    // Stop the kids pressing it multiple times!
    const serverControlState: ServerControlState = this.state;
    serverControlState.extendButtonDisabled = true;
    this.setState(serverControlState);
    console.log('Extending server...');
    await this._post('extend');
    // If the POST fails, the button will be re-enabled here.
    await this._getServerState();
  }

  private async _post(action: 'stop' | 'start' | 'extend') {
    const headers = {
      "Authorization": `Bearer ${AuthController.accessToken}`,
      "Content-Type": "application/json"
    };

    const data = {
      action,
      instanceId: this.state.instanceId,
      deleteStopRule: true
    };

    const uri = Env.getServerStatusUri();
    const axiosRequestConfig :AxiosRequestConfig = {
      method: 'post',
      url: Env.getServerStatusUri(),
      headers
    };
    try {
      const result = await axios.post(uri, data, axiosRequestConfig);
      if(result.status != 200) {
        alert(`Request failed, status ${result.status}`);
      }
    }
    catch (error) {
      const err = error as AxiosError;
      console.error(`Error setting server status: ${JSON.stringify(err)}`);
      console.log(`code: ${err.code}`);
      if(err.response) {
        console.log(err.response.status);
        console.log(err.response.data);
        if(err.response.status === 403) {
          alert("You don't have permission to do that");
        }
        else {
          alert(`${err.message}`);
        }
      }
    }
  }

  private _stopStartButton = styled.button`
  font-size: 20px;
  padding: 10px 60px;
  border-radius: 5px;
  margin: 10px 0px;
  ${(props) => {
    switch(props.disabled) {
    case true:
      return css`
        border: 1px solid #999999;
        background-color: #cccccc;
        color: #666666;
        cursor: not-allowed;
      `;
      break;
    default:
      return css`
        background-color: black;
        color: white;
        cursor: pointer;
      `;
    }
  }}
`;
  private _extendButton = styled.button`
  font-size: 20px;
  padding: 10px 60px;
  border-radius: 5px;
  margin: 10px 0px;
  ${(props) => {
    switch(props.disabled) {
    case true:
      return css`
        border: 1px solid #999999;
        background-color: #cccccc;
        color: #666666;
        cursor: not-allowed;
      `;  
      break;
    default:
      return css`
        background-color: black;
        color: white;
        cursor: pointer;
      `;
    }
  }}
`;
}


