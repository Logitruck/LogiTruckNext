import React, { useEffect, useMemo } from 'react';
import { View, TextInput, Text } from 'react-native';

import { useTheme, useTranslations } from '../../../../../../core/dopebase';
import { dynamicStepStyles } from './styles';

type RouteItem = {
  id: string;
  origin?: {
    title?: string;
  };
  destination?: {
    title?: string;
  };
  pickupAlias?: string;
  dropoffAlias?: string;
};

type Props = {
  data: any;
  setData: React.Dispatch<React.SetStateAction<any>>;
  onValidationChange: (value: boolean) => void;
};

const getRouteLabel = (
  route: RouteItem,
  localized: (key: string) => string,
  index: number,
) => {
  const originTitle = route?.origin?.title ?? localized('Unknown origin');
  const destinationTitle =
    route?.destination?.title ?? localized('Unknown destination');

  return `${localized('Route')} ${index + 1}: ${originTitle} → ${destinationTitle}`;
};

const SetupStepRoutes = ({
  data,
  setData,
  onValidationChange,
}: Props) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStepStyles(theme, appearance);

  const routes = useMemo<RouteItem[]>(
    () => (Array.isArray(data?.routes) ? data.routes : []),
    [data?.routes],
  );

  useEffect(() => {
    const valid =
      routes.length > 0 &&
      routes.every(
        (route) =>
          String(route?.pickupAlias ?? '').trim() !== '' &&
          String(route?.dropoffAlias ?? '').trim() !== '',
      );

    onValidationChange(valid);
  }, [routes, onValidationChange]);

  const updateRouteField = (
    routeID: string,
    field: 'pickupAlias' | 'dropoffAlias',
    value: string,
  ) => {
    setData((prev: any) => ({
      ...prev,
      routes: Array.isArray(prev?.routes)
        ? prev.routes.map((route: RouteItem) =>
            route.id === routeID ? { ...route, [field]: value } : route,
          )
        : [],
    }));
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.label}>{localized('Routes Setup')}</Text>

      <Text style={styles.helperText}>
        {localized(
          'Define internal aliases for pickup and dropoff locations for each accepted route.',
        )}
      </Text>

      {routes.map((route, index) => (
        <View key={route.id || index} style={styles.routeCard}>
          <Text style={styles.routeTitle}>
            {getRouteLabel(route, localized, index)}
          </Text>

          <Text style={styles.label}>{localized('Pickup Site Alias')}</Text>
          <TextInput
            value={route.pickupAlias ?? ''}
            onChangeText={(value) =>
              updateRouteField(route.id, 'pickupAlias', value)
            }
            style={styles.input}
            placeholder={localized('Ex: Main Warehouse')}
            placeholderTextColor={theme.colors[appearance].secondaryText}
          />

          <Text style={styles.label}>{localized('Dropoff Site Alias')}</Text>
          <TextInput
            value={route.dropoffAlias ?? ''}
            onChangeText={(value) =>
              updateRouteField(route.id, 'dropoffAlias', value)
            }
            style={styles.input}
            placeholder={localized('Ex: Orlando Delivery Point')}
            placeholderTextColor={theme.colors[appearance].secondaryText}
          />
        </View>
      ))}
    </View>
  );
};

export default SetupStepRoutes;