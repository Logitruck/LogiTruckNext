import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { db } from '../../../core/firebase/config';
import { SaveFuelExpenseInput, VehicleExpense } from '../types';

export type SaveRepairExpenseInput = {
  vendorID: string;
  vehicleID: string;
  vehicleType?: 'Truck' | 'Trailer';
  amount: number;
  repairCategory?: string;
  vendorName?: string;
  invoiceNumber?: string;
  partsAmount?: number | null;
  laborAmount?: number | null;
  correctedItemLabel?: string;
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
  } | null;
  jobID?: string | null;
  projectID?: string | null;
  channelID?: string | null;
  inspectionID?: string | null;
  createdBy?: {
    userID: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null;
};

const roundToTwo = (value: number) => Math.round(value * 100) / 100;

export const buildFuelExpensePayload = (
  input: SaveFuelExpenseInput,
): Omit<VehicleExpense, 'id'> => {
  return {
    expenseType: 'fuel',
    vendorID: input.vendorID,
    vehicleID: input.vehicleID,
    vehicleType: input.vehicleType || 'Truck',
    amount: roundToTwo(input.amount),
    currency: 'USD',
    date: serverTimestamp(),
    gallons: roundToTwo(input.gallons),
    pricePerGallon: roundToTwo(input.pricePerGallon),
    fuelType: input.fuelType || 'diesel',
    stationName: input.stationName?.trim() || null,
    odometerReading: input.odometerReading?.trim() || null,
    notes: input.notes?.trim() || null,
    createdBy: input.createdBy || null,
    jobID: input.jobID || null,
    projectID: input.projectID || null,
    channelID: input.channelID || null,
    location: input.location || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
};

export const buildRepairExpensePayload = (
  input: SaveRepairExpenseInput,
): Omit<VehicleExpense, 'id'> => {
  return {
    expenseType: 'repair',
    vendorID: input.vendorID,
    vehicleID: input.vehicleID,
    vehicleType: input.vehicleType || 'Truck',
    amount: roundToTwo(input.amount),
    currency: 'USD',
    date: serverTimestamp(),
    notes: input.notes?.trim() || null,
    createdBy: input.createdBy || null,
    jobID: input.jobID || null,
    projectID: input.projectID || null,
    channelID: input.channelID || null,
    inspectionID: input.inspectionID || null,
    location: input.location || null,
    repairCategory: input.repairCategory?.trim() || null,
    vendorName: input.vendorName?.trim() || null,
    invoiceNumber: input.invoiceNumber?.trim() || null,
    partsAmount:
      typeof input.partsAmount === 'number'
        ? roundToTwo(input.partsAmount)
        : null,
    laborAmount:
      typeof input.laborAmount === 'number'
        ? roundToTwo(input.laborAmount)
        : null,
    correctedItemLabel: input.correctedItemLabel?.trim() || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
};

export const saveFuelExpense = async (input: SaveFuelExpenseInput) => {
  const expensesRef = collection(
    db,
    'vendor_vehicles',
    input.vendorID,
    'vehicles',
    input.vehicleID,
    'expenses',
  );

  const expenseRef = doc(expensesRef);
  const payload = buildFuelExpensePayload(input);

  await setDoc(expenseRef, {
    id: expenseRef.id,
    ...payload,
  });

  return {
    id: expenseRef.id,
    ...payload,
  };
};

export const saveRepairExpense = async (input: SaveRepairExpenseInput) => {
  const expensesRef = collection(
    db,
    'vendor_vehicles',
    input.vendorID,
    'vehicles',
    input.vehicleID,
    'expenses',
  );

  const expenseRef = doc(expensesRef);
  const payload = buildRepairExpensePayload(input);

  await setDoc(expenseRef, {
    id: expenseRef.id,
    ...payload,
  });

  return {
    id: expenseRef.id,
    ...payload,
  };
};