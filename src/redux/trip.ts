const LOG_OUT = 'LOG_OUT';

const SET_ORIGIN = 'SET_ORIGIN';
const SET_DESTINATION = 'SET_DESTINATION';
const SET_TRIP_DESCRIPTION = 'SET_TRIP_DESCRIPTION';
const SET_TRIP_COORDINATES = 'SET_TRIP_COORDINATES';
const SET_DROP_OFF_ETA = 'SET_DROP_OFF_ETA';
const SET_DROP_OFF_DISTANCE = 'SET_DROP_OFF_DISTANCE';
const RESET_TRIP_STATE = 'RESET_TRIP_STATE';
const SET_IS_SEARCHING = 'SET_IS_SEARCHING';
const SET_CARGO_DETAILS = 'SET_CARGO_DETAILS';

// nuevos para Finder Route
const SET_QUOTE_COORDINATES = 'SET_QUOTE_COORDINATES';
const SET_SUMMARY_TRIP = 'SET_SUMMARY_TRIP';

export const setOrigin = (payload: any) => ({
  type: SET_ORIGIN,
  payload,
});

export const setDestination = (payload: any) => ({
  type: SET_DESTINATION,
  payload,
});

export const setTripDescription = (payload: any) => ({
  type: SET_TRIP_DESCRIPTION,
  payload,
});

export const setTripCoordinates = (payload: any) => ({
  type: SET_TRIP_COORDINATES,
  payload,
});

export const setDropoffETA = (payload: any) => ({
  type: SET_DROP_OFF_ETA,
  payload,
});

export const setDropoffDistance = (payload: any) => ({
  type: SET_DROP_OFF_DISTANCE,
  payload,
});

export const setIsSearching = (payload: boolean) => ({
  type: SET_IS_SEARCHING,
  payload,
});

export const setCargoDetails = (payload: any) => ({
  type: SET_CARGO_DETAILS,
  payload,
});

export const setQuoteCoordinates = (payload: any) => ({
  type: SET_QUOTE_COORDINATES,
  payload,
});

export const setSummaryTrip = (payload: any) => ({
  type: SET_SUMMARY_TRIP,
  payload,
});

export const resetTripState = () => ({
  type: RESET_TRIP_STATE,
});

const initialState = {
  dropoffETA: '',
  dropoffDistance: '',

  origin: {
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.0143,
    longitudeDelta: 0.0134,
    location: null,
    title: null,
  },

  destination: null,

  tripDescription: {},

  tripCoordinates: {
    pickup: null,
    carDrive: null,
    dropoff: null,
    routeCoordinates: null,
    routeId: null,
  },

  isSearching: false,

  cargoDetails: {
    trips: '',
    dailyTrips: '',
    startDate: null,
    endDate: null,
    description: '',
  },

  // nuevos
  routeCoordinates: null,
  summaryTrip: null,
};

export default function tripReducer(state = initialState, action: any) {
  switch (action.type) {
    case SET_ORIGIN:
      return {
        ...state,
        origin: {
          ...state.origin,
          ...action.payload,
        },
      };

    case SET_DESTINATION:
      return {
        ...state,
        destination: action.payload,
      };

    case SET_TRIP_DESCRIPTION:
      return {
        ...state,
        tripDescription: {
          ...state.tripDescription,
          ...action.payload,
        },
      };

    case SET_TRIP_COORDINATES:
      return {
        ...state,
        tripCoordinates: {
          ...state.tripCoordinates,
          ...action.payload,
        },
      };

    case SET_DROP_OFF_ETA:
      return {
        ...state,
        dropoffETA: action.payload,
      };

    case SET_DROP_OFF_DISTANCE:
      return {
        ...state,
        dropoffDistance: action.payload,
      };

    case SET_IS_SEARCHING:
      return {
        ...state,
        isSearching: action.payload,
      };

    case SET_CARGO_DETAILS:
      return {
        ...state,
        cargoDetails: {
          ...state.cargoDetails,
          ...action.payload,
        },
      };

    case SET_QUOTE_COORDINATES:
      return {
        ...state,
        routeCoordinates: action.payload,
      };

    case SET_SUMMARY_TRIP:
      return {
        ...state,
        summaryTrip: action.payload,
      };

    case RESET_TRIP_STATE:
    case LOG_OUT:
      return initialState;

    default:
      return state;
  }
}