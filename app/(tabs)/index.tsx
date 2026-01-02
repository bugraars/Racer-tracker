import Colors from '@/constants/Colors';
import { useColorScheme } from '@/src/components/useColorScheme';
import { PendingSync } from '@/src/interface/sync';
import { nfcService } from '@/src/services/nfcService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NetInfo from '@react-native-community/netinfo';
import * as Clipboard from 'expo-clipboard';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, ToastAndroid, TouchableOpacity, View } from 'react-native';

export default function TabOneScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  
  const [status, setStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [lastScan, setLastScan] = useState<PendingSync | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [activeCp, setActiveCp] = useState('YÜKLENİYOR...');
  const [conn, setConn] = useState<{ type: string | null; isConnected: boolean | null }>({ type: null, isConnected: true });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | number | null>(null);
  const cacheCheckIntervalRef = useRef<NodeJS.Timeout | number | null>(null);

  // Silme işlemini dinle
  useEffect(() => {
    const checkCacheCleared = async () => {
      try {
        const queueData = await AsyncStorage.getItem('@nfc_scan_queue');
        // Queue silinmişse veya boşsa lastScan'ı sıfırla
        if (!queueData || queueData === '[]') {
          if (lastScan) {
            setLastScan(null);
          }
        }
      } catch (e) {
        console.error('Cache check hatası:', e);
      }
    };

    checkCacheCleared(); // İlk çalıştırma
    cacheCheckIntervalRef.current = setInterval(checkCacheCleared, 1000);
    
    return () => {
      if (cacheCheckIntervalRef.current) {
        clearInterval(cacheCheckIntervalRef.current);
      }
    };
  }, [lastScan]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setConn({ type: state.type, isConnected: state.isConnected });
    });
    loadConfig();
    requestLocationPermission();
    return () => unsubscribe();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Konum izni reddedildi');
      }
    } catch (e) {
      console.error('Konum izni hatası:', e);
    }
  };

  const loadConfig = async () => {
    // AsyncStorage'dan çekilen değeri hem state'e hem de fonksiyona geri döndür
    const cp = (await AsyncStorage.getItem('@checkpoint_name')) || ' CHECKPOINT';
    setActiveCp(cp);
    return cp;
  };

  const getLocationCoords = async () => {
    try {
      setIsLoadingLocation(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Konum izni reddedildi');
        return { lat: 0, lng: 0 };
      }

      // Önce son bilinen konumu dene (hızlı)
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        return {
          lat: lastKnown.coords.latitude,
          lng: lastKnown.coords.longitude
        };
      }

      // Son bilinen yoksa, yeni konum al (timeout ile)
      const location = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Balanced,
      });
      
      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude
      };
    } catch (e) {
      console.error('GPS hatası:', e);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Konum alınamadı', ToastAndroid.SHORT);
      }
      return { lat: 0, lng: 0 };
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Numara panoya kopyalandı', ToastAndroid.SHORT);
    } else {
      Alert.alert('Başarılı', 'Numara panoya kopyalandı');
    }
  };

  const handleNfcScan = async () => {
    const currentCp = await loadConfig();
    setShowWarning(false); 
    setStatus('SCANNING');

    // GPS koordinatlarını al
    const coords = await getLocationCoords();

    const result = await nfcService.readTag();

    if (result.success) {
      const riderId = result.tagId || '14 BUĞRA ARSLAN'; 
      
      try {
        const stored = await AsyncStorage.getItem('@nfc_scan_queue');
        let currentList: PendingSync[] = stored ? JSON.parse(stored) : [];

        const isDuplicate = currentList.find(item => item.tagId === riderId && item.pointName === currentCp);
        
        if (isDuplicate) {
          setShowWarning(true);
          setStatus('IDLE');
          setTimeout(() => setShowWarning(false), 3000);
          return;
        }

        const newEntry: PendingSync = {
          id: Date.now().toString(),
          tagId: riderId,
          payload: result.data || '',
          status: 'PENDING',
          retryCount: 0,
          timestamp: Date.now(),
          pointName: currentCp,
          coords: coords
        };

        const updatedList = [newEntry, ...currentList];
        await AsyncStorage.setItem('@nfc_scan_queue', JSON.stringify(updatedList));
        // Cache'e kaydet
        await AsyncStorage.setItem('@last_scan_cache', JSON.stringify(newEntry));
        
        setLastScan(newEntry);
        setStatus('SUCCESS');

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setStatus('IDLE'), 15000);

      } catch (err) {
        console.error("Kayıt hatası:", err);
        setStatus('ERROR');
      }
    } else {
      setStatus('ERROR');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <View style={[styles.fullCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        
        {/* 1. ÜST BİLGİ */}
        <View style={styles.topHeader}>
          <Text style={[styles.locationText, { color: lastScan ? colors.palette.blue[600] : colors.palette.gray[400] }]}>
            Konum: {activeCp}
          </Text>
          <View style={styles.systemInfo}>
            <Text style={styles.staffId}>Staff 21</Text>
            <MaterialCommunityIcons 
              name={!conn.isConnected ? "wifi-off" : (conn.type === 'wifi' ? "wifi" : "transmission-tower")} 
              size={20} 
              color={conn.isConnected ? colors.palette.emerald[500] : colors.palette.rose[500]} 
            />
          </View>
        </View>

        {/* 2. ZAMAN */}
        <View style={styles.timeBox}>
          <Text style={[styles.timeText, { color: colors.text }]}>
            {lastScan ? new Date(lastScan.timestamp).toLocaleTimeString('tr-TR', { hour12: false }) : '00:00:00'}
            <Text style={styles.msText}>:{lastScan ? String(lastScan.timestamp % 1000).padStart(3, '0') : '000'}</Text>
          </Text>
        </View>

        {/* 3. YARIŞÇI (YEŞİL) */}
        <View style={styles.heroSection}>
          {lastScan ? (
            <Text style={styles.driverNameHero} numberOfLines={2}>
              <Text style={styles.driverNumber}>{lastScan.tagId?.split(' ')[0]}</Text>
              {" "}
              {lastScan.tagId?.split(' ').slice(1).join(' ').toUpperCase()}
            </Text>
          ) : (
            <Text style={[styles.driverNameHero, { color: colors.palette.gray[200] }]}>NFC OKUTUN</Text>
          )}
        </View>

        <View style={styles.hr} />

        {/* 4. DETAYLAR (KAYDIRILABİLİR ALAN) */}
        <ScrollView style={styles.infoSection} showsVerticalScrollIndicator={false}>
          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>ARAÇ</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>KTM 2022</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>YAŞ</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>22</Text>
            </View>
          </View>

          <View style={[styles.detailGrid, { marginTop: 20 }]}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>KAN GRUBU</Text>
              <Text style={[styles.detailValue, { color: colors.palette.rose[600] }]}>0 RH+</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>UYRUK</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>TUR 🇹🇷</Text>
            </View>
          </View>

          {/* KOORDİNAT BİLGİSİ */}
          {lastScan && lastScan.coords && (lastScan.coords.lat !== 0 || lastScan.coords.lng !== 0) && (
            <View style={[styles.detailGrid, { marginTop: 20 }]}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>KONUM (LAT)</Text>
                <Text style={[styles.detailValue, { color: colors.text, fontSize: 14 }]}>
                  {lastScan.coords.lat.toFixed(5)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>KONUM (LNG)</Text>
                <Text style={[styles.detailValue, { color: colors.text, fontSize: 14 }]}>
                  {lastScan.coords.lng.toFixed(5)}
                </Text>
              </View>
            </View>
          )}

          {/* TEAM / EMERGENCY CONTACT */}
          <TouchableOpacity 
            activeOpacity={0.7}
            onLongPress={() => handleCopy("+90 5XX XXX XX XX")}
            style={{ marginTop: 25 }}
          >
            <Text style={[styles.detailLabel, { color: colors.palette.rose[500] }]}>TEAM / EMERGENCY CONTACT</Text>
            <View style={styles.contactRow}>
              <Text style={[styles.detailValue, { color: colors.palette.rose[600], fontSize: 22 }]}>
                +90 5XX XXX XX XX
              </Text>
              <MaterialCommunityIcons name="content-copy" size={16} color={colors.palette.rose[400]} style={{marginLeft: 10}} />
            </View>
            <Text style={styles.copyHint}>Kopyalamak için numaraya basılı tutun</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 5. BUTON VE ÜSTÜNE BİNECEK UYARI PANELİ */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={handleNfcScan}
            disabled={status === 'SCANNING' || isLoadingLocation}
            style={[styles.slimButton, { backgroundColor: status === 'SCANNING' ? colors.palette.blue[500] : status === 'SUCCESS' ? colors.palette.emerald[500] : status === 'ERROR' ? colors.palette.rose[500] : colors.palette.blue[600] }]}
          >
            <Text style={styles.buttonLabel}>
              {isLoadingLocation ? 'KOORDİNAT ALINIYOR...' : status === 'SCANNING' ? 'OKUTUNUZ...' : status === 'IDLE' ? 'NFC TARAMA' : 'İŞLEM TAMAM'}
            </Text>
          </TouchableOpacity>

          {showWarning && (
            <TouchableOpacity 
              activeOpacity={1}
              onPress={() => setShowWarning(false)}
              style={styles.warningOverlay}
            >
              <MaterialCommunityIcons name="alert-decagram" size={24} color="white" />
              <View>
                <Text style={styles.warningTitle}>MÜKERRER OKUMA!</Text>
                <Text style={styles.warningSub}>Bu yarışçıya ait bu Checkpoint'te kayıt var!</Text>
              </View>
              <MaterialCommunityIcons name="close" size={18} color="white" style={{marginLeft: 'auto'}} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fullCard: { flex: 1, margin: 15, borderRadius: 30, padding: 25, elevation: 5, borderWidth: 1 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  locationText: { fontSize: 18, fontWeight: '800' },
  systemInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  staffId: { fontSize: 12, fontWeight: '700', color: '#aaa' },
  timeBox: { alignItems: 'center', marginBottom: 5 },
  timeText: { fontSize: 42, fontWeight: '800' },
  msText: { fontSize: 22, color: '#bbb' },
  heroSection: { alignItems: 'center', marginBottom: 5 },
  driverNameHero: { fontSize: 36, fontWeight: '900', textAlign: 'center', color: '#10b981' },
  driverNumber: { fontSize: 22, fontWeight: '600', color: '#059669' },
  hr: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  infoSection: { flex: 1 },
  detailGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 10, fontWeight: '800', color: '#bbb', marginBottom: 4 },
  detailValue: { fontSize: 20, fontWeight: 'bold' },
  contactRow: { flexDirection: 'row', alignItems: 'center' },
  copyHint: { fontSize: 9, color: '#aaa', fontStyle: 'italic', marginTop: 2 },
  buttonContainer: { marginTop: 15, position: 'relative' },
  slimButton: { height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  buttonLabel: { color: 'white', fontSize: 16, fontWeight: '800' },
  warningOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#e11d48',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    zIndex: 999,
  },
  warningTitle: { color: 'white', fontWeight: '900', fontSize: 14 },
  warningSub: { color: 'rgba(255,255,255,0.9)', fontSize: 11 },
});