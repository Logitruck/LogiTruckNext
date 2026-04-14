import React, { useRef } from 'react';
import { View, TextInput, Text } from 'react-native';
import { useTheme } from '../../dopebase';
import dynamicStyles from './styles';

type CustomTextInputProps = {
  inputRef?: React.MutableRefObject<any>;
  editorStyles?: Record<string, any>;
  formattedText: any;
  inputText?: string;
  placeholder?: string;
  placeholderTextColor?: string;
  onChange: (text: string) => void;
  autoFocus?: boolean;
  clearTextOnFocus?: boolean;
  handleSelectionChange?: (event: any) => void;
  numberOfLines?: number | null;
  multiline?: boolean;
  onFocus?: () => void;
  toggleEditor?: () => void;
  editable?: boolean;
  onPressIn?: () => void;
  onPressOut?: () => void;
};

export default function CustomTextInput(props: CustomTextInputProps) {
  const {
    editorStyles = {},
    formattedText,
    placeholder,
    placeholderTextColor,
    onChange,
    autoFocus,
    handleSelectionChange,
    numberOfLines = null,
    multiline = true,
    onFocus = () => {},
  } = props;

  const inputRef = useRef<any>(null);

  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  if (props.inputRef) {
    props.inputRef.current = inputRef.current;
  }

  return (
    <View style={styles.container}>
      <TextInput
        ref={inputRef}
        style={[styles.input, editorStyles.input]}
        multiline={multiline}
        autoFocus={autoFocus}
        onFocus={onFocus}
        numberOfLines={numberOfLines ?? undefined}
        clearTextOnFocus={props.clearTextOnFocus ?? formattedText?.length === 0}
        onBlur={props.toggleEditor}
        onChangeText={onChange}
        onSelectionChange={handleSelectionChange}
        editable={props.editable}
        onPressIn={props.onPressIn}
        onPressOut={props.onPressOut}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
      >
        {formattedText?.length > 0 ? (
          <Text style={[styles.formmatedText, editorStyles.inputMaskText]}>
            {formattedText}
          </Text>
        ) : null}
      </TextInput>
    </View>
  );
}

CustomTextInput.defaultProps = {
  inputRef: {
    current: {},
  },
};