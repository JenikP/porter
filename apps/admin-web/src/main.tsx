import React from 'react';
import { createRoot } from 'react-dom/client';
import { PlatformErrorBoundary } from '@porter/mock-platform';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app';
import { Application } from '@porter/app-session';
import './styles.css';
import '../../../packages/ui/src/premium-v2.css';

createRoot(document.getElementById('root')!).render(
  <PlatformErrorBoundary><BrowserRouter>
    <Application role="admin"><App /></Application>
  </BrowserRouter></PlatformErrorBoundary>,
);