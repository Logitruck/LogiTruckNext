declare module 'react-native-dialog-input' {
  import React from 'react';
  import { ViewStyle, TextStyle } from 'react-native';

  type Props = {
    isDialogVisible: boolean;
    title?: string;
    message?: string;
    hintInput?: string;
    submitInput?: (inputText: string) => void;
    closeDialog?: () => void;
    submitText?: string;
    cancelText?: string;
    textInputProps?: any;
    dialogStyle?: ViewStyle;
    textStyle?: TextStyle;
  };

  const DialogInput: React.FC<Props>;
  export default DialogInput;
}