import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../core/firebase/config';

export type InspectionTemplateItem = {
  id: string;
  label: string;
  order?: number;
  combinedOrder?: number;
  vehicleType?: 'Truck' | 'Trailer' | string;
};

export type InspectionTemplate = {
  id: string;
  vehicleType?: 'Truck' | 'Trailer' | 'Mixed' | string;
  templateType?: 'vehicle' | 'combined' | string;
  mode?: 'separate' | 'combined' | string;
  title?: string;
  isActive?: boolean;
  version?: number;
  items: InspectionTemplateItem[];
  [key: string]: any;
};

export type VendorInspectionSettings = {
  vendorID: string;
  inspectionMode?: 'separate' | 'combined' | string;
  truckTemplateID?: string;
  trailerTemplateID?: string;
  combinedTemplateID?: string;
  allowTruckOnlyInspection?: boolean;
  allowTrailerOnlyInspection?: boolean;
  isActive?: boolean;
  version?: number;
  [key: string]: any;
};

type UseInspectionTemplateParams = {
  vendorID?: string | null;
  vehicleType?: 'Truck' | 'Trailer' | string;
};

const getDefaultTemplateDocID = (vehicleType?: string) => {
  if (vehicleType === 'Truck') return 'truck_default';
  if (vehicleType === 'Trailer') return 'trailer_default';
  return null;
};

const sortTemplateItems = (items: InspectionTemplateItem[] = []) => {
  return [...items].sort((a, b) => {
    const orderA =
      typeof a.combinedOrder === 'number' ? a.combinedOrder : Number(a.order || 0);
    const orderB =
      typeof b.combinedOrder === 'number' ? b.combinedOrder : Number(b.order || 0);

    return orderA - orderB;
  });
};

const useInspectionTemplate = ({
  vendorID,
  vehicleType,
}: UseInspectionTemplateParams) => {
  const [template, setTemplate] = useState<InspectionTemplate | null>(null);
  const [items, setItems] = useState<InspectionTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [settings, setSettings] = useState<VendorInspectionSettings | null>(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        setError(null);

        let resolvedSettings: VendorInspectionSettings | null = null;
        let templateDocID: string | null = null;

        if (vendorID) {
          const settingsRef = doc(db, 'vendor_inspection_settings', vendorID);
          const settingsSnap = await getDoc(settingsRef);

          if (settingsSnap.exists()) {
            resolvedSettings = {
              vendorID: settingsSnap.id,
              ...settingsSnap.data(),
            } as VendorInspectionSettings;

            setSettings(resolvedSettings);

            if (resolvedSettings.inspectionMode === 'combined') {
              templateDocID =
                resolvedSettings.combinedTemplateID || 'combined_default';
            } else {
              if (vehicleType === 'Truck') {
                templateDocID =
                  resolvedSettings.truckTemplateID || 'truck_default';
              } else if (vehicleType === 'Trailer') {
                templateDocID =
                  resolvedSettings.trailerTemplateID || 'trailer_default';
              }
            }
          } else {
            setSettings(null);
          }
        } else {
          setSettings(null);
        }

        if (!templateDocID) {
          templateDocID = getDefaultTemplateDocID(vehicleType);
        }

        if (!templateDocID) {
          setTemplate(null);
          setItems([]);
          setLoading(false);
          return;
        }

        const templateRef = doc(db, 'inspection_templates', templateDocID);
        const templateSnap = await getDoc(templateRef);

        if (!templateSnap.exists()) {
          setTemplate(null);
          setItems([]);
          setLoading(false);
          return;
        }

        const data = {
          id: templateSnap.id,
          ...templateSnap.data(),
        } as InspectionTemplate;

        const sortedItems = Array.isArray(data?.items)
          ? sortTemplateItems(data.items)
          : [];

        setTemplate(data);
        setItems(sortedItems);
      } catch (err) {
        console.error('[useInspectionTemplate] Error fetching template:', err);
        setError(err);
        setTemplate(null);
        setItems([]);
        setSettings(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [vendorID, vehicleType]);

  return {
    template,
    items,
    settings,
    loading,
    error,
  };
};

export default useInspectionTemplate;