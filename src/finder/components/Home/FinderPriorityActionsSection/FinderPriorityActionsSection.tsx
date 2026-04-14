import React from 'react';
import { View } from 'react-native';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import dynamicStyles from './styles';
import SectionHeader from '../shared/SectionHeader/SectionHeader';
import FinderPriorityActionCard from './FinderPriorityActionCard';
import useFinderPriorityActions from '../../../hooks/home/useFinderPriorityActions';

const FinderPriorityActionsSection = () => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const { actions, loading } = useFinderPriorityActions();

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
          <FinderPriorityActionCard
            key={action.id}
            item={action}
            loading={loading}
          />
        ))}
      </View>
    </View>
  );
};

export default FinderPriorityActionsSection;