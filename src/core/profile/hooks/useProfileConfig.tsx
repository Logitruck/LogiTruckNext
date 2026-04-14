import { ReactNode } from 'react';

export const ProfileConfigProvider = ({
  children,
}: {
  children: ReactNode;
  config?: unknown;
}) => children;