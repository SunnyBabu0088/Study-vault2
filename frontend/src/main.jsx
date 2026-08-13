import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { StudyProvider } from './context/StudyContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StudyProvider>
      <App />
    </StudyProvider>
  </React.StrictMode>
);
