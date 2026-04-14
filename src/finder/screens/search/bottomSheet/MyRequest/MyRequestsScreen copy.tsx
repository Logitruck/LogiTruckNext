import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './MyRequestsScreen.styles';
import useMyRequests from  '../../../../hooks/useMyRequests';

type RequestItem = {
  id: string;
  origin?: {
    title?: string;
  };
  destination?: {
    title?: string;
  };
  cargo?: {
    startDate?: string;
  };
  status?: string;
};

const formatDate = (value?: string) => {
  if (!value) return '—';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';

  return parsed.toDateString();
};

const MyRequestsScreen = () => {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);
  const navigation = useNavigation<any>();

  const currentUserID = useSelector((state: any) => state.auth?.user?.id);
  const { activeRequests, historyRequests, loading } = useMyRequests(currentUserID);

  const renderRequestCard = ({ item }: { item: RequestItem }) => (
    <Pressable
      onPress={() =>

        navigation.navigate("FinderDealsTab", {
          screen: "RequestDetails",
          params: {
            requestID: item.id,
          },
        })
      }
      style={styles.card}
    >
      <Text style={styles.cardTitle}>
        {item.origin?.title ?? localized("Unknown origin")} {"→"}{" "}
        {item.destination?.title ?? localized("Unknown destination")}
      </Text>

      <Text style={styles.cardSubtitle}>
        {localized("Start")}: {formatDate(item.cargo?.startDate)}
      </Text>

      <Text style={styles.cardStatus}>
        {localized("Status")}: {item.status ?? "—"}
      </Text>
    </Pressable>
  );

  const renderSection = (
    title: string,
    data: RequestItem[],
    emptyLabel: string
  ) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            color={theme.colors[appearance].primaryForeground}
          />
        </View>
      ) : data.length > 0 ? (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderRequestCard}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      )}
    </View>
  );

  return (
    <FlatList
      data={[{ key: 'content' }]}
      keyExtractor={(item) => item.key}
      renderItem={() => (
        <View style={styles.container}>
          {renderSection(
            localized('Active Requests'),
            activeRequests ?? [],
            localized('No active requests')
          )}

          {renderSection(
            localized('Request History'),
            historyRequests ?? [],
            localized('No historical requests')
          )}
        </View>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default MyRequestsScreen;