import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { StudyProvider } from './context/StudyContext';
import ErrorBoundary from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <StudyProvider>
        <App />
      </StudyProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
