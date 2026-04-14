const useReadyForSignature = (
  checklistItems: any[],
  submittedDocuments: any[]
) => {
  if (!checklistItems?.length || !submittedDocuments?.length) return false;

  const approvedSections = new Set(
    submittedDocuments
      .filter((doc) => doc.status === 'approved')
      .map((doc) => doc.checklistItemLabel)
  );

  return checklistItems.every((item) => approvedSections.has(item));
};

export default useReadyForSignature;