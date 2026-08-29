import { Platform } from 'react-native';
if (Platform.OS !== 'web') {
  require('react-native-get-random-values');
}
import { registerRootComponent } from 'expo';
import App from './App';
registerRootComponent(App);
