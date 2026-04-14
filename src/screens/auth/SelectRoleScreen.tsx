import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useAuth } from '../../core/onboarding/hooks/useAuth';
import { useTheme, useTranslations } from '../../core/dopebase';

const SelectRoleScreen = () => {
  const { availableRoles, setActiveRole } = useAuth();
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
        {localized('Select Role')}
      </Text>

      {availableRoles.map((role) => (
        <Pressable
          key={role}
          onPress={() => setActiveRole(role)}
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
              textTransform: 'capitalize',
            }}
          >
            {role}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

export default SelectRoleScreen;