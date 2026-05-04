import { act } from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { useCurrentUser } from '../../../onboarding/hooks/useAuth';
import { useTranslations } from '../../../dopebase';
import { useUpdateUserProfile } from '../useUpdateUserProfile';

jest.mock('../../../onboarding/hooks/useAuth');
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({})),
  updateDoc: jest.fn(),
}));
jest.mock('../../../firebase/config', () => ({ db: {} }));
jest.mock('../../../dopebase', () => ({
  useTranslations: jest.fn(),
}));

const mockUseCurrentUser = useCurrentUser as jest.Mock;
const mockUseTranslations = useTranslations as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockSetAppLocale = jest.fn();

describe('useUpdateUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetAppLocale.mockReset();
    mockUseTranslations.mockReturnValue({ setAppLocale: mockSetAppLocale });
    mockUseCurrentUser.mockReturnValue({ id: 'user-123', vendorID: 'vendor-456' });
  });

  it('happy path — escribe en users y vendor_users, llama setAppLocale', async () => {
    mockUpdateDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdateUserProfile());

    act(() => {
      result.current.updateProfile({
        firstName: 'Juan',
        lastName: 'Moreno',
        preferredLanguage: 'es',
      });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
    expect(mockSetAppLocale).toHaveBeenCalledWith('es');
    expect(result.current.error).toBeNull();
  });

  it('loading: true mientras las escrituras están pendientes', async () => {
    let resolveWrite!: () => void;
    mockUpdateDoc.mockReturnValue(
      new Promise<void>((resolve) => { resolveWrite = resolve; })
    );

    const { result } = renderHook(() => useUpdateUserProfile());

    act(() => {
      result.current.updateProfile({
        firstName: 'Juan',
        lastName: 'Moreno',
        preferredLanguage: 'en',
      });
    });

    expect(result.current.loading).toBe(true);

    act(() => resolveWrite());
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('error en users/{uid} — propaga el error, NO llama setAppLocale', async () => {
    mockUpdateDoc.mockRejectedValue(new Error('Firestore permission denied'));

    const { result } = renderHook(() => useUpdateUserProfile());

    act(() => {
      result.current.updateProfile({
        firstName: 'Juan',
        lastName: 'Moreno',
        preferredLanguage: 'es',
      });
    });

    await waitFor(() => expect(result.current.error).toBeTruthy());

    expect(mockSetAppLocale).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it('error en vendor_users/{vendorID}/users/{uid} — propaga el error, NO llama setAppLocale', async () => {
    mockUpdateDoc
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Vendor write failed'));

    const { result } = renderHook(() => useUpdateUserProfile());

    act(() => {
      result.current.updateProfile({
        firstName: 'Juan',
        lastName: 'Moreno',
        preferredLanguage: 'es',
      });
    });

    await waitFor(() => expect(result.current.error).toBeTruthy());

    expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
    expect(mockSetAppLocale).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it('sin vendorID — solo escribe en users/{uid}, sí llama setAppLocale', async () => {
    mockUseCurrentUser.mockReturnValue({ id: 'user-123', vendorID: null });
    mockUpdateDoc.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdateUserProfile());

    act(() => {
      result.current.updateProfile({
        firstName: 'Juan',
        lastName: 'Moreno',
        preferredLanguage: 'fr',
      });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    expect(mockSetAppLocale).toHaveBeenCalledWith('fr');
    expect(result.current.error).toBeNull();
  });
});
