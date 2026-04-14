import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../../../core/dopebase';
import { dynamicStyles } from './PlaceRow.styles';

type Props = {
  data: any;
};

const PlaceRow = ({ data }: Props) => {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);
  const colors = theme.colors[appearance];

  const mainText =
    data?.structured_formatting?.main_text ??
    data?.description ??
    data?.vicinity ??
    '—';

  const secondaryText =
    data?.structured_formatting?.secondary_text ?? '';

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name="map-marker-outline"
          size={20}
          color={colors.secondaryText}
        />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {mainText}
        </Text>

        {!!secondaryText && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {secondaryText}
          </Text>
        )}
      </View>
    </View>
  );
};

export default PlaceRow;