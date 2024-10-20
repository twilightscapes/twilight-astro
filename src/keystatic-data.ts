import { createReader } from '@keystatic/core/reader';
import config from '../keystatic.config';

type ReaderType = {
  collections: {
    [key: string]: {
      all: () => Promise<Array<{ slug: string; entry: any }>>;
    };
  };
  singletons: {
    [key: string]: {
      read: () => Promise<any>;
    };
  };
};

export const reader = createReader('src/content', config) as ReaderType;

export const getSiteSettings = async () => {
  return await reader.singletons.siteSettings.read();
};

// Add this new function to fetch social links
export const getSocialLinks = async () => {
  return await reader.collections.socialLinks.all();
};