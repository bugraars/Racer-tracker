import AsyncStorage from '@react-native-async-storage/async-storage';
import { PendingSync } from '../interface/sync';

// Storage Keys
const KEYS = {
  QUEUE: '@nfc_scan_queue',
  STAFF_NAME: '@staff_name',
  STAFF_PHONE: '@staff_phone',
  CHECKPOINT_NAME: '@checkpoint_name',
  USER_SESSION: '@user_session',
  AUTH_TOKEN: '@auth_token',
  USER_DATA: '@user_data',
  RACE_MODE: '@race_day_config',
};

export const storageService = {
  // ==================== QUEUE İŞLEMLERİ ====================
  
  async saveToQueue(
    tagId: string,
    checkpointId: number,
    checkpointName: string,
    coords?: { lat: number; lon: number }
  ): Promise<PendingSync | null> {
    try {
      const existing = await this.getQueue();
      
      const newItem: PendingSync = {
        id: Date.now().toString(),
        tagId,
        checkpointId,
        checkpointName,
        timestamp: Date.now(),
        status: 'PENDING',
        retryCount: 0,
        coords: coords ? { lat: coords.lat, lon: coords.lon, lng: coords.lon } : undefined,
      };

      existing.push(newItem);
      await AsyncStorage.setItem(KEYS.QUEUE, JSON.stringify(existing));
      return newItem;
    } catch (e) {
      console.error("Kayıt hatası", e);
      return null;
    }
  },

  async getQueue(): Promise<PendingSync[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.QUEUE);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Queue okuma hatası", e);
      return [];
    }
  },

  async clearQueue(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(KEYS.QUEUE);
      return true;
    } catch (e) {
      console.error("Sıra silme hatası", e);
      return false;
    }
  },

  // ==================== CONFIG İŞLEMLERİ ====================

  async getCheckpointName(): Promise<string> {
    try {
      return (await AsyncStorage.getItem(KEYS.CHECKPOINT_NAME)) || 'CHECKPOINT';
    } catch (e) {
      return 'CHECKPOINT';
    }
  },

  async setCheckpointName(name: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.CHECKPOINT_NAME, name);
  },

  async getStaffName(): Promise<string | null> {
    return await AsyncStorage.getItem(KEYS.STAFF_NAME);
  },

  async setStaffName(name: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.STAFF_NAME, name);
  },

  async getStaffPhone(): Promise<string | null> {
    return await AsyncStorage.getItem(KEYS.STAFF_PHONE);
  },

  async setStaffPhone(phone: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.STAFF_PHONE, phone);
  },

  // ==================== TEMİZLİK İŞLEMLERİ ====================

  async clearAllData(): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove([
        KEYS.QUEUE, 
        KEYS.STAFF_NAME, 
        KEYS.STAFF_PHONE, 
        KEYS.CHECKPOINT_NAME,
        KEYS.RACE_MODE,
      ]);
      return true;
    } catch (e) {
      console.error("Veri silme hatası", e);
      return false;
    }
  },

  async logout(): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove([
        KEYS.USER_SESSION,
        KEYS.AUTH_TOKEN,
        KEYS.USER_DATA,
      ]);
      return true;
    } catch (e) {
      console.error("Logout hatası", e);
      return false;
    }
  },

  async fullReset(): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove(Object.values(KEYS));
      return true;
    } catch (e) {
      console.error("Full reset hatası", e);
      return false;
    }
  },

  // ==================== RACE MODE ====================

  async isPreRaceMode(): Promise<boolean> {
    const mode = await AsyncStorage.getItem(KEYS.RACE_MODE);
    return mode === 'prerace';
  },

  async setPreRaceMode(isPreRace: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.RACE_MODE, isPreRace ? 'prerace' : 'race');
  },
};