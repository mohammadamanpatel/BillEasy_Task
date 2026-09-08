import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// Put the App into the page.
ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode checks our code for common mistakes during development.
  <React.StrictMode>
    <App />
  </React.StrictMode>
);