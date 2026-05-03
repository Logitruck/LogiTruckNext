import React, { useContext } from 'react';
import { Platform } from 'react-native';
import { useTranslations } from '../core/dopebase';

export const ConfigContext = React.createContext<any>({});

export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const { localized } = useTranslations();

  const config = {
    appIdentifier: `logitruck-${Platform.OS}`,

    googleAPIKey: "AIzaSyB1K_eSBcSyJKiW9iqEIJ2Fcld15OwacrA",
    googleMapsAPIKey: "AIzaSyB1K_eSBcSyJKiW9iqEIJ2Fcld15OwacrA",
    hereAPIKey: "8teJO9e7JJuBJb7CeNDaI1J4_RWFqtMUiq4TZD35BvU",

    currencyCode: "usd",
    displayCurrencyTitle: "$",
    currency: "usd",

    tracking: {
      firebaseUpdateThreshold: 300,
      localTrackingThreshold: 30,
      nearDestinationRadius: 1000,
      localDistance: 50,
      closeRange: 150,
    },

    tabIcons: {
      FinderHomeTab: {
        focus: "home",
        unFocus: "home-outline",
        label: "Home",
      },
      FinderSearchTab: {
        focus: "magnify",
        unFocus: "magnify",
        label: "Search",
      },
      FinderDealsTab: {
        focus: "handshake",
        unFocus: "handshake-outline",
        label: "Deals",
      },
      FinderProjectsTab: {
        focus: "briefcase",
        unFocus: "briefcase-outline",
        label: "Projects",
      },
      FinderChatTab: {
        focus: "message-text",
        unFocus: "message-text-outline",
        label: "Messenger",
      },

      CarrierHomeTab: {
        label: "Home",
        focus: "home",
        unFocus: "home-outline",
      },
      CarrierInspectionsTab: {
        label: "Inspections",
        focus: "shield-search",
        unFocus: "shield-search",
      },
      CarrierDealsTab: {
        focus: "hand-coin",
        unFocus: "hand-coin-outline",
        label: "Deals",
      },
      CarrierProjectsTab: {
        focus: "briefcase",
        unFocus: "briefcase-outline",
        label: "Projects",
      },
      CarrierTruckLiveTab: {
        focus: "truck-check",
        unFocus: "truck-outline",
        label: "Live Fleet",
      },
      CarrierChatTab: {
        label: "Chat",
        focus: "message-text",
        unFocus: "message-text-outline",
      },

      DriverHomeTab: {
        label: "Home",
        focus: "home",
        unFocus: "home-outline",
      },
      DriverJobsTab: {
        focus: "briefcase",
        unFocus: "briefcase-outline",
        label: "Projects",
      },
      ActiveJobTab: {
        focus: "progress-clock",
        unFocus: "clock-outline",
        label: "Job",
      },
      DriverInspectionsTab: {
        label: "Inspections",
        focus: "shield-search",
        unFocus: "shield-search",
      },
      DriverSupportTab: {
        label: "Chat",
        focus: "message-text",
        unFocus: "message-text-outline",
      },
    },

    drawerMenuConfig: {
      finderHomeDrawerConfig: {
        upperMenu: [
          {
            title: localized("HOME"),
            icon: "home",
            navigationPath: "FinderHomeScreen",
          },
          {
            title: localized("PROFILE"),
            icon: "account-circle",
            navigationPath: "MyProfileDrawer",
          },
        ],
        lowerMenu: [
          {
            title: localized("LOGOUT"),
            icon: "logout",
            action: "logout",
          },
        ],
      },

      searchDrawerConfig: {
        upperMenu: [
          {
            title: localized("HOME"),
            icon: "home",
            navigationPath: "FinderHomeScreen",
          },
          {
            title: localized("PROFILE"),
            icon: "account-circle",
            navigationPath: "MyProfileDrawer",
          },
        ],
        lowerMenu: [
          {
            title: localized("LOGOUT"),
            icon: "logout",
            action: "logout",
          },
        ],
      },

      dealsDrawerConfig: {
        upperMenu: [
          {
            title: localized("HOME"),
            icon: "home",
            navigationPath: "CarrierHomeTab",
          },
          {
            title: localized("PROFILE"),
            icon: "account-circle",
            navigationPath: "MyProfileDrawer",
          },
        ],
        lowerMenu: [
          {
            title: localized("LOGOUT"),
            icon: "logout",
            action: "logout",
          },
        ],
      },
      jobsDrawerConfig: {
        upperMenu: [
          {
            title: localized("HOME"),
            icon: "home",
            navigationPath: "CarrierJobsMain",
          },
          {
            title: localized("PROFILE"),
            icon: "account-circle",
            navigationPath: "MyProfileDrawer",
          },
        ],
        lowerMenu: [
          {
            title: localized("LOGOUT"),
            icon: "logout",
            action: "logout",
          },
        ],
      },

      projectsDrawerConfig: {
        upperMenu: [
          {
            title: localized("HOME"),
            icon: "home",
            navigationPath: "ProjectsMain",
          },
          {
            title: localized("PROFILE"),
            icon: "account-circle",
            navigationPath: "MyProfileDrawer",
          },
        ],
        lowerMenu: [
          {
            title: localized("LOGOUT"),
            icon: "logout",
            action: "logout",
          },
        ],
      },

      messengerDrawerConfig: {
        upperMenu: [
          {
            title: localized("HOME"),
            icon: "home",
            navigationPath: "MessengerHome",
          },
          {
            title: localized("PROFILE"),
            icon: "account-circle",
            navigationPath: "MyProfileDrawer",
          },
        ],
        lowerMenu: [
          {
            title: localized("LOGOUT"),
            icon: "logout",
            action: "logout",
          },
        ],
      },

      homeDrawerConfig: {
        upperMenu: [
          {
            title: localized("HOME"),
            icon: "home",
            navigationPath: "HomeScreen",
          },
          {
            title: localized("MESSENGER"),
            icon: "chat",
            navigationPath: "GlobalChatStack",
          },
          {
            title: localized("PROFILE"),
            icon: "account-circle",
            navigationPath: "MyProfile",
          },
        ],
        lowerMenu: [
          {
            title: localized("LOGOUT"),
            icon: "logout",
            action: "logout",
          },
        ],
      },

      inspectionDrawerConfig: {
        upperMenu: [
          {
            title: localized("HOME"),
            icon: "home",
            navigationPath: "Home",
          },
          {
            title: localized("INSPECTIONS"),
            icon: "clipboard-list-outline",
            navigationPath: "Inspections",
          },
          {
            title: localized("PROFILE"),
            icon: "account-circle",
            navigationPath: "MyProfileDrawer",
          },
        ],
        lowerMenu: [
          {
            title: localized("LOGOUT"),
            icon: "logout",
            action: "logout",
          },
        ],
      },

      offersDrawerConfig: {
        upperMenu: [
          {
            title: localized("HOME"),
            icon: "home",
            navigationPath: "Offers",
          },
          {
            title: localized("PROFILE"),
            icon: "account-circle",
            navigationPath: "MyProfileDrawer",
          },
        ],
        lowerMenu: [
          {
            title: localized("LOGOUT"),
            icon: "logout",
            action: "logout",
          },
        ],
      },

      carrierProjectsDrawerConfig: {
        upperMenu: [
          {
            title: localized("HOME"),
            icon: "home",
            navigationPath: "ProjectsCarrierMain",
          },
          {
            title: localized("PROFILE"),
            icon: "account-circle",
            navigationPath: "MyProfileDrawer",
          },
        ],
        lowerMenu: [
          {
            title: localized("LOGOUT"),
            icon: "logout",
            action: "logout",
          },
        ],
      },

      liveTruckDrawerConfig: {
        upperMenu: [
          {
            title: localized("HOME"),
            icon: "home",
            navigationPath: "LiveTruck",
          },
          {
            title: localized("PROFILE"),
            icon: "account-circle",
            navigationPath: "MyProfileDrawer",
          },
        ],
        lowerMenu: [
          {
            title: localized("LOGOUT"),
            icon: "logout",
            action: "logout",
          },
        ],
      },

      driverDrawerConfig: {
        upperMenu: [
          {
            title: localized("HOME"),
            icon: "home",
            navigationPath: "DriverMainTabs",
            params: {
              screen: "DriverHomeTab",
            },
          },
          {
            title: localized("INSPECTIONS"),
            icon: "shield-search",
            navigationPath: "DriverMainTabs",
            params: {
              screen: "DriverInspectionsTab",
            },
          },
          {
            title: localized("JOBS"),
            icon: "briefcase-outline",
            navigationPath: "DriverMainTabs",
            params: {
              screen: "DriverJobsTab",
            },
          },
          {
            title: localized("ACTIVE JOB"),
            icon: "map-marker-path",
            navigationPath: "DriverActiveJobStack",
          },
          {
            title: localized("Chat"),
            icon: "map-marker-path",
            navigationPath: "DriverActiveJobStack",
          },
          {
            title: localized("PROFILE"),
            icon: "account-circle",
            navigationPath: "MyProfile",
          },
        ],
      },
    },
  };

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);