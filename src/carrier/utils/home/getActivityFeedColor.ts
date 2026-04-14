const getActivityFeedColor = (type: string) => {
  switch (type) {
    case 'inspection':
      return 'orange';
    case 'job':
      return 'green';
    case 'offer':
      return 'blue';
    default:
      return 'gray';
  }
};

export default getActivityFeedColor;
