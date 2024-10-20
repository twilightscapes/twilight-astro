import { getEntry } from 'astro:content';

export async function getPwaSettings() {
  const pwaSettings = await getEntry('pwaSettings', 'index');
  return pwaSettings.data;
}
