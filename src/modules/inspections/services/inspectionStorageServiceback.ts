import AsyncStorage from '@react-native-async-storage/async-storage';

const REPORT_PREFIX = 'report_';

// 🔹 Guardar reporte local
export const saveReportLocally = async (report: any) => {
  try {
    const key = `${REPORT_PREFIX}${report.inspectionID}`;

    const payload = {
      ...report,
      status: 'pending',
    };

    await AsyncStorage.setItem(key, JSON.stringify(payload));

    return true;
  } catch (error) {
    console.error('Error saving report locally:', error);
    return false;
  }
};

// 🔹 Obtener todos los reportes pendientes
export const getPendingReports = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const reportKeys = keys.filter(key => key.startsWith(REPORT_PREFIX));

    const reports = [];

    for (const key of reportKeys) {
      const value = await AsyncStorage.getItem(key);
      if (!value) continue;

      const parsed = JSON.parse(value);

      if (parsed.status === 'pending') {
        reports.push({ key, data: parsed });
      }
    }

    return reports;
  } catch (error) {
    console.error('Error getting pending reports:', error);
    return [];
  }
};

// 🔹 Marcar como sincronizado
export const markReportAsSynced = async (key: string, report: any) => {
  try {
    const updated = {
      ...report,
      status: 'synced',
    };

    await AsyncStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error('Error marking report as synced:', error);
  }
};

// 🔹 Eliminar reporte
export const removeReport = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing report:', error);
  }
};