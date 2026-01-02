import Colors from '@/constants/Colors';
import { useColorScheme } from '@/src/components/useColorScheme';
import { PendingSync } from '@/src/interface/sync';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ListScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const [history, setHistory] = useState<PendingSync[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCp, setActiveCp] = useState('YÜKLENİYOR...');
  const isFocused = useIsFocused();
  const checkIntervalRef = useRef<number | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const storedData = await AsyncStorage.getItem('@nfc_scan_queue');
      if (storedData) {
        const parsed: PendingSync[] = JSON.parse(storedData);
        // İlk kaydı üstte göstermek için zaman damgasına göre sıralıyoruz (eskiden yeniye)
        parsed.sort((a, b) => a.timestamp - b.timestamp);
        setHistory(parsed);
      } else {
        setHistory([]);
      }
    } catch (e) {
      console.error("Veri yükleme hatası:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCheckpoint = async () => {
    const cp = await AsyncStorage.getItem('@checkpoint_name');
    setActiveCp(cp || 'CHECK 1');
  };

  useEffect(() => {
    if (isFocused) {
      loadData();
      loadCheckpoint();
    }
  }, [isFocused]);

  // Silme işlemini dinle
  useEffect(() => {
    const checkDataCleared = async () => {
      try {
        const data = await AsyncStorage.getItem('@nfc_scan_queue');
        if (!data && history.length > 0) {
          setHistory([]);
        }
      } catch (e) {
        console.error('Data check hatası:', e);
      }
    };

    checkIntervalRef.current = setInterval(checkDataCleared, 1000);
    
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [history.length]);

  const renderItem = ({ item, index }: { item: PendingSync; index: number }) => {
    // Zebra deseni
    const isOdd = index % 2 !== 0;
    const rowBackground = isOdd 
      ? (theme === 'light' ? '#F7F7F7' : '#1A1A1A') 
      : colors.card;

    // Zaman Hesaplama (Hata payı bırakmamak için manuel formatlama)
    const date = new Date(item.timestamp);
    const HH = String(date.getHours()).padStart(2, '0');
    const MM = String(date.getMinutes()).padStart(2, '0');
    const SS = String(date.getSeconds()).padStart(2, '0');
    const MS = String(item.timestamp % 1000).padStart(3, '0');

    return (
      <View style={[styles.row, { backgroundColor: rowBackground, borderBottomColor: colors.border }]}>
        {/* DURUM İKONU */}
        <View style={styles.syncCol}>
          <MaterialCommunityIcons 
            name={item.status === 'SYNCED' ? "check-circle" : "clock-outline"} 
            size={14} 
            color={item.status === 'SYNCED' ? colors.palette.emerald[500] : colors.palette.amber[500]} 
          />
        </View>

        {/* NO */}
        <View style={styles.numCol}>
          <Text style={[styles.numText, { color: colors.text }]}>
            {item.tagId?.split(' ')[0] || '00'}
          </Text>
        </View>

        {/* YARIŞÇI ADI */}
        <View style={styles.nameCol}>
          <Text style={[styles.nameText, { color: colors.text }]} numberOfLines={1}>
            {item.tagId?.split(' ').slice(1).join(' ').toUpperCase() || 'BİLİNMEYEN'}
          </Text>
        </View>

        {/* TAM SÜRE (Milisaniye ile) */}
        <View style={styles.timeCol}>
          <Text style={[styles.timeText, { color: colors.text }]}>
            {`${HH}:${MM}:${SS}`}
            <Text style={styles.msText}>:{MS}</Text>
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* BAŞLIK PANELİ */}
      <View style={[styles.stickyHeader, { backgroundColor: colors.palette.blue[700] }]}>
        <View style={styles.headerTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View>
              <Text style={styles.headerTitleSmall}>{activeCp}</Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={loadData} disabled={isLoading} style={styles.refreshBtn}>
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialCommunityIcons name="refresh" size={26} color="white" />
            )}
          </TouchableOpacity>
        </View>
        
        {/* TABLO ETİKETLERİ */}
        <View style={styles.tableLabels}>
          <View style={{ width: 25 }} />
          <Text style={[styles.label, { width: 35 }]}>NO</Text>
          <Text style={[styles.label, { flex: 1 }]}>YARIŞÇI ADI</Text>
          <Text style={[styles.label, { width: 110, textAlign: 'right' }]}>TAM SÜRE</Text>
        </View>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="text-box-remove-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Henüz bir geçiş kaydı bulunmuyor.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stickyHeader: {
    paddingTop: Platform.OS === 'ios' ? 32 : 24,
    paddingBottom: 12,
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitleSmall: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  headerTitleBig: { color: 'white', fontSize: 18, fontWeight: '900', marginTop: -2 },
  refreshBtn: { padding: 5 },
  tableLabels: {
    flexDirection: 'row',
    opacity: 0.5,
    paddingBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: 'white',
  },
  label: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 0.5,
  },
  syncCol: { width: 25 },
  numCol: { width: 35 },
  nameCol: { flex: 1, paddingRight: 5 },
  timeCol: { 
    width: 110, 
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  numText: { fontSize: 13, fontWeight: '800' },
  nameText: { fontSize: 13, fontWeight: '600' },
  timeText: { 
    fontSize: 12, 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', 
    textAlign: 'right',
    fontWeight: '700'
  },
  msText: { fontSize: 10, opacity: 0.6, fontWeight: '400' },
  emptyContainer: { padding: 100, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#aaa', marginTop: 10, textAlign: 'center', fontSize: 14 },
});