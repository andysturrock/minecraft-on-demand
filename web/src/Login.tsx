import './App.css';
import LoginLogoutButton from './LoginLogoutButton';
import {useLocation, useNavigate} from "react-router-dom";
import LoginLogoutController from './LoginLogoutController';
import {useEffect, useState} from 'react';
import React from 'react';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    async function fetchData() {
      await LoginLogoutController.login(location.search);
      navigate('/');
    }
    fetchData();
  }, [location.search, navigate]);


  return <p className="App-para">Please wait...</p>;
}


