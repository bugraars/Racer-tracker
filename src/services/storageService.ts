import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@nfc_scan_queue';
const STAFF_NAME_KEY = '@staff_name';
const STAFF_PHONE_KEY = '@staff_phone';
const CHECKPOINT_NAME_KEY = '@checkpoint_name';
const USER_SESSION_KEY = '@user_session';

export const storageService = {
  async saveToQueue(payload: string, tagId?: string, pointName?: string, coords?: { lat: number; lng: number }) {
    try {
      const existing = await AsyncStorage.getItem(QUEUE_KEY);
      const queue = existing ? JSON.parse(existing) : [];
      
      const newItem = {
        id: Date.now().toString(),
        tagId,
        data: payload,
        timestamp: Date.now(),
        status: 'PENDING',
        pointName: pointName || 'BEKLENİYOR',
        coords: coords || { lat: 0, lng: 0 },
        retryCount: 0,
      };

      queue.push(newItem);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      return true;
    } catch (e) {
      console.error("Kayıt hatası", e);
      return false;
    }
  },

  async clearQueue() {
    try {
      await AsyncStorage.removeItem(QUEUE_KEY);
      return true;
    } catch (e) {
      console.error("Sıra silme hatası", e);
      return false;
    }
  },

  async clearAllData() {
    try {
      await AsyncStorage.multiRemove([QUEUE_KEY, STAFF_NAME_KEY, STAFF_PHONE_KEY, CHECKPOINT_NAME_KEY]);
      return true;
    } catch (e) {
      console.error("Veri silme hatası", e);
      return false;
    }
  },

  async logout() {
    try {
      await AsyncStorage.removeItem(USER_SESSION_KEY);
      return true;
    } catch (e) {
      console.error("Logout hatası", e);
      return false;
    }
  }
};