import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';
import brandImage from './CourtHive.svg';

const prefersDark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches;

const theme = create({
  base: prefersDark ? 'dark' : 'light',
  brandTitle: 'pdf-factory',
  brandUrl: 'https://github.com/CourtHive/pdf-factory',
  brandImage,
});

addons.setConfig({ theme });
