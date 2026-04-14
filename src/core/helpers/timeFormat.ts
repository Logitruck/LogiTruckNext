export const getUnixTimeStamp = () => {
  return Math.floor(Date.now() / 1000);
};

export const timeFormat = (timestamp: number) => {
  if (!timestamp) return '';

  const date = new Date(timestamp * 1000);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    }); // 3:20 PM
  }

  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' }); // Tue
  }

  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
  }); // 20 Jan
};