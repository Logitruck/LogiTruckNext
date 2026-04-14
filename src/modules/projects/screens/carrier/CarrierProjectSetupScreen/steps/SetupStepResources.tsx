import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../../../core/dopebase';
import { dynamicStepStyles } from './styles';
import MultiSelectSheet from '../../../../../../core/components/selectors/MultiSelectSheet';
import useCarrierResources from '../../../../hooks/carrier/useCarrierResources';
import CreateVehicleModal from '../modals/vehicleModal/CreateVehicleModal/CreateVehicleModal';

type ResourceItem = {
  id: string;
  vehicleID?: string;
  type?: 'Truck' | 'Trailer';
  vehicleType?: 'Truck' | 'Trailer';
  number?: string;
  name?: string;
  licensePlate?: string;
  vin?: string | null;
  make?: string | null;
  model?: string | null;
  year?: string | null;
  operationalStatus?: string;
  lastInspectionStatus?: string | null;
  lastInspectionID?: string | null;
  lastInspectionDate?: any;
  currentAssignedDriverID?: string | null;
  hasOpenDefects?: boolean;
  requiresPretrip?: boolean;
  lastInspectionPDF?: string | null;
  [key: string]: any;
};

type Props = {
  data: any;
  setData: React.Dispatch<React.SetStateAction<any>>;
  onValidationChange: (value: boolean) => void;
};

const cleanVehicle = (item: ResourceItem) => ({
  id: item.id,
  vehicleID: item.vehicleID || item.id,
  type: item.type || item.vehicleType || null,
  vehicleType: item.vehicleType || item.type || null,
  number: item.number || '',
  name: item.name || '',
  licensePlate: item.licensePlate || '',
  vin: item.vin || null,
  make: item.make || null,
  model: item.model || null,
  year: item.year || null,
  operationalStatus: item.operationalStatus || 'pending',
  lastInspectionStatus: item.lastInspectionStatus || null,
  lastInspectionID: item.lastInspectionID || null,
  lastInspectionDate: item.lastInspectionDate || null,
  currentAssignedDriverID: item.currentAssignedDriverID || null,
  hasOpenDefects: !!item.hasOpenDefects,
  requiresPretrip: !!item.requiresPretrip,
  lastInspectionPDF: item.lastInspectionPDF || null,
});

const getVehicleLabel = (item: ResourceItem) => {
  const primary =
    item.number?.trim() ||
    item.name?.trim() ||
    item.licensePlate?.trim() ||
    item.id;

  const secondary = item.licensePlate?.trim();

  if (secondary && secondary !== primary) {
    return `${primary} • ${secondary}`;
  }

  return primary;
};

