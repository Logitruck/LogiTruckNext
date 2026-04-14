import React, { useMemo, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme, useTranslations } from '../../../../core/dopebase';
import { dynamicStyles } from './OffersManagementSection.styles';

type OffersManagementSectionProps = {
  offers: any[];
  onAccept: (vendorID: string) => void;
  onReject: (vendorID: string) => void;
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

const getOfferSummary = (offer: any) => {
  const matchedRoutes =
    offer?.matchedRoutes ||
    offer?.offer?.matchedRoutes ||
    [];

  const routeOffers =
    offer?.offer?.routeOffers ||
    [];

  const totalMatchedRoutes =
    offer?.matchedRoutesCount ||
    matchedRoutes.length ||
    routeOffers.length ||
    0;

  const totalTrips =
    offer?.offer?.totalTrips ||
    matchedRoutes.reduce(
      (sum: number, route: any) => sum + Number(route?.cargo?.trips || 0),
      0,
    );

  const totalPrice =
    offer?.offer?.totalPrice ??
    offer?.offer?.price ??
    '—';

  const estimatedDays =
    offer?.offer?.estimatedDays ??
    '—';

  const comment =
    offer?.offer?.comment ||
    '';

  return {
    matchedRoutes,
    routeOffers,
    totalMatchedRoutes,
    totalTrips,
    totalPrice,
    estimatedDays,
    comment,
  };
};

const OffersManagementSection = ({
  offers = [],
  onAccept,
  onReject,
}: OffersManagementSectionProps) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const [expandedVendorID, setExpandedVendorID] = useState<string | null>(null);

  const sortedOffers = useMemo(() => {
    return [...offers].sort((a, b) => {
      const aSummary = getOfferSummary(a);
      const bSummary = getOfferSummary(b);

      const aPrice = Number(aSummary.totalPrice || 0);
      const bPrice = Number(bSummary.totalPrice || 0);

      return aPrice - bPrice;
    });
  }, [offers]);

  const toggleExpanded = (vendorID: string) => {
    setExpandedVendorID((prev) => (prev === vendorID ? null : vendorID));
  };

  return (
    <View>
      <Text style={styles.header}>{localized('Offers Received')}</Text>

      {sortedOffers.length > 0 ? (
        sortedOffers.map((offer, index) => {
          const summary = getOfferSummary(offer);
          const isExpanded = expandedVendorID === offer.vendorID;

          return (
            <View key={offer.id || `${offer.vendorID}-${index}`} style={styles.card}>
              <Pressable
                style={styles.summaryHeader}
                onPress={() => toggleExpanded(offer.vendorID)}
              >
                <View style={styles.summaryLeft}>
                  <Text style={styles.vendor}>
                    {localized('Vendor')}: {offer.vendorID}
                  </Text>

                  <Text style={styles.summaryMainValue}>
                    ${summary.totalPrice}
                  </Text>
                </View>

                <View style={styles.summaryRight}>
                  <Text style={styles.summaryMeta}>
                    {localized('Routes')}: {summary.totalMatchedRoutes}
                  </Text>
                  <Text style={styles.summaryMeta}>
                    {localized('Trips')}: {summary.totalTrips}
                  </Text>
                  <Text style={styles.summaryMeta}>
                    {localized('ETA')}: {summary.estimatedDays}
                  </Text>
                  <Text style={styles.expandText}>
                    {isExpanded
                      ? localized('Hide details')
                      : localized('View details')}
                  </Text>
                </View>
              </Pressable>

              {isExpanded ? (
                <View style={styles.expandedContent}>
                  {summary.comment ? (
                    <View style={styles.commentBox}>
                      <Text style={styles.routesHeader}>
                        {localized('Comment')}
                      </Text>
                      <Text style={styles.routeMeta}>{summary.comment}</Text>
                    </View>
                  ) : null}

                  {summary.matchedRoutes.length > 0 ? (
                    <View style={styles.routesBox}>
                      <Text style={styles.routesHeader}>
                        {localized('Matched routes')}
                      </Text>

                      {summary.matchedRoutes.map(
                        (matchedRoute: any, routeIndex: number) => (
                          <View
                            key={matchedRoute?.id || routeIndex}
                            style={styles.routeItem}
                          >
                            <Text style={styles.routeText}>
                              {getRouteLabel(matchedRoute, localized, routeIndex)}
                            </Text>

                            <Text style={styles.routeMeta}>
                              {localized('Trips')}: {matchedRoute?.cargo?.trips ?? '—'}
                            </Text>
                          </View>
                        ),
                      )}
                    </View>
                  ) : null}

                  {summary.routeOffers.length > 0 ? (
                    <View style={styles.routesBox}>
                      <Text style={styles.routesHeader}>
                        {localized('Offer breakdown')}
                      </Text>

                      {summary.routeOffers.map(
                        (routeOffer: any, routeIndex: number) => {
                          const relatedRoute =
                            summary.matchedRoutes.find(
                              (matchedRoute: any) =>
                                matchedRoute?.id === routeOffer?.routeID,
                            ) || null;

                          return (
                            <View
                              key={routeOffer?.routeID || routeIndex}
                              style={styles.routeItem}
                            >
                              <Text style={styles.routeText}>
                                {relatedRoute
                                  ? getRouteLabel(relatedRoute, localized, routeIndex)
                                  : `${localized('Route')} ${routeIndex + 1}`}
                              </Text>

                              <Text style={styles.routeMeta}>
                                {localized('Price per trip')}: $
                                {routeOffer?.pricePerTrip ?? '—'}
                              </Text>

                              <Text style={styles.routeMeta}>
                                {localized('Trips offered')}: {routeOffer?.tripsOffered ?? '—'}
                              </Text>

                              {routeOffer?.notes ? (
                                <Text style={styles.routeMeta}>
                                  {localized('Notes')}: {routeOffer.notes}
                                </Text>
                              ) : null}
                            </View>
                          );
                        },
                      )}
                    </View>
                  ) : null}

                  <View style={styles.row}>
                    <Pressable
                      style={styles.accept}
                      onPress={() => onAccept(offer.vendorID)}
                    >
                      <Text style={styles.acceptText}>
                        {localized('Accept')}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.reject}
                      onPress={() => onReject(offer.vendorID)}
                    >
                      <Text style={styles.rejectText}>
                        {localized('Reject')}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          );
        })
      ) : (
        <Text style={styles.empty}>
          {localized('No offers available yet.')}
        </Text>
      )}
    </View>
  );
};

export default OffersManagementSection;