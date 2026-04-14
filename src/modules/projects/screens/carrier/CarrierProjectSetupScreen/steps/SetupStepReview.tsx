import React from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
} from 'react-native';

import { useTheme, useTranslations } from '../../../../../../core/dopebase';
import { dynamicStepStyles } from './styles';
import useSaveProjectData from '../../../../hooks/shared/useSaveProjectData';

type ResourceItem = {
  id: string;
  name?: string;
  licensePlate?: string;
};

type PersonnelItem = {
  id: string;
  firstName?: string;
  lastName?: string;
};

type Props = {
  data: any;
  navigation: any;
};

const SetupStepReview = ({ data, navigation }: Props) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStepStyles(theme, appearance);

  const { markSetupFlag } = useSaveProjectData();

  const handleConfirm = async () => {
    try {
      await markSetupFlag({
        channelID: data.channelID,
        projectID: data.id,
        role: 'carrier',
      });

      navigation.navigate('ProjectsHome');
    } catch (error) {
      Alert.alert(
        localized('Error'),
        localized('Could not confirm the project.'),
      );
      console.error('🔥 Error confirming project:', error);
    }
  };

  const trucks: ResourceItem[] = Array.isArray(data?.carrierResources?.trucks)
    ? data.carrierResources.trucks
    : [];

  const trailers: ResourceItem[] = Array.isArray(data?.carrierResources?.trailers)
    ? data.carrierResources.trailers
    : [];

  const drivers: PersonnelItem[] = Array.isArray(data?.carrierPersonnel?.drivers)
    ? data.carrierPersonnel.drivers
    : [];

  const dispatchers: PersonnelItem[] = Array.isArray(data?.carrierPersonnel?.dispatchers)
    ? data.carrierPersonnel.dispatchers
    : [];

  const rawStartDate = data?.carrierAvailability?.startDate;
  const startDate = rawStartDate
    ? new Date(rawStartDate).toLocaleDateString()
    : '-';

  const tripsPerDay =
    data?.carrierAvailability?.tripsPerDay != null
      ? String(data.carrierAvailability.tripsPerDay)
      : '-';

  const notes = data?.carrierNotes || '-';

  const formatVehicleList = (items: ResourceItem[]) => {
    if (!items.length) return ['-'];

    return items.map((item) => {
      return item.name || item.licensePlate || item.id || '-';
    });
  };

  const formatPersonnelList = (items: PersonnelItem[]) => {
    if (!items.length) return ['-'];

    return items.map((item) => {
      const first = item.firstName || '';
      const last = item.lastName || '';
      return `${first} ${last}`.trim() || item.id || '-';
    });
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>
        {localized('Carrier Setup Summary')}
      </Text>

      <Text style={styles.label}>{localized('Assigned Trucks')}:</Text>
      {formatVehicleList(trucks).map((text, index) => (
        <Text key={`truck-${index}`} style={styles.itemText}>
          {text}
        </Text>
      ))}

      <Text style={styles.label}>{localized('Assigned Trailers')}:</Text>
      {formatVehicleList(trailers).map((text, index) => (
        <Text key={`trailer-${index}`} style={styles.itemText}>
          {text}
        </Text>
      ))}

      <Text style={styles.label}>{localized('Drivers')}:</Text>
      {formatPersonnelList(drivers).map((text, index) => (
        <Text key={`driver-${index}`} style={styles.itemText}>
          {text}
        </Text>
      ))}

      <Text style={styles.label}>{localized('Dispatchers')}:</Text>
      {formatPersonnelList(dispatchers).map((text, index) => (
        <Text key={`dispatcher-${index}`} style={styles.itemText}>
          {text}
        </Text>
      ))}

      <Text style={styles.label}>{localized('Estimated Start')}:</Text>
      <Text style={styles.itemText}>{startDate}</Text>

      <Text style={styles.label}>{localized('Trips per Day')}:</Text>
      <Text style={styles.itemText}>{tripsPerDay}</Text>

      <Text style={styles.label}>{localized('Operational Notes')}:</Text>
      <Text style={styles.itemText}>{notes}</Text>

      <Pressable style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmButtonText}>
          {localized('Confirm Carrier Setup')}
        </Text>
      </Pressable>
    </View>
  );
};

export default SetupStepReview;