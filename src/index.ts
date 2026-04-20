// Config
export { PRESETS, getPreset, mergePreset } from './config/formatPresets';
export {
  COMPOSITION_CATALOG,
  getCatalogPreset,
  listCatalogPresets,
  mergeCatalogPreset,
} from './config/compositionCatalog';
export type { CompositionPreset } from './config/compositionCatalog';

// Data conversion (getEventData → DrawData)
export { structureToDrawData, findStructure } from './core/drawsDataToDrawData';

// Page composition
export { createDoc, getPageRegions, getDefaultPageConfig } from './composition/page';
export { renderHeader } from './composition/headerLayouts';
export { renderFooter, measureFooterHeight } from './composition/footerLayouts';
export { renderSeedingsFooter, measureSeedingsHeight } from './composition/seedingsFooter';
export { executePrint } from './composition/printDispatcher';

// Composition editor + modal types
export type {
  CompositionConfig,
  ContentOptions,
  EditorState,
  PreviewData,
  CompositionTemplate,
} from './composition/editorTypes';
export {
  HEADER_LAYOUT_OPTIONS,
  FOOTER_LAYOUT_OPTIONS,
  PAGE_SIZE_OPTIONS,
  ORIENTATION_OPTIONS,
  SPLIT_STRATEGY_OPTIONS,
} from './composition/editorTypes';
export type {
  PrintRequest,
  PrintDrawRequest,
  PrintScheduleRequest,
  PrintPlayerListRequest,
  PrintCourtCardsRequest,
  PrintSignInSheetRequest,
  PrintMatchCardRequest,
  PrintModalConfig,
  PrintModalTab,
  PrintModalField,
  PrintResult,
} from './composition/printModalTypes';
export { DRAW_MODAL_TABS, SCHEDULE_MODAL_TABS } from './composition/printModalTypes';

// Core data extractors
export { extractDrawData, getRoundLabel } from './core/extractDrawData';
export { extractScheduleData } from './core/extractScheduleData';
export { extractParticipantData } from './core/extractParticipantData';
export { extractCourtCardData } from './core/extractCourtCardData';
export { extractRoundRobinData } from './core/extractRoundRobinData';

// Renderers
export { renderTraditionalDraw } from './renderers/traditionalDraw';
export { renderRoundRobinGroup } from './renderers/roundRobinDraw';
export { renderLuckyDraw } from './renderers/luckyDraw';
export { splitDraw } from './renderers/drawSplitter';
export { formatPlayerEntry, formatMatchScore } from './renderers/formatEntry';
export { renderCompassDraw } from './renderers/compassDraw';
export { renderConsolationDraw, extractConsolationStructures } from './renderers/consolationDraw';
export { renderDoubleEliminationDraw } from './renderers/doubleEliminationDraw';
export type { DoubleEliminationData } from './renderers/doubleEliminationDraw';

// Core data extractors (additional)
export { extractCompassData } from './core/extractCompassData';

// Parser (additional) — Node-only, use pdf-factory/parser entry
// export { mergeTextItems, cleanMergedText } from './parser/textMerger';
// export { extractDrawMerged } from './parser/drawExtractor';

// PDF generators (legacy — still work, will be updated to use composition)
export { generateDrawSheetPDF } from './generators/drawSheet';
export { generateSchedulePDF } from './generators/schedule';
export { generatePlayerListPDF } from './generators/playerList';
export { generateCourtCardPDF } from './generators/courtCard';
export { generateSignInSheetPDF } from './generators/signInSheet';
export { generateScheduleV2PDF } from './generators/scheduleV2';
export type { ScheduleV2Options } from './generators/scheduleV2';
export { generateSequentialOOP } from './generators/sequentialOOP';
export type { SequentialOOPOptions } from './generators/sequentialOOP';
export { generateMatchCardPDF } from './generators/matchCard';
export { generateReportPDF } from './generators/report';
export type { ReportPDFOptions, ReportColumn as ReportPDFColumn } from './generators/report';
export {
  generateDrawPDF,
  generateTraditionalDrawPDF,
  generateSplitDrawPDF,
  generateFeedInDrawPDF,
  generateConsolationDrawPDF,
  generateCompassDrawPDF,
  generateDoubleEliminationPDF,
  generateLuckyDrawPDF,
  generateMirroredDrawPDF,
  generateBackdrawPDF,
} from './generators/drawPDF';
export type { DrawPDFOptions } from './generators/drawPDF';
export { generateFromEventData } from './generators/generateFromEventData';
export type { GenerateFromEventDataOptions } from './generators/generateFromEventData';

