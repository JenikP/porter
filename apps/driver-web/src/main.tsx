import React from 'react';
import { createRoot } from 'react-dom/client';
import { MockPlatformProvider, PlatformErrorBoundary } from '@porter/mock-platform';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <PlatformErrorBoundary><MockPlatformProvider><BrowserRouter>
    <App />
  </BrowserRouter></MockPlatformProvider></PlatformErrorBoundary>,
);
