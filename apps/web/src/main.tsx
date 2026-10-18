import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/kanit/latin-400.css';
import '@fontsource/kanit/latin-500.css';
import '@fontsource/kanit/latin-600.css';
import '@fontsource/kanit/latin-700.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App, { queryClient } from './app/App';
import './styles/global.css';
async function start() {
  if (import.meta.env.VITE_DEMO_MODE !== 'false') {
    const { worker } = await import('./mocks/browser');
    const { events } = await import('./mocks/repository');
    events.addEventListener('domain', () => {
      queryClient.invalidateQueries({ queryKey: ['workspace'] });
      queryClient.invalidateQueries({ queryKey: ['checkout'] });
    });
    await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
  }
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
start().catch(() => {
  document.getElementById('root')!.innerHTML =
    '<main style="padding:48px;font-family:sans-serif"><h1>Unable to start the workspace</h1><p>The demo service worker could not start. Open this app on localhost or HTTPS and reload.</p></main>';
});
