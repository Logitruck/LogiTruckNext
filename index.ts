import messaging from '@react-native-firebase/messaging';
import { registerRootComponent } from 'expo';
import App from './App';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📩 Background push:', remoteMessage);
});

registerRootComponent(App);