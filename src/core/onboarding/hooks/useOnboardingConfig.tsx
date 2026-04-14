import { createContext, ReactNode, useContext } from 'react';

type OnboardingConfigContextType = {
  config: any;
};

const OnboardingConfigContext = createContext<OnboardingConfigContextType>({
  config: {
    isDelayedLoginEnabled: false,
  },
});

export const OnboardingConfigProvider = ({
  children,
  config,
}: {
  children: ReactNode;
  config?: any;
}) => {
  return (
    <OnboardingConfigContext.Provider
      value={{
        config: config ?? {
          isDelayedLoginEnabled: false,
        },
      }}
    >
      {children}
    </OnboardingConfigContext.Provider>
  );
};

export const useOnboardingConfig = () => useContext(OnboardingConfigContext);