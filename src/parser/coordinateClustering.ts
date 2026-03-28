/**
 * Coordinate clustering algorithm — modernized TypeScript port of pdfRuler's useRuler.
 *
 * Groups nearby coordinate values into logical rows/columns using a tolerance threshold.
 * This is the core algorithm that makes PDF text extraction layout-aware.
 */

export interface ClusterRange {
  index: number;
  values: number[];
  min: number;
  max: number;
  center: number;
}

export function clusterCoordinates(coords: number[], tolerance: number = 0.2): ClusterRange[] {
  if (!coords.length) return [];

  const sorted = [...new Set(coords)].sort((a, b) => a - b);
  const ranges: ClusterRange[] = [];
  let currentRange: number[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] <= tolerance) {
      currentRange.push(sorted[i]);
    } else {
      ranges.push(buildRange(ranges.length, currentRange));
      currentRange = [sorted[i]];
    }
  }
  ranges.push(buildRange(ranges.length, currentRange));

  return ranges;
}

function buildRange(index: number, values: number[]): ClusterRange {
  return {
    index,
    values,
    min: Math.min(...values),
    max: Math.max(...values),
    center: values.reduce((a, b) => a + b, 0) / values.length,
  };
}

export function findClusterIndex(ranges: ClusterRange[], value: number): number {
  for (const range of ranges) {
    if (range.values.includes(value) || (value >= range.min && value <= range.max)) {
      return range.index;
    }
  }
  // Fallback: find nearest
  let closest = 0;
  let minDist = Infinity;
  for (const range of ranges) {
    const dist = Math.abs(value - range.center);
    if (dist < minDist) {
      minDist = dist;
      closest = range.index;
    }
  }
  return closest;
}
