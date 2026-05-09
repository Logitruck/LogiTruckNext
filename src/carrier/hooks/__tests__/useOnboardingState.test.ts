import { renderHook, waitFor, act } from '@testing-library/react-native';
import { onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { useOnboardingState } from '../useOnboardingState';

jest.mock('firebase/firestore', () => ({
  onSnapshot: jest.fn(),
  updateDoc: jest.fn(),
  doc: jest.fn(),
}));

jest.mock('../../../core/firebase/config', () => ({
  db: {},
}));

const mockOnSnapshot = onSnapshot as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockDoc = doc as jest.Mock;

describe('useOnboardingState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDoc.mockReturnValue({ path: 'vendors/test-vendor' });
  });

  it('returns loading:true initially before snapshot arrives', () => {
    mockOnSnapshot.mockImplementation(() => jest.fn());

    const { result } = renderHook(() => useOnboardingState('test-vendor'));

    expect(result.current.loading).toBe(true);
    expect(result.current.onboarding).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns onboarding data when snapshot has the field', async () => {
    const mockOnboardingData = {
      isComplete: false,
      steps: { dispatch: true, drivers: false },
      completedAt: null,
    };

    let snapshotCallback: any;
    mockOnSnapshot.mockImplementation((_ref: any, callback: any) => {
      snapshotCallback = callback;
      return jest.fn();
    });

    const { result } = renderHook(() => useOnboardingState('test-vendor'));

    await act(async () => {
      snapshotCallback({ data: () => ({ onboarding: mockOnboardingData }) });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.onboarding).toEqual(mockOnboardingData);
    });
  });

  it('returns null for onboarding when field is missing', async () => {
    let snapshotCallback: any;
    mockOnSnapshot.mockImplementation((_ref: any, callback: any) => {
      snapshotCallback = callback;
      return jest.fn();
    });

    const { result } = renderHook(() => useOnboardingState('test-vendor'));

    await act(async () => {
      snapshotCallback({ data: () => ({}) });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.onboarding).toBeNull();
    });
  });

  it('calls unsubscribe on unmount', () => {
    const mockUnsubscribe = jest.fn();
    mockOnSnapshot.mockImplementation(() => mockUnsubscribe);

    const { unmount } = renderHook(() => useOnboardingState('test-vendor'));

    act(() => unmount());

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('markStepComplete calls updateDoc with correct dot-notation path', async () => {
    let snapshotCallback: any;
    mockOnSnapshot.mockImplementation((_ref: any, callback: any) => {
      snapshotCallback = callback;
      return jest.fn();
    });
    mockUpdateDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useOnboardingState('test-vendor'));

    await act(async () => {
      snapshotCallback({
        data: () => ({
          onboarding: { isComplete: false, steps: { dispatch: false }, completedAt: null },
        }),
      });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.markStepComplete('dispatch');
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { path: 'vendors/test-vendor' },
      { 'onboarding.steps.dispatch': true },
    );
  });
});
