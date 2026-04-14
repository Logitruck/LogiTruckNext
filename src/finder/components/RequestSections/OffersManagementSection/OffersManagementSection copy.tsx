import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme, useTranslations } from '../../../../core/dopebase';
import { dynamicStyles } from './OffersManagementSection.styles';

type OffersManagementSectionProps = {
  offers: any[];
  onAccept: (vendorID: string) => void;
  onReject: (vendorID: string) => void;
};

const OffersManagementSection = ({
  offers = [],
  onAccept,
  onReject,
}: OffersManagementSectionProps) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  return (
    <View>
      <Text style={styles.header}>{localized('Offers Received')}</Text>

      {offers.length > 0 ? (
        offers.map((offer, index) => (
          <View key={offer.id || index} style={styles.card}>
            <Text style={styles.vendor}>
              {localized('Vendor')}: {offer.vendorID}
            </Text>

            <Text style={styles.text}>
              {localized('Price')}: ${offer.offer?.price ?? '—'}
            </Text>

            <Text style={styles.text}>
              {localized('Estimated days')}: {offer.offer?.estimatedDays ?? '—'}
            </Text>

            <Text style={styles.text}>
              {localized('Comment')}: {offer.offer?.comment || '—'}
            </Text>

            <View style={styles.row}>
              <Pressable
                style={styles.accept}
                onPress={() => onAccept(offer.vendorID)}
              >
                <Text style={styles.acceptText}>
                  {localized('Accept')}
                </Text>
              </Pressable>

              <Pressable
                style={styles.reject}
                onPress={() => onReject(offer.vendorID)}
              >
                <Text style={styles.rejectText}>
                  {localized('Reject')}
                </Text>
              </Pressable>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>
          {localized('No offers available yet.')}
        </Text>
      )}
    </View>
  );
};

export default OffersManagementSection;