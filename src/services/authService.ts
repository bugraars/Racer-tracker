import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSession } from '../interface/auth';

const STORAGE_KEY = '@user_session';

export const authService = {
  // Giriş yap ve cihaz hafızasına kaydet
  async login(eventId: string, pin: string): Promise<boolean> {
    // Şimdilik statik kontrol (Senin belirlediğin bilgiler)
    if (eventId === "STAFF2026" && pin === "1234") {
      const session: UserSession = {
        eventId,
        pin,
        loginDate: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return true;
    }
    return false;
  },

  // Oturumu sil (Çıkış yap)
  async logout() {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
};