const { onCall, HttpsError } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');
const fetch = require('node-fetch');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

const db = admin.firestore();

const HERE_API_KEY = defineSecret('HERE_API_KEY');
const EIA_API_KEY = defineSecret('EIA_API_KEY');

const stateAbbreviationToDuoArea = {
  FL: 'MFL',
  CA: 'PCA',
  TX: 'MTX',
  NY: 'CNY',
  GA: 'MGA',
  NC: 'MNC',
};

const extractStateAbbreviation = (placeName = '') => {
  const matches = placeName.match(/,\s*([A-Z]{2})\b/);
  return matches ? matches[1] : null;
};

const getFullTripRequest = onCall(
  { secrets: [HERE_API_KEY, EIA_API_KEY] },
  async (request) => {
    const { origin, destination, categoryID, keyword } = request.data;

    if (
      !origin?.lat ||
      !origin?.lon ||
      !destination?.lat ||
      !destination?.lon ||
      !categoryID
    ) {
      throw new HttpsError('invalid-argument', 'Missing required fields.');
    }

    try {
      // 1. Buscar vendors
      const vendorCollection = db.collection('vendors');
      const vendorsSnapshot = await vendorCollection
        .where('serviceCategoryIDs', 'array-contains', categoryID)
        .get();

      const vendorIDs = new Set();
      vendorsSnapshot.forEach((doc) => vendorIDs.add(doc.id));

      if (keyword?.trim()) {
        const keywordSnapshot = await vendorCollection
          .where('searchKeywords', 'array-contains', keyword.toLowerCase().trim())
          .get();

        const keywordVendorIDs = new Set();
        keywordSnapshot.forEach((doc) => keywordVendorIDs.add(doc.id));

        const filtered = new Set(
          [...vendorIDs].filter((id) => keywordVendorIDs.has(id))
        );

        vendorIDs.clear();
        filtered.forEach((id) => vendorIDs.add(id));
      }

      const matchedVendors = [];

      for (const vendorID of vendorIDs) {
        const vendorDoc = await vendorCollection.doc(vendorID).get();
        const vendorData = vendorDoc.data();

        const locationsSnapshot = await db
          .collection('vendor_locations')
          .doc(vendorID)
          .collection('locations')
          .get();

        locationsSnapshot.forEach((locationDoc) => {
          const locData = locationDoc.data();
          const lat = locData?.location?.location?.lat;
          const lng = locData?.location?.location?.lng;
          const maxDistanceService = locData?.maxDistanceService;

          if (lat && lng && maxDistanceService) {
            const distance = haversine(origin.lat, origin.lon, lat, lng);

            if (distance <= parseFloat(maxDistanceService)) {
              matchedVendors.push({
                vendorID,
                vendorName: vendorData?.name ?? 'Unknown Vendor',
                vendorLocation: locData?.location?.label ?? 'Unknown',
                lat,
                lng,
                distance,
                maxDistanceService,
              });
            }
          }
        });
      }

      // 2. Ruta HERE
      const routeUrl =
        `https://router.hereapi.com/v8/routes` +
        `?origin=${origin.lat},${origin.lon}` +
        `&destination=${destination.lat},${destination.lon}` +
        `&transportMode=truck` +
        `&return=summary,tolls,polyline` +
        `&apikey=${HERE_API_KEY.value()}`;

      const routeRes = await fetch(routeUrl);
      const routeJson = await routeRes.json();

      const section = routeJson?.routes?.[0]?.sections?.[0];
      if (!section) {
        logger.error('HERE route response invalid', routeJson);
        throw new Error('No route section found.');
      }

      const summary = section.summary;
      const tolls = section.tolls || [];
      const encodedPolyline = section.polyline;

      const totalTollCost = tolls.reduce((sum, toll) => {
        if (Array.isArray(toll.fares)) {
          const tollSum = toll.fares.reduce((subSum, fare) => {
            const value = fare?.price?.value;
            return typeof value === 'number' ? subSum + value : subSum;
          }, 0);
          return sum + tollSum;
        }
        return sum;
      }, 0);

      const routeSummary = {
        distanceMiles: +(summary.length / 1609.34).toFixed(2),
        durationMinutes: Math.round(summary.duration / 60),
        tollsCount: tolls.length,
        tollsCostUSD: +totalTollCost.toFixed(2),
        encodedPolyline,
      };

      // 3. Precio diésel EIA
      const originTitle = origin?.title || '';
      const state = extractStateAbbreviation(originTitle);
      const duoArea = state ? stateAbbreviationToDuoArea[state] || 'NUS' : 'NUS';

      const dieselURL =
        `https://api.eia.gov/v2/petroleum/pri/gnd/data/` +
        `?api_key=${EIA_API_KEY.value()}` +
        `&frequency=weekly` +
        `&data[0]=value` +
        `&facets[product][]=EPD2D` +
        `&facets[duoarea][]=${duoArea}` +
        `&sort[0][column]=period` +
        `&sort[0][direction]=desc` +
        `&offset=0` +
        `&length=1`;

      logger.info('Diesel lookup params', {
        originTitle,
        state,
        duoArea,
      });

      const dieselRes = await fetch(dieselURL);
      const dieselData = await dieselRes.json();

      logger.info('Diesel API response', {
        duoArea,
        rows: dieselData?.response?.data?.length || 0,
        firstRow: dieselData?.response?.data?.[0] || null,
      });

      const dieselPriceRaw = dieselData?.response?.data?.[0]?.value;
      const dieselPrice = dieselPriceRaw ? parseFloat(dieselPriceRaw) : 4;

      // 4. Calcular costos estimados
      const mpg = 6;
      const salarioHora = 28;
      const costosFijos = 100;
      const utilidadPorcentaje = 0.2;

      const galones = routeSummary.distanceMiles / mpg;
      const combustible = galones * dieselPrice;
      const horas = routeSummary.durationMinutes / 60;
      const salario = horas * salarioHora;
      const operativo =
        combustible + salario + routeSummary.tollsCostUSD + costosFijos;
      const utilidad = operativo * utilidadPorcentaje;
      const total = operativo + utilidad;

      const estimacion = {
        combustible: +combustible.toFixed(2),
        salario: +salario.toFixed(2),
        peajes: routeSummary.tollsCostUSD,
        costosFijos,
        utilidad: +utilidad.toFixed(2),
        total: +total.toFixed(2),
        precioMin: +(total * 0.85).toFixed(2),
        precioMax: +(total * 1.15).toFixed(2),
      };

      return {
        vendors: matchedVendors,
        routeSummary,
        dieselPriceUSD: dieselPrice,
        estimatedTripCost: estimacion,
      };
    } catch (error) {
      logger.error('🔥 Error in getFullTripEvaluation:', error);
      throw new HttpsError('internal', 'Failed to evaluate full trip.');
    }
  }
);

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = (val) => (val * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = {
  getFullTripRequest,
};