import { useEffect, useState } from 'react';

/** Accepts a file dropped anywhere on the window; returns whether a file is being dragged over it. */
export function useFileDrop(onFile: (file: File) => void): boolean {
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes('Files') ?? false;
    const onDragOver = (event: DragEvent) => {
      if (hasFiles(event)) {
        event.preventDefault();
        setDragging(true);
      }
    };
    const onDragLeave = (event: DragEvent) => {
      if (event.relatedTarget === null) {
        setDragging(false);
      }
    };
    const onDrop = (event: DragEvent) => {
      if (!hasFiles(event)) {
        return;
      }
      event.preventDefault();
      setDragging(false);
      const file = event.dataTransfer?.files[0];
      if (file) {
        onFile(file);
      }
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [onFile]);

  return dragging;
}
