"use client";

import { type DragEvent, useCallback, useState } from "react";

/** Whether a drag is over the target, and the handlers to spread onto it. */
export type DropTarget = {
  dragging: boolean;
  handlers: {
    onDragOver: (event: DragEvent<HTMLElement>) => void;
    onDragEnter: (event: DragEvent<HTMLElement>) => void;
    onDragLeave: (event: DragEvent<HTMLElement>) => void;
    onDrop: (event: DragEvent<HTMLElement>) => void;
  };
};

/**
 * Makes one element a drop target. `onFile` gets the first file dropped on it; `onEmpty` hears
 * about a drop that carried no file, so the view can say why nothing happened.
 */
export const useDropTarget = (onFile: (file: File) => void, onEmpty: () => void): DropTarget => {
  const [dragging, setDragging] = useState(false);

  const onDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    // Crossing into a child of the target is not a leave.
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setDragging(false);
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      // Marks the drop handled: for the browser, which would navigate to the file, and for the
      // page wide handler behind this one.
      event.preventDefault();
      setDragging(false);
      const dropped = Array.from(event.dataTransfer.files)[0];
      if (dropped) onFile(dropped);
      else onEmpty();
    },
    [onFile, onEmpty]
  );

  return { dragging, handlers: { onDragOver, onDragEnter: onDragOver, onDragLeave, onDrop } };
};
