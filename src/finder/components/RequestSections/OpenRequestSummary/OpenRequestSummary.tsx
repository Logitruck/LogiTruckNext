import React from 'react';
import { View, Text } from 'react-native';
import { useTheme, useTranslations } from '../../../../core/dopebase';
import { dynamicStyles } from './OpenRequestSummary.styles';

type OpenRequestSummaryProps = {
  request: any;
  offersCount?: number;
};

const formatDate = (value?: string) => {
  if (!value) return '—';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';

  return parsed.toDateString();
};

const OpenRequestSummary = ({
  request,
  offersCount = 0,
}: OpenRequestSummaryProps) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const routes = request?.routes || [];
  const firstRoute = routes[0];

  const totalRoutes = request?.totalRoutes || routes.length;

  const totalTrips =
    request?.totalTrips ||
    routes.reduce(
      (sum: number, route: any) => sum + Number(route?.cargo?.trips || 0),
      0
    );

  const startDate = formatDate(firstRoute?.cargo?.startDate);

  const totalTollsCount = routes.reduce(
    (sum: number, route: any) =>
      sum + Number(route?.routeSummary?.tollsCount || 0),
    0
  );

  const totalTollsCost = routes
    .reduce(
      (sum: number, route: any) =>
        sum + Number(route?.routeSummary?.tollsCostUSD || 0),
      0
    )
    .toFixed(2);

  const dieselValues = routes
    .map((route: any) => Number(route?.dieselPrice))
    .filter((value: number) => !Number.isNaN(value) && value > 0);

  const averageDiesel =
    dieselValues.length > 0
      ? (
          dieselValues.reduce((sum: number, value: number) => sum + value, 0) /
          dieselValues.length
        ).toFixed(2)
      : '0.00';

  const suggestedMin = routes.reduce(
    (sum: number, route: any) =>
      sum + Number(route?.costEstimate?.precioMin || 0),
    0
  );

  const suggestedMax = routes.reduce(
    (sum: number, route: any) =>
      sum + Number(route?.costEstimate?.precioMax || 0),
    0
  );

  const title =
    totalRoutes === 1
      ? `${firstRoute?.origin?.title ?? '—'} → ${
          firstRoute?.destination?.title ?? '—'
        }`
      : `${firstRoute?.origin?.title ?? '—'} → ${
          firstRoute?.destination?.title ?? '—'
        } + ${totalRoutes - 1} ${localized('more routes')}`;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <Text style={styles.label}>
        {localized('Date')}: {startDate}
      </Text>

      <Text style={styles.label}>
        {localized('Routes')}: {totalRoutes}
      </Text>

      <Text style={styles.label}>
        {localized('Trips')}: {totalTrips}
      </Text>

      <Text style={styles.label}>
        {localized('Offers received')}: {offersCount}
      </Text>

      <Text style={styles.label}>
        {localized('Tolls')}: {totalTollsCount} (${totalTollsCost})
      </Text>

      <Text style={styles.label}>
        {localized('Average diesel')}: ${averageDiesel}
      </Text>

      <Text style={styles.label}>
        {localized('Suggested range')}: ${suggestedMin} - ${suggestedMax}
      </Text>
    </View>
  );
};

export default OpenRequestSummary;