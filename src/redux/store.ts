import { legacy_createStore as createStore, combineReducers } from 'redux';
import authReducer from './auth';
import bottomSheetReducer from './bottomSheet';
import tripReducer from './trip';
import rideReducer from './ride';
import finderRequestPackageReducer from './finderRequestPackage';
import operationSheetReducer from './operationSheet';

const rootReducer = combineReducers({
  auth: authReducer,
  bottomSheet: bottomSheetReducer,
  trip: tripReducer,
  ride: rideReducer,
  finderRequestPackage: finderRequestPackageReducer,
  operationSheet: operationSheetReducer,
});

const configureStore = () => {
  return createStore(rootReducer);
};

export default configureStore;