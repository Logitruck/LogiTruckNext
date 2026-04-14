import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../../../core/firebase/config';

type CreateCarrierVehicleParams = {
  vendorID: string;
  type: 'Truck' | 'Trailer';
  number: string;
  licensePlate: string;
  name?: string;
  vin?: string;
  make?: string;
  model?: string;
  year?: string;
};

const useCreateCarrierVehicle = () => {
  const createVehicle = async ({
    vendorID,
    type,
    number,
    licensePlate,
    name = '',
    vin = '',
    make = '',
    model = '',
    year = '',
  }: CreateCarrierVehicleParams) => {
    if (!vendorID) {
      throw new Error('Missing vendorID');
    }

    const trimmedNumber = number.trim();
    const trimmedPlate = licensePlate.trim().toUpperCase();
    const trimmedName = name.trim();
    const trimmedVin = vin.trim().toUpperCase();
    const trimmedMake = make.trim();
    const trimmedModel = model.trim();
    const trimmedYear = year.trim();

    if (!trimmedNumber || !trimmedPlate) {
      throw new Error('Unit number and license plate are required');
    }

    const vehicleRef = doc(
      db,
      'vendor_vehicles',
      vendorID,
      'vehicles',
      `${type.toLowerCase()}_${Date.now()}`
    );

    await setDoc(vehicleRef, {
      vehicleID: vehicleRef.id,
      vendorID,
      type,
      vehicleType: type,

      number: trimmedNumber,
      name: trimmedName || trimmedNumber,
      licensePlate: trimmedPlate,

      vin: trimmedVin || null,
      make: trimmedMake || null,
      model: trimmedModel || null,
      year: trimmedYear || null,

      status: 'active',

      // estado operativo inicial para inspections
      operationalStatus: 'pending',
      requiresPretrip: true,
      hasOpenDefects: false,

      currentAssignedDriverID: null,
      lastInspectionStatus: null,
      lastInspectionID: null,
      lastInspectionDate: null,
      lastInspectionDriverID: null,
      lastInspectionPDF: null,
      lastApprovedDate: null,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: vehicleRef.id,
      vehicleID: vehicleRef.id,
      vendorID,
      type,
      vehicleType: type,
      number: trimmedNumber,
      name: trimmedName || trimmedNumber,
      licensePlate: trimmedPlate,
      vin: trimmedVin || null,
      make: trimmedMake || null,
      model: trimmedModel || null,
      year: trimmedYear || null,
      operationalStatus: 'pending',
      requiresPretrip: true,
      hasOpenDefects: false,
    };
  };

  return { createVehicle };
};

export default useCreateCarrierVehicle;