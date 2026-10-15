import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PlatformErrorBoundary } from '@porter/mock-platform';
import { App } from './app';
import { Application, registerMobileShell } from '@porter/app-session';
import './styles.css';
import '../../../packages/ui/src/premium-v2.css';

registerMobileShell();
createRoot(document.getElementById('root')!).render(
  <PlatformErrorBoundary>
    <BrowserRouter>
      <Application role="customer"><App /></Application>
    </BrowserRouter>
  </PlatformErrorBoundary>,
);