import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import { dynamicStyles } from './styles';
import { formatDate } from '../../../../utils/dateUtils';
import PendingVehicleItem from './PendingVehicleItem';

type InspectionStatus = 'Approved' | 'Review' | 'Pending';

const InspectionDetailsScreen = ({ route, navigation }: any) => {
  const { inspections = {}, selectedStatus = 'Pending' } = route.params || {};
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const [currentStatus, setCurrentStatus] =
    useState<InspectionStatus>(selectedStatus);

  const approvedList = Array.isArray(inspections?.approved)
    ? inspections.approved
    : [];

  const reviewList = Array.isArray(inspections?.review)
    ? inspections.review
    : [];

  const pendingList = Array.isArray(inspections?.pending)
    ? inspections.pending
    : [];

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

    navigation.setOptions({
      headerShown: true,
      title: localized('Manage Inspections'),
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
      headerStyle: {
        backgroundColor: colors.primaryBackground,
      },
      headerTintColor: colors.primaryText,
    });
  }, [navigation, localized, theme, appearance]);

  const filteredInspections = useMemo(() => {
    if (currentStatus === 'Approved') {
      return approvedList;
    }

    if (currentStatus === 'Review') {
      return reviewList;
    }

    return pendingList;
  }, [currentStatus, approvedList, reviewList, pendingList]);

  const handleStatusChange = (status: InspectionStatus) => {
    setCurrentStatus(status);
  };

  const renderNonPendingItem = ({ item }: { item: any }) => {
    const formattedDate = item?.lastReportDate
      ? formatDate(item.lastReportDate)
      : localized('No date provided');

    const statusText = item?.statusReport || localized('No status');

    let iconColor = 'gray';

    if (
      statusText === 'Approved' ||
      statusText === 'Approved by Mechanics'
    ) {
      iconColor = 'green';
    } else if (
      statusText === 'Send' ||
      statusText === 'Send for Repair'
    ) {
      iconColor = 'orange';
    }

    const inspectionKey = String(item?.inspectionID || '');
    const parts = inspectionKey.split('_');
    const reportKey = parts[parts.length - 1] || '-';

    const truckOne = item?.trucks?.[0];
    const truckTwo = item?.trucks?.[1];

    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemDetails}>
          <Text style={styles.titleText}>
            {truckOne?.type || localized('Vehicle')} {truckOne?.number || '-'}{' '}
            - {truckTwo?.type || localized('Vehicle')} {truckTwo?.number || '-'}
          </Text>

          <Text style={styles.subtitleText}>
            {localized('Last Inspection')}: {formattedDate}
          </Text>

          <Text style={styles.subtitleText}>
            {localized('Carrier')}: {item?.carrier?.title || 'N/A'}
          </Text>

          <Text style={styles.subtitleText}>
            {localized('Driver')}: {item?.driver?.firstName || 'N/A'}{' '}
            {item?.driver?.lastName || ''}
          </Text>

          <Text style={styles.subtitleText}>
            {localized('Status')}: {statusText}
          </Text>

          <Text style={styles.subtitleText}>
            {localized('Report')}: {reportKey}
          </Text>
        </View>

        <View style={styles.iconContainer}>
          {(statusText === 'Approved' ||
            statusText === 'Approved by Mechanics' ||
            statusText === 'Send' ||
            statusText === 'Send for Repair') && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('ReportView', {
                    vehicleType: item?.type,
                    pdfURL: item?.pdfURL,
                  })
                }
                style={styles.button}
              >
                <MaterialCommunityIcons
                  name="eye-check"
                  color={iconColor}
                  size={36}
                />
                <Text style={styles.boldText}>{localized('Review')}</Text>
              </TouchableOpacity>

              {statusText === 'Send for Repair' && (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('InspectionRepair', {
                      inspectionRef: {
                        vendorID: item?.vendorID,
                        inspectionID: item?.inspectionID,
                        vehicleID: item?.vehicleID || item?.truckID,
                        vehicleType: item?.type,
                      },
                    })
                  }
                  style={styles.button}
                >
                  <MaterialCommunityIcons
                    name="tools"
                    color={iconColor}
                    size={36}
                  />
                  <Text style={styles.boldText}>{localized('Repair')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    if (currentStatus === 'Pending') {
      return <PendingVehicleItem item={item} navigation={navigation} />;
    }

    return renderNonPendingItem({ item });
  };

  return (
    <View style={styles.container}>
      <View style={styles.counterContainer}>
        <TouchableOpacity
          style={[
            styles.counterButton,
            currentStatus === 'Approved' && styles.selectedButton,
          ]}
          onPress={() => handleStatusChange('Approved')}
        >
          <Text style={styles.counterButtonText}>
            {localized('Approved')}
          </Text>
          <Text style={styles.counter}>{approvedList.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.counterButton,
            currentStatus === 'Review' && styles.selectedButton,
          ]}
          onPress={() => handleStatusChange('Review')}
        >
          <Text style={styles.counterButtonText}>
            {localized('Review')}
          </Text>
          <Text style={styles.counter}>{reviewList.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.counterButton,
            currentStatus === 'Pending' && styles.selectedButton,
          ]}
          onPress={() => handleStatusChange('Pending')}
        >
          <Text style={styles.counterButtonText}>
            {localized('Pending')}
          </Text>
          <Text style={styles.counter}>{pendingList.length}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredInspections}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          `${item?.id || item?.inspectionID || 'inspection'}_${index}`
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.titleHeader}>{localized(currentStatus)}</Text>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {localized('No inspections found')}
          </Text>
        }
      />
    </View>
  );
};

export default InspectionDetailsScreen;