const SetupStepResources = ({
  data,
  setData,
  onValidationChange,
}: Props) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStepStyles(theme, appearance);

  const vendorID = data?.vendorID || '';
  const { trucks, trailers, refresh } = useCarrierResources(vendorID);

  const initialTrucks = useMemo<ResourceItem[]>(
    () =>
      Array.isArray(data?.carrierResources?.trucks)
        ? data.carrierResources.trucks
        : [],
    [data?.carrierResources?.trucks],
  );

  const initialTrailers = useMemo<ResourceItem[]>(
    () =>
      Array.isArray(data?.carrierResources?.trailers)
        ? data.carrierResources.trailers
        : [],
    [data?.carrierResources?.trailers],
  );

  const [selectedTrucks, setSelectedTrucks] = useState<ResourceItem[]>(initialTrucks);
  const [selectedTrailers, setSelectedTrailers] = useState<ResourceItem[]>(initialTrailers);

  const [showTrucksSheet, setShowTrucksSheet] = useState(false);
  const [showTrailersSheet, setShowTrailersSheet] = useState(false);

  const [showCreateTruckModal, setShowCreateTruckModal] = useState(false);
  const [showCreateTrailerModal, setShowCreateTrailerModal] = useState(false);

  useEffect(() => {
    const prevSerialized = JSON.stringify(selectedTrucks.map(cleanVehicle));
    const nextSerialized = JSON.stringify(initialTrucks.map(cleanVehicle));

    if (prevSerialized !== nextSerialized) {
      setSelectedTrucks(initialTrucks);
    }
  }, [initialTrucks]);

  useEffect(() => {
    const prevSerialized = JSON.stringify(selectedTrailers.map(cleanVehicle));
    const nextSerialized = JSON.stringify(initialTrailers.map(cleanVehicle));

    if (prevSerialized !== nextSerialized) {
      setSelectedTrailers(initialTrailers);
    }
  }, [initialTrailers]);

  useEffect(() => {
    const isValid = selectedTrucks.length > 0;
    onValidationChange(isValid);
  }, [selectedTrucks.length, onValidationChange]);

  useEffect(() => {
    const nextResources = {
      ...(data?.carrierResources || {}),
      trucks: selectedTrucks.map(cleanVehicle),
      trailers: selectedTrailers.map(cleanVehicle),
    };

    setData((prev: any) => {
      const prevResources = prev?.carrierResources || {};
      const prevSerialized = JSON.stringify(prevResources);
      const nextSerialized = JSON.stringify(nextResources);

      if (prevSerialized === nextSerialized) {
        return prev;
      }

      return {
        ...prev,
        carrierResources: nextResources,
      };
    });
  }, [selectedTrucks, selectedTrailers, setData]);

  const renderSelectedItem = (
    item: ResourceItem,
    setList: React.Dispatch<React.SetStateAction<ResourceItem[]>>,
  ) => {
    const label = getVehicleLabel(item);

    return (
      <View style={styles.selectedItemContainer}>
        <Text style={styles.selectedItemText}>{label}</Text>

        <TouchableOpacity
          onPress={() =>
            setList((prev) => prev.filter((selected) => selected.id !== item.id))
          }
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={20}
            color={theme.colors[appearance].danger}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.stepContainer}>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="truck"
            size={20}
            style={styles.sectionIcon}
          />
          <Text style={styles.listTitle}>{localized('Assigned Trucks')}</Text>
        </View>

        <Pressable
          style={styles.selectorButton}
          onPress={() => setShowTrucksSheet(true)}
        >
          <Text style={styles.selectorButtonText}>
            {selectedTrucks.length > 0
              ? `${selectedTrucks.length} ${localized('selected')}`
              : localized('Select Trucks')}
          </Text>

          <MaterialCommunityIcons
            name="chevron-down"
            size={20}
            color={theme.colors[appearance].primaryText}
          />
        </Pressable>

        <Pressable
          style={styles.addNewButton}
          onPress={() => setShowCreateTruckModal(true)}
        >
          <MaterialCommunityIcons
            name="plus-circle-outline"
            size={18}
            color={theme.colors[appearance].primaryForeground}
          />
          <Text style={styles.addNewText}>{localized('Add new truck')}</Text>
        </Pressable>

        {selectedTrucks.length > 0 && (
          <FlatList
            data={selectedTrucks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) =>
              renderSelectedItem(item, setSelectedTrucks)
            }
            scrollEnabled={false}
          />
        )}
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="train"
            size={20}
            style={styles.sectionIcon}
          />
          <Text style={styles.listTitle}>{localized('Assigned Trailers')}</Text>
        </View>

        <Pressable
          style={styles.selectorButton}
          onPress={() => setShowTrailersSheet(true)}
        >
          <Text style={styles.selectorButtonText}>
            {selectedTrailers.length > 0
              ? `${selectedTrailers.length} ${localized('selected')}`
              : localized('Select Trailers')}
          </Text>

          <MaterialCommunityIcons
            name="chevron-down"
            size={20}
            color={theme.colors[appearance].primaryText}
          />
        </Pressable>

        <Pressable
          style={styles.addNewButton}
          onPress={() => setShowCreateTrailerModal(true)}
        >
          <MaterialCommunityIcons
            name="plus-circle-outline"
            size={18}
            color={theme.colors[appearance].primaryForeground}
          />
          <Text style={styles.addNewText}>{localized('Add new trailer')}</Text>
        </Pressable>

        {selectedTrailers.length > 0 && (
          <FlatList
            data={selectedTrailers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) =>
              renderSelectedItem(item, setSelectedTrailers)
            }
            scrollEnabled={false}
          />
        )}
      </View>

      <Modal visible={showTrucksSheet} animationType="slide">
        <MultiSelectSheet
          title={localized('Select Trucks')}
          items={trucks}
          selectedItems={selectedTrucks}
          onClose={() => setShowTrucksSheet(false)}
          getLabel={(truck) => getVehicleLabel(truck)}
          onConfirm={(items) => {
            setSelectedTrucks(items);
            setShowTrucksSheet(false);
          }}
        />
      </Modal>

      <Modal visible={showTrailersSheet} animationType="slide">
        <MultiSelectSheet
          title={localized('Select Trailers')}
          items={trailers}
          selectedItems={selectedTrailers}
          onClose={() => setShowTrailersSheet(false)}
          getLabel={(trailer) => getVehicleLabel(trailer)}
          onConfirm={(items) => {
            setSelectedTrailers(items);
            setShowTrailersSheet(false);
          }}
        />
      </Modal>

      <CreateVehicleModal
        visible={showCreateTruckModal}
        onClose={() => setShowCreateTruckModal(false)}
        vendorID={vendorID}
        type="Truck"
        onCreated={async (created) => {
          await refresh();
          setSelectedTrucks((prev) => {
            const exists = prev.some((item) => item.id === created.id);
            return exists ? prev : [...prev, created];
          });
        }}
      />

      <CreateVehicleModal
        visible={showCreateTrailerModal}
        onClose={() => setShowCreateTrailerModal(false)}
        vendorID={vendorID}
        type="Trailer"
        onCreated={async (created) => {
          await refresh();
          setSelectedTrailers((prev) => {
            const exists = prev.some((item) => item.id === created.id);
            return exists ? prev : [...prev, created];
          });
        }}
      />
    </View>
  );
};

export default SetupStepResources;