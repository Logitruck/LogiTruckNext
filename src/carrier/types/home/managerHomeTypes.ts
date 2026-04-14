export type PrioritySeverity = 'low' | 'medium' | 'high';

export type ManagerHomeStat = {
  id: string;
  label: string;
  value: number;
  icon?: string;
};

export type PriorityActionItem = {
  id: string;
  label: string;
  count: number;
  severity: PrioritySeverity;
  target?: any;
};

export type ActivityFeedItemType = {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  createdAt?: any;
};
