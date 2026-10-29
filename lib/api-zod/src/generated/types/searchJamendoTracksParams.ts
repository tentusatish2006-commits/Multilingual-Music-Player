import type { SearchJamendoTracksLanguage } from './searchJamendoTracksLanguage';

export type SearchJamendoTracksParams = {
  language: SearchJamendoTracksLanguage;
  term?: string;
  limit?: number;
};
