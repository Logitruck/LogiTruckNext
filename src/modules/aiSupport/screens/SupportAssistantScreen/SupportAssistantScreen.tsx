import React, { useLayoutEffect, useMemo, useRef } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import dynamicStyles from './styles';
import { SupportContext, SupportMessage } from '../../types';
import { useSupportAssistant } from '../../hooks/useSupportAssistant';
import SupportMessageBubble from '../../components/SupportMessageBubble';
import SupportComposer from '../../components/SupportComposer';
import SupportQuickActions from '../../components/SupportQuickActions';

const SupportAssistantScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const flatListRef = useRef<FlatList<SupportMessage> | null>(null);

  const context: SupportContext = useMemo(
    () =>
      route?.params?.context || {
        role: 'carrier',
      },
    [route?.params?.context],
  );

  const {
    messages,
    input,
    setInput,
    loading,
    sendMessage,
    quickActions,
  } = useSupportAssistant(context);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: localized('AI Support'),
    });
  }, [navigation, localized]);

  const renderItem = ({ item }: { item: SupportMessage }) => {
    return <SupportMessageBubble message={item} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>
              {localized('Context')}
            </Text>
            <Text style={styles.introSubtitle}>
              {`${localized('Role')}: ${context.role}${
                context.module ? ` • ${localized('Module')}: ${context.module}` : ''
              }${context.screen ? ` • ${localized('Screen')}: ${context.screen}` : ''}`}
            </Text>
          </View>

          <SupportQuickActions
            actions={quickActions}
            onPressAction={sendMessage}
          />

          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />

          {loading ? (
            <Text style={styles.loadingText}>
              {localized('Assistant is thinking...')}
            </Text>
          ) : null}
        </View>

        <SupportComposer
          value={input}
          onChangeText={setInput}
          onSend={() => sendMessage()}
          loading={loading}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SupportAssistantScreen;