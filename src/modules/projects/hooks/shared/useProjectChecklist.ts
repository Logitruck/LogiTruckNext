import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../../core/firebase/config';

export type ProjectChecklistStatus =
  | 'pending'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'not_required';

export type ProjectChecklistCategory =
  | 'document'
  | 'operation'
  | 'compliance'
  | 'route'
  | 'resource';

export type ProjectChecklistAssignedTo =
  | 'finder'
  | 'carrier'
  | 'driver'
  | 'dispatcher'
  | null;

export type ProjectChecklistItem = {
  id: string;
  title: string;
  category: ProjectChecklistCategory;
  required: boolean;
  routeID: string | null;
  assignedTo: ProjectChecklistAssignedTo;
  status: ProjectChecklistStatus;
  notes: string;
  createdAt?: any;
  updatedAt?: any;
};

const useProjectChecklist = (channelID?: string, projectID?: string) => {
  const [items, setItems] = useState<ProjectChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelID || !projectID) {
      setItems([]);
      setLoading(false);
      return;
    }

    const checklistRef = collection(
      db,
      'project_channels',
      channelID,
      'projects',
      projectID,
      'checklist',
    );

    const checklistQuery = query(checklistRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      checklistQuery,
      (snapshot) => {
        const list = snapshot.docs.map((itemDoc) => ({
          id: itemDoc.id,
          ...itemDoc.data(),
        })) as ProjectChecklistItem[];

        setItems(list);
        setLoading(false);
      },
      (error) => {
        console.error('🔥 Error fetching project checklist:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [channelID, projectID]);

  const createItem = useCallback(
    async (payload: {
      title: string;
      category: ProjectChecklistCategory;
      required: boolean;
      routeID: string | null;
      assignedTo: ProjectChecklistAssignedTo;
      notes: string;
    }) => {
      if (!channelID || !projectID) {
        throw new Error('Missing channelID or projectID');
      }

      const checklistRef = collection(
        db,
        'project_channels',
        channelID,
        'projects',
        projectID,
        'checklist',
      );

      await addDoc(checklistRef, {
        title: payload.title.trim(),
        category: payload.category,
        required: payload.required,
        routeID: payload.routeID,
        assignedTo: payload.assignedTo,
        status: 'pending',
        notes: payload.notes?.trim() || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },
    [channelID, projectID],
  );

  const updateItemStatus = useCallback(
    async (itemID: string, status: ProjectChecklistStatus) => {
      if (!channelID || !projectID) {
        throw new Error('Missing channelID or projectID');
      }

      const itemRef = doc(
        db,
        'project_channels',
        channelID,
        'projects',
        projectID,
        'checklist',
        itemID,
      );

      await updateDoc(itemRef, {
        status,
        updatedAt: serverTimestamp(),
      });
    },
    [channelID, projectID],
  );

  const deleteItem = useCallback(
    async (itemID: string) => {
      if (!channelID || !projectID) {
        throw new Error('Missing channelID or projectID');
      }

      const itemRef = doc(
        db,
        'project_channels',
        channelID,
        'projects',
        projectID,
        'checklist',
        itemID,
      );

      await deleteDoc(itemRef);
    },
    [channelID, projectID],
  );

  return {
    items,
    loading,
    createItem,
    updateItemStatus,
    deleteItem,
  };
};

export default useProjectChecklist;