import 'react-native-gesture-handler/jestSetup'

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: {
    apps: [],
    initializeApp: jest.fn(),
    app: jest.fn(() => ({})),
  },
}))

jest.mock('@react-native-firebase/messaging', () => () => ({
  getToken: jest.fn().mockResolvedValue('mock-fcm-token'),
  onMessage: jest.fn(() => jest.fn()),
  onNotificationOpenedApp: jest.fn(() => jest.fn()),
  getInitialNotification: jest.fn().mockResolvedValue(null),
  requestPermission: jest.fn().mockResolvedValue(1),
  hasPermission: jest.fn().mockResolvedValue(1),
  subscribeToTopic: jest.fn(),
  unsubscribeFromTopic: jest.fn(),
  setBackgroundMessageHandler: jest.fn(),
  registerDeviceForRemoteMessages: jest.fn().mockResolvedValue(undefined),
  isDeviceRegisteredForRemoteMessages: true,
}))

jest.mock('react-native-maps', () => ({
  __esModule: true,
  default: jest.fn(),
  MapView: jest.fn(),
  Marker: jest.fn(),
  Polyline: jest.fn(),
  Callout: jest.fn(),
  Circle: jest.fn(),
  PROVIDER_GOOGLE: 'google',
  PROVIDER_DEFAULT: null,
}))

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-expo-push-token' }),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  removeNotificationSubscription: jest.fn(),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
  dismissAllNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { MAX: 5, HIGH: 4, DEFAULT: 3, LOW: 2, MIN: 1 },
}))

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  MediaTypeOptions: { All: 'All', Videos: 'Videos', Images: 'Images' },
  UIImagePickerPresentationStyle: { FullScreen: 0 },
}))

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
}))

jest.mock('@gorhom/bottom-sheet', () => ({
  __esModule: true,
  default: jest.fn(),
  BottomSheet: jest.fn(),
  BottomSheetModal: jest.fn(),
  BottomSheetView: jest.fn(),
  BottomSheetScrollView: jest.fn(),
  BottomSheetFlatList: jest.fn(),
  BottomSheetModalProvider: jest.fn(),
  useBottomSheet: jest.fn(() => ({ expand: jest.fn(), collapse: jest.fn(), close: jest.fn() })),
  useBottomSheetModal: jest.fn(() => ({ present: jest.fn(), dismiss: jest.fn() })),
}))

jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: jest.fn(),
  DateTimePickerAndroid: { open: jest.fn(), dismiss: jest.fn() },
}))

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fs: {
      dirs: {
        DocumentDir: '/mock/docs',
        CacheDir: '/mock/cache',
        DownloadDir: '/mock/downloads',
      },
      exists: jest.fn().mockResolvedValue(false),
      readFile: jest.fn().mockResolvedValue(''),
      writeFile: jest.fn().mockResolvedValue(undefined),
      unlink: jest.fn().mockResolvedValue(undefined),
      mkdir: jest.fn().mockResolvedValue(undefined),
      ls: jest.fn().mockResolvedValue([]),
    },
    config: jest.fn(() => ({
      fetch: jest.fn().mockResolvedValue({ path: jest.fn(() => '/mock/file.pdf') }),
    })),
    fetch: jest.fn().mockReturnValue({
      uploadProgress: jest.fn().mockReturnThis(),
      downloadProgress: jest.fn().mockReturnThis(),
    }),
  },
}))

jest.mock('react-native-pdf', () => ({
  __esModule: true,
  default: jest.fn(),
}))
