import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import ContractSummaryScreen from '../screens/contracts/contractSummaryScreen/ContractSummaryScreen';
import ContractSigningScreen from '../screens/contracts/ContractSigningScreen/ContractSigningScreen';
import AssociateDocumentsScreen from '../screens/contracts/AssociateDocumentsScreen/AssociateDocumentsScreen';
import CompanyDocumentsScreen from '../screens/contracts/companyDocumentsScreen/CompanyDocumentsScreen';

export type ContractStackParamList = {
  ContractSummary: {
    requestID: string;
    vendorID: string;
  };

  ContractSigning: {
    requestID: string;
    vendorID: string;
  };

  AssociateDocuments: {
    requestID: string;
    vendorID: string;
    docType?: string;
  };

  CompanyDocuments: {
    vendorID: string;
  };
};

const Stack = createNativeStackNavigator<ContractStackParamList>();

const ContractStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{

      }}
    >
      <Stack.Screen
        name="ContractSummary"
        component={ContractSummaryScreen}
        options={{ title: 'Contract Summary' }}
      />

      <Stack.Screen
        name="ContractSigning"
        component={ContractSigningScreen}
        options={{ title: 'Sign Contract' }}
      />

      <Stack.Screen
        name="AssociateDocuments"
        component={AssociateDocumentsScreen}
        options={{ title: 'Associate Documents' }}
      />

      <Stack.Screen
        name="CompanyDocuments"
        component={CompanyDocumentsScreen}
        options={{ title: 'Company Documents' }}
      />
    </Stack.Navigator>
  );
};

export default ContractStackNavigator;