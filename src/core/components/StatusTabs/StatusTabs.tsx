import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, useTranslations } from '../../dopebase';
import { dynamicStyles } from './StatusTabs.styles';

type TabItem = {
  key?: string;
  status?: string;
  label: string;
  icon?: string;
  color?: string;
};

type StatusTabsProps = {
  tabs?: TabItem[];
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  initialStatus?: string;
  counters?: Record<string, number>;
  renderContent?: (activeTab: string) => React.ReactNode;
};

const StatusTabs = ({
  tabs = [],
  activeTab: controlledTab,
  setActiveTab: controlledSetTab,
  initialStatus,
  counters = {},
  renderContent,
}: StatusTabsProps) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const colorSet = theme.colors[appearance];

  const isControlled =
    typeof controlledTab === 'string' &&
    typeof controlledSetTab === 'function';

  const [internalTab, setInternalTab] = useState(
    initialStatus || tabs[0]?.key || tabs[0]?.status || ''
  );

  const activeTab = isControlled ? controlledTab : internalTab;
  const setActiveTab = isControlled ? controlledSetTab : setInternalTab;

  useEffect(() => {
    if (!isControlled && initialStatus) {
      setInternalTab(initialStatus);
    }
  }, [initialStatus, isControlled]);

  return (
    <View style={styles.tabContainer}>
      <View style={styles.tabList}>
        {tabs.map(({ key, label, icon, color, status }) => {
          const tabKey = key || status || '';
          const isActive = activeTab === tabKey;
          const count = counters?.[tabKey] ?? 0;
          const activeColor = color || colorSet.primaryForeground;

          return (
            <TouchableOpacity
              key={tabKey}
              style={[
                styles.tabItem,
                isActive && styles.tabItemActive,
                isActive && { borderBottomColor: activeColor },
              ]}
              onPress={() => setActiveTab(tabKey)}
            >
              {icon && (
                <MaterialCommunityIcons
                  name={icon as any}
                  size={18}
                  color={isActive ? activeColor : colorSet.secondaryText}
                  style={{ marginBottom: 2 }}
                />
              )}

              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={[
                  styles.tabText,
                  isActive && { color: activeColor, fontWeight: "bold" },
                ]}
              >
                {localized(label)}
              </Text>

              {count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.tabContent}>
        {renderContent && typeof renderContent === 'function'
          ? renderContent(activeTab)
          : null}
      </View>
    </View>
  );
};

export default StatusTabs;