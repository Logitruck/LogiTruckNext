import React, { useState, useEffect, useRef } from 'react';
import { Text, Platform } from 'react-native';
import CustomTextInput from './CustomTextInput';
import EU from './EditorUtil';
import { mentionStyle } from './styles';

type MentionUser = {
  id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: any;
};

type MentionMapValue = {
  id: string;
  username: string;
};

type RichTextInputProps = {
  initialValue?: string;
  clearInput?: boolean;
  showMentions?: boolean;
  setClearInput?: (value: boolean) => void;
  onUpdateSuggestions: (keyword: string) => void;
  onTrackingStateChange: (tracking: boolean) => void;
  onHideMentions: () => void;
  onChange: (value: { displayText: string; text: string }) => void;
  richTextInputRef: React.MutableRefObject<any>;
  inputRef?: React.MutableRefObject<any>;
  placeholder?: string;
  placeholderTextColor?: string;
  numberOfLines?: number | null;
  multiline?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  editable?: boolean;
  onPressIn?: () => void;
  onPressOut?: () => void;
  autoFocus?: boolean;
  showEditor?: boolean;
  toggleEditor?: () => void;
  editorStyles?: Record<string, any>;
};

function IMRichTextInput(props: RichTextInputProps) {
  const hasTrackingStarted = useRef(false);
  const previousChar = useRef(' ');
  const trigger = useRef('@');
  const menIndex = useRef(0);
  const triggerLocation = useRef('anywhere');
  const mentionsMap = useRef<Map<[number, number], MentionMapValue>>(new Map());

  let msg = '';
  let formattedMsg: any = '';

  if (props.initialValue && props.initialValue !== '') {
    const parsed = EU.getMentionsWithInputText(props.initialValue);
    if (parsed) {
      const { map, newValue } = parsed;
      mentionsMap.current = map;
      msg = newValue;
      formattedMsg = formatText(newValue);
      setTimeout(() => {
        sendMessageToFooter(newValue);
      });
    }
  }

  const inputTextCopy = useRef(msg);

  const [clearInput, setClearInput] = useState(props.clearInput);
  const [inputText, setInputText] = useState(msg);
  const [formattedText, setFormattedText] = useState<any>(formattedMsg);
  const [selection, setSelection] = useState({
    start: 0,
    end: 0,
  });
  const [, setIsTrackingStarted] = useState(false);
  const [showMentions, setShowMentions] = useState(props.showMentions);
  const [, setClearTextOnFocus] = useState(false);

  useEffect(() => {
    if (props.clearInput !== clearInput) {
      setClearInput(props.clearInput);
      return;
    }

    if (props.showMentions && !showMentions) {
      const newInputText = `${inputText}${trigger.current}`;
      setInputText(newInputText);
      setShowMentions(props.showMentions);
      return;
    }

    if (!props.showMentions) {
      setShowMentions(props.showMentions);
      return;
    }
  }, [props.clearInput, clearInput, props.showMentions, showMentions, inputText]);

  useEffect(() => {
    if (inputText !== '' && clearInput) {
      setInputText('');
      inputTextCopy.current = '';
      setFormattedText('');
      props?.setClearInput?.(false);
      mentionsMap.current.clear();
    }
  }, [inputText, clearInput, props]);

  useEffect(() => {
    onChange(inputText, true);
  }, [props.showMentions]);

  const updateMentionsMap = (
    selc: { start: number; end: number },
    count: number,
    shouldAdd: boolean,
  ) => {
    mentionsMap.current = EU.updateRemainingMentionsIndexes(
      mentionsMap.current,
      selc,
      count,
      shouldAdd,
    );
  };

  const startTracking = (mentionIndex: number) => {
    hasTrackingStarted.current = true;
    menIndex.current = mentionIndex;

    setIsTrackingStarted(true);
    props.onUpdateSuggestions('');
    props.onTrackingStateChange(true);
  };

  const stopTracking = () => {
    hasTrackingStarted.current = false;
    setIsTrackingStarted(false);

    props.onTrackingStateChange(false);
    props.onHideMentions();
  };

  const updateSuggestions = (lastKeyword: string) => {
    props.onUpdateSuggestions(lastKeyword);
  };

  const identifyKeyword = (input: string) => {
    if (hasTrackingStarted.current) {
      let pattern: RegExp | null = null;

      if (triggerLocation.current === 'new-word-only') {
        pattern = new RegExp(
          `\\B${trigger.current}[a-z0-9_-]+|\\B${trigger.current}`,
          'gi',
        );
      } else {
        pattern = new RegExp(
          `\\${trigger.current}[a-z0-9_-]+|\\${trigger.current}`,
          'i',
        );
      }

      const str = input.substr(menIndex.current);
      if (!str) {
        return;
      }

      const keywordArray = str.match(pattern) ?? [];
      if (keywordArray.length) {
        const lastKeyword = keywordArray[keywordArray.length - 1];
        updateSuggestions(lastKeyword);
      }
    }
  };

  const checkForMention = (
    input: string,
    selc: { start: number; end: number },
  ) => {
    const mentionIndex = selc.start - 1;
    const lastChar = input.substr(mentionIndex, 1);
    const wordBoundry =
      triggerLocation.current === 'new-word-only'
        ? previousChar.current.trim().length === 0
        : true;

    if (
      lastChar === trigger.current &&
      input.length - 1 === mentionIndex &&
      wordBoundry
    ) {
      startTracking(mentionIndex);
    } else if (lastChar.trim() === '' && hasTrackingStarted.current) {
      stopTracking();
    }

    previousChar.current = lastChar;
    identifyKeyword(input);
  };

  const getInitialAndRemainingStrings = (
    input: string,
    mentionIndex: number,
  ) => {
    let initialStr = input.substr(0, mentionIndex).trim();
    if (!EU.isEmpty(initialStr)) {
      initialStr = `${initialStr} `;
    }

    let remStr =
      input
        .substr(mentionIndex + 1)
        .replace(/\s+/, '\x01')
        .split('\x01')[1] || '';

    const adjMentIndexes = {
      start: initialStr.length - 1,
      end: input.length - remStr.length - 1,
    };

    const mentionKeys = EU.getSelectedMentionKeys(
      mentionsMap.current,
      adjMentIndexes,
    );

    mentionKeys.forEach((key: [number, number]) => {
      remStr = `@${mentionsMap.current.get(key)?.username} ${remStr}`;
    });

    return {
      initialStr,
      remStr,
    };
  };

  const onSuggestionTap = (user: MentionUser) => {
    const { initialStr, remStr } = getInitialAndRemainingStrings(
      inputTextCopy.current,
      menIndex.current,
    );

    const username =
      user.username || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();

    const decoratedUsername = `@${username}`;
    const text = `${initialStr}${decoratedUsername} ${remStr}`;

    const menStartIndex = initialStr.length;
    const menEndIndex = menStartIndex + (decoratedUsername.length - 1);

    mentionsMap.current.set([menStartIndex, menEndIndex], {
      id: String(user.id),
      username,
    });

    const charAdded = Math.abs(text.length - inputTextCopy.current.length);
    updateMentionsMap(
      {
        start: menEndIndex + 1,
        end: text.length,
      },
      charAdded,
      true,
    );

    const newFormattedText = formatText(text);
    setFormattedText(newFormattedText);
    setInputText(text);
    inputTextCopy.current = text;

    stopTracking();
    sendMessageToFooter(text);
  };

  props.richTextInputRef.current = {
    onSuggestionTap: (user: MentionUser) => onSuggestionTap(user),
  };

  const handleSelectionChange = ({
    nativeEvent: { selection: newSelection },
  }: {
    nativeEvent: { selection: { start: number; end: number } };
  }) => {
    const prevSelc = selection;
    let newSelc = { ...newSelection };

    if (newSelc.start !== newSelc.end) {
      newSelc = EU.addMenInSelection(newSelc, prevSelc, mentionsMap.current);
    }

    setSelection(newSelc);

    if (Platform.OS === 'android') {
      checkForMention(inputTextCopy.current, newSelc);
    }
  };

  const formatMentionNode = (txt: string, key: string) => (
    <Text key={key} style={mentionStyle.mention}>
      {txt}
    </Text>
  );

 function formatText(input: string) {
  if (input === '' || !mentionsMap.current.size) return input;

  const newFormattedText: any[] = [];
  let lastIndex = 0;

  mentionsMap.current.forEach((men, [start, end]) => {
    const initialStr = start === 1 ? '' : input.substring(lastIndex, start);
    lastIndex = end + 1;
    newFormattedText.push(initialStr);

    const formattedMention = formatMentionNode(
      `@${men.username}`,
      `${start}-${men.id}-${end}`,
    );
    newFormattedText.push(formattedMention);

    if (
      EU.isKeysAreSame(EU.getLastKeyInMap(mentionsMap.current), [start, end])
    ) {
      const lastStr = input.substr(lastIndex);
      newFormattedText.push(lastStr);
    }
  });

  return newFormattedText;
}


  const formatTextWithMentions = (input: string) => {
    if (input === '' || !mentionsMap.current.size) return input;

    let newFormattedText = '';
    let lastIndex = 0;

    mentionsMap.current.forEach((men, [start, end]) => {
      const initialStr = start === 1 ? '' : input.substring(lastIndex, start);
      lastIndex = end + 1;
      newFormattedText = newFormattedText.concat(initialStr);
      newFormattedText = newFormattedText.concat(`@[${men.username}](id:${men.id})`);

      if (
        EU.isKeysAreSame(EU.getLastKeyInMap(mentionsMap.current), [start, end])
      ) {
        const lastStr = input.substr(lastIndex);
        newFormattedText = newFormattedText.concat(lastStr);
      }
    });

    return newFormattedText;
  };

  const sendMessageToFooter = (text: string) => {
    props.onChange({
      displayText: text,
      text: formatTextWithMentions(text),
    });
  };

  const onChange = (input: string, fromAtBtn?: boolean) => {
    let text = input;
    const prevText = inputText;
    const selectionCopy = { ...selection };

    if (fromAtBtn) {
      selectionCopy.start = selectionCopy.start + 1;
      selectionCopy.end = selectionCopy.end + 1;
    }

    if (text.length < prevText.length) {
      let charDeleted = Math.abs(text.length - prevText.length);
      const totalSelection = {
        start: selectionCopy.start,
        end:
          charDeleted > 1
            ? selectionCopy.start + charDeleted
            : selectionCopy.start,
      };

      if (totalSelection.start === totalSelection.end) {
        const key = EU.findMentionKeyInMap(
          mentionsMap.current,
          totalSelection.start,
        );

        if (key && key.length) {
          const initial = text.substring(0, key[0]);
          text = initial + text.substr(key[1]);
          charDeleted = charDeleted + Math.abs(key[0] - key[1]);
          mentionsMap.current.delete(key);
        }
      } else {
        const mentionKeys = EU.getSelectedMentionKeys(
          mentionsMap.current,
          totalSelection,
        );
        mentionKeys.forEach((key: [number, number]) => {
          mentionsMap.current.delete(key);
        });
      }

      updateMentionsMap(
        {
          start: selectionCopy.end,
          end: prevText.length,
        },
        charDeleted,
        false,
      );
    } else {
      const charAdded = Math.abs(text.length - prevText.length);

      updateMentionsMap(
        {
          start: selectionCopy.end,
          end: text.length,
        },
        charAdded,
        true,
      );

      if (selectionCopy.start === selectionCopy.end) {
        const key = EU.findMentionKeyInMap(
          mentionsMap.current,
          selectionCopy.start - 1,
        );
        if (key && key.length) {
          mentionsMap.current.delete(key);
        }
      }
    }

    const newFormattedText = formatText(text);

    setFormattedText(newFormattedText);
    setInputText(text);
    inputTextCopy.current = text;

    checkForMention(text, selectionCopy);
    sendMessageToFooter(text);
  };

  const { editorStyles = {} } = props;
  if (!props.showEditor) return null;

  return (
    <CustomTextInput
      inputRef={props.inputRef}
      editorStyles={editorStyles}
      formattedText={formattedText}
      placeholder={props?.placeholder}
      placeholderTextColor={props.placeholderTextColor}
      inputText={inputText}
      numberOfLines={props.numberOfLines}
      multiline={props.multiline}
      onFocus={props.onFocus}
      clearTextOnFocus={false}
      autoFocus={props.autoFocus}
      toggleEditor={props.onBlur}
      onChange={onChange}
      editable={props.editable}
      onPressIn={props.onPressIn}
      onPressOut={props.onPressOut}
      handleSelectionChange={handleSelectionChange}
    />
  );
}

IMRichTextInput.defaultProps = {
  richTextInputRef: { current: {} },
};

export default IMRichTextInput;