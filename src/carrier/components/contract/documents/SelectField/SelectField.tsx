import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../../../core/dopebase';
import { dynamicStyles } from './styles';

type Option = {
  label: string;
  value: string;
};

type SelectFieldProps = {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
};

const SelectField = ({ label, value, options, onChange }: SelectFieldProps) => {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);
  const [visible, setVisible] = useState(false);

  const selectedLabel = useMemo(() => {
    return options.find((item) => item.value === value)?.label || 'Select';
  }, [options, value]);

  const handleSelect = (newValue: string) => {
    onChange(newValue);
    setVisible(false);
  };

  return (
    <>
      <Text style={styles.label}>{label}</Text>

      <Pressable style={styles.field} onPress={() => setVisible(true)}>
        <Text style={styles.valueText}>{selectedLabel}</Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={20}
          color={theme.colors[appearance].primaryText}
        />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const selected = item.value === value;

                return (
                  <Pressable
                    style={[styles.optionRow, selected && styles.optionRowSelected]}
                    onPress={() => handleSelect(item.value)}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {item.label}
                    </Text>
                    {selected && (
                      <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color={theme.colors[appearance].primaryForeground}
                      />
                    )}
                  </Pressable>
                );
              }}
            />

            <Pressable style={styles.closeButton} onPress={() => setVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default SelectField;