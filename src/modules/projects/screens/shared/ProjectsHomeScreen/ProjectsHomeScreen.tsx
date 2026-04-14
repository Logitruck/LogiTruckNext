import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './styles';
import StatusTabs from '../../../../../core/components/StatusTabs';
import useFinderProjects from '../../../hooks/finder/useFinderProjects';
import useCarrierProjects from '../../../hooks/carrier/useCarrierProjects';

const TABS = [
  { key: 'setup', label: 'Setup', icon: 'cog-outline', color: '#e67e22' },
  { key: 'execution', label: 'Execution', icon: 'truck-fast-outline', color: '#2ecc71' },
  { key: 'completed', label: 'Completed', icon: 'check-circle-outline', color: '#3498db' },
];

const CARD_BACKGROUNDS: Record<string, string> = {
  setup: '#fff2e6',
  execution: '#e6f9f0',
  completed: '#eaf4fb',
};

const formatDate = (value?: string) => {
  if (!value) return '—';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';

  return parsed.toDateString();
};

const getProjectSummary = (
  project: any,
  localized: (key: string) => string,
) => {
  const routes = Array.isArray(project?.routes) ? project.routes : [];
  const firstRoute = routes[0] || null;

  const totalRoutes = Number(project?.totalRoutes ?? routes.length ?? 0);

  const totalTrips =
    Number(project?.totalTrips ?? 0) ||
    routes.reduce((sum: number, route: any) => {
      return sum + Number(route?.tripsOffered ?? route?.cargo?.trips ?? 0);
    }, 0);

  const startDate = firstRoute?.cargo?.startDate;

  const title = project?.name?.trim()
    ? project.name
    : totalRoutes <= 1
      ? `${firstRoute?.origin?.title ?? localized('Unknown origin')} → ${
          firstRoute?.destination?.title ?? localized('Unknown destination')
        }`
      : `${firstRoute?.origin?.title ?? localized('Unknown origin')} → ${
          firstRoute?.destination?.title ?? localized('Unknown destination')
        } + ${totalRoutes - 1} ${localized('more routes')}`;

  return {
    title,
    startDate,
    totalRoutes,
    totalTrips,
  };
};

const ProjectsHomeScreen = () => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { role = 'finder' } = route.params || {};
  const [activeTab, setActiveTab] = useState('execution');

  const finderState = useFinderProjects();
  const carrierState = useCarrierProjects();
  console.log('carrierState',carrierState)
  const { projects, loading, counters } =
    role === 'carrier' ? carrierState : finderState;

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

    navigation.setOptions({
      headerShown: true,
      title: localized('Projects'),
      headerLeft: () => (
        <MaterialCommunityIcons
          name="menu"
          size={24}
          color={colors.primaryText}
          style={{ marginLeft: 16 }}
          onPress={() => navigation.getParent()?.openDrawer()}
        />
      ),
      headerStyle: {
        backgroundColor: colors.primaryBackground,
      },
      headerTintColor: colors.primaryText,
    });
  }, [navigation, appearance, localized, theme]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project: any) => project.status === activeTab);
  }, [projects, activeTab]);

  const renderItem = ({ item }: { item: any }) => {
    const backgroundColor =
      CARD_BACKGROUNDS[item.status] ||
      theme.colors[appearance].secondaryBackground;

    const summary = getProjectSummary(item, localized);

    return (
      <Pressable
        style={[styles.card, { backgroundColor }]}
        onPress={() =>
          navigation.navigate('ProjectDetails', {
            project: item,
            role,
          })
        }
      >
        <Text style={styles.cardTitle}>{summary.title}</Text>

        <Text style={styles.cardSubtitle}>
          {localized('Status')}: {item.status}
        </Text>

        <Text style={styles.cardMeta}>
          {localized('Start date')}: {formatDate(summary.startDate)}
        </Text>

        <Text style={styles.cardMeta}>
          {localized('Routes')}: {summary.totalRoutes}
        </Text>

        <Text style={styles.cardMeta}>
          {localized('Trips')}: {summary.totalTrips}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <StatusTabs
        tabs={TABS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counters={counters}
      />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors[appearance].primaryForeground}
          />
        </View>
      ) : (
        <FlatList
          data={filteredProjects}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {localized('No projects found')}
            </Text>
          }
        />
      )}
    </View>
  );
};

export default ProjectsHomeScreen;