import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './RequestSuccessScreen.styles';

type RouteParams = {
  requestID?: string;
};

const RequestSuccessScreen = () => {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const requestID = (route.params as RouteParams | undefined)?.requestID;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialIcons
          name="check-circle"
          size={80}
          color={theme.colors[appearance].success}
        />
      </View>

      <Text style={styles.title}>{localized('Request Sent!')}</Text>

      <Text style={styles.subtitle}>
        {localized('Your request has been successfully submitted.')}
      </Text>

      {!!requestID && (
        <Text style={styles.requestId}>
          {localized('Request ID')}: {requestID}
        </Text>
      )}

      <View style={styles.buttonColumn}>
        <Pressable
          onPress={() => {
            navigation.navigate('MyRequests');
          }}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>
            {localized('Go to My Requests')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'FinderHomeTab' }],
            });
          }}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>
            {localized('Return to Home')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default RequestSuccessScreen;