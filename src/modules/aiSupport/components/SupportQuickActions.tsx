import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { useTheme } from '../../../core/dopebase';
import dynamicStyles from '../screens/SupportAssistantScreen/styles';
import { SupportQuickAction } from '../types';

type Props = {
  actions: SupportQuickAction[];
  onPressAction: (prompt: string) => void;
};

const SupportQuickActions = ({ actions, onPressAction }: Props) => {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.quickActionsContainer}
    >
      {actions.map(action => (
        <Pressable
          key={action.id}
          style={styles.quickActionChip}
          onPress={() => onPressAction(action.prompt)}
        >
          <Text style={styles.quickActionText}>{action.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
};

export default SupportQuickActions;