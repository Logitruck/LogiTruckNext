import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { decode } from '@liberty-rider/flexpolyline';
import { db } from '../../../../core/firebase/config';

const useCompletedPolyline = (
  channelID?: string,
  projectID?: string,
  jobID?: string
) => {
  const [polylineCoords, setPolylineCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolyline = async () => {
      if (!channelID || !projectID || !jobID) {
        setPolylineCoords([]);
        setLoading(false);
        return;
      }

      try {
        const jobRef = doc(
          db,
          'project_channels',
          channelID,
          'projects',
          projectID,
          'jobs',
          jobID
        );

        const jobSnap = await getDoc(jobRef);

        if (!jobSnap.exists()) {
          setPolylineCoords([]);
          return;
        }

        const data = jobSnap.data();

        if (data?.completedPolyline) {
          const decodedResult: any = decode(data.completedPolyline);
          const decoded = decodedResult?.polyline || decodedResult;

          const coords = decoded.map(([lat, lon]: [number, number]) => ({
            latitude: lat,
            longitude: lon,
          }));

          setPolylineCoords(coords);
        } else {
          setPolylineCoords([]);
        }
      } catch (err) {
        console.error('🔥 Error loading completed polyline:', err);
        setPolylineCoords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPolyline();
  }, [channelID, projectID, jobID]);

  return { polylineCoords, loading };
};

export default useCompletedPolyline;