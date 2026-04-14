import { ReactNode } from 'react';

export const VendorConfigProvider = ({
  children,
}: {
  children: ReactNode;
  config?: unknown;
}) => children;