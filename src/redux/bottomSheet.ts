const SET_BOTTOM_SHEET_SNAP_POINTS = 'SET_BOTTOM_SHEET_SNAP_POINTS';

export const setbottomSheetSnapPoints = (payload: {
  key?: string;
  snapPoints: Array<string | number>;
  index: number;
}) => ({
  type: SET_BOTTOM_SHEET_SNAP_POINTS,
  payload,
});

const initialState = {
  bottomSheetSnapPoints: {
    key: 'default',
    snapPoints: ['50%'],
    index: 0,
  },
};

export default function bottomSheetReducer(state = initialState, action: any) {
  switch (action.type) {
    case SET_BOTTOM_SHEET_SNAP_POINTS:
      return {
        ...state,
        bottomSheetSnapPoints: {
          ...state.bottomSheetSnapPoints,
          ...action.payload,
        },
      };
    default:
      return state;
  }
}