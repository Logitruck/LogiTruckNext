import React, { useLayoutEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import { dynamicStyles } from './styles';

const ConfirmOfferScreen = () => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const navigation = useNavigation<any>();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: localized('Confirm Offer'),
    });
  }, [navigation, localized]);

  const handleFinish = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'DealsHome' }],
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {localized('Offer Submitted Successfully')}
        </Text>

        <Pressable style={styles.button} onPress={handleFinish}>
          <Text style={styles.buttonText}>
            {localized('Return to Offers')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default ConfirmOfferScreen;