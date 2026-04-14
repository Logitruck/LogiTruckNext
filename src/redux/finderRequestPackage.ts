const ADD_ROUTE_TO_PACKAGE = 'finderRequestPackage/ADD_ROUTE_TO_PACKAGE';
const UPDATE_ROUTE_IN_PACKAGE = 'finderRequestPackage/UPDATE_ROUTE_IN_PACKAGE';
const REMOVE_ROUTE_FROM_PACKAGE = 'finderRequestPackage/REMOVE_ROUTE_FROM_PACKAGE';
const CLEAR_REQUEST_PACKAGE = 'finderRequestPackage/CLEAR_REQUEST_PACKAGE';

type RouteItem = {
  id: string;
  origin?: any;
  destination?: any;
  routeSummary?: any;
  rideType?: any;
  cargo?: any;
  [key: string]: any;
};

type FinderRequestPackageState = {
  routes: RouteItem[];
};

const initialState: FinderRequestPackageState = {
  routes: [],
};

export const addRouteToPackage = (route: RouteItem) => ({
  type: ADD_ROUTE_TO_PACKAGE,
  payload: route,
});

export const updateRouteInPackage = (
  routeID: string,
  updates: Partial<RouteItem>
) => ({
  type: UPDATE_ROUTE_IN_PACKAGE,
  payload: {
    routeID,
    updates,
  },
});

export const removeRouteFromPackage = (routeID: string) => ({
  type: REMOVE_ROUTE_FROM_PACKAGE,
  payload: routeID,
});

export const clearRequestPackage = () => ({
  type: CLEAR_REQUEST_PACKAGE,
});

const finderRequestPackageReducer = (
  state = initialState,
  action: any
): FinderRequestPackageState => {
  switch (action.type) {
    case ADD_ROUTE_TO_PACKAGE: {
      const newRoute = action.payload;

      const exists = state.routes.some((route) => route.id === newRoute.id);
      if (exists) {
        return state;
      }

      return {
        ...state,
        routes: [...state.routes, newRoute],
      };
    }

    case UPDATE_ROUTE_IN_PACKAGE: {
      const { routeID, updates } = action.payload;

      return {
        ...state,
        routes: state.routes.map((route) =>
          route.id === routeID ? { ...route, ...updates } : route
        ),
      };
    }

    case REMOVE_ROUTE_FROM_PACKAGE:
      return {
        ...state,
        routes: state.routes.filter(
          (route) => route.id !== action.payload
        ),
      };

    case CLEAR_REQUEST_PACKAGE:
      return {
        ...state,
        routes: [],
      };

    default:
      return state;
  }
};

export default finderRequestPackageReducer;