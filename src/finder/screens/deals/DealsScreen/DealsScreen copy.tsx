import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme, useTranslations } from '../../../../core/dopebase';
import { dynamicStyles } from './DealsScreen.styles';
import useDealsByTab from '../../../hooks/useDealsByTab'
import StatusTabs from '../../../../core/components/StatusTabs';
const TABS = [
  { key: 'sending', label: 'Sending', icon: 'send', color: '#e74c3c' },
  { key: 'offered', label: 'Offered', icon: 'tag-outline', color: '#2980b9' },
  { key: 'accepted', label: 'Prep', icon: 'file-document-edit-outline', color: '#27ae60' },
  { key: 'to_sign', label: 'To Sign', icon: 'pen', color: '#8e44ad' },
  { key: 'execution', label: 'Execution', icon: 'play-circle-outline', color: '#f39c12' },
];

const CARD_BACKGROUNDS: Record<string, string> = {
  sending: '#fdecea',
  offered: '#eaf3fc',
  accepted: '#e8f5e9',
  to_sign: '#f3e5f5',
  execution: '#fff7e6',
};

const DealsScreen = () => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const styles = dynamicStyles(theme, appearance);
  const [activeTab, setActiveTab] = useState('sending');

  const { deals, loading, counters } = useDealsByTab(activeTab);

  useEffect(() => {
    if (route.params?.status) {
      const statusExists = TABS.find(tab => tab.key === route.params.status);
      if (statusExists) {
        setActiveTab(route.params.status);
      }
    }
  }, [route.params?.status]);

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

    navigation.setOptions({
      headerShown: true,
      headerTitle: localized('Deals'),
      headerBackTitleVisible: false,
      headerLeft: () => (
        <MaterialCommunityIcons
          name="menu"
          size={24}
          color={colors.primaryText}
          style={{ marginLeft: 16 }}
          onPress={() => navigation.openDrawer()}
        />
      ),
      headerStyle: {
        backgroundColor: colors.primaryBackground,
      },
      headerTintColor: colors.primaryText,
    });
  }, [navigation, appearance]);

  const renderItem = ({ item }: { item: any }) => {
    const backgroundColor =
      CARD_BACKGROUNDS[activeTab] ||
      theme.colors[appearance].secondaryBackground;

    return (
      <Pressable
        style={[styles.card, { backgroundColor }]}
        onPress={() =>
          navigation.navigate('RequestDetails', { requestID: item.id })
        }
      >
        <Text style={styles.cardTitle}>
          {item.origin?.title} → {item.destination?.title}
        </Text>

        <Text style={styles.cardSubtitle}>
          {localized('Status')}: {item.status}
        </Text>

        <Text style={styles.cardMeta}>
          {localized('Start date')}:{' '}
          {item.cargo?.startDate
            ? new Date(item.cargo.startDate).toDateString()
            : '—'}
        </Text>

        {item.offer?.price && (
          <Text style={styles.cardMeta}>
            {localized('Offer')}: ${item.offer.price}
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <StatusTabs
        tabs={TABS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counters={counters}
      />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors[appearance].primaryForeground}
          />
        </View>
      ) : (
        <FlatList
          data={deals}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{localized('No requests')}</Text>
          }
        />
      )}
    </View>
  );
};

export default DealsScreen;