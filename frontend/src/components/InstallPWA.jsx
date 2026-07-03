import React, { useEffect, useState } from 'react';

const IconDownload = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const IconClose = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const InstallPWA = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handler = e => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };
    
    // Check if dismissed previously
    if(localStorage.getItem('muna_pwa_dismissed') === 'true') {
        setIsDismissed(true);
    }

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const onClick = evt => {
    evt.preventDefault();
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
    promptInstall.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      setSupportsPWA(false);
    });
  };
  
  const onDismiss = () => {
      setIsDismissed(true);
      localStorage.setItem('muna_pwa_dismissed', 'true');
  };

  if (!supportsPWA || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl p-4 z-50 flex items-center justify-between border border-gray-100 dark:border-zinc-700 animate-fade-in-up">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400">
           <IconDownload />
        </div>
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white text-sm">Install MUNA App</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">Add to home screen for faster access</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
          <button 
            onClick={onClick}
            className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 px-4 rounded-xl transition-colors"
          >
            Install
          </button>
          <button 
             onClick={onDismiss}
             className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2"
          >
              <IconClose />
          </button>
      </div>
    </div>
  );
};

export default InstallPWA;
