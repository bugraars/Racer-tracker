// NFC Okuma Sonuçları
export interface NfcScanResult {
  success: boolean;
  data?: string;      // NDEF mesaj içeriği
  tagId?: string;     // Etiket UID
  error?: string;
  timestamp: number;
}