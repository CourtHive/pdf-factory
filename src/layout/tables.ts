import type { UserOptions } from 'jspdf-autotable';

export const TABLE_STYLES: Record<string, Partial<UserOptions>> = {
  compact: {
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      lineWidth: 0.1,
      lineColor: [200, 200, 200],
    },
    headStyles: {
      fillColor: [50, 50, 50],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  },
  schedule: {
    styles: {
      fontSize: 7,
      cellPadding: 2,
      lineWidth: 0.2,
      lineColor: [180, 180, 180],
      valign: 'top',
    },
    headStyles: {
      fillColor: [30, 60, 120],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [240, 244, 250],
    },
  },
  playerList: {
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineWidth: 0.1,
      lineColor: [200, 200, 200],
    },
    headStyles: {
      fillColor: [40, 80, 40],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [242, 248, 242],
    },
  },
  report: {
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineWidth: 0.1,
      lineColor: [200, 200, 200],
    },
    headStyles: {
      fillColor: [35, 55, 90],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [244, 246, 250],
    },
  },
  courtCard: {
    styles: {
      fontSize: 14,
      cellPadding: 6,
      lineWidth: 0.3,
      lineColor: [100, 100, 100],
      halign: 'center',
    },
    headStyles: {
      fillColor: [20, 20, 80],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 16,
    },
  },
};
