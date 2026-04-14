import { useState } from 'react';
import { Alert } from 'react-native';

import {
  saveFuelExpense,
  saveRepairExpense,
  SaveRepairExpenseInput,
} from '../services/vehicleExpenseService';
import { SaveFuelExpenseInput } from '../types';

const useSaveVehicleExpense = (localized?: (key: string) => string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const saveFuel = async (input: SaveFuelExpenseInput) => {
    try {
      setLoading(true);
      setError(null);

      if (!input.vendorID) throw new Error('Missing vendorID');
      if (!input.vehicleID) throw new Error('Missing vehicleID');
      if (!input.amount || input.amount <= 0) {
        throw new Error('Amount must be greater than zero');
      }
      if (!input.gallons || input.gallons <= 0) {
        throw new Error('Gallons must be greater than zero');
      }
      if (!input.pricePerGallon || input.pricePerGallon <= 0) {
        throw new Error('Price per gallon must be greater than zero');
      }

      return await saveFuelExpense(input);
    } catch (err: any) {
      console.error('🔥 Error saving fuel expense:', err);
      setError(err);

      Alert.alert(
        localized?.('Error') || 'Error',
        err?.message ||
          localized?.('Could not save fuel expense') ||
          'Could not save fuel expense',
      );

      throw err;
    } finally {
      setLoading(false);
    }
  };

  const saveRepair = async (input: SaveRepairExpenseInput) => {
    try {
      setLoading(true);
      setError(null);

      if (!input.vendorID) throw new Error('Missing vendorID');
      if (!input.vehicleID) throw new Error('Missing vehicleID');
      if (!input.amount || input.amount <= 0) {
        throw new Error('Amount must be greater than zero');
      }

      return await saveRepairExpense(input);
    } catch (err: any) {
      console.error('🔥 Error saving repair expense:', err);
      setError(err);

      Alert.alert(
        localized?.('Error') || 'Error',
        err?.message ||
          localized?.('Could not save repair expense') ||
          'Could not save repair expense',
      );

      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    saveFuel,
    saveRepair,
    loading,
    error,
  };
};

export default useSaveVehicleExpense;