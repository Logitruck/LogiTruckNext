export type VehicleExpenseType = 'fuel' | 'repair';

export type FuelType = 'diesel' | 'gasoline' | 'def';

export type VehicleExpense = {
  id: string;
  expenseType: VehicleExpenseType;

  vendorID: string;
  vehicleID: string;
  vehicleType?: 'Truck' | 'Trailer';

  amount: number;
  currency: 'USD';
  date: any;

  notes?: string | null;
  odometerReading?: string | null;

  createdBy?: {
    userID: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;

  jobID?: string | null;
  projectID?: string | null;
  channelID?: string | null;
  inspectionID?: string | null;

  location?: {
    latitude: number;
    longitude: number;
  } | null;

  receiptURL?: string | null;

  gallons?: number | null;
  pricePerGallon?: number | null;
  fuelType?: FuelType | null;
  stationName?: string | null;

  repairCategory?: string | null;
  vendorName?: string | null;
  invoiceNumber?: string | null;
  partsAmount?: number | null;
  laborAmount?: number | null;
  correctedItemLabel?: string | null;

  createdAt?: any;
  updatedAt?: any;
};

export type SaveFuelExpenseInput = {
  vendorID: string;
  vehicleID: string;
  vehicleType?: 'Truck' | 'Trailer';
  amount: number;
  gallons: number;
  pricePerGallon: number;
  fuelType: FuelType;
  stationName?: string;
  odometerReading?: string;
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
  } | null;
  jobID?: string | null;
  projectID?: string | null;
  channelID?: string | null;
  createdBy?: {
    userID: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
};