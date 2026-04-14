import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../../core/dopebase';
import StatusTabs from '../../../../../core/components/StatusTabs';
import { dynamicStyles } from './styles';
import useProjectDetails from '../../../hooks/shared/useProjectDetails';

type ProjectDetailsParams = {
  project?: any;
  channelID?: string;
  projectID?: string;
  role?: 'finder' | 'carrier';
};

type ProjectTabKey =
  | 'routes'
  | 'jobs'
  | 'resources'
  | 'personnel'
  | 'checklist';

const formatDate = (value?: string) => {
  if (!value) return '-';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';

  return parsed.toDateString();
};

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

const getPersonLabel = (person: any) =>
  `${person?.firstName || ''} ${person?.lastName || ''}`.trim() ||
  person?.email ||
  person?.id ||
  '-';

const ProjectDetailsScreen = () => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const {
    project: initialProject,
    channelID: routeChannelID,
    projectID: routeProjectID,
    role = 'finder',
  } = (route.params || {}) as ProjectDetailsParams;

  const channelID = routeChannelID || initialProject?.channelID;
  const projectID = routeProjectID || initialProject?.id;

  const { project, loading } = useProjectDetails(channelID, projectID);

  const [activeTab, setActiveTab] = useState<ProjectTabKey>('routes');

  const routes = useMemo(
    () => (Array.isArray(project?.routes) ? project.routes : []),
    [project?.routes],
  );

  const totalRoutes = Number(project?.totalRoutes ?? routes.length ?? 0);

  const totalTrips = Number(
    project?.totalTrips ??
      routes.reduce((sum: number, currentRoute: any) => {
        return (
          sum +
          Number(currentRoute?.tripsOffered ?? currentRoute?.cargo?.trips ?? 0)
        );
      }, 0),
  );

  const firstRoute = routes[0] || null;
  const startDate = formatDate(firstRoute?.cargo?.startDate);

  const drivers = Array.isArray(project?.carrierPersonnel?.drivers)
    ? project.carrierPersonnel.drivers
    : [];

  const dispatchers = Array.isArray(project?.carrierPersonnel?.dispatchers)
    ? project.carrierPersonnel.dispatchers
    : [];

  const trucks = Array.isArray(project?.carrierResources?.trucks)
    ? project.carrierResources.trucks
    : [];

  const trailers = Array.isArray(project?.carrierResources?.trailers)
    ? project.carrierResources.trailers
    : [];

  const checklistItems = Array.isArray(project?.checklistItems)
    ? project.checklistItems
    : [];

  const tabs = useMemo(
    () => [
      {
        key: 'routes',
        label: localized('Routes'),
        icon: 'map-marker-path',
        color: '#3498db',
      },
      {
        key: 'jobs',
        label: localized('Jobs'),
        icon: 'clipboard-list-outline',
        color: '#27ae60',
      },
      {
        key: 'resources',
        label: localized('Resources'),
        icon: 'truck-outline',
        color: '#f39c12',
      },
      {
        key: 'personnel',
        label: localized('Personnel'),
        icon: 'account-group-outline',
        color: '#8e44ad',
      },
      {
        key: 'checklist',
        label: localized('Checklist'),
        icon: 'folder-outline',
        color: '#e67e22',
      },
    ],
    [localized],
  );

  const counters = useMemo(
    () => ({
      routes: totalRoutes,
      jobs: totalTrips,
      resources: trucks.length + trailers.length,
      personnel: drivers.length + dispatchers.length,
      checklist: checklistItems.length,
    }),
    [
      totalRoutes,
      totalTrips,
      trucks.length,
      trailers.length,
      drivers.length,
      dispatchers.length,
      checklistItems.length,
    ],
  );

  const getStatusStyle = () => {
    switch (project?.status) {
      case 'setup':
        return styles.setup;
      case 'execution':
        return styles.execution;
      case 'completed':
        return styles.completed;
      case 'cancelled':
        return styles.cancelled;
      default:
        return styles.defaultStatus;
    }
  };

  const handleSetupPress = () => {
    if (role === 'finder') {
      navigation.navigate('ProjectSetup', {
        channelID: project.channelID,
        projectID: project.id,
      });
      return;
    }

    navigation.navigate('ProjectCarrierSetup', {
      channelID: project.channelID,
      projectID: project.id,
    });
  };

  const renderVehiclePreviewList = (items: any[]) => {
    const preview = items.slice(0, 3);
    const remaining = items.length - preview.length;

    return (
      <>
        {preview.map((item: any, index: number) => (
          <Text
            key={`${item?.id || item?.vehicleID || index}`}
            style={styles.value}
          >
            {getVehicleLabel(item)}
          </Text>
        ))}

        {remaining > 0 ? (
          <Text style={styles.moreText}>
            +{remaining} {localized('more')}
          </Text>
        ) : null}
      </>
    );
  };

  const renderPeoplePreviewList = (items: any[]) => {
    const preview = items.slice(0, 3);
    const remaining = items.length - preview.length;

    return (
      <>
        {preview.map((item: any, index: number) => (
          <Text
            key={`${item?.id || item?.userID || index}`}
            style={styles.value}
          >
            {getPersonLabel(item)}
          </Text>
        ))}

        {remaining > 0 ? (
          <Text style={styles.moreText}>
            +{remaining} {localized('more')}
          </Text>
        ) : null}
      </>
    );
  };

  const renderRoutesTab = () => (
    <View style={styles.section}>
      <View style={styles.tabHeaderRow}>
        <Text style={styles.sectionTitle}>{localized('Routes Summary')}</Text>

        <Pressable
          style={styles.inlineActionButton}
          onPress={() => navigation.navigate('ProjectRoutes', { project, role })}
        >
          <Text style={styles.inlineActionText}>{localized('Open')}</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>{localized('Total Routes')}:</Text>
      <Text style={styles.value}>{totalRoutes}</Text>

      <Text style={styles.label}>{localized('Total Trips')}:</Text>
      <Text style={styles.value}>{totalTrips}</Text>

      {routes.length > 0 ? (
        routes.map((currentRoute: any, index: number) => (
          <View key={currentRoute?.id || index} style={styles.routeCard}>
            <Text style={styles.routeTitle}>
              {localized('Route')} {index + 1}
            </Text>

            <Text style={styles.value}>
              {currentRoute?.origin?.title || '-'} →{' '}
              {currentRoute?.destination?.title || '-'}
            </Text>

            <Text style={styles.routeMeta}>
              {localized('Trips')}:{' '}
              {currentRoute?.tripsOffered ?? currentRoute?.cargo?.trips ?? '-'}
            </Text>

            <Text style={styles.routeMeta}>
              {localized('Pickup Alias')}: {currentRoute?.pickupAlias || '-'}
            </Text>

            <Text style={styles.routeMeta}>
              {localized('Dropoff Alias')}: {currentRoute?.dropoffAlias || '-'}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.value}>—</Text>
      )}
    </View>
  );

  const renderJobsTab = () => (
    <View style={styles.section}>
      <View style={styles.tabHeaderRow}>
        <Text style={styles.sectionTitle}>{localized('Jobs')}</Text>

        <Pressable
          style={styles.inlineActionButton}
          onPress={() =>
            navigation.navigate('ProjectJobsList', {
              project,
              role,
              channelID: project.channelID,
              projectID: project.id,
            })
          }
        >
          <Text style={styles.inlineActionText}>
            {role === 'carrier' ? localized('Manage') : localized('Open')}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.label}>{localized('Total Jobs')}:</Text>
      <Text style={styles.value}>{totalTrips}</Text>

      <Text style={styles.label}>{localized('Project Status')}:</Text>
      <Text style={styles.value}>{project?.status || '-'}</Text>

      <Text style={styles.label}>{localized('Current Phase')}:</Text>
      <Text style={styles.value}>
        {project?.status === 'setup'
          ? localized('Setup pending')
          : localized('Execution available')}
      </Text>
    </View>
  );

  const renderResourcesTab = () => (
    <View style={styles.section}>
      <View style={styles.tabHeaderRow}>
        <Text style={styles.sectionTitle}>{localized('Assigned Resources')}</Text>

        {role === 'carrier' ? (
          <Pressable
            style={styles.inlineActionButton}
            onPress={() =>
              navigation.navigate('ProjectResources', {
                projectID: project.id,
                channelID: project.channelID,
                project,
                role,
              })
            }
          >
            <Text style={styles.inlineActionText}>{localized('Manage')}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryPill}>
          <Text style={styles.summaryPillLabel}>{localized('Trucks')}</Text>
          <Text style={styles.summaryPillValue}>{trucks.length}</Text>
        </View>

        <View style={styles.summaryPill}>
          <Text style={styles.summaryPillLabel}>{localized('Trailers')}</Text>
          <Text style={styles.summaryPillValue}>{trailers.length}</Text>
        </View>
      </View>

      <Text style={styles.label}>{localized('Trucks')}:</Text>
      {trucks.length > 0 ? (
        renderVehiclePreviewList(trucks)
      ) : (
        <Text style={styles.value}>—</Text>
      )}

      <Text style={styles.label}>{localized('Trailers')}:</Text>
      {trailers.length > 0 ? (
        renderVehiclePreviewList(trailers)
      ) : (
        <Text style={styles.value}>—</Text>
      )}
    </View>
  );

const renderPersonnelTab = () => (
  <View style={styles.section}>
    <View style={styles.tabHeaderRow}>
      <Text style={styles.sectionTitle}>{localized('Assigned Personnel')}</Text>

      {role === 'carrier' ? (
        <Pressable
          style={styles.inlineActionButton}
          onPress={() =>
            navigation.navigate('ProjectPersonnel', {
              projectID: project.id,
              channelID: project.channelID,
              project,
              role,
            })
          }
        >
          <Text style={styles.inlineActionText}>{localized('Manage')}</Text>
        </Pressable>
      ) : null}
    </View>

    <View style={styles.summaryRow}>
      <View style={styles.summaryPill}>
        <Text style={styles.summaryPillLabel}>{localized('Drivers')}</Text>
        <Text style={styles.summaryPillValue}>{drivers.length}</Text>
      </View>

      <View style={styles.summaryPill}>
        <Text style={styles.summaryPillLabel}>{localized('Dispatchers')}</Text>
        <Text style={styles.summaryPillValue}>{dispatchers.length}</Text>
      </View>
    </View>

    <Text style={styles.label}>{localized('Drivers')}:</Text>
    {drivers.length > 0 ? (
      renderPeoplePreviewList(drivers)
    ) : (
      <Text style={styles.value}>—</Text>
    )}

    <Text style={styles.label}>{localized('Dispatchers')}:</Text>
    {dispatchers.length > 0 ? (
      renderPeoplePreviewList(dispatchers)
    ) : (
      <Text style={styles.value}>—</Text>
    )}
  </View>
);

  const renderChecklistTab = () => (
    <View style={styles.section}>
      <View style={styles.tabHeaderRow}>
        <Text style={styles.sectionTitle}>{localized('Project Checklist')}</Text>

        <Pressable
          style={styles.inlineActionButton}
          onPress={() =>
            navigation.navigate('ProjectChecklist', {
              project,
              role,
              projectID: project.id,
              channelID: project.channelID,
            })
          }
        >
          <Text style={styles.inlineActionText}>
            {role === 'finder' ? localized('Edit') : localized('Open')}
          </Text>
        </Pressable>
      </View>

      {checklistItems.length > 0 ? (
        checklistItems.slice(0, 5).map((item: any, index: number) => (
          <Text key={`${item}-${index}`} style={styles.value}>
            • {item}
          </Text>
        ))
      ) : (
        <Text style={styles.value}>{localized('No checklist items yet')}</Text>
      )}

      {checklistItems.length > 5 ? (
        <Text style={styles.moreText}>
          +{checklistItems.length - 5} {localized('more')}
        </Text>
      ) : null}
    </View>
  );

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'routes':
        return renderRoutesTab();
      case 'jobs':
        return renderJobsTab();
      case 'resources':
        return renderResourcesTab();
      case 'personnel':
        return renderPersonnelTab();
      case 'checklist':
        return renderChecklistTab();
      default:
        return null;
    }
  };

  if (loading || !project) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator
          size="large"
          color={theme.colors[appearance].primaryForeground}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.projectHeaderBlock}>
        <Text style={styles.projectHeaderLabel}>{localized('Project')}</Text>

        <Text style={styles.projectHeaderTitle}>
          {project?.name || project?.title || localized('Untitled Project')}
        </Text>

        <View style={styles.projectMetaRow}>
          <View style={[styles.statusBadge, getStatusStyle()]}>
            <Text style={styles.statusText}>
              {project?.status?.toUpperCase?.() || '—'}
            </Text>
          </View>

          <View style={styles.startDateInline}>
            <Text style={styles.startDateInlineLabel}>
              {localized('Start Date')}:
            </Text>
            <Text style={styles.startDateInlineValue}>{startDate}</Text>
          </View>
        </View>
      </View>

      {project?.status === 'setup' ? (
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>{localized('Project Setup')}</Text>

          <Pressable style={styles.actionButton} onPress={handleSetupPress}>
            <MaterialCommunityIcons
              name="tools"
              size={20}
              color={theme.colors[appearance].primaryText}
            />
            <Text style={styles.buttonText}>{localized('Setup Project')}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.tabsSection}>
            <StatusTabs
              tabs={tabs}
              activeTab={activeTab}
              setActiveTab={(tab: string) => setActiveTab(tab as ProjectTabKey)}
              counters={counters}
            />
          </View>

          {renderActiveTabContent()}
        </>
      )}
    </ScrollView>
  );
};

export default ProjectDetailsScreen;