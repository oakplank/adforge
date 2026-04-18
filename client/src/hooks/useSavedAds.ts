import { useState, useCallback, useEffect } from 'react';

export interface SavedAd {
  id: string;
  thumbnail: string;
  format: string;
  width: number;
  height: number;
  createdAt: string;
  name?: string;
}

const STORAGE_KEY = 'adforge-saved-ads';

export function useSavedAds() {
  const [savedAds, setSavedAds] = useState<SavedAd[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedAds));
    } catch { /* Storage full */ }
  }, [savedAds]);

  const saveAd = useCallback((ad: Omit<SavedAd, 'id'>) => {
    const newAd: SavedAd = {
      ...ad,
      id: `ad-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: `Ad ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    };
    setSavedAds(prev => [newAd, ...prev]);
    return newAd.id;
  }, []);

  const deleteAd = useCallback((id: string) => {
    setSavedAds(prev => prev.filter(ad => ad.id !== id));
  }, []);

  return { savedAds, saveAd, deleteAd };
}
