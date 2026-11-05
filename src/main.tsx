// Suppress benign Google Cloud Firestore idle stream timeout notices
const originalError = console.error;
console.error = (...args: any[]) => {
  if (
    args.length > 0 &&
    typeof args[0] === 'string' &&
    args[0].includes('Disconnecting idle stream')
  ) {
    return;
  }
  originalError(...args);
};

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
