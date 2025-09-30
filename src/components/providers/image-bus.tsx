"use client";

import React from "react";

export type ImageRecord = {
  /** data URL for the image */
  dataUrl: string;
  /** extracted palette in RGB tuples */
  palette?: Array<[number, number, number]>;
};

type ImageBusState = Map<string, ImageRecord>;

type ImageBusContextValue = {
  get: (id: string) => ImageRecord | undefined;
  set: (id: string, record: ImageRecord) => void;
  setImage: (id: string, dataUrl: string) => void;
  setPalette: (id: string, palette: Array<[number, number, number]>) => void;
};

const ImageBusContext = React.createContext<ImageBusContextValue | null>(null);

export const ImageBusProvider = ({ children }: { children: React.ReactNode }) => {
  const [store] = React.useState<ImageBusState>(() => new Map());
  const [, force] = React.useReducer((x: number) => x + 1, 0);

  const get = React.useCallback((id: string) => store.get(id), [store]);
  const set = React.useCallback(
    (id: string, record: ImageRecord) => {
      store.set(id, record);
      force();
    },
    [store]
  );
  const setImage = React.useCallback(
    (id: string, dataUrl: string) => {
      const current = store.get(id);
      store.set(id, { dataUrl, palette: current?.palette });
      force();
    },
    [store]
  );
  const setPalette = React.useCallback(
    (id: string, palette: Array<[number, number, number]>) => {
      const current = store.get(id);
      if (current) {
        store.set(id, { ...current, palette });
      } else {
        store.set(id, { dataUrl: "", palette });
      }
      force();
    },
    [store]
  );

  // Recreate context value every render so consumers are notified after force()
  const value: ImageBusContextValue = { get, set, setImage, setPalette };

  return (
    <ImageBusContext.Provider value={value}>
      {/* rerender trigger; not rendered */}
      {children}
    </ImageBusContext.Provider>
  );
};

export const useImageBus = () => {
  const ctx = React.useContext(ImageBusContext);
  if (!ctx) throw new Error("ImageBusProvider is missing");
  return ctx;
};
