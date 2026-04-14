import { Timestamp } from 'firebase/firestore';

// 🔹 Serialize Date → ISO string
export const serializeDate = (date: Date): string => {
  return date.toISOString();
};

// 🔹 Deserialize ISO → Date
export const deserializeDate = (isoString: string): Date => {
  return new Date(isoString);
};

// 🔹 Format Date (reemplazo de moment)
export const formatDate = (date: Date | null): string => {
  if (!date) return 'N/A';

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return 'N/A';
  }
};

// 🔹 Convert Date → Firestore Timestamp
export const toFirestoreTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// 🔹 Convert Firestore Timestamp → Date
export const fromFirestoreTimestamp = (timestamp: any): Date | null => {
  if (!timestamp) return null;

  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  if (timestamp?.seconds) {
    return new Date(timestamp.seconds * 1000);
  }

  const parsed = new Date(timestamp);
  return isNaN(parsed.getTime()) ? null : parsed;
};