import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NetInfo from '@react-native-community/netinfo';
import api from '../config/api';
import { PendingSync, SyncRecord, SyncResponse, SyncItemResult, RaceResult } from '../interface/sync';
import { authService } from './authService';

const QUEUE_KEY = '@nfc_scan_queue';
const SYNC_INTERVAL = 60000; // 60 saniye

let syncIntervalId: ReturnType<typeof setInterval> | null = null;

export const syncService = {
  // ==================== QUEUE YÖNETİMİ ====================
  
  // Yeni tarama ekle
  async addToQueue(
    tagId: string,
    checkpointId: number,
    checkpointName: string,
    coords?: { lat: number; lon: number }
  ): Promise<PendingSync> {
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
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(existing));
    
    // Hemen sync'i dene
    this.trySync();
    
    return newItem;
  },

  // Queue'yu getir
  async getQueue(): Promise<PendingSync[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Queue okuma hatası:', error);
      return [];
    }
  },

  // Pending kayıtları getir
  async getPendingItems(): Promise<PendingSync[]> {
    const queue = await this.getQueue();
    return queue.filter(item => item.status === 'PENDING');
  },

  // Sync edilmiş kayıtları getir
  async getSyncedItems(): Promise<PendingSync[]> {
    const queue = await this.getQueue();
    return queue.filter(item => item.status === 'SYNCED');
  },

  // Kayıt durumunu güncelle
  async updateItemStatus(
    id: string, 
    status: 'PENDING' | 'SYNCED' | 'FAILED',
    syncResult?: SyncItemResult
  ): Promise<void> {
    const queue = await this.getQueue();
    const index = queue.findIndex(item => item.id === id);
    
    if (index !== -1) {
      queue[index].status = status;
      if (syncResult) {
        queue[index].syncResult = syncResult;
      }
      if (status === 'FAILED') {
        queue[index].retryCount++;
      }
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }
  },

  // Queue'yu temizle
  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
  },

  // Sadece sync edilmiş kayıtları temizle
  async clearSyncedItems(): Promise<void> {
    const queue = await this.getQueue();
    const pending = queue.filter(item => item.status !== 'SYNCED');
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(pending));
  },

  // ==================== SYNC İŞLEMLERİ ====================

  // Manuel sync tetikle
  async trySync(): Promise<SyncResponse | null> {
    // İnternet kontrolü
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('İnternet bağlantısı yok, sync atlandı');
      return null;
    }

    const pending = await this.getPendingItems();
    if (pending.length === 0) {
      console.log('Sync edilecek kayıt yok');
      return null;
    }

    // Session kontrolü (hangi gün olduğunu anlamak için)
    const session = await authService.getOfflineSession();
    if (!session) {
      console.log('Oturum yok, sync atlandı');
      return null;
    }

    // Records'ları API formatına çevir
    const records: SyncRecord[] = pending.map(item => ({
      tagId: item.tagId,
      bibNumber: item.bibNumber,
      racerName: item.racerName,
      checkpointId: item.checkpointId,
      checkpointName: item.checkpointName,
      timestamp: new Date(item.timestamp).toISOString(),
      lat: item.coords?.lat,
      lon: item.coords?.lon,
    }));

    try {
      // PreRace veya Race sync (şimdilik race varsayalım, config'den alınabilir)
      const isPreRace = await this.isPreRaceDay();
      const endpoint = isPreRace ? '/times/prerace/sync' : '/times/race/sync';
      
      const response = await api.post<SyncResponse>(endpoint, { records });
      const result = response.data;

      // Her kaydın durumunu güncelle
      for (const detail of result.details) {
        const item = pending.find(p => p.tagId === detail.tagId && p.checkpointId === detail.checkpointId);
        if (item) {
          const status = detail.status === 'OK' ? 'SYNCED' : 
                        detail.status === 'ERROR' ? 'FAILED' : 'PENDING';
          await this.updateItemStatus(item.id, status, detail);
        }
      }

      console.log(`Sync tamamlandı: ${result.synced}/${result.processed} başarılı`);
      return result;
    } catch (error: any) {
      console.error('Sync hatası:', error.response?.data || error.message);
      return null;
    }
  },

  // Otomatik sync başlat (60 saniyede bir)
  startAutoSync(): void {
    if (syncIntervalId) {
      clearInterval(syncIntervalId);
    }
    
    syncIntervalId = setInterval(() => {
      this.trySync();
    }, SYNC_INTERVAL);
    
    console.log('Otomatik sync başlatıldı (60 saniye aralık)');
  },

  // Otomatik sync durdur
  stopAutoSync(): void {
    if (syncIntervalId) {
      clearInterval(syncIntervalId);
      syncIntervalId = null;
      console.log('Otomatik sync durduruldu');
    }
  },

  // ==================== VERİ SORGULAMA ====================

  // PreRace sonuçlarını getir
  async getPreRaceResults(checkpointId?: number): Promise<RaceResult[]> {
    try {
      const params = checkpointId ? `?checkpointId=${checkpointId}` : '';
      const response = await api.get<RaceResult[]>(`/times/prerace/results${params}`);
      return response.data;
    } catch (error) {
      console.error('PreRace sonuçları alınamadı:', error);
      return [];
    }
  },

  // Race sonuçlarını getir
  async getRaceResults(checkpointId?: number): Promise<RaceResult[]> {
    try {
      const params = checkpointId ? `?checkpointId=${checkpointId}` : '';
      const response = await api.get<RaceResult[]>(`/times/race/results${params}`);
      return response.data;
    } catch (error) {
      console.error('Race sonuçları alınamadı:', error);
      return [];
    }
  },

  // Final sonuçları getir
  async getFinalResults(eventId: number): Promise<RaceResult[]> {
    try {
      const response = await api.get<RaceResult[]>(`/times/race/final/${eventId}`);
      return response.data;
    } catch (error) {
      console.error('Final sonuçları alınamadı:', error);
      return [];
    }
  },

  // ==================== HELPER ====================

  // PreRace günü mü kontrolü (config'den veya event'ten alınabilir)
  async isPreRaceDay(): Promise<boolean> {
    // Şimdilik false döndür (Race Day varsayıyoruz)
    // İleride event bilgisinden veya manuel config'den alınabilir
    const config = await AsyncStorage.getItem('@race_day_config');
    return config === 'prerace';
  },

  // Race Day modunu ayarla
  async setRaceMode(isPreRace: boolean): Promise<void> {
    await AsyncStorage.setItem('@race_day_config', isPreRace ? 'prerace' : 'race');
  },

  // Sync istatistiklerini getir
  async getSyncStats(): Promise<{
    total: number;
    pending: number;
    synced: number;
    failed: number;
  }> {
    const queue = await this.getQueue();
    return {
      total: queue.length,
      pending: queue.filter(i => i.status === 'PENDING').length,
      synced: queue.filter(i => i.status === 'SYNCED').length,
      failed: queue.filter(i => i.status === 'FAILED').length,
    };
  }
};

export default syncService;
