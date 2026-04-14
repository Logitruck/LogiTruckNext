import { useState, useEffect } from 'react';
import {
  doc,
  onSnapshot,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../../core/firebase/config';
import { useCurrentUser } from '../../../../core/onboarding/hooks/useAuth';

export type ProjectRoute = {
  id: string;
  origin?: any;
  destination?: any;
  rideType?: any;
  cargo?: any;

  pickupAlias?: string;
  dropoffAlias?: string;
  pickupSite?: string;
  dropoffSite?: string;
  pickupTime?: string;
  pickupContact?: string;
  dropoffContact?: string;
  pickupInstructions?: string;
  dropoffInstructions?: string;

  pricePerTrip?: number;
  tripsOffered?: number;
  notes?: string;

  date?: any;
  [key: string]: any;
};

const useProjectRoutes = (channelID?: string, projectID?: string) => {
  const currentUser = useCurrentUser();
  const activeVendorID =
    currentUser?.activeVendorID ||
    currentUser?.vendorID ||
    null;

  const [routes, setRoutes] = useState<ProjectRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!channelID || !projectID || !activeVendorID) {
      setRoutes([]);
      setLoading(false);
      return;
    }

    const projectRef = doc(
      db,
      'project_channels',
      channelID,
      'projects',
      projectID,
    );

    const unsubscribe = onSnapshot(
      projectRef,
      (projectSnap) => {
        if (!projectSnap.exists()) {
          setRoutes([]);
          setLoading(false);
          return;
        }

        const projectData = projectSnap.data();

        // Permitir acceso si el vendor activo participa en el proyecto
        const participants = Array.isArray(projectData?.participants)
          ? projectData.participants
          : [];

        const isAuthorized =
          projectData?.finderID === activeVendorID ||
          projectData?.carrierID === activeVendorID ||
          projectData?.confirmedVendor === activeVendorID ||
          participants.includes(activeVendorID);

        if (!isAuthorized) {
          setRoutes([]);
          setLoading(false);
          return;
        }

        const projectRoutes = Array.isArray(projectData?.routes)
          ? projectData.routes
          : [];

        setRoutes(projectRoutes);
        setLoading(false);
      },
      (err) => {
        console.error('❌ [useProjectRoutes] Error fetching routes:', err);
        setError(err);
        setLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [channelID, projectID, activeVendorID]);

  return { routes, loading, error };
};

const getRouteByID = async (
  channelID: string,
  projectID: string,
  routeID: string,
  activeVendorID?: string | null,
): Promise<ProjectRoute | null> => {
  try {
    const projectRef = doc(
      db,
      'project_channels',
      channelID,
      'projects',
      projectID,
    );

    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      return null;
    }

    const projectData = projectSnap.data();

    if (activeVendorID) {
      const participants = Array.isArray(projectData?.participants)
        ? projectData.participants
        : [];

      const isAuthorized =
        projectData?.finderID === activeVendorID ||
        projectData?.carrierID === activeVendorID ||
        projectData?.confirmedVendor === activeVendorID ||
        participants.includes(activeVendorID);

      if (!isAuthorized) {
        throw new Error('Unauthorized access');
      }
    }

    const routes = Array.isArray(projectData?.routes) ? projectData.routes : [];

    const route =
      routes.find((item: ProjectRoute) => item.id === routeID) || null;

    return route;
  } catch (err) {
    console.error('[useProjectRoutes] Error fetching route by ID:', err);
    throw err;
  }
};

const updateRoute = async (
  channelID: string,
  projectID: string,
  routeID: string,
  updates: Partial<ProjectRoute>,
  activeVendorID?: string | null,
) => {
  try {
    const projectRef = doc(
      db,
      'project_channels',
      channelID,
      'projects',
      projectID,
    );

    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      throw new Error('Project not found');
    }

    const projectData = projectSnap.data();

    if (activeVendorID) {
      const participants = Array.isArray(projectData?.participants)
        ? projectData.participants
        : [];

      const isAuthorized =
        projectData?.finderID === activeVendorID ||
        projectData?.carrierID === activeVendorID ||
        projectData?.confirmedVendor === activeVendorID ||
        participants.includes(activeVendorID);

      if (!isAuthorized) {
        throw new Error('Unauthorized action');
      }
    }

    const currentRoutes = Array.isArray(projectData?.routes)
      ? projectData.routes
      : [];

    const updatedRoutes = currentRoutes.map((route: ProjectRoute) =>
      route.id === routeID
        ? {
            ...route,
            ...updates,
          }
        : route,
    );

    await updateDoc(projectRef, {
      routes: updatedRoutes,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('[useProjectRoutes] Error updating route:', err);
    throw err;
  }
};

export default useProjectRoutes;
export { getRouteByID, updateRoute };