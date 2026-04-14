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
import CreatePersonnelModal from '../CarrierProjectSetupScreen/modals/CreatePersonnelModal/CreatePersonnelModal';
import SelectExistingPersonnelModal from '../CarrierProjectSetupScreen/modals/CreatePersonnelModal/SelectExistingPersonnelModal';
import useProjectPersonnel from '../../../hooks/carrier/useProjectPersonnel';
import useUpdateProjectPersonnel from '../../../hooks/carrier/useUpdateProjectPersonnel';

const getPersonLabel = (person: any) =>
  `${person?.firstName || ''} ${person?.lastName || ''}`.trim() ||
  person?.email ||
  person?.id ||
  '-';

const getPersonMeta = (person: any) =>
  person?.email || person?.phoneNumber || person?.status || '-';

const PersonCard = ({
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
        <Text style={styles.cardTitle}>{getPersonLabel(item)}</Text>
        <Text style={styles.cardMeta}>{getPersonMeta(item)}</Text>
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

const ProjectPersonnelScreen = ({ route, navigation }: any) => {
  const { project } = route.params || {};

  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const {
    drivers,
    dispatchers,
    loading,
  } = useProjectPersonnel(project?.channelID, project?.id);

  const {
    saving,
    addDriverToProject,
    addDispatcherToProject,
    removeDriverFromProject,
    removeDispatcherFromProject,
  } = useUpdateProjectPersonnel(project?.channelID, project?.id);

  const [showCreateDriverModal, setShowCreateDriverModal] = useState(false);
  const [showCreateDispatcherModal, setShowCreateDispatcherModal] = useState(false);
  const [showSelectDriverModal, setShowSelectDriverModal] = useState(false);
  const [showSelectDispatcherModal, setShowSelectDispatcherModal] = useState(false);

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

    navigation.setOptions({
      headerShown: true,
      title: localized('Project Personnel'),
      headerBackTitleVisible: false,
      headerStyle: {
        backgroundColor: colors.primaryBackground,
      },
      headerTintColor: colors.primaryText,
    });
  }, [navigation, localized, theme, appearance]);

  const confirmRemoveDriver = (driver: any) => {
    Alert.alert(
      localized('Remove Driver'),
      localized('Do you want to remove this driver from the project?'),
      [
        { text: localized('Cancel'), style: 'cancel' },
        {
          text: localized('Remove'),
          style: 'destructive',
          onPress: () => removeDriverFromProject(driver.id),
        },
      ],
    );
  };

  const confirmRemoveDispatcher = (dispatcher: any) => {
    Alert.alert(
      localized('Remove Dispatcher'),
      localized('Do you want to remove this dispatcher from the project?'),
      [
        { text: localized('Cancel'), style: 'cancel' },
        {
          text: localized('Remove'),
          style: 'destructive',
          onPress: () => removeDispatcherFromProject(dispatcher.id),
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
        data={[{ key: 'drivers' }, { key: 'dispatchers' }]}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.contentContainer}
        renderItem={({ item }) => {
          if (item.key === 'drivers') {
            return (
              <View style={styles.section}>
                {renderSectionHeader(
                  localized('Drivers'),
                  () => setShowCreateDriverModal(true),
                  () => setShowSelectDriverModal(true),
                )}

                {drivers.length > 0 ? (
                  drivers.map((driver: any) => (
                    <PersonCard
                      key={driver.id}
                      item={driver}
                      onRemove={() => confirmRemoveDriver(driver)}
                    />
                  ))
                ) : (
                  <Text style={styles.emptyText}>
                    {localized('No drivers assigned')}
                  </Text>
                )}
              </View>
            );
          }

          return (
            <View style={styles.section}>
              {renderSectionHeader(
                localized('Dispatchers'),
                () => setShowCreateDispatcherModal(true),
                () => setShowSelectDispatcherModal(true),
              )}

              {dispatchers.length > 0 ? (
                dispatchers.map((dispatcher: any) => (
                  <PersonCard
                    key={dispatcher.id}
                    item={dispatcher}
                    onRemove={() => confirmRemoveDispatcher(dispatcher)}
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>
                  {localized('No dispatchers assigned')}
                </Text>
              )}
            </View>
          );
        }}
      />

      <CreatePersonnelModal
        visible={showCreateDriverModal}
        onClose={() => setShowCreateDriverModal(false)}
        vendorID={project?.vendorID}
        role="driver"
        onCreated={async (created) => {
          await addDriverToProject(created);
          setShowCreateDriverModal(false);
        }}
      />

      <CreatePersonnelModal
        visible={showCreateDispatcherModal}
        onClose={() => setShowCreateDispatcherModal(false)}
        vendorID={project?.vendorID}
        role="dispatch"
        onCreated={async (created) => {
          await addDispatcherToProject(created);
          setShowCreateDispatcherModal(false);
        }}
      />

      <SelectExistingPersonnelModal
        visible={showSelectDriverModal}
        onClose={() => setShowSelectDriverModal(false)}
        vendorID={project?.vendorID}
        type="driver"
        excludedIDs={drivers.map((item: any) => item.id)}
        onSelect={async (person) => {
          await addDriverToProject(person);
        }}
      />

      <SelectExistingPersonnelModal
        visible={showSelectDispatcherModal}
        onClose={() => setShowSelectDispatcherModal(false)}
        vendorID={project?.vendorID}
        type="dispatch"
        excludedIDs={dispatchers.map((item: any) => item.id)}
        onSelect={async (person) => {
          await addDispatcherToProject(person);
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

export default ProjectPersonnelScreen;