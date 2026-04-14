import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
  Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTheme, useTranslations } from '../../../../../../core/dopebase';
import { dynamicStepStyles } from './styles';

type Props = {
  data: any;
  setData: React.Dispatch<React.SetStateAction<any>>;
  onValidationChange: (value: boolean) => void;
};

const SetupStepAvailability = ({
  data,
  setData,
  onValidationChange,
}: Props) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStepStyles(theme, appearance);

  const initialStartDate = data?.carrierAvailability?.startDate
    ? new Date(data.carrierAvailability.startDate)
    : null;

  const initialTripsPerDay =
    data?.carrierAvailability?.tripsPerDay != null
      ? String(data.carrierAvailability.tripsPerDay)
      : '';

  const [startDate, setStartDate] = useState<Date | null>(initialStartDate);
  const [tripsPerDay, setTripsPerDay] = useState(initialTripsPerDay);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const valid =
      !!startDate &&
      tripsPerDay.trim() !== '' &&
      !Number.isNaN(Number(tripsPerDay)) &&
      Number(tripsPerDay) > 0;

    onValidationChange(valid);
  }, [startDate, tripsPerDay, onValidationChange]);

  useEffect(() => {
    setData((prev: any) => ({
      ...prev,
      carrierAvailability: {
        startDate: startDate ? startDate.toISOString() : null,
        tripsPerDay:
          tripsPerDay.trim() !== '' && !Number.isNaN(Number(tripsPerDay))
            ? Number(tripsPerDay)
            : null,
      },
    }));
  }, [startDate, tripsPerDay, setData]);

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.label}>{localized('Estimated Start Date')}</Text>

      <Pressable
        style={styles.dateInputContainer}
        onPress={() => {
          Keyboard.dismiss();
          setShowDatePicker(true);
        }}
      >
        <Text style={styles.dateInputText}>
          {startDate ? startDate.toDateString() : localized('Select a date')}
        </Text>
      </Pressable>

      {showDatePicker && (
        <DateTimePicker
          mode="date"
          display={Platform.OS === 'ios' ? 'default' : 'default'}
          value={startDate || new Date()}
          onChange={(_, date) => {
            setShowDatePicker(false);
            if (date) {
              setStartDate(date);
            }
          }}
        />
      )}

      <Text style={styles.label}>{localized('Trips per Day')}</Text>

      <TextInput
        style={styles.input}
        keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
        value={tripsPerDay}
        onChangeText={setTripsPerDay}
        placeholder={localized('e.g. 2')}
        placeholderTextColor={theme.colors[appearance].secondaryText}
        returnKeyType="done"
        blurOnSubmit
        onSubmitEditing={() => Keyboard.dismiss()}
      />
    </View>
  );
};

export default SetupStepAvailability;