import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {AuthProvider} from './context/AuthContext.tsx';
import {SocketProvider} from './context/SocketContext.tsx';
import {LanguageProvider} from './context/LanguageContext.tsx';
import {ThemeProvider} from './context/ThemeContext.tsx';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';
import {Toaster} from 'react-hot-toast';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <Toaster position="top-center" />
              <App />
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
);
