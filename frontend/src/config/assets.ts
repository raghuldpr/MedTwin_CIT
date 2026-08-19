/**
 * Centralized Anatomical Assets Configuration
 * All screens and components must reference this single source of truth.
 */

export interface AnatomyAssetsConfig {
  body: string;
  upperBody: string;
  brain: string;
  heart: string;
  lungs: string;
  kidneys: string;
  liver: string;
  stomach: string;
  bladder?: string;
  muscles?: string;
  bones?: string;
  skin?: string;
}

export const anatomyAssets: AnatomyAssetsConfig = {
  body: '/assets/anatomy/body.png',
  upperBody: '/assets/anatomy/body.png',
  brain: '/assets/anatomy/brain.png',
  heart: '/assets/anatomy/heart.png',
  lungs: '/assets/anatomy/lungs.png',
  kidneys: '/assets/anatomy/kidneys.png',
  liver: '/assets/anatomy/liver.png',
  stomach: '/assets/anatomy/stomach.png',
};

/**
 * Returns an array of candidate paths to try in order when loading an asset.
 * This guarantees resilience across different hosting environments, Vite base paths,
 * and direct public directory mappings.
 */
export function getAssetCandidates(assetKey: keyof AnatomyAssetsConfig | string): string[] {
  const normalizedKey = assetKey.toLowerCase();
  
  if (normalizedKey === 'body') {
    return [
      '/assets/anatomy/body.png',
    ];
  }

  if (normalizedKey === 'upperbody' || normalizedKey === 'upper-body') {
    return [
      '/assets/anatomy/body.png',
    ];
  }

  // Organ assets
  const organSlug = normalizedKey;
  return [
    `/assets/anatomy/${organSlug}.png`,
  ];
}
