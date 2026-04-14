import React, { useEffect, useMemo } from 'react';
import { View, Text, TextInput } from 'react-native';

import { useTheme, useTranslations } from '../../../../../../core/dopebase';
import { dynamicStepStyles } from './styles';

type RouteItem = {
  id: string;
  origin?: { title?: string };
  destination?: { title?: string };
  pickupContact?: string;
  dropoffContact?: string;
  [key: string]: any;
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
  const destinationTitle = route?.destination?.title ?? localized('Unknown destination');

  return `${localized('Route')} ${index + 1}: ${originTitle} → ${destinationTitle}`;
};

const SetupStepContacts = ({ data, setData, onValidationChange }: Props) => {
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
          String(route?.pickupContact ?? '').trim() !== '' &&
          String(route?.dropoffContact ?? '').trim() !== '',
      );

    onValidationChange(valid);
  }, [routes, onValidationChange]);

  const updateRouteField = (
    routeID: string,
    field: 'pickupContact' | 'dropoffContact',
    value: string,
  ) => {
    setData((prev: any) => ({
      ...prev,
      routes: prev.routes.map((route: RouteItem) =>
        route.id === routeID ? { ...route, [field]: value } : route,
      ),
    }));
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.label}>{localized('Route Contacts')}</Text>

      <Text style={styles.helperText}>
        {localized('Define pickup and dropoff contacts for each accepted route.')}
      </Text>

      {routes.map((route, index) => (
        <View key={route.id || index} style={styles.routeCard}>
          <Text style={styles.routeTitle}>
            {getRouteLabel(route, localized, index)}
          </Text>

          <Text style={styles.label}>{localized('Pickup Contact')}</Text>
          <TextInput
            value={route.pickupContact ?? ''}
            onChangeText={(value) => updateRouteField(route.id, 'pickupContact', value)}
            style={styles.input}
            placeholder={localized('Enter pickup contact')}
            placeholderTextColor={theme.colors[appearance].secondaryText}
          />

          <Text style={styles.label}>{localized('Dropoff Contact')}</Text>
          <TextInput
            value={route.dropoffContact ?? ''}
            onChangeText={(value) => updateRouteField(route.id, 'dropoffContact', value)}
            style={styles.input}
            placeholder={localized('Enter dropoff contact')}
            placeholderTextColor={theme.colors[appearance].secondaryText}
          />
        </View>
      ))}
    </View>
  );
};

export default SetupStepContacts;