const getPrioritySeverity = (count: number) => {
  if (count >= 5) return 'high';
  if (count >= 1) return 'medium';
  return 'low';
};

export default getPrioritySeverity;
