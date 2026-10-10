import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MockPlatformProvider, PlatformErrorBoundary } from '@porter/mock-platform';
import { App } from './app';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <PlatformErrorBoundary><MockPlatformProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </MockPlatformProvider></PlatformErrorBoundary>,
);
