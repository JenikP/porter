import React from 'react';
import { createRoot } from 'react-dom/client';
import { PlatformErrorBoundary } from '@porter/mock-platform';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app';
import { Application, registerMobileShell } from '@porter/app-session';
import './styles.css';

registerMobileShell();
createRoot(document.getElementById('root')!).render(
  <PlatformErrorBoundary><BrowserRouter>
    <Application role="driver"><App /></Application>
  </BrowserRouter></PlatformErrorBoundary>,
);

