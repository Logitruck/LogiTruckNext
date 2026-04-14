import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../../../../core/dopebase';

import dynamicStyles from './OperationStaticSheet.styles';

const OperationStaticSheet = () => {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);
console.log('loaded OperationStaticSheet 1');
  return (
    <View style={[styles.container, { minHeight: '100%', width: '100%' }]}>
    <View style={styles.container}>
      {/* Handle */}
      <View style={styles.handle} />

      {/* Status */}
      <Text style={styles.status}>Heading to Pickup</Text>

      {/* Destination */}
      <Text style={styles.title}>Walmart Distribution Center</Text>
      <Text style={styles.subtitle}>1234 Logistics Ave, Orlando FL</Text>

      {/* Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Distance</Text>
          <Text style={styles.metricValue}>78.3 mi</Text>
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricLabel}>ETA</Text>
          <Text style={styles.metricValue}>75 min</Text>
        </View>
      </View>

      {/* Contact */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.contact}>John Doe</Text>
        <Text style={styles.phone}>(555) 123-4567</Text>

        <Pressable style={styles.callButton}>
          <Text style={styles.callText}>Call</Text>
        </Pressable>
      </View>

      {/* Action */}
      <Pressable style={styles.actionButton}>
        <Text style={styles.actionText}>Arrived at Pickup</Text>
      </Pressable>
    </View>
    </View>
  );
};

export default OperationStaticSheet;