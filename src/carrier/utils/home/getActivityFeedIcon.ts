const getActivityFeedIcon = (type: string) => {
  switch (type) {
    case 'inspection':
      return 'clipboard-check-outline';
    case 'job':
      return 'briefcase-outline';
    case 'offer':
      return 'tag-outline';
    default:
      return 'bell-outline';
  }
};

export default getActivityFeedIcon;
