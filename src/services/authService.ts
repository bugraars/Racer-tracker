import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { tokenService } from '../config/api';
import { LoginResponse, UserSession, ValidateResponse, Checkpoint, StaffInfo } from '../interface/auth';

const USER_SESSION_KEY = '@user_session';
const CHECKPOINT_NAME_KEY = '@checkpoint_name';

export const authService = {
  // Staff ID + PIN ile giriş
  async login(staffCode: string, pin: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        staffCode: staffCode.toUpperCase(),
        pin,
      });

      const { token, staff } = response.data;

      // Token'ı kaydet
      await tokenService.setToken(token);

      // Session bilgilerini kaydet
      const session: UserSession = {
        token,
        staffId: staff.id,
        staffCode: staff.staffCode,
        firstName: staff.firstName,
        lastName: staff.lastName,
        fullName: staff.fullName,
        phone: staff.phone,
        role: staff.role,
        checkpointId: staff.checkpoint?.id || null,
        checkpointName: staff.checkpoint?.name || null,
        loginDate: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
      
      // Checkpoint adını da ayrıca kaydet (kolay erişim için)
      if (staff.checkpoint?.name) {
        await AsyncStorage.setItem(CHECKPOINT_NAME_KEY, staff.checkpoint.name);
      }

      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Bağlantı hatası';
      return { success: false, error: message };
    }
  },

  // Token'ı doğrula ve güncel bilgileri al
  async validateToken(): Promise<{ valid: boolean; staff?: StaffInfo }> {
    try {
      const response = await api.get<ValidateResponse>('/auth/validate');
      
      if (response.data.valid && response.data.staff) {
        // Session'ı güncel bilgilerle güncelle
        const currentSession = await this.getOfflineSession();
        if (currentSession) {
          const updatedSession: UserSession = {
            ...currentSession,
            checkpointId: response.data.staff.checkpoint?.id || null,
            checkpointName: response.data.staff.checkpoint?.name || null,
          };
          await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(updatedSession));
          
          if (response.data.staff.checkpoint?.name) {
            await AsyncStorage.setItem(CHECKPOINT_NAME_KEY, response.data.staff.checkpoint.name);
          }
        }
      }
      
      return response.data;
    } catch (error) {
      return { valid: false };
    }
  },

  // Mevcut session'ı getir (online kontrol ile)
  async getSession(): Promise<UserSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem(USER_SESSION_KEY);
      if (!sessionData) return null;
      
      const session: UserSession = JSON.parse(sessionData);
      
      // Token'ın hala geçerli olup olmadığını kontrol et
      const validation = await this.validateToken();
      if (!validation.valid) {
        await this.logout();
        return null;
      }
      
      // Güncel checkpoint bilgisini döndür
      if (validation.staff?.checkpoint) {
        session.checkpointId = validation.staff.checkpoint.id;
        session.checkpointName = validation.staff.checkpoint.name;
      }
      
      return session;
    } catch (error) {
      return null;
    }
  },

  // Offline session kontrolü (internet yokken)
  async getOfflineSession(): Promise<UserSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem(USER_SESSION_KEY);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      return null;
    }
  },

  // Çıkış yap
  async logout(): Promise<void> {
    await tokenService.clearAuth();
    await AsyncStorage.multiRemove([USER_SESSION_KEY, CHECKPOINT_NAME_KEY]);
  },

  // Checkpoint listesini getir (Admin için)
  async getCheckpoints(eventId: number): Promise<Checkpoint[]> {
    try {
      const response = await api.get<Checkpoint[]>(`/events/${eventId}/checkpoints`);
      return response.data;
    } catch (error) {
      return [];
    }
  },

  // Session var mı kontrolü
  async hasSession(): Promise<boolean> {
    const session = await this.getOfflineSession();
    return session !== null;
  },

  // Checkpoint atanmış mı kontrolü
  async hasCheckpoint(): Promise<boolean> {
    const session = await this.getOfflineSession();
    return session?.checkpointId !== null;
  }
};