export type { SignInSheetOptions } from './generators/signInSheet';
export type { MatchCardData, MatchCardOptions } from './generators/matchCard';

// Layout utilities
export { drawTournamentHeader, drawPageFooter } from './layout/headers';
export { TABLE_STYLES } from './layout/tables';
export { calculateBracketPositions, drawBracketSlot, drawBracketConnectors } from './layout/brackets';
export { setFont, FONT, STYLE, SIZE } from './layout/fonts';

// Data formatting utilities
export {
  participantName,
  nationality,
  seedDisplay,
  entryStatusDisplay,
  formatScore,
  formatDate,
  formatTime,
  eventAbbreviation,
  roundName,
} from './utils/primitives';

// Types — config
export type {
  PageConfig,
  PageRegions,
  DrawFormatConfig,
  DrawSplitConfig,
  HeaderConfig,
  FooterConfig,
  HeaderLayout,
  FooterLayout,
  RenderStyle,
  NameFormat,
  NationalityFormat,
  SeedPosition,
  SeedFormat,
  EntryFormat,
  GameScoreSeparator,
  SetScoreSeparator,
} from './config/types';

// Types — data
export type { DrawData, DrawSlot, DrawMatchUp } from './core/extractDrawData';
export type { ScheduleData, ScheduleMatch, ScheduleTimeSlot } from './core/extractScheduleData';
export type { ParticipantRow } from './core/extractParticipantData';
export type { CourtCardData, CourtCardMatch } from './core/extractCourtCardData';
export type { RoundRobinGroupData, RoundRobinParticipant, RoundRobinResult } from './core/extractRoundRobinData';
export type { DrawSegment } from './renderers/drawSplitter';

// Parser — Node-only, use pdf-factory/parser entry
// export { parsePdfBuffer } from './parser/pdfExtractor';
// export { clusterCoordinates, findClusterIndex } from './parser/coordinateClustering';
// export { detectRegions } from './parser/regionDetector';
// export { classifyText, extractPlayerName, extractSeedValue } from './parser/textAnalyzer';
// export { extractDrawFromPage } from './parser/drawExtractor';

// Parser types (safe — no runtime deps)
export type { TextItem, PdfLine, PdfPage, ParsedPdf } from './parser/pdfExtractor';
export type { ClusterRange } from './parser/coordinateClustering';
export type { PageRegion, DetectedRegions } from './parser/regionDetector';
export type { TextType, ClassifiedText } from './parser/textAnalyzer';
export type { ExtractedDrawData, ExtractedParticipant, ExtractedMatchUp } from './parser/drawExtractor';

// Comparison — Node-only, use pdf-factory/parser entry
// export { comparePdfToSnapshot, comparetwoPdfs, pdfToImages } from './comparison/visualCompare';
export type { CompareResult, CompareOptions } from './comparison/visualCompare';

// Types — layout (legacy)
export type { TournamentHeader } from './layout/headers';
export type { BracketPosition, BracketConfig } from './layout/brackets';
export type { DrawSheetOptions } from './generators/drawSheet';
export type { ScheduleOptions } from './generators/schedule';
export type { PlayerListOptions } from './generators/playerList';
export type { CourtCardOptions } from './generators/courtCard';
