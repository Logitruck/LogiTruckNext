import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Signature from 'react-native-signature-canvas';
import Pdf from 'react-native-pdf';
import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './styles';
import useUploadSignedContract from '../../../hooks/useUploadSignedContract';
import useContractSignatures from '../../../hooks/useContractSignatures';

const RNHTMLtoPDF = require('react-native-html-to-pdf');

const formatDate = (value?: string) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toDateString();
};

const getRouteLabel = (
  route: any,
  localized: (key: string) => string,
  index: number,
) => {
  const originTitle = route?.origin?.title ?? localized('Unknown origin');
  const destinationTitle =
    route?.destination?.title ?? localized('Unknown destination');

  if (
    originTitle === localized('Unknown origin') &&
    destinationTitle === localized('Unknown destination')
  ) {
    return `${localized('Route')} ${index + 1}`;
  }

  return `${originTitle} → ${destinationTitle}`;
};

const ContractSigningScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { request, offer, role } = route?.params || {};

  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const [signature, setSignature] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [pendingSigned, setPendingSigned] = useState<boolean | null>(null);

  const { upload } = useUploadSignedContract(localized, navigation);
  const { signatures, loading, saveSignature } = useContractSignatures(
    request?.id,
  );

  const acceptedRoutes = useMemo(() => {
    const allRoutes = request?.routes || [];

    if (!offer) return allRoutes;

    if (Array.isArray(offer?.matchedRoutes) && offer.matchedRoutes.length > 0) {
      return offer.matchedRoutes;
    }

    const acceptedRouteIDs =
      offer?.offer?.routeOffers?.map((routeOffer: any) => routeOffer?.routeID) || [];

    if (acceptedRouteIDs.length === 0) {
      return allRoutes;
    }

    return allRoutes.filter((currentRoute: any) =>
      acceptedRouteIDs.includes(currentRoute?.id),
    );
  }, [request, offer]);

  const summary = useMemo(() => {
    const totalRoutes = acceptedRoutes.length;

    const totalTrips =
      offer?.offer?.totalTrips ||
      acceptedRoutes.reduce(
        (sum: number, currentRoute: any) =>
          sum + Number(currentRoute?.cargo?.trips || 0),
        0,
      );

    const totalPrice = offer?.offer?.totalPrice ?? 0;
    const estimatedDays = offer?.offer?.estimatedDays ?? '—';

    return {
      totalRoutes,
      totalTrips,
      totalPrice,
      estimatedDays,
    };
  }, [acceptedRoutes, offer]);

  const signatureStyle = `
    .m-signature-pad--body canvas {
      width: 100%;
      height: 200px;
    }
    .m-signature-pad--footer .button {
      background-color: green;
      color: #f2f2f2;
    }
    .m-signature-pad {
      border: 2px solid #000;
      height: 280px;
      box-shadow: none;
    }
    .m-signature-pad--body {
      border: 3px solid #000;
      height: 200px;
    }
  `;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: localized('Sign Contract'),
      headerBackTitleVisible: false,
    });
  }, [navigation, localized]);

  useEffect(() => {
    if (!request || !offer) {
      setInitialLoad(false);
      return;
    }

    if (role === 'finder' && signatures.finder) {
      setSignature(signatures.finder);
    } else if (role === 'carrier' && signatures.carrier) {
      setSignature(signatures.carrier);
    }

    generatePDF(false);
    setInitialLoad(false);
  }, [signatures, role, request?.id, offer?.offer?.totalPrice]);

  useEffect(() => {
    if (pendingSigned !== null) {
      generatePDF(pendingSigned);
      setPendingSigned(null);
    }
  }, [pendingSigned]);

  const generatePDF = async (signed = false) => {
    if (!request || !offer) {
      setPdfUri(null);
      return;
    }

    const isFinder = role === 'finder';

    const finderSignature =
      isFinder && signature ? signature : signatures?.finder ?? null;

    const carrierSignature =
      !isFinder && signature ? signature : signatures?.carrier ?? null;

    const routesHtml = acceptedRoutes
      .map((currentRoute: any, index: number) => {
        const relatedRouteOffer =
          offer?.offer?.routeOffers?.find(
            (routeOffer: any) => routeOffer?.routeID === currentRoute?.id,
          ) || null;

        return `
          <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #ccc; border-radius: 8px;">
            <p><strong>${localized('Route')} ${index + 1}:</strong> ${getRouteLabel(
              currentRoute,
              localized,
              index,
            )}</p>
            <p><strong>${localized('Trips')}:</strong> ${currentRoute?.cargo?.trips ?? '—'}</p>
            <p><strong>${localized('Start Date')}:</strong> ${formatDate(
              currentRoute?.cargo?.startDate,
            )}</p>
            <p><strong>${localized('Distance')}:</strong> ${
              currentRoute?.routeSummary?.distanceMiles ?? '—'
            } mi</p>
            <p><strong>${localized('Duration')}:</strong> ${
              currentRoute?.routeSummary?.durationMinutes ?? '—'
            } min</p>
            ${
              relatedRouteOffer
                ? `
                  <p><strong>${localized('Price per trip')}:</strong> $${
                    relatedRouteOffer?.pricePerTrip ?? '—'
                  }</p>
                  <p><strong>${localized('Trips offered')}:</strong> ${
                    relatedRouteOffer?.tripsOffered ?? '—'
                  }</p>
                  ${
                    relatedRouteOffer?.notes
                      ? `<p><strong>${localized('Notes')}:</strong> ${relatedRouteOffer.notes}</p>`
                      : ''
                  }
                `
                : ''
            }
          </div>
        `;
      })
      .join('');

    const html = `
      <html>
        <body style="font-family: Arial; padding: 24px;">
          <h2 style="text-align: center;">${localized('Transport Contract')}</h2>

          <p><strong>${localized('Accepted Routes')}:</strong> ${summary.totalRoutes}</p>
          <p><strong>${localized('Total Trips')}:</strong> ${summary.totalTrips}</p>
          <p><strong>${localized('Offer Total')}:</strong> $${summary.totalPrice}</p>
          <p><strong>${localized('Estimated Days')}:</strong> ${summary.estimatedDays}</p>
          <p><strong>${localized('Signed At')}:</strong> ${
            signed ? new Date().toDateString() : '_________________'
          }</p>

          <h3 style="margin-top: 24px;">${localized('Accepted Route Details')}</h3>
          ${routesHtml}

          <p><strong>${localized('Finder Signature')}:</strong></p>
          ${
            finderSignature
              ? `<img src="${finderSignature}" style="width: 100%; height: 100px; border: 1px solid #000;" />`
              : `<div style="width: 100%; height: 100px; border: 1px solid #000;"></div>`
          }

          <p><strong>${localized('Carrier Signature')}:</strong></p>
          ${
            carrierSignature
              ? `<img src="${carrierSignature}" style="width: 100%; height: 100px; border: 1px solid #000;" />`
              : `<div style="width: 100%; height: 100px; border: 1px solid #000;"></div>`
          }
        </body>
      </html>
    `;

    try {
      const file = await RNHTMLtoPDF.generatePDF({
        html,
        fileName: `contract_${signed ? 'signed_' : 'draft_'}${Date.now()}`,
        directory: 'Documents',
      });

      setPdfUri(file.filePath ?? null);
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      setPdfUri(null);
    }
  };

  const handleSignature = async (sig: string) => {
    try {
      setModalVisible(false);
      setSignature(sig);

      await saveSignature(role, sig);
      setPendingSigned(true);
    } catch (error) {
      console.error('❌ Error saving signature:', error);
      Alert.alert(
        localized('Error'),
        localized('Could not save signature'),
      );
    }
  };

  const handleUpload = async () => {
    if (!pdfUri || !signature) {
      Alert.alert(
        localized('Error'),
        localized('Missing signed contract data'),
      );
      return;
    }

    try {
      setUploading(true);
      await upload(request, role, pdfUri, signature);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      scrollEnabled={isScrollEnabled}
      showsVerticalScrollIndicator={false}
    >
      {loading || initialLoad ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors[appearance].primaryForeground}
          />
          <Text style={styles.infoText}>
            {localized('Generating contract...')}
          </Text>
        </View>
      ) : pdfUri ? (
        <Pdf
          source={{ uri: pdfUri }}
          style={styles.pdf}
          trustAllCerts={false}
        />
      ) : (
        <View style={styles.loaderContainer}>
          <Text style={styles.infoText}>
            {localized('Error generating contract.')}
          </Text>
        </View>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.buttonText}>{localized('Sign')}</Text>
        </TouchableOpacity>

        {signature && pdfUri ? (
          <TouchableOpacity
            style={styles.button}
            onPress={handleUpload}
            disabled={uploading}
          >
            <Text style={styles.buttonText}>
              {uploading
                ? localized('Uploading...')
                : localized('Submit')}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.signatureModal}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.signatureContainer}>
              <Signature
                onBegin={() => setIsScrollEnabled(false)}
                onEnd={() => setIsScrollEnabled(true)}
                onOK={handleSignature}
                onEmpty={() => console.log('Empty')}
                descriptionText={localized('Sign here')}
                clearText={localized('Reset')}
                confirmText={localized('Save')}
                webStyle={signatureStyle}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, styles.cancelActionButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>{localized('Cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ContractSigningScreen;