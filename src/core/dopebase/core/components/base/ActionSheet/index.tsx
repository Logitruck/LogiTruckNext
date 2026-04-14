import React, { createContext, useContext } from 'react';

type ActionSheetOptions = {
  options: string[];
  cancelButtonIndex?: number;
  destructiveButtonIndex?: number;
};

type ActionSheetContextValue = {
  showActionSheetWithOptions: (
    options: ActionSheetOptions,
    callback: (index: number) => void,
  ) => void;
};

const ActionSheetContext = createContext<ActionSheetContextValue>({
  showActionSheetWithOptions: () => {},
});

export const ActionSheetProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const showActionSheetWithOptions = (
    options: ActionSheetOptions,
    callback: (index: number) => void,
  ) => {
    // 👇 implementación básica (temporal)
    console.log('ActionSheet options:', options.options);

    // fallback simple → selecciona cancel
    if (callback) {
      callback(options.cancelButtonIndex ?? 0);
    }
  };

  return (
    <ActionSheetContext.Provider
      value={{ showActionSheetWithOptions }}
    >
      {children}
    </ActionSheetContext.Provider>
  );
};

export const useActionSheet = () => {
  return useContext(ActionSheetContext);
};