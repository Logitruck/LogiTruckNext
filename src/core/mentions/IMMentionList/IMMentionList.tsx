import React from 'react';
import { ActivityIndicator, FlatList, Animated, View } from 'react-native';
import { useTheme } from '../../dopebase';
import IMMentionListItem from '../IMMentionListItem/IMMentionListItem';
import dynamicStyles from './styles';

type MentionItem = {
  id: string;
  name: string;
  [key: string]: any;
};

type IMMentionListProps = {
  list: MentionItem[];
  keyword: string;
  isTrackingStarted: boolean;
  onSuggestionTap?: (item: MentionItem) => void;
  editorStyles?: Record<string, any>;
  containerStyle?: any;
};

export default function IMMentionList(props: IMMentionListProps) {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);
 console.log('IMMentionList')
  const renderSuggestionsRow = ({
    item,
    index,
  }: {
    item: MentionItem;
    index: number;
  }) => {
    return (
      <IMMentionListItem
        key={index.toString()}
        onSuggestionTap={props.onSuggestionTap}
        item={item}
        editorStyles={props.editorStyles}
      />
    );
  };

  const { keyword, isTrackingStarted, list } = props;

  const withoutAtKeyword = (keyword || '').toLowerCase().substr(1, keyword.length);

  const suggestions =
    withoutAtKeyword !== ''
      ? list.filter(user =>
          (user.name || '').toLowerCase().includes(withoutAtKeyword),
        )
      : list;

  const renderEmptyList = () => {
    if (list.length === 0) {
      return null;
    }

    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator />
      </View>
    );
  };

  if (!isTrackingStarted) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.usersMentionContainer,
        props.containerStyle,
      ]}
    >
      <FlatList
        style={styles.usersMentionScrollContainer}
        keyboardShouldPersistTaps="always"
        horizontal={false}
        ListEmptyComponent={renderEmptyList()}
        data={suggestions}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderSuggestionsRow}
      />
    </Animated.View>
  );
}