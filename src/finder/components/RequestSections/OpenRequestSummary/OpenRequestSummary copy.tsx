import React from 'react';
import { View, Text } from 'react-native';
import { useTheme, useTranslations } from '../../../../core/dopebase';
import { dynamicStyles } from './OpenRequestSummary.styles';

type OpenRequestSummaryProps = {
  request: any;
  offersCount?: number;
};

const OpenRequestSummary = ({
  request,
  offersCount = 0,
}: OpenRequestSummaryProps) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const startDate = request?.cargo?.startDate
    ? new Date(request.cargo.startDate).toDateString()
    : '—';

  const tollsCount = request?.routeSummary?.tollsCount ?? 0;
  const tollsCost =
    typeof request?.routeSummary?.tollsCostUSD === 'number'
      ? request.routeSummary.tollsCostUSD.toFixed(2)
      : '0.00';

  const dieselPrice =
    typeof request?.dieselPrice === 'number'
      ? request.dieselPrice.toFixed(2)
      : '0.00';

  const suggestedMin = request?.costEstimate?.precioMin ?? '—';
  const suggestedMax = request?.costEstimate?.precioMax ?? '—';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {request?.origin?.title ?? '—'} → {request?.destination?.title ?? '—'}
      </Text>

      <Text style={styles.label}>
        {localized('Date')}: {startDate}
      </Text>

      <Text style={styles.label}>
        {localized('Offers received')}: {offersCount}
      </Text>

      <Text style={styles.label}>
        {localized('Tolls')}: {tollsCount} (${tollsCost})
      </Text>

      <Text style={styles.label}>
        {localized('Average diesel')}: ${dieselPrice}
      </Text>

      <Text style={styles.label}>
        {localized('Suggested range')}: ${suggestedMin} - ${suggestedMax}
      </Text>
    </View>
  );
};

export default OpenRequestSummary;