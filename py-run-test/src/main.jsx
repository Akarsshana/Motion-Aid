import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Added missing imports
import './index.css';
import App from './App.jsx';
import ExOne from './ExOne.jsx';

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter> {/* Fixed Router issue */}
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/exone" element={<ExOne/>}/>
        
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
