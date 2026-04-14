import { StyleSheet } from 'react-native';

export const dynamicStepStyles = (
  theme: any,
  appearance: 'light' | 'dark'
) => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    stepContainer: {
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.primaryBackground,
    },

    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 8,
      marginTop: 12,
    },

    input: {
      minHeight: 48,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.primaryText,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    dateInputContainer: {
      minHeight: 48,
      borderRadius: 12,
      paddingHorizontal: 14,
      justifyContent: 'center',
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    dateInputText: {
      fontSize: 15,
      color: colors.primaryText,
    },

    textArea: {
      minHeight: 110,
      textAlignVertical: 'top',
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 12,
    },

    helperText: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 6,
    },

    card: {
      padding: 14,
      borderRadius: 14,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
    },

    cardSelected: {
      borderColor: colors.primaryForeground,
      borderWidth: 2,
    },

    cardTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primaryText,
    },

    cardSubtitle: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 4,
    },
    sectionContainer: {
  marginBottom: 20,
},

sectionHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 10,
},

sectionIcon: {
  marginRight: 8,
  color: colors.primaryText,
},

listTitle: {
  fontSize: 15,
  fontWeight: '700',
  color: colors.primaryText,
},

selectedItemContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingVertical: 10,
  paddingHorizontal: 12,
  marginTop: 8,
  borderRadius: 10,
  backgroundColor: colors.secondaryBackground,
  borderWidth: 1,
  borderColor: colors.border,
},

selectedItemText: {
  fontSize: 14,
  color: colors.primaryText,
  flex: 1,
  marginRight: 12,
},

itemText: {
  fontSize: 14,
  color: colors.primaryText,
  marginBottom: 6,
},

confirmButton: {
  marginTop: 20,
  minHeight: 48,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.primaryForeground,
},

confirmButtonText: {
  fontSize: 15,
  fontWeight: '700',
  color: colors.buttonText,
},
selectorButton: {
  minHeight: 50,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.hairline,
  paddingHorizontal: 16,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: colors.surface,
},

selectorButtonText: {
  fontSize: 14,
  color: colors.text,
},
addNewButton: {
  marginTop: 10,
  marginBottom: 10,
  flexDirection: 'row',
  alignItems: 'center',
},

addNewText: {
  marginLeft: 8,
  fontSize: 14,
  fontWeight: '600',
  color: colors.primaryForeground,
},


  });
};