// NFC'den okunan yarışçı verisi
export interface RacerNfcData {
  bib: number;
  firstName: string;
  lastName: string;
  nat: string;
  age: number;
  blood: string;
  phone: string;
}

// Bekleyen sync kaydı (lokal storage)
export interface PendingSync {
  id: string;
  racer: RacerNfcData;
  checkpointId: number;
  checkpointName: string;
  timestamp: number;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  coords?: {
    lng: number;
    lat: number;
    lon: number;
  };
  syncResult?: SyncItemResult;
}

// Server'a gönderilecek sync kaydı
export interface SyncRecord {
  racer: RacerNfcData;
  checkpointId: number;
  checkpointName: string;
  timestamp: string; // ISO format
  lat?: number;
  lon?: number;
}

// Tekil sync sonucu
export interface SyncItemResult {
  bib: number;
  checkpointId: number;
  status: 'OK' | 'NOT' | 'ERROR';
  reason?: string;
  message?: string;
}

// Toplu sync yanıtı
export interface SyncResponse {
  success: boolean;
  processed: number;
  synced: number;
  skipped: number;
  errors: number;
  details: SyncItemResult[];
}

// Sync durumu kontrolü için
export interface SyncStatusCheck {
  tagId: string;
  checkpointId: number;
  timestamp: string;
}

export interface SyncStatusResponse {
  tagId: string;
  checkpointId: number;
  synced: boolean;
}

// Race sonuçları
export interface RaceResult {
  id: number;
  racerId: number;
  racer: {
    bibNumber: number;
    name: string;
  };
  checkpointId: number;
  checkpoint: {
    name: string;
  };
  sectionTime: number; // saniye
  totalTime: number; // saniye
  position?: number;
}

// Zaman formatı helper
export const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};