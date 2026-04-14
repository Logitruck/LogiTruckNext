import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './styles';
import useProjectRoutes from '../../../hooks/finder/useProjectRoutes';

type Props = {
  route: any;
  navigation: any;
};

const formatCurrency = (value?: number | null): string => {
  const safeValue = Number(value);
  if (!isFinite(safeValue)) return '$0.00';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(safeValue);
};

const ProjectRoutesScreen = ({ route, navigation }: Props) => {
  const { project } = route.params || {};

  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const channelID =
    project?.channelID || `${project?.finderID}_${project?.vendorID}`;

  const projectID = project?.id || project?.requestID;

  const { routes, loading } = useProjectRoutes(channelID, projectID);

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

    navigation.setOptions({
      headerShown: true,
      headerTitle: localized('Project Routes'),
      headerBackTitleVisible: false,
      headerStyle: {
        backgroundColor: colors.primaryBackground,
      },
      headerTintColor: colors.primaryText,
    });
  }, [navigation, appearance, localized, theme]);

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const title =
      item?.pickupAlias?.trim() && item?.dropoffAlias?.trim()
        ? `${item.pickupAlias} → ${item.dropoffAlias}`
        : `${item?.origin?.title || localized('Unknown origin')} → ${
            item?.destination?.title || localized('Unknown destination')
          }`;

    return (
      <Pressable
        style={styles.card}
        onPress={() =>
          navigation.navigate('EditRoute', {
            routeID: item.id,
            project,
            channelID,
            projectID,
          })
        }
      >
        <Text style={styles.cardTitle}>
          {localized('Route')} {index + 1}
        </Text>

        <Text style={styles.cardSubtitle}>{title}</Text>

        <Text style={styles.cardMeta}>
          {localized('Trips')}: {item?.tripsOffered ?? item?.cargo?.trips ?? '—'}
        </Text>

        <Text style={styles.cardMeta}>
          {localized('Price per Trip')}: {formatCurrency(item?.pricePerTrip ?? 0)}
        </Text>

        <View style={styles.actionsRow}>
          <MaterialCommunityIcons
            name="pencil"
            size={20}
            color={theme.colors[appearance].primaryText}
          />
          <Text style={styles.editLabel}>{localized('Edit')}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors[appearance].primaryForeground}
          />
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {localized('No routes found.')}
            </Text>
          }
        />
      )}
    </View>
  );
};

export default ProjectRoutesScreen;