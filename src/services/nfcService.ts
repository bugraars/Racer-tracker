import NfcManager, { Ndef, NfcTech } from 'react-native-nfc-manager';

export interface NfcReadResult {
  success: boolean;
  tagId?: string;
  data?: string;
  allData?: string; // Kartın tüm ham detayları için
  error?: string;
}

export const nfcService = {
  async init() {
    try {
      await NfcManager.start();
    } catch (ex) {
      console.warn("NFC başlatılamadı:", ex);
    }
  },

  async readTag(): Promise<NfcReadResult> {
    try {
      // Sadece Ndef değil, genel bir istek gönderiyoruz
      await NfcManager.requestTechnology([NfcTech.Ndef, NfcTech.NfcA, NfcTech.IsoDep]);
      const tag = await NfcManager.getTag();
      
      if (!tag) throw new Error("Etiket yakalanamadı");

      // 1. Metin İçeriğini Çöz (Varsa)
      let decodedText = "N/A";
      if (tag.ndefMessage && tag.ndefMessage.length > 0) {
        const payload = tag.ndefMessage[0].payload;
        decodedText = Ndef.text.decodePayload(Uint8Array.from(payload));
      }

      // 2. Tüm Ham Veriyi String'e Çevir (Kartta ne var ne yoksa)
      // Tag objesinin içindeki tüm teknik detayları (sak, atqa, techTypes vb.) JSON yapıyoruz
      const rawDetails = JSON.stringify(tag, null, 2);

      return {
        success: true,
        tagId: tag.id || undefined,
        data: decodedText,
        allData: rawDetails, 
      };
    } catch (ex: any) {
      return { success: false, error: ex.toString() };
    } finally {
      NfcManager.cancelTechnologyRequest();
    }
  }
};