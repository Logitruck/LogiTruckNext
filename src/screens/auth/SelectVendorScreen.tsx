import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useAuth } from '../../core/onboarding/hooks/useAuth';
import { useTheme, useTranslations } from '../../core/dopebase';

const SelectVendorScreen = () => {
  const { availableVendorIDs, setActiveVendor } = useAuth();
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const colors = theme.colors[appearance];

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.primaryBackground,
        padding: 24,
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: '800',
          color: colors.primaryText,
          marginBottom: 20,
        }}
      >
        {localized('Select Company')}
      </Text>

      {availableVendorIDs.map((vendorID) => (
        <Pressable
          key={vendorID}
          onPress={() => setActiveVendor(vendorID)}
          style={{
            padding: 16,
            borderRadius: 14,
            backgroundColor: colors.secondaryBackground,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              color: colors.primaryText,
              fontSize: 16,
              fontWeight: '700',
            }}
          >
            {vendorID}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

export default SelectVendorScreen;