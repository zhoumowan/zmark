import { useEffect } from 'react';

export const useSaveShortcut = (onSave: () => void) => {
  useEffect(() => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isSaveShortcut = isMac
        ? event.metaKey && event.key === 's'
        : event.ctrlKey && event.key === 's';

      if (isSaveShortcut) {
        event.preventDefault();
        onSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSave]);
};
