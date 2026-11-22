import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import WorkflowPage from './pages/WorkflowPage';

export default function App() {
  const [page, setPage] = useState('landing');
  const [sessionData, setSessionData] = useState(null);

  return (
    <div className="app">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#f1f5f9',
            border: '1px solid #2d2d4e',
          },
        }}
      />
      {page === 'landing' ? (
        <LandingPage onStart={() => setPage('workflow')} />
      ) : (
        <WorkflowPage
          sessionData={sessionData}
          setSessionData={setSessionData}
          onBack={() => { setPage('landing'); setSessionData(null); }}
        />
      )}
    </div>
  );
}
