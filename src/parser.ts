/**
 * Parser entry point — Node-only.
 *
 * Depends on pdf2json, pngjs, and other Node-only packages.
 * Import from 'pdf-factory/parser' instead of 'pdf-factory'.
 */

// Parser
export { parsePdfBuffer } from './parser/pdfExtractor';
export { clusterCoordinates, findClusterIndex } from './parser/coordinateClustering';
export { detectRegions } from './parser/regionDetector';
export { classifyText, extractPlayerName, extractSeedValue } from './parser/textAnalyzer';
export { extractDrawFromPage, extractDrawMerged } from './parser/drawExtractor';
export { mergeTextItems, cleanMergedText } from './parser/textMerger';

// Parser types
export type { TextItem, PdfLine, PdfPage, ParsedPdf } from './parser/pdfExtractor';
export type { ClusterRange } from './parser/coordinateClustering';
export type { PageRegion, DetectedRegions } from './parser/regionDetector';
export type { TextType, ClassifiedText } from './parser/textAnalyzer';
export type { ExtractedDrawData, ExtractedParticipant, ExtractedMatchUp } from './parser/drawExtractor';

// Comparison
export { comparePdfToSnapshot, comparetwoPdfs, pdfToImages } from './comparison/visualCompare';
export type { CompareResult, CompareOptions } from './comparison/visualCompare';
