import { useCallback } from 'react';
import { formatDate } from '../../../utils/dateUtils';

const RNHTMLtoPDF = require('react-native-html-to-pdf') as {
  convert: (options: any) => Promise<{ filePath: string }>;
};

const escapeHtml = (value: any) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const useInspectionPDF = () => {
  const generateFaultsHTML = useCallback((checklist: any, type: string) => {
    let faultsHTML = '';

    Object.values(checklist || {}).forEach((truckOrTrailer: any) => {
      faultsHTML += `
        <div class="section-title">${escapeHtml(type)}</div>
        <table>
          <tr>
            <th>Item</th>
            <th>Description</th>
            <th>Solution</th>
            <th>Resolution Type</th>
          </tr>
      `;

      Object.values(truckOrTrailer?.checklistItems || {}).forEach(
        (item: any) => {
          faultsHTML += `
            <tr>
              <td>${escapeHtml(item?.label)}</td>
              <td>${escapeHtml(item?.fault)}</td>
              <td>${escapeHtml(item?.solution)}</td>
              <td>${escapeHtml(item?.typeSolution)}</td>
            </tr>
          `;
        },
      );

      faultsHTML += '</table>';
    });

    return faultsHTML;
  }, []);

  const buildFinalInspectionHtml = useCallback(
    (
      data: any,
      driverSignature: string,
      mechanicSignature: string,
      inspectionID: string,
    ) => {
      const carrierTitle = escapeHtml(data?.carrier?.title);
      const carrierAddress = escapeHtml(data?.carrier?.location?.label);
      const driverName = `${escapeHtml(data?.driver?.firstName)} ${escapeHtml(
        data?.driver?.lastName,
      )}`.trim();

      const driverReportDate = formatDate(data?.dateReport);
      const mechanicReportDate = escapeHtml(data?.dateReportDispatch || '');

      return `
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 24px;
              color: #111;
            }

            @page {
              margin: 1in;
            }

            .header {
              font-size: 20px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 8px;
            }

            .subheader {
              font-size: 13px;
              text-align: center;
              margin-bottom: 18px;
              color: #444;
            }

            .section-title {
              font-size: 15px;
              font-weight: bold;
              margin-top: 18px;
              margin-bottom: 10px;
            }

            .info-row {
              border: 1px solid #000;
              padding: 6px;
              margin-top: 4px;
              font-size: 13px;
              display: flex;
              justify-content: space-between;
            }

            .info-block {
              flex: 1;
              padding: 4px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }

            th, td {
              padding: 8px;
              text-align: left;
              border: 1px solid #ddd;
              font-size: 12px;
              vertical-align: top;
            }

            th {
              background-color: #f2f2f2;
            }

            .signatureContainer {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              margin-top: 28px;
            }

            .signatureBox {
              flex: 1;
              text-align: center;
            }

            .signature {
              width: 100%;
              height: 70px;
              object-fit: contain;
              border-bottom: 1px solid #000;
            }

            .emptySignature {
              width: 100%;
              height: 70px;
              border-bottom: 1px solid #000;
            }

            .signatureLabel {
              font-size: 12px;
              margin-top: 6px;
            }

            .footer-note {
              margin-top: 24px;
              font-size: 11px;
              color: #555;
            }
          </style>
        </head>
        <body>
          <div class="header">FINAL VEHICLE INSPECTION REPORT</div>
          <div class="subheader">DRIVER REPORT + MECHANIC / DISPATCH REVIEW</div>

          <div class="info-row">
            <div class="info-block"><strong>Carrier:</strong> ${carrierTitle}</div>
          </div>

          <div class="info-row">
            <div class="info-block"><strong>Address:</strong> ${carrierAddress}</div>
          </div>

          <div class="info-row">
            <div class="info-block"><strong>Report ID:</strong> ${escapeHtml(
              inspectionID,
            )}</div>
          </div>

          <div class="info-row">
            <div class="info-block"><strong>Driver:</strong> ${driverName}</div>
          </div>

          <div class="info-row">
            <div class="info-block"><strong>Date Driver Report:</strong> ${escapeHtml(
              driverReportDate,
            )}</div>
            <div class="info-block"><strong>Date Mechanic Report:</strong> ${mechanicReportDate}</div>
          </div>

          <div class="info-row">
            <div class="info-block"><strong>Odometer Reading:</strong> ${escapeHtml(
              data?.miles,
            )}</div>
          </div>

          <div class="section-title">Driver Reported Defects and Resolution</div>
          ${generateFaultsHTML(data?.truckSolutions, 'Truck')}
          ${generateFaultsHTML(data?.trailerSolutions, 'Trailer')}

          <div class="section-title">Signatures</div>
          <div class="signatureContainer">
            <div class="signatureBox">
              ${
                driverSignature
                  ? `<img src="${driverSignature}" class="signature" />`
                  : `<div class="emptySignature"></div>`
              }
              <div class="signatureLabel">Driver Signature</div>
              <div class="signatureLabel">${escapeHtml(driverReportDate)}</div>
            </div>

            <div class="signatureBox">
              ${
                mechanicSignature
                  ? `<img src="${mechanicSignature}" class="signature" />`
                  : `<div class="emptySignature"></div>`
              }
              <div class="signatureLabel">Mechanic / Dispatcher Signature</div>
              <div class="signatureLabel">${mechanicReportDate}</div>
            </div>
          </div>

          <div class="footer-note">
            This final report consolidates the driver inspection submission and the mechanic / dispatcher review.
          </div>
        </body>
        </html>
      `;
    },
    [generateFaultsHTML],
  );

  const generateFinalInspectionPDF = useCallback(
    async (
      data: any,
      driverSignature: string,
      mechanicSignature: string,
      inspectionID: string,
    ) => {
      if (!data) {
        throw new Error('Missing inspection data');
      }

      if (!inspectionID) {
        throw new Error('Missing inspectionID');
      }

      const html = buildFinalInspectionHtml(
        data,
        driverSignature,
        mechanicSignature,
        inspectionID,
      );

      const file = await RNHTMLtoPDF.convert({
        html,
        fileName: `inspection_report_${inspectionID}_${Date.now()}`,
        directory: 'Documents',
        padding: 20,
      });

      if (!file?.filePath) {
        throw new Error('Failed to generate inspection PDF');
      }

      return file.filePath;
    },
    [buildFinalInspectionHtml],
  );

  return {
    buildFinalInspectionHtml,
    generateFinalInspectionPDF,
  };
};

export default useInspectionPDF;