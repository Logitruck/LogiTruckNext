import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },

    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 24,
    },

    contentCard: {
      width: '100%',
      backgroundColor: colors.card || colors.white || colors.primaryBackground,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.hairline || colors.border || '#E5E7EB',
    },

    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 8,
      textAlign: 'center',
    },

    subtitle: {
      fontSize: 14,
      color: colors.secondaryText,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
    },

   

    imagePreview: {
      width: '100%',
      height: 280,
      borderRadius: 16,
      marginBottom: 20,
      resizeMode: 'cover',
      backgroundColor: colors.grey5 || '#E5E7EB',
    },
actionsColumn: {
  marginTop: 16,
},

captureButton: {
  backgroundColor: colors.primaryForeground,
  paddingVertical: 16,
  paddingHorizontal: 28,
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 56,
},

captureButtonText: {
  color: colors.buttonText, // ya lo tienes definido 👌
  fontSize: 16,
  fontWeight: '700',
},

saveButton: {
  backgroundColor: colors.primaryForeground,
  paddingVertical: 16,
  paddingHorizontal: 20,
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 12,
},

saveButtonText: {
  color: colors.white || '#FFFFFF',
  fontSize: 16,
  fontWeight: '700',
},

secondaryButton: {
  backgroundColor: colors.grey6 || '#E5E7EB',
  paddingVertical: 16,
  paddingHorizontal: 20,
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
},

secondaryButtonText: {
  color: colors.primaryText,
  fontSize: 15,
  fontWeight: '600',
},
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },

   
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.08)',
      zIndex: 10,
    },
    captureButtonVisible: {
  backgroundColor: '#111827',
  borderWidth: 0,
},
  });
};

export default dynamicStyles;