import React, { useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './styles';
import CreateVehicleModal from '../CarrierProjectSetupScreen/modals/vehicleModal/CreateVehicleModal/CreateVehicleModal';
import SelectExistingVehicleModal from '../CarrierProjectSetupScreen/modals/vehicleModal/SelectExistingVehicleModal/SelectExistingVehicleModal';
import useUpdateProjectResources from '../../../hooks/carrier/useUpdateProjectResources';
import useProjectResources from '../../../hooks/carrier/useProjectResources';

const getVehicleLabel = (item: any) => {
  const primary =
    item?.number?.trim() ||
    item?.name?.trim() ||
    item?.licensePlate?.trim() ||
    item?.id ||
    '-';

  const secondary = item?.licensePlate?.trim();

  if (secondary && secondary !== primary) {
    return `${primary} • ${secondary}`;
  }

  return primary;
};

const getVehicleMeta = (item: any) => {
  const metaParts = [item?.make, item?.model, item?.year].filter(Boolean);

  if (metaParts.length > 0) {
    return metaParts.join(' • ');
  }

  return item?.operationalStatus || 'pending';
};

const ResourceCard = ({
  item,
  onRemove,
}: {
  item: any;
  onRemove: () => void;
}) => {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  return (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{getVehicleLabel(item)}</Text>
        <Text style={styles.cardMeta}>{getVehicleMeta(item)}</Text>
      </View>

      <Pressable style={styles.removeButton} onPress={onRemove}>
        <MaterialCommunityIcons
          name="trash-can-outline"
          size={20}
          color={theme.colors[appearance].danger}
        />
      </Pressable>
    </View>
  );
};

const ProjectResourcesScreen = ({ route, navigation }: any) => {
  const { project } = route.params || {};

  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const {
    saving,
    addTruckToProject,
    addTrailerToProject,
    removeTruckFromProject,
    removeTrailerFromProject,
  } = useUpdateProjectResources(project?.channelID, project?.id);

  const {
    trucks,
    trailers,
    loading,
  } = useProjectResources(project?.channelID, project?.id);

  const [showCreateTruckModal, setShowCreateTruckModal] = useState(false);
  const [showCreateTrailerModal, setShowCreateTrailerModal] = useState(false);
  const [showSelectTruckModal, setShowSelectTruckModal] = useState(false);
  const [showSelectTrailerModal, setShowSelectTrailerModal] = useState(false);

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

    navigation.setOptions({
      headerShown: true,
      title: localized('Project Resources'),
      headerBackTitleVisible: false,
      headerStyle: {
        backgroundColor: colors.primaryBackground,
      },
      headerTintColor: colors.primaryText,
    });
  }, [navigation, localized, theme, appearance]);

  const confirmRemoveTruck = (truck: any) => {
    Alert.alert(
      localized('Remove Truck'),
      localized('Do you want to remove this truck from the project?'),
      [
        { text: localized('Cancel'), style: 'cancel' },
        {
          text: localized('Remove'),
          style: 'destructive',
          onPress: () => removeTruckFromProject(truck.id),
        },
      ],
    );
  };

  const confirmRemoveTrailer = (trailer: any) => {
    Alert.alert(
      localized('Remove Trailer'),
      localized('Do you want to remove this trailer from the project?'),
      [
        { text: localized('Cancel'), style: 'cancel' },
        {
          text: localized('Remove'),
          style: 'destructive',
          onPress: () => removeTrailerFromProject(trailer.id),
        },
      ],
    );
  };

  const renderSectionHeader = (
    title: string,
    onAddNew: () => void,
    onSelectExisting: () => void,
  ) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.headerActions}>
        <Pressable style={styles.secondaryAction} onPress={onSelectExisting}>
          <Text style={styles.secondaryActionText}>
            {localized('Select Existing')}
          </Text>
        </Pressable>

        <Pressable style={styles.primaryAction} onPress={onAddNew}>
          <MaterialCommunityIcons
            name="plus-circle-outline"
            size={18}
            color={theme.colors[appearance].buttonText}
          />
          <Text style={styles.primaryActionText}>{localized('Add New')}</Text>
        </Pressable>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors[appearance].primaryForeground}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={[{ key: 'trucks' }, { key: 'trailers' }]}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.contentContainer}
        renderItem={({ item }) => {
          if (item.key === 'trucks') {
            return (
              <View style={styles.section}>
                {renderSectionHeader(
                  localized('Trucks'),
                  () => setShowCreateTruckModal(true),
                  () => setShowSelectTruckModal(true),
                )}

                {trucks.length > 0 ? (
                  trucks.map((truck: any) => (
                    <ResourceCard
                      key={truck.id}
                      item={truck}
                      onRemove={() => confirmRemoveTruck(truck)}
                    />
                  ))
                ) : (
                  <Text style={styles.emptyText}>
                    {localized('No trucks assigned')}
                  </Text>
                )}
              </View>
            );
          }

          return (
            <View style={styles.section}>
              {renderSectionHeader(
                localized('Trailers'),
                () => setShowCreateTrailerModal(true),
                () => setShowSelectTrailerModal(true),
              )}

              {trailers.length > 0 ? (
                trailers.map((trailer: any) => (
                  <ResourceCard
                    key={trailer.id}
                    item={trailer}
                    onRemove={() => confirmRemoveTrailer(trailer)}
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>
                  {localized('No trailers assigned')}
                </Text>
              )}
            </View>
          );
        }}
      />

      <CreateVehicleModal
        visible={showCreateTruckModal}
        onClose={() => setShowCreateTruckModal(false)}
        vendorID={project?.vendorID}
        type="Truck"
        onCreated={async (created) => {
          await addTruckToProject(created);
          setShowCreateTruckModal(false);
        }}
      />

      <CreateVehicleModal
        visible={showCreateTrailerModal}
        onClose={() => setShowCreateTrailerModal(false)}
        vendorID={project?.vendorID}
        type="Trailer"
        onCreated={async (created) => {
          await addTrailerToProject(created);
          setShowCreateTrailerModal(false);
        }}
      />

      <SelectExistingVehicleModal
        visible={showSelectTruckModal}
        onClose={() => setShowSelectTruckModal(false)}
        vendorID={project?.vendorID}
        type="Truck"
        excludedIDs={trucks.map((item: any) => item.id)}
        onSelect={async (vehicle) => {
          await addTruckToProject(vehicle);
        }}
      />

      <SelectExistingVehicleModal
        visible={showSelectTrailerModal}
        onClose={() => setShowSelectTrailerModal(false)}
        vendorID={project?.vendorID}
        type="Trailer"
        excludedIDs={trailers.map((item: any) => item.id)}
        onSelect={async (vehicle) => {
          await addTrailerToProject(vehicle);
        }}
      />

      {saving ? (
        <View style={styles.savingBar}>
          <Text style={styles.savingText}>{localized('Saving...')}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default ProjectResourcesScreen;