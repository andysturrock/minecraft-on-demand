import axios, {AxiosError, AxiosRequestConfig} from 'axios';
import React from 'react';
import styled from "styled-components";
import {AuthController} from './AuthController';
import {Env} from './utils/env';
import './css/ServerControl.css';

enum ServerState {none, pending, running, stopping, stopped }
type ServerControlState = {
  instanceId: string;
  launchTime: Date;
  serverState: ServerState;
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
      serverState: ServerState.none
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
      },
      withCredentials: false
    };
    try {
      const result = await axios.get(uri, axiosRequestConfig);
      const serverControlState: ServerControlState = {
        instanceId: result.data.instanceId,
        launchTime: new Date(result.data.launchTime),
        serverState: ServerState[result.data.state.Name as keyof typeof ServerState]
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
    const dateString = this.state.launchTime.toLocaleTimeString();
    const serverStateString = ServerState[this.state.serverState];
    const buttonData = {
      text: '',
      enabled: false,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      action: () => {}
    };
    switch(this.state.serverState) {
    case ServerState.running:
      buttonData.text = "Stop";
      buttonData.enabled = true;
      buttonData.action = this._stopServer;
      break;
    case ServerState.stopped:
      buttonData.text = "Start";
      buttonData.enabled = true;
      buttonData.action = this._startServer;
      break;
    case ServerState.stopping:
    case ServerState.pending:
    case ServerState.none:
    default:
      buttonData.text = "Wait...";
      buttonData.enabled = true;
      break;
    }
    return (
      <>
        <ul className="black">
          <li>Server Instance Id: {this.state.instanceId}</li>
          <li>Server Launch Time: {dateString}</li>
          <li>Server State: {serverStateString}</li>
        </ul>
        <this._button onClick={buttonData.action.bind(this)}>
          {buttonData.text}
        </this._button>
      </>
    );
  }

  private async _startServer() {
    console.log('Starting server...');
    await this._post('start');
    await this._getServerState();
  }

  private async _stopServer() {
    console.log('Stopping server...');
    await this._post('stop');
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
      headers,
      withCredentials: false
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
        alert(`${err.message}`);
      }
    }
  }

  private _button = styled.button`
  background-color: black;
  color: white;
  font-size: 20px;
  padding: 10px 60px;
  border-radius: 5px;
  margin: 10px 0px;
  cursor: pointer;
`;
}


