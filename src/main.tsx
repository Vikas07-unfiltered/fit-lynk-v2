import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Import Capacitor plugins
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

// Initialize Capacitor plugins
const initializeApp = async () => {
  if (Capacitor.isNativePlatform()) {
    // Set status bar style
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#10b981' });
    
    // Hide splash screen after app loads
    await SplashScreen.hide();
  }
};

// Initialize the app
initializeApp();

createRoot(document.getElementById("root")!).render(<App />);