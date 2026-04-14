import React, { memo } from 'react';
import {
  FlatList,
  TouchableOpacity,
  Text,
  View,
  Image,
  ListRenderItem,
} from 'react-native';
import DialogInput from 'react-native-dialog-input';
import {
  useTheme,
  useTranslations,
  ActivityIndicator,
  EmptyStateView,
} from '../../../dopebase';
import IMConversationIconView from '../../IMConversationView/IMConversationIconView/IMConversationIconView';
import dynamicStyles from './styles';

type FriendItem = {
  id?: string;
  userID?: string;
  firstName?: string;
  lastName?: string;
  profilePictureURL?: string;
  checked?: boolean;
  isOnline?: boolean;
  [key: string]: any;
};

type IMCreateGroupComponentProps = {
  onCancel: () => void;
  isNameDialogVisible?: boolean;
  friends?: FriendItem[] | null;
  onSubmitName: (name: string) => void;
  onCheck: (item: FriendItem) => void;
  onEmptyStatePress?: () => void;
  onListEndReached?: () => void;
  isLoading?: boolean;
};

function IMCreateGroupComponent({
  onCancel,
  isNameDialogVisible = false,
  friends,
  onSubmitName,
  onCheck,
  onEmptyStatePress,
  onListEndReached,
  isLoading = false,
}: IMCreateGroupComponentProps) {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const renderItem: ListRenderItem<FriendItem> = ({ item }) => (
    <TouchableOpacity
      onPress={() => onCheck(item)}
      style={styles.itemContainer}
    >
      <View style={styles.chatIconContainer}>
        <IMConversationIconView
          style={styles.photo}
          imageStyle={styles.photo}
          participants={[item]}
        />
        <Text style={styles.name}>{item.firstName}</Text>
      </View>

      <View style={styles.addFlexContainer}>
        {item.checked ? (
          <Image style={styles.checked} source={(theme as any).icons.checked} />
        ) : null}
      </View>

      <View style={styles.divider} />
    </TouchableOpacity>
  );

  const emptyStateConfig = {
    title: localized("You can't create groups"),
    description: localized(
      "You don't have enough friends to create groups. Add at least 2 friends to be able to create groups.",
    ),
    callToAction: localized('Go back'),
    onPress: onEmptyStatePress,
  };

  return (
    <View style={styles.container}>
      {friends && friends.length > 1 ? (
        <FlatList
          data={friends}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.id ?? item.userID ?? index}`}
          initialNumToRender={5}
          removeClippedSubviews={true}
          onEndReached={onListEndReached}
          onEndReachedThreshold={0.3}
          style={styles.listContainer}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />
      ) : null}

      {friends && friends.length <= 1 ? (
        <View style={styles.emptyViewContainer}>
          <EmptyStateView emptyStateConfig={emptyStateConfig} />
        </View>
      ) : null}

      <DialogInput
        isDialogVisible={isNameDialogVisible}
        title={localized('Type group name')}
        hintInput="Group Name"
        textInputProps={{ selectTextOnFocus: true }}
        submitText="OK"
        submitInput={(inputText: string) => {
          onSubmitName(inputText);
        }}
        closeDialog={onCancel}
      />

      {isLoading ? <ActivityIndicator /> : null}
    </View>
  );
}

export default memo(IMCreateGroupComponent);