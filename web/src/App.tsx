import './App.css';
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Home from './Home';
import {Login} from './Login';
import React from 'react';

export default class App extends React.Component {


  render() {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login/>} />
          <Route path="/logout" element={<Home />} />
        </Routes>
      </BrowserRouter>
    );
  }
}


