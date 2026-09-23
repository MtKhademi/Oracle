import React from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/500.css';
import '@fontsource/vazirmatn/700.css';
import App from '../App';
import './styles.css';

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /><Toaster dir="rtl" position="top-center" richColors /></React.StrictMode>);
