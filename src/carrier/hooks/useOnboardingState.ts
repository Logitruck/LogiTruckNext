import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../core/firebase/config';

export interface OnboardingState {
  isComplete: boolean;
  steps: Record<string, boolean>;
  completedAt: string | null;
}

export interface UseOnboardingStateReturn {
  onboarding: OnboardingState | null;
  loading: boolean;
  error: Error | null;
  markStepComplete: (stepKey: string) => Promise<void>;
}

export function useOnboardingState(
  vendorID: string,
): UseOnboardingStateReturn {
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!vendorID) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = doc(db, 'vendors', vendorID);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        try {
          const data = snapshot.data();
          setOnboarding(data?.onboarding || null);
          setError(null);
        } catch (e) {
          setError(e as Error);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [vendorID]);

  const markStepComplete = async (stepKey: string): Promise<void> => {
    if (!vendorID) {
      throw new Error('VendorID is required to mark step complete');
    }
    const docRef = doc(db, 'vendors', vendorID);
    await updateDoc(docRef, {
      [`onboarding.steps.${stepKey}`]: true,
    });
  };

  return { onboarding, loading, error, markStepComplete };
}
