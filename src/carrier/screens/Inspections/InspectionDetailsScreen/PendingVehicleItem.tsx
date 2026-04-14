import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import { dynamicStyles } from './styles';
import { formatDate } from '../../../../utils/dateUtils';

const PendingVehicleItem = ({ item, navigation }: any) => {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const formattedDate = item?.lastReportDate
    ? formatDate(item.lastReportDate)
    : localized('No date provided');

  const vehicleType = item?.type || localized('Vehicle');
  const vehicleNumber = item?.number || '-';

  const vendorName = item?.vendor?.title || 'N/A';

  return (
    <View style={styles.itemContainer}>
      <View style={styles.itemDetails}>
        <Text style={styles.titleText}>
          {vehicleType} {vehicleNumber}
        </Text>

        <Text style={styles.subtitleText}>
          {localized('Vendor')}: {vendorName}
        </Text>

        <Text style={styles.subtitleText}>
          {localized('Last Inspection Date')}: {formattedDate}
        </Text>
      </View>

      <View style={styles.iconContainer}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('ReportView', {
              vehicleType: vehicleType,
              pdfURL: item?.lastInspectionPDF,
            })
          }
          style={styles.button}
        >
          <MaterialCommunityIcons
            name="eye-check"
            color={theme.colors[appearance].secondaryText}
            size={32}
          />
          <Text style={styles.boldText}>{localized('Review')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PendingVehicleItem;