import React from 'react';
import { View } from 'react-native';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import dynamicStyles from './styles';
import SectionHeader from '../shared/SectionHeader';
import PriorityActionCard from './PriorityActionCard';
import useCarrierPriorityActions from '../../../hooks/home/useCarrierPriorityActions';

const PriorityActionsSection = () => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const { actions, loading } = useCarrierPriorityActions();

  if (!loading && actions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <SectionHeader
        title={localized('Priority Actions')}
        subtitle={localized('What needs attention now')}
      />

      <View style={styles.list}>
        {actions.map(action => (
          <PriorityActionCard
            key={action.id}
            item={action}
            loading={loading}
          />
        ))}
      </View>
    </View>
  );
};

export default PriorityActionsSection;