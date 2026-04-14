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
import CreatePersonnelModal from '../modals/CreatePersonnelModal/CreatePersonnelModal';

type PersonnelItem = {
  id: string;
  userID?: string;
  usersID?: string;
  vendorID?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  rolesArray?: string[];
  status?: string;
  [key: string]: any;
};

type Props = {
  data: any;
  setData: React.Dispatch<React.SetStateAction<any>>;
  onValidationChange: (value: boolean) => void;
};

const cleanPerson = (person: PersonnelItem) => ({
  id: person.id,
  userID: person.userID || person.usersID || person.id || '',
  usersID: person.usersID || person.userID || person.id || '',
  vendorID: person.vendorID || '',
  firstName: person.firstName || '',
  lastName: person.lastName || '',
  phoneNumber: person.phoneNumber || '',
  email: person.email || '',
  rolesArray: Array.isArray(person.rolesArray) ? person.rolesArray : [],
  status: person.status || 'active',
});

const getPersonLabel = (person: PersonnelItem) =>
  `${person.firstName || ''} ${person.lastName || ''}`.trim() ||
  person.email ||
  person.id;

const SetupStepPersonnel = ({
  data,
  setData,
  onValidationChange,
}: Props) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStepStyles(theme, appearance);

  const vendorID = data?.vendorID || '';
  const { drivers, dispatchers, refresh } = useCarrierResources(vendorID);
 console.log('vendorID',vendorID)
  const initialDrivers = useMemo<PersonnelItem[]>(
    () =>
      Array.isArray(data?.carrierPersonnel?.drivers)
        ? data.carrierPersonnel.drivers
        : [],
    [data?.carrierPersonnel?.drivers],
  );

  const initialDispatchers = useMemo<PersonnelItem[]>(
    () =>
      Array.isArray(data?.carrierPersonnel?.dispatchers)
        ? data.carrierPersonnel.dispatchers
        : [],
    [data?.carrierPersonnel?.dispatchers],
  );

  const [selectedDrivers, setSelectedDrivers] = useState<PersonnelItem[]>(
    initialDrivers,
  );
  const [selectedDispatchers, setSelectedDispatchers] = useState<PersonnelItem[]>(
    initialDispatchers,
  );

  const [showDriversSheet, setShowDriversSheet] = useState(false);
  const [showDispatchersSheet, setShowDispatchersSheet] = useState(false);

  const [showCreateDriverModal, setShowCreateDriverModal] = useState(false);
  const [showCreateDispatcherModal, setShowCreateDispatcherModal] =
    useState(false);

  useEffect(() => {
    const prevSerialized = JSON.stringify(selectedDrivers.map(cleanPerson));
    const nextSerialized = JSON.stringify(initialDrivers.map(cleanPerson));

    if (prevSerialized !== nextSerialized) {
      setSelectedDrivers(initialDrivers);
    }
  }, [initialDrivers]);

  useEffect(() => {
    const prevSerialized = JSON.stringify(selectedDispatchers.map(cleanPerson));
    const nextSerialized = JSON.stringify(initialDispatchers.map(cleanPerson));

    if (prevSerialized !== nextSerialized) {
      setSelectedDispatchers(initialDispatchers);
    }
  }, [initialDispatchers]);

  useEffect(() => {
    const valid =
      selectedDrivers.length > 0 && selectedDispatchers.length > 0;

    onValidationChange(valid);
  }, [selectedDrivers.length, selectedDispatchers.length, onValidationChange]);

  useEffect(() => {
    const nextPersonnel = {
      ...(data?.carrierPersonnel || {}),
      drivers: selectedDrivers.map(cleanPerson),
      dispatchers: selectedDispatchers.map(cleanPerson),
    };

    setData((prev: any) => {
      const prevPersonnel = prev?.carrierPersonnel || {};
      const prevSerialized = JSON.stringify(prevPersonnel);
      const nextSerialized = JSON.stringify(nextPersonnel);

      if (prevSerialized === nextSerialized) {
        return prev;
      }

      return {
        ...prev,
        carrierPersonnel: nextPersonnel,
      };
    });
  }, [selectedDrivers, selectedDispatchers, setData]);

  const renderSelectedItem = (
    item: PersonnelItem,
    setList: React.Dispatch<React.SetStateAction<PersonnelItem[]>>,
  ) => {
    const label = getPersonLabel(item);

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
            name="account"
            size={20}
            style={styles.sectionIcon}
          />
          <Text style={styles.listTitle}>{localized('Assigned Drivers')}</Text>
        </View>

        <Pressable
          style={styles.selectorButton}
          onPress={() => setShowDriversSheet(true)}
        >
          <Text style={styles.selectorButtonText}>
            {selectedDrivers.length > 0
              ? `${selectedDrivers.length} ${localized('selected')}`
              : localized('Select Drivers')}
          </Text>

          <MaterialCommunityIcons
            name="chevron-down"
            size={20}
            color={theme.colors[appearance].primaryText}
          />
        </Pressable>

        <Pressable
          style={styles.addNewButton}
          onPress={() => setShowCreateDriverModal(true)}
        >
          <MaterialCommunityIcons
            name="plus-circle-outline"
            size={18}
            color={theme.colors[appearance].primaryForeground}
          />
          <Text style={styles.addNewText}>{localized('Add new driver')}</Text>
        </Pressable>

        {selectedDrivers.length > 0 && (
          <FlatList
            data={selectedDrivers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) =>
              renderSelectedItem(item, setSelectedDrivers)
            }
            scrollEnabled={false}
          />
        )}
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="account-group"
            size={20}
            style={styles.sectionIcon}
          />
          <Text style={styles.listTitle}>
            {localized('Assigned Dispatchers')}
          </Text>
        </View>

        <Pressable
          style={styles.selectorButton}
          onPress={() => setShowDispatchersSheet(true)}
        >
          <Text style={styles.selectorButtonText}>
            {selectedDispatchers.length > 0
              ? `${selectedDispatchers.length} ${localized('selected')}`
              : localized('Select Dispatchers')}
          </Text>

          <MaterialCommunityIcons
            name="chevron-down"
            size={20}
            color={theme.colors[appearance].primaryText}
          />
        </Pressable>

        <Pressable
          style={styles.addNewButton}
          onPress={() => setShowCreateDispatcherModal(true)}
        >
          <MaterialCommunityIcons
            name="plus-circle-outline"
            size={18}
            color={theme.colors[appearance].primaryForeground}
          />
          <Text style={styles.addNewText}>
            {localized('Add new dispatcher')}
          </Text>
        </Pressable>

        {selectedDispatchers.length > 0 && (
          <FlatList
            data={selectedDispatchers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) =>
              renderSelectedItem(item, setSelectedDispatchers)
            }
            scrollEnabled={false}
          />
        )}
      </View>

      <Modal visible={showDriversSheet} animationType="slide">
        <MultiSelectSheet
          title={localized('Select Drivers')}
          items={drivers}
          selectedItems={selectedDrivers}
          onClose={() => setShowDriversSheet(false)}
          getLabel={(driver) => getPersonLabel(driver)}
          onConfirm={(items) => {
            setSelectedDrivers(items);
            setShowDriversSheet(false);
          }}
        />
      </Modal>

      <Modal visible={showDispatchersSheet} animationType="slide">
        <MultiSelectSheet
          title={localized('Select Dispatchers')}
          items={dispatchers}
          selectedItems={selectedDispatchers}
          onClose={() => setShowDispatchersSheet(false)}
          getLabel={(dispatcher) => getPersonLabel(dispatcher)}
          onConfirm={(items) => {
            setSelectedDispatchers(items);
            setShowDispatchersSheet(false);
          }}
        />
      </Modal>

      <CreatePersonnelModal
        visible={showCreateDriverModal}
        onClose={() => setShowCreateDriverModal(false)}
        vendorID={vendorID}
        role="driver"
        onCreated={async (created) => {
          await refresh();
          setSelectedDrivers((prev) => {
            const exists = prev.some((item) => item.id === created.id);
            return exists ? prev : [...prev, created];
          });
        }}
      />

      <CreatePersonnelModal
        visible={showCreateDispatcherModal}
        onClose={() => setShowCreateDispatcherModal(false)}
        vendorID={vendorID}
        role="dispatch"
        onCreated={async (created) => {
          await refresh();
          setSelectedDispatchers((prev) => {
            const exists = prev.some((item) => item.id === created.id);
            return exists ? prev : [...prev, created];
          });
        }}
      />
    </View>
  );
};

export default SetupStepPersonnel;