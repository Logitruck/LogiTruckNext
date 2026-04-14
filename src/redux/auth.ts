const SET_USER_DATA = 'SET_USER_DATA';
const LOG_OUT = 'LOG_OUT';

export const setUserData = (payload: any) => ({
  type: SET_USER_DATA,
  payload,
});

export const logOut = () => ({
  type: LOG_OUT,
});

const initialState = {
  user: null,
};

export default function authReducer(state = initialState, action: any) {
  switch (action.type) {
    case SET_USER_DATA:
      return {
        ...state,
        user: action.payload?.user ?? null,
      };
    case LOG_OUT:
      return {
        ...state,
        user: null,
      };
    default:
      return state;
  }
}