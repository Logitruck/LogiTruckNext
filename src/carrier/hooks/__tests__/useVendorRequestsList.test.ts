import { act } from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { onSnapshot, getDoc, collection } from 'firebase/firestore';
import { useCurrentUser } from '../../../core/onboarding/hooks/useAuth';
import useVendorRequestsList from '../useVendorRequestsList';

jest.mock('../../../core/onboarding/hooks/useAuth');
jest.mock('firebase/firestore', () => ({
  onSnapshot: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(() => ({})),
  doc: jest.fn(),
}));
jest.mock('../../../core/firebase/config', () => ({ db: {} }));

const mockUseCurrentUser = useCurrentUser as jest.Mock;
const mockOnSnapshot   = onSnapshot as jest.Mock;
const mockGetDoc       = getDoc as jest.Mock;

describe('useVendorRequestsList', () => {
  const mockUnsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Caso 1: sin vendorID ────────────────────────────────────────────────
  describe('caso 1 — sin vendorID', () => {
    it('retorna requests vacío y loading false cuando currentUser es null', async () => {
      mockUseCurrentUser.mockReturnValue(null);

      const { result } = renderHook(() => useVendorRequestsList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.requests).toEqual([]);
      expect(mockOnSnapshot).not.toHaveBeenCalled();
    });

    it('retorna requests vacío cuando currentUser existe pero no tiene vendorID', async () => {
      mockUseCurrentUser.mockReturnValue({ email: 'carrier@test.com' });

      const { result } = renderHook(() => useVendorRequestsList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.requests).toEqual([]);
      expect(mockOnSnapshot).not.toHaveBeenCalled();
    });
  });

  // ─── Caso 2: snapshot vacío ──────────────────────────────────────────────
  describe('caso 2 — snapshot vacío', () => {
    it('retorna requests vacío cuando el snapshot no tiene documentos', async () => {
      mockUseCurrentUser.mockReturnValue({ vendorID: 'vendor-1' });
      mockOnSnapshot.mockImplementation((ref, onNext) => {
        onNext({ docs: [] });
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useVendorRequestsList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.requests).toEqual([]);
    });
  });

  // ─── Caso 3: docs sin requestRef ────────────────────────────────────────
  describe('caso 3 — docs sin requestRef', () => {
    it('retorna items con vendorStatus y offer sin hacer getDoc', async () => {
      mockUseCurrentUser.mockReturnValue({ vendorID: 'vendor-1' });
      mockOnSnapshot.mockImplementation((ref, onNext) => {
        onNext({
          docs: [
            { id: 'req-1', data: () => ({ status: 'pending', offer: { price: 1000 } }) },
            { id: 'req-2', data: () => ({ status: 'review',  offer: null }) },
          ],
        });
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useVendorRequestsList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.requests).toEqual([
        { id: 'req-1', vendorStatus: 'pending', offer: { price: 1000 } },
        { id: 'req-2', vendorStatus: 'review',  offer: null },
      ]);
      expect(mockGetDoc).not.toHaveBeenCalled();
    });
  });

  // ─── Caso 4: requestRef existe y getDoc resuelve ─────────────────────────
  describe('caso 4 — requestRef existe y getDoc resuelve', () => {
    it('enriquece el item con los datos del doc referenciado', async () => {
      const mockRef = { id: 'full-req-1' };
      // activeVendorID tiene prioridad sobre vendorID
      mockUseCurrentUser.mockReturnValue({ activeVendorID: 'vendor-99', vendorID: 'vendor-1' });
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data:   () => ({ origin: 'CDMX', destination: 'GDL', cargo: 'electronics' }),
      });
      mockOnSnapshot.mockImplementation((ref, onNext) => {
        onNext({
          docs: [
            {
              id: 'req-1',
              data: () => ({ status: 'accepted', offer: { price: 2000 }, requestRef: mockRef }),
            },
          ],
        });
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useVendorRequestsList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetDoc).toHaveBeenCalledWith(mockRef);
      expect(result.current.requests).toEqual([
        {
          id: 'req-1',
          vendorStatus: 'accepted',
          offer: { price: 2000 },
          origin: 'CDMX',
          destination: 'GDL',
          cargo: 'electronics',
        },
      ]);
    });
  });

  // ─── Caso 5: requestRef existe pero el doc no existe en Firestore ────────
  describe('caso 5 — doc referenciado no existe', () => {
    it('retorna el item sin datos extra cuando requestDoc.exists() es false', async () => {
      const mockRef = { id: 'missing-req' };
      mockUseCurrentUser.mockReturnValue({ vendorID: 'vendor-1' });
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data:   () => undefined,
      });
      mockOnSnapshot.mockImplementation((ref, onNext) => {
        onNext({
          docs: [
            {
              id: 'req-1',
              data: () => ({ status: 'pending', offer: { price: 500 }, requestRef: mockRef }),
            },
          ],
        });
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useVendorRequestsList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.requests).toEqual([
        { id: 'req-1', vendorStatus: 'pending', offer: { price: 500 } },
      ]);
    });
  });

  // ─── Caso 6: error en el callback de error de onSnapshot ────────────────
  describe('caso 6 — error en onSnapshot', () => {
    it('retorna requests vacío y loading false cuando el listener falla', async () => {
      mockUseCurrentUser.mockReturnValue({ vendorID: 'vendor-1' });
      mockOnSnapshot.mockImplementation((ref, onNext, onError) => {
        onError(new Error('Firestore: permission denied'));
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useVendorRequestsList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.requests).toEqual([]);
    });
  });

  // ─── Caso 7: cleanup en unmount ──────────────────────────────────────────
  describe('caso 7 — cleanup en unmount', () => {
    it('llama a unsubscribe cuando el hook se desmonta', async () => {
      mockUseCurrentUser.mockReturnValue({ vendorID: 'vendor-1' });
      mockOnSnapshot.mockImplementation((ref, onNext) => {
        onNext({ docs: [] });
        return mockUnsubscribe;
      });

      const { unmount } = renderHook(() => useVendorRequestsList());

      await waitFor(() => {
        expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
      });

      act(() => unmount());

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Caso 8: getDoc lanza excepción ─────────────────────────────────────
  describe('caso 8 — getDoc lanza excepción', () => {
    it('retorna el item sin datos extra y no propaga el error', async () => {
      const mockRef = { id: 'error-req' };
      mockUseCurrentUser.mockReturnValue({ vendorID: 'vendor-1' });
      mockGetDoc.mockRejectedValue(new Error('Network error'));
      mockOnSnapshot.mockImplementation((ref, onNext) => {
        onNext({
          docs: [
            {
              id: 'req-1',
              data: () => ({ status: 'pending', offer: { price: 750 }, requestRef: mockRef }),
            },
          ],
        });
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useVendorRequestsList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.requests).toEqual([
        { id: 'req-1', vendorStatus: 'pending', offer: { price: 750 } },
      ]);
    });
  });
});
