import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { MigrationRunner } from './infrastructure/migrations/MigrationRunner';
import { DialogProvider } from './components/ui/DialogProvider';

const runner = new MigrationRunner();
runner.run().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <DialogProvider>
        <App />
      </DialogProvider>
    </StrictMode>,
  );
}).catch(err => {
  console.error('Failed to start application due to migration error:', err);
});
