const SET_OPERATION_SHEET_DATA = 'SET_OPERATION_SHEET_DATA';
const RESET_OPERATION_SHEET_DATA = 'RESET_OPERATION_SHEET_DATA';

export type OperationActionType =
  | 'pickup_arrival'
  | 'capture_pickup_ticket'
  | 'dropoff_arrival'
  | 'capture_dropoff_ticket'
  | null;

type OperationSheetState = {
  isPickupPhase: boolean;
  isCloseToDropoff: boolean;
  showArrivalPickupButton: boolean;
  showArrivalDropoffButton: boolean;
  currentStatusLabel: string;
  origin: any;
  destination: any;
  activeSummary: any;
  currentContactName: string | null;
  currentContactPhone: string | null;
  currentInstructions: string | null;
  showNavigateButton: boolean;
  requestedAction: OperationActionType;
  onPrimaryActionType: OperationActionType;
};

export const setOperationSheetData = (
  payload: Partial<OperationSheetState>,
) => ({
  type: SET_OPERATION_SHEET_DATA,
  payload,
});

export const resetOperationSheetData = () => ({
  type: RESET_OPERATION_SHEET_DATA,
});

const initialState: OperationSheetState = {
  isPickupPhase: true,
  isCloseToDropoff: false,
  showArrivalPickupButton: false,
  showArrivalDropoffButton: false,
  currentStatusLabel: '',
  origin: null,
  destination: null,
  activeSummary: null,
  currentContactName: null,
  currentContactPhone: null,
  currentInstructions: null,
  showNavigateButton: true,
  requestedAction: null,
  onPrimaryActionType: null,
};

export default function operationSheetReducer(
  state = initialState,
  action: any,
): OperationSheetState {
  switch (action.type) {
    case SET_OPERATION_SHEET_DATA:
      return {
        ...state,
        ...action.payload,
      };

    case RESET_OPERATION_SHEET_DATA:
      return initialState;

    default:
      return state;
  }
}