import { useEffect } from 'react';
import { useCurrentUser } from '../../onboarding/hooks/useAuth';
import { useTranslations } from '../../dopebase';

const LanguageInitializer = () => {
  const currentUser = useCurrentUser();
  const { setAppLocale } = useTranslations();

  useEffect(() => {
    if (currentUser?.preferredLanguage) {
      setAppLocale(currentUser.preferredLanguage);
    }
  }, [currentUser?.preferredLanguage]);

  return null;
};

export default LanguageInitializer;
