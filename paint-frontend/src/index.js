import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

;(function patchCanvasGetContext() {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(type, opts) {
    // Sadece 2d context için willReadFrequently ekle
    if (type === '2d') {
      if (opts == null) {
        opts = { willReadFrequently: true };
      } else if (typeof opts === 'object') {
        opts = { ...opts, willReadFrequently: true };
      }
    }
    return orig.call(this, type, opts);
  };
})();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
