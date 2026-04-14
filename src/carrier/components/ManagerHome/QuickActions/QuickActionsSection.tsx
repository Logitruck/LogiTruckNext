import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import dynamicStyles from './styles';
import SectionHeader from '../shared/SectionHeader';
import QuickActionCard from './QuickActionCard';

const QuickActionsSection = () => {
  const navigation = useNavigation<any>();
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const actions = useMemo(
    () => [
      {
        key: 'create_driver',
        label: localized('Create Driver'),
        icon: 'account-plus-outline',
        color: '#3b82f6',
        onPress: () => {
          navigation.navigate('CarrierProjectsTab', {
            screen: 'ProjectsCarrierMain',
            params: {
              screen: 'ProjectPersonnel',
              params: {
                mode: 'quick_create',
                openCreatePersonnel: true,
                personnelRole: 'driver',
              },
            },
          });
        },
      },
      {
        key: 'register_expense',
        label: localized('Register Expense'),
        icon: 'cash-plus',
        color: '#16a34a',
        onPress: () => {
          navigation.navigate('CarrierProjectsTab', {
            screen: 'ProjectsCarrierMain',
            params: {
              screen: 'ProjectResources',
              params: {
                mode: 'quick_create',
                openExpenseSelector: true,
              },
            },
          });
        },
      },
      {
        key: 'create_truck',
        label: localized('Create Truck'),
        icon: 'truck-plus',
        color: '#f59e0b',
        onPress: () => {
          navigation.navigate('CarrierProjectsTab', {
            screen: 'ProjectsCarrierMain',
            params: {
              screen: 'ProjectResources',
              params: {
                mode: 'quick_create',
                openCreateVehicle: true,
                vehicleType: 'Truck',
              },
            },
          });
        },
      },
    ],
    [localized, navigation],
  );

  return (
    <View style={styles.container}>
      <SectionHeader
        title={localized('Quick Actions')}
        subtitle={localized('Create common resources faster')}
      />

      <View style={styles.grid}>
        {actions.map(action => (
          <QuickActionCard
            key={action.key}
            label={action.label}
            icon={action.icon}
            color={action.color}
            onPress={action.onPress}
          />
        ))}
      </View>
    </View>
  );
};

export default QuickActionsSection;