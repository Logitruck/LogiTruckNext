import React, { useEffect, useMemo } from 'react';
import { View, Text, TextInput } from 'react-native';

import { useTheme, useTranslations } from '../../../../../../core/dopebase';
import { dynamicStepStyles } from './styles';

type RouteItem = {
  id: string;
  origin?: { title?: string };
  destination?: { title?: string };
  pickupInstructions?: string;
  dropoffInstructions?: string;
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

const SetupStepInstructions = ({ data, setData, onValidationChange }: Props) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStepStyles(theme, appearance);

  const routes = useMemo<RouteItem[]>(
    () => (Array.isArray(data?.routes) ? data.routes : []),
    [data?.routes],
  );

  useEffect(() => {
    onValidationChange(true);
  }, [onValidationChange]);

  const updateRouteField = (
    routeID: string,
    field: 'pickupInstructions' | 'dropoffInstructions',
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
      <Text style={styles.label}>{localized('Route Instructions')}</Text>

      <Text style={styles.helperText}>
        {localized('Add pickup and dropoff instructions for each accepted route. These fields are optional.')}
      </Text>

      {routes.map((route, index) => (
        <View key={route.id || index} style={styles.routeCard}>
          <Text style={styles.routeTitle}>
            {getRouteLabel(route, localized, index)}
          </Text>

          <Text style={styles.label}>{localized('Pickup Instructions')}</Text>
          <TextInput
            value={route.pickupInstructions ?? ''}
            onChangeText={(value) => updateRouteField(route.id, 'pickupInstructions', value)}
            multiline
            style={[styles.input, styles.textArea]}
            placeholder={localized('Enter pickup instructions')}
            placeholderTextColor={theme.colors[appearance].secondaryText}
          />

          <Text style={styles.label}>{localized('Dropoff Instructions')}</Text>
          <TextInput
            value={route.dropoffInstructions ?? ''}
            onChangeText={(value) => updateRouteField(route.id, 'dropoffInstructions', value)}
            multiline
            style={[styles.input, styles.textArea]}
            placeholder={localized('Enter dropoff instructions')}
            placeholderTextColor={theme.colors[appearance].secondaryText}
          />
        </View>
      ))}
    </View>
  );
};

export default SetupStepInstructions;