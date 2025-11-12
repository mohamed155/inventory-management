import { Minus, Square, SquaresExclude, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/animate-ui/components/buttons/button.tsx';

declare global {
  interface Window {
    electronAPI: {
      isMaximized: () => Promise<boolean>;
      onWindowMaximized: (callback: (isMaximized: boolean) => void) => void;

      closeWindow: () => void;
      maximizeWindow: () => void;
      minimizeWindow: () => void;
      restoreWindow: () => void;
    };
  }
}

function WindowFrame({ children }: { children: React.ReactNode }) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    window.electronAPI.isMaximized().then(setIsMaximized);
    window.electronAPI.onWindowMaximized(setIsMaximized);
  }, []);

  const closeWindow = () => {
    window.electronAPI.closeWindow();
  };

  const maximizeWindow = () => {
    window.electronAPI.maximizeWindow();
  };

  const minimizeWindow = () => {
    window.electronAPI.minimizeWindow();
  };

  const restoreWindow = () => {
    window.electronAPI.restoreWindow();
  };

  return (
    <div
      className={`border-4 border-primary w-dvw h-dvh shadow-xl ${isMaximized ? '' : 'rounded-lg'}`}
    >
      <div className="h-9 w-full relative window-top-bar">
        <div className="window-controls">
          <div className="before"></div>
          <Button
            type="button"
            className="control minimize"
            onClick={minimizeWindow}
          >
            <Minus />
          </Button>
          <Button
            type="button"
            className="control maximize"
            onClick={isMaximized ? restoreWindow : maximizeWindow}
          >
            {isMaximized ? <SquaresExclude /> : <Square />}
          </Button>
          <Button type="button" className="control close" onClick={closeWindow}>
            <X />
          </Button>
          <div className="after"></div>
        </div>
      </div>
      <div className="window-content">{children}</div>
    </div>
  );
}

export default WindowFrame;
