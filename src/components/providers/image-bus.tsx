"use client";

import React from "react";

const GlobalLoadingOverlay: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl border bg-background/95 p-8 shadow-2xl">
        <div className="relative size-16">
          <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
        <div className="text-sm font-medium text-foreground">{message}</div>
      </div>
    </div>
  );
};

export type ColorAssignments = {
  primary?: Array<[number, number, number]>;
  secondary?: Array<[number, number, number]>;
  accent?: Array<[number, number, number]>;
  sub?: Array<[number, number, number]>;
};

export type ImageRecord = {
  /** data URL for the image */
  dataUrl: string;
  /** extracted palette in RGB tuples */
  palette?: Array<[number, number, number]>;
  /** color assignments by category */
  assignments?: ColorAssignments;
};

type ImageBusState = Map<string, ImageRecord>;

type ImageBusContextValue = {
  get: (id: string) => ImageRecord | undefined;
  set: (id: string, record: ImageRecord) => void;
  setImage: (id: string, dataUrl: string) => void;
  setPalette: (id: string, palette: Array<[number, number, number]>) => void;
  setAssignments: (id: string, assignments: ColorAssignments) => void;
  remove: (id: string) => void;
  setLoading: (loading: boolean, message?: string) => void;
  loading: boolean;
  loadingMessage: string;
};

const ImageBusContext = React.createContext<ImageBusContextValue | null>(null);

export const ImageBusProvider = ({ children }: { children: React.ReactNode }) => {
  const [store] = React.useState<ImageBusState>(() => new Map());
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  const [loading, setLoadingState] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState("Loading...");

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

  const setAssignments = React.useCallback(
    (id: string, assignments: ColorAssignments) => {
      const current = store.get(id);
      if (current) {
        store.set(id, { ...current, assignments });
      } else {
        store.set(id, { dataUrl: "", assignments });
      }
      force();
    },
    [store]
  );

  const remove = React.useCallback(
    (id: string) => {
      store.delete(id);
      force();
    },
    [store]
  );

  const setLoading = React.useCallback((isLoading: boolean, message?: string) => {
    setLoadingState(isLoading);
    if (message) {
      setLoadingMessage(message);
    }
  }, []);

  // Recreate context value every render so consumers are notified after force()
  const value: ImageBusContextValue = {
    get,
    set,
    setImage,
    setPalette,
    setAssignments,
    remove,
    setLoading,
    loading,
    loadingMessage,
  };

  return (
    <ImageBusContext.Provider value={value}>
      {children}
      {loading && <GlobalLoadingOverlay message={loadingMessage} />}
    </ImageBusContext.Provider>
  );
};

export const useImageBus = () => {
  const ctx = React.useContext(ImageBusContext);
  if (!ctx) throw new Error("ImageBusProvider is missing");
  return ctx;
};
