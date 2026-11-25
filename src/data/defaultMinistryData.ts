import {
  FaithArticle,
  MinistryProgram,
  MinistrySettings,
  Sermon,
} from '../types/ministry';
import {
  ABSTRACT_ART_PATH,
  COVER_IMAGE_PRESETS,
  DEFAULT_MINISTRY_SETTINGS_DATA,
  PORTRAIT_IMAGE_PATH,
  PRAYER_IMAGE_PATH,
  SERMON_STUDIO_PATH,
  STARTER_FAITH_ARTICLES_DATA,
  STARTER_PROGRAMS_DATA,
  STARTER_SERMONS_DATA,
} from '../../shared/starterData';

export {
  PORTRAIT_IMAGE_PATH,
  ABSTRACT_ART_PATH,
  SERMON_STUDIO_PATH,
  PRAYER_IMAGE_PATH,
  COVER_IMAGE_PRESETS,
};

export const DEFAULT_MINISTRY_SETTINGS: MinistrySettings = DEFAULT_MINISTRY_SETTINGS_DATA;

export const STARTER_SERMONS: Omit<
  Sermon,
  'id' | 'authorId' | 'createdAt' | 'updatedAt'
>[] = STARTER_SERMONS_DATA;

export const STARTER_FAITH_ARTICLES: Omit<
  FaithArticle,
  'id' | 'authorId' | 'createdAt' | 'updatedAt'
>[] = STARTER_FAITH_ARTICLES_DATA;

export const STARTER_PROGRAMS: Omit<
  MinistryProgram,
  'id' | 'authorId' | 'createdAt' | 'updatedAt'
>[] = STARTER_PROGRAMS_DATA;
