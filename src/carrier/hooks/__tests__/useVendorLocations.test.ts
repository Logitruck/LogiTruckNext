import { renderHook, waitFor, act } from '@testing-library/react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { useVendorLocations } from '../useVendorLocations';

const mockUnsubscribe = jest.fn();
const mockOnSnapshot = onSnapshot as jest.Mock;
const mockCollection = collection as jest.Mock;

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  onSnapshot: jest.fn(),
}));
jest.mock('../../../core/firebase/config', () => ({ db: {} }));
jest.mock('../../../core/onboarding/hooks/useAuth', () => {
  const stableReturn = { user: { uid: 'test-user' } };
  return { useCurrentUser: jest.fn(() => stableReturn) };
});

describe('useVendorLocations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUnsubscribe.mockReset();
    mockCollection.mockReturnValue({});
  });

  it('returns loading:true initially before snapshot arrives', () => {
    mockOnSnapshot.mockImplementation((_ref: any, _onNext: any) => mockUnsubscribe);

    const { result } = renderHook(() => useVendorLocations('vendor-123'));
    expect(result.current.loading).toBe(true);
  });

  it('returns locations array when snapshot has docs', async () => {
    mockOnSnapshot.mockImplementation((_ref: any, onNext: (snap: any) => void) => {
      onNext({
        docs: [
          { id: 'loc-1', data: () => ({ name: 'Sede Norte', address: '123 Main St', maxDistanceService: 50 }) },
          { id: 'loc-2', data: () => ({ name: 'Sede Sur', address: '456 Oak Ave', maxDistanceService: 30 }) },
        ],
      });
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useVendorLocations('vendor-123'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.locations).toHaveLength(2);
    expect(result.current.locations[0].id).toBe('loc-1');
    expect(result.current.locations[0].name).toBe('Sede Norte');
  });

  it('returns empty array when collection is empty', async () => {
    mockOnSnapshot.mockImplementation((_ref: any, onNext: (snap: any) => void) => {
      onNext({ docs: [] });
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useVendorLocations('vendor-123'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.locations).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('calls unsubscribe on unmount', async () => {
    mockOnSnapshot.mockImplementation((_ref: any, onNext: (snap: any) => void) => {
      onNext({ docs: [] });
      return mockUnsubscribe;
    });

    const { unmount } = renderHook(() => useVendorLocations('vendor-123'));

    await waitFor(() => expect(mockOnSnapshot).toHaveBeenCalledTimes(1));
    act(() => unmount());
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
