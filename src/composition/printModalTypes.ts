/**
 * Print Modal types — defines the request/response shapes for TMX print integration.
 *
 * A PrintRequest describes what to print and how.
 * PrintModalConfig/Tab/Field describe the modal UI for configuring print options.
 */

import type { CompositionConfig } from './editorTypes';

// --- Print Requests ---

export type PrintRequest =
  | PrintDrawRequest
  | PrintScheduleRequest
  | PrintPlayerListRequest
  | PrintCourtCardsRequest
  | PrintSignInSheetRequest
  | PrintMatchCardRequest;

export interface PrintDrawRequest {
  type: 'draw';
  drawId: string;
  eventId: string;
  composition: Partial<CompositionConfig>;
}

export interface PrintScheduleRequest {
  type: 'schedule';
  scheduledDate: string;
  venueId?: string;
  composition: Partial<CompositionConfig>;
}

export interface PrintPlayerListRequest {
  type: 'playerList';
  eventId?: string;
  composition: Partial<CompositionConfig>;
}

export interface PrintCourtCardsRequest {
  type: 'courtCards';
  venueId?: string;
  scheduledDate?: string;
  composition: Partial<CompositionConfig>;
}

export interface PrintSignInSheetRequest {
  type: 'signInSheet';
  eventId: string;
  composition: Partial<CompositionConfig>;
}

export interface PrintMatchCardRequest {
  type: 'matchCard';
  matchUpIds: string[];
  composition: Partial<CompositionConfig>;
}

// --- Print Result ---

export interface PrintResult {
  success: boolean;
  doc?: any;
  blob?: Blob;
  filename?: string;
  error?: string;
}

// --- Modal Configuration ---

export interface PrintModalConfig {
  title: string;
  tabs: PrintModalTab[];
}

export interface PrintModalTab {
  id: string;
  label: string;
  icon?: string;
  fields: PrintModalField[];
}

export interface PrintModalField {
  id: string;
  label: string;
  type: 'select' | 'checkbox' | 'text' | 'number';
  options?: { value: string; label: string }[];
  defaultValue?: any;
  configPath: string;
}

// --- Modal Tab Presets ---

export const DRAW_MODAL_TABS: PrintModalTab[] = [
  {
    id: 'content',
    label: 'Content',
    fields: [
      {
        id: 'includeSeedings',
        label: 'Include seedings',
        type: 'checkbox',
        defaultValue: true,
        configPath: 'content.draw.includeSeedings',
      },
      {
        id: 'includeScores',
        label: 'Include scores',
        type: 'checkbox',
        defaultValue: true,
        configPath: 'content.draw.includeScores',
      },
      {
        id: 'showDrawPositions',
        label: 'Show draw positions',
        type: 'checkbox',
        defaultValue: true,
        configPath: 'content.draw.showDrawPositions',
      },
      { id: 'showByes', label: 'Show byes', type: 'checkbox', defaultValue: true, configPath: 'content.draw.showByes' },
      {
        id: 'splitStrategy',
        label: 'Split strategy',
        type: 'select',
        options: [
          { value: 'single-page', label: 'Single page' },
          { value: 'halves', label: 'Split in halves' },
          { value: 'quarters', label: 'Split in quarters' },
        ],
        defaultValue: 'single-page',
        configPath: 'content.draw.splitStrategy',
      },
    ],
  },
  {
    id: 'layout',
    label: 'Layout',
    fields: [
      {
        id: 'headerLayout',
        label: 'Header style',
        type: 'select',
        options: [
          { value: 'itf', label: 'ITF' },
          { value: 'minimal', label: 'Minimal' },
          { value: 'branded', label: 'Branded' },
        ],
        defaultValue: 'itf',
        configPath: 'header.layout',
      },
      {
        id: 'orientation',
        label: 'Orientation',
        type: 'select',
        options: [
          { value: 'landscape', label: 'Landscape' },
          { value: 'portrait', label: 'Portrait' },
        ],
        defaultValue: 'landscape',
        configPath: 'page.orientation',
      },
    ],
  },
];

export const SCHEDULE_MODAL_TABS: PrintModalTab[] = [
  {
    id: 'content',
    label: 'Content',
    fields: [
      {
        id: 'cellStyle',
        label: 'Cell style',
        type: 'select',
        options: [
          { value: 'detailed', label: 'Detailed' },
          { value: 'compact', label: 'Compact' },
        ],
        defaultValue: 'detailed',
        configPath: 'content.schedule.cellStyle',
      },
      {
        id: 'showMatchNumbers',
        label: 'Show match numbers',
        type: 'checkbox',
        defaultValue: false,
        configPath: 'content.schedule.showMatchNumbers',
      },
      { id: 'alertBanner', label: 'Alert banner text', type: 'text', configPath: 'content.schedule.alertBanner' },
    ],
  },
  {
    id: 'layout',
    label: 'Layout',
    fields: [
      {
        id: 'headerLayout',
        label: 'Header style',
        type: 'select',
        options: [
          { value: 'itf', label: 'ITF' },
          { value: 'minimal', label: 'Minimal' },
          { value: 'branded', label: 'Branded' },
        ],
        defaultValue: 'itf',
        configPath: 'header.layout',
      },
    ],
  },
];
