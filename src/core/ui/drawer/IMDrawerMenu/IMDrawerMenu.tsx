import React from 'react';
import { View, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Image } from 'expo-image';
import { useTheme, useTranslations } from '../../../dopebase';
import { dynamicStyles } from './styles';
import IMMenuButton from '../IMMenuButton/IMMenuButton';
import { useAuth, useCurrentUser } from '../../../onboarding/hooks/useAuth';

type MenuItem = {
  title: string;
  icon?: string | number;
  navigationPath?: string;
  params?: any;
  action?: string;
};

type Props = {
  navigation: any;
  menuItems: MenuItem[];
  menuItemsSettings: MenuItem[];
  menuItemStyle?: StyleProp<ViewStyle>;
  headerStyle?: StyleProp<ViewStyle>;
  nameStyle?: StyleProp<TextStyle>;
  emailStyle?: StyleProp<TextStyle>;
  forceMenuItemsStyle?: StyleProp<ViewStyle>;
};

export const IMDrawerMenu = ({
  navigation,
  menuItems,
  menuItemsSettings,
  menuItemStyle,
  headerStyle,
  nameStyle,
  emailStyle,
  forceMenuItemsStyle,
}: Props) => {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const { signOut } = useAuth();
  const currentUser = useCurrentUser();

  const defaultProfilePhotoURL =
    'https://www.iosapptemplates.com/wp-content/uploads/2019/06/empty-avatar.jpg';

  const actionLowerMenu = async (action?: string) => {
    if (action === 'logout') {
      await signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoadScreen' }],
      });
    }
  };

  const mappingMenuItems = menuItems.map((menuItem, index) => (
    <IMMenuButton
      key={index}
      title={menuItem.title}
      source={menuItem.icon}
      containerStyle={menuItemStyle}
      onPress={() => {
        if (menuItem.navigationPath) {
          navigation.navigate(menuItem.navigationPath, menuItem.params);
        }
      }}
    />
  ));

  const mappingMenuSettings = menuItemsSettings.map((menuItemSetting, index) => (
    <IMMenuButton
      key={index}
      title={menuItemSetting.title}
      source={menuItemSetting.icon}
      containerStyle={menuItemStyle}
      onPress={() => {
        actionLowerMenu(menuItemSetting.action);
      }}
    />
  ));

  const lowerMenu =
    menuItemsSettings.length === 0 ? null : (
      <View>
        <View style={styles.line} />
        {mappingMenuSettings}
      </View>
    );

  return (
    <View style={styles.content}>
      <View style={[styles.header, headerStyle]}>
        <Image
          style={styles.imageContainer}
          source={{
            uri:
              currentUser?.photoURI ||
              currentUser?.profilePictureURL ||
              defaultProfilePhotoURL,
          }}
          contentFit="cover"
        />

        <Text style={[styles.info, nameStyle]}>
          {currentUser?.firstName ?? ''} {currentUser?.lastName ?? ''}
        </Text>

        <Text style={[styles.email, emailStyle]}>
          {currentUser?.email ?? ''}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.container, forceMenuItemsStyle]}>
          {mappingMenuItems}
          {lowerMenu}
        </View>

        <View style={styles.footer}>
          <Text style={styles.textFooter}>{localized('Made by LogiTruck')}</Text>
        </View>
      </View>
    </View>
  );
};