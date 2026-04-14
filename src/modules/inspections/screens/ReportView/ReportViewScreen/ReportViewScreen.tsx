import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Pdf from 'react-native-pdf';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../../core/dopebase';
import dynamicStyles from './styles';

type ReportViewRouteParams = {
  pdfURL?: string;
  inspectionID?: string;
  vehicleID?: string;
  vehicleType?: 'Truck' | 'Trailer' | string;
  statusReport?: string;
};

const getReadableStatus = (
  statusReport: string | undefined,
  localized: (key: string) => string,
) => {
  switch (statusReport) {
    case 'driver_submitted':
      return localized('Submitted - waiting for review');
    case 'under_review':
      return localized('Under review');
    case 'resolved':
      return localized('Resolved');
    case 'approved_for_operation':
      return localized('Approved for operation');
    case 'blocked_for_operation':
      return localized('Blocked for operation');
    default:
      return localized('Unknown status');
  }
};

const ReportViewScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = (route?.params || {}) as ReportViewRouteParams;

  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const colors = theme.colors[appearance];

  const {
    pdfURL,
    inspectionID,
    vehicleID,
    vehicleType,
    statusReport,
  } = params;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: localized('Inspection Report'),
      headerBackTitleVisible: false,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginLeft: 16 }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.primaryText}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, localized, colors.primaryText]);

  if (!pdfURL) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="file-alert-outline"
          size={42}
          color={colors.secondaryText}
        />
        <Text style={styles.emptyTitle}>
          {localized('Report not available')}
        </Text>
        <Text style={styles.emptyText}>
          {localized('This inspection report does not have a PDF available yet.')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.summaryBox}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{localized('Vehicle')}</Text>
          <Text style={styles.summaryValue}>
            {vehicleType || '—'} {vehicleID ? `• ${vehicleID}` : ''}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{localized('Inspection ID')}</Text>
          <Text style={styles.summaryValue}>{inspectionID || '—'}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{localized('Status')}</Text>
          <Text style={styles.summaryValue}>
            {getReadableStatus(statusReport, localized)}
          </Text>
        </View>
      </View>

      <View style={styles.pdfContainer}>
        <Pdf
          source={{ uri: pdfURL }}
          style={styles.pdf}
          trustAllCerts={false}
          renderActivityIndicator={() => (
            <View style={styles.loaderContainer}>
              <ActivityIndicator
                size="large"
                color={colors.primaryForeground}
              />
              <Text style={styles.infoText}>
                {localized('Loading report...')}
              </Text>
            </View>
          )}
          onError={(error: any) => {
            console.error('❌ Error loading inspection PDF:', error);
          }}
        />
      </View>
    </View>
  );
};

export default ReportViewScreen;