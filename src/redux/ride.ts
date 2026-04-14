const SET_CAR_CATEGORIES = 'SET_CAR_CATEGORIES';
const SET_SELECTED_RIDE = 'SET_SELECTED_RIDE';
const SET_SELECTED_RIDE_PRICE_RANGE = 'SET_SELECTED_RIDE_PRICE_RANGE';
const SET_CARS = 'SET_CARS';

export const setCarCategories = (payload: any[]) => ({
  type: SET_CAR_CATEGORIES,
  payload,
});

export const setSelectedRide = (payload: any) => ({
  type: SET_SELECTED_RIDE,
  payload,
});

export const setSelectedRidePriceRange = (payload: any) => ({
  type: SET_SELECTED_RIDE_PRICE_RANGE,
  payload,
});

export const setCars = (payload: any[]) => ({
  type: SET_CARS,
  payload,
});

const initialState = {
  carCategories: [],
  selectedRide: null,
  selectedRidePriceRange: null,
  cars: [],
};

export default function rideReducer(state = initialState, action: any) {
  switch (action.type) {
    case SET_CAR_CATEGORIES:
      return {
        ...state,
        carCategories: action.payload ?? [],
      };
    case SET_SELECTED_RIDE:
      return {
        ...state,
        selectedRide: action.payload,
      };
    case SET_SELECTED_RIDE_PRICE_RANGE:
      return {
        ...state,
        selectedRidePriceRange: action.payload,
      };
    case SET_CARS:
      return {
        ...state,
        cars: action.payload ?? [],
      };
    default:
      return state;
  }
}