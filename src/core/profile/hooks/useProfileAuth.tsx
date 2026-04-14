import { ReactNode } from 'react';

export const ProfileAuthProvider = ({
  children,
}: {
  children: ReactNode;
  authManager?: unknown;
}) => children;