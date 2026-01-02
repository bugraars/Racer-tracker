import Colors from '@/constants/Colors';
import { useColorScheme } from '@/src/components/useColorScheme';
import { storageService } from '@/src/services/storageService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();

  const [staffName, setStaffName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [checkpointName, setCheckpointName] = useState('CHECK 1');
  const [staffCode] = useState('S-482910');

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'CLEAR' | 'LOGOUT' | null>(null);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);

  const locations = ["START LINE", "CHECK 1", "CHECK 2", "CHECK 3", "CHECK 4", "CHECK 5", "FINISH"];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const name = await AsyncStorage.getItem('@staff_name');
    const phone = await AsyncStorage.getItem('@staff_phone');
    const cp = await AsyncStorage.getItem('@checkpoint_name');
    if (name) setStaffName(name);
    if (phone) setStaffPhone(phone);
    if (cp) setCheckpointName(cp);
  };

  const saveProfile = async (newCp?: string) => {
    await AsyncStorage.setItem('@staff_name', staffName);
    await AsyncStorage.setItem('@staff_phone', staffPhone);
    if (newCp) {
      await AsyncStorage.setItem('@checkpoint_name', newCp);
      setCheckpointName(newCp);
    }
  };

  const handleConfirm = async () => {
    if (modalType === 'CLEAR') {
      const success = await storageService.clearQueue();
      if (success) {
        try {
          await AsyncStorage.removeItem('@last_scan_cache');
        } catch (e) {
          console.error('Cache silme hatası:', e);
        }
        if (Platform.OS === 'android') {
          ToastAndroid.show('Yerel kayıtlar silindi', ToastAndroid.SHORT);
        } else {
          Alert.alert('Başarılı', 'Yerel kayıtlar silindi');
        }
      } else {
        Alert.alert('Hata', 'Kayıtlar silinirken bir hata oluştu');
      }
    } else if (modalType === 'LOGOUT') {
      const success = await storageService.logout();
      if (success) {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Sistemden çıkış yapıldı', ToastAndroid.SHORT);
        } else {
          Alert.alert('Başarılı', 'Sistemden çıkış yapıldı');
        }
        router.replace('/login');
      } else {
        Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
      }
    }
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.codeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.codeLabel}>GÖREVLİ KİMLİK KODU</Text>
          <Text style={[styles.codeValue, { color: colors.palette.blue[600] }]}>{staffCode}</Text>
          <View style={styles.roleBadge}><Text style={styles.roleText}>STAFF (S)</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.palette.gray[500] }]}>GÖREVLİ BİLGİLERİ</Text>
          <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Ad Soyad"
              value={staffName}
              onChangeText={(v) => { setStaffName(v); saveProfile(); }}
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={[styles.inputGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Telefon"
              value={staffPhone}
              keyboardType="phone-pad"
              onChangeText={(v) => { setStaffPhone(v); saveProfile(); }}
              placeholderTextColor="#aaa"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.palette.gray[500] }]}>LOKASYON SEÇİMİ</Text>
          <TouchableOpacity 
            style={[styles.pickerTrigger, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setIsLocationModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.pickerContent}>
              <MaterialCommunityIcons name="map-marker" size={20} color={colors.palette.blue[600]} />
              <Text style={[styles.pickerTriggerText, { color: colors.text }]}>{checkpointName}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={24} color={colors.palette.gray[400]} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.palette.rose[500] }]}>SİSTEM YÖNETİMİ</Text>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {setModalType('CLEAR'); setModalVisible(true);}}>
            <MaterialCommunityIcons name="database-off" size={20} color={colors.palette.amber[600]} />
            <Text style={[styles.actionText, { color: colors.text }]}>Yerel Kayıtları Sıfırla</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]} onPress={() => {setModalType('LOGOUT'); setModalVisible(true);}}>
            <MaterialCommunityIcons name="power" size={20} color={colors.palette.rose[600]} />
            <Text style={[styles.actionText, { color: colors.palette.rose[600] }]}>Sistemden Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* LOKASYON SEÇİM MODALI - MODERN TASARIM */}
      <Modal visible={isLocationModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.locationModalContent, { backgroundColor: colors.card }]}>
            {/* MODAL BAŞLIĞI */}
            <View style={[styles.locationModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.locationModalTitle, { color: colors.text }]}>LOKASYON SEÇİN</Text>
              <TouchableOpacity onPress={() => setIsLocationModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={26} color={colors.palette.gray[500]} />
              </TouchableOpacity>
            </View>

            {/* LOKASYON LİSTESİ */}
            <FlatList
              data={locations}
              keyExtractor={(item) => item}
              scrollEnabled={locations.length > 4}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.locationItem, 
                    { 
                      borderBottomColor: colors.border,
                      backgroundColor: checkpointName === item ? colors.palette.blue[50] : 'transparent'
                    }
                  ]} 
                  onPress={() => { 
                    saveProfile(item); 
                    setIsLocationModalVisible(false); 
                  }}
                  activeOpacity={0.6}
                >
                  <View style={styles.locationItemLeft}>
                    <View style={[
                      styles.locationDot,
                      { 
                        backgroundColor: checkpointName === item 
                          ? colors.palette.blue[600] 
                          : colors.palette.gray[300]
                      }
                    ]} />
                    <Text style={[
                      styles.locationItemText, 
                      { 
                        color: colors.text,
                        fontWeight: checkpointName === item ? 'bold' : '500'
                      }
                    ]}>
                      {item}
                    </Text>
                  </View>
                  {checkpointName === item && (
                    <MaterialCommunityIcons name="check-circle" size={24} color={colors.palette.blue[600]} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* ONAY MODALI */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons 
              name={modalType === 'CLEAR' ? "alert-outline" : "logout"} 
              size={48} 
              color={modalType === 'CLEAR' ? colors.palette.amber[500] : colors.palette.rose[500]} 
            />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {modalType === 'CLEAR' ? 'Veriler Silinsin mi?' : 'Çıkış Yapılsın mı?'}
            </Text>
            <Text style={styles.modalSub}>Bu işlem geri alınamaz, emin misiniz?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>VAZGEÇ</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmBtn, { backgroundColor: modalType === 'CLEAR' ? colors.palette.amber[600] : colors.palette.rose[600] }]} 
                onPress={handleConfirm}
              >
                <Text style={styles.confirmBtnText}>ONAYLA</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 25, paddingTop: 50 },
  codeCard: { padding: 20, borderRadius: 20, borderWidth: 1, alignItems: 'center', marginBottom: 30, borderStyle: 'dashed' },
  codeLabel: { fontSize: 10, fontWeight: 'bold', color: '#aaa', marginBottom: 5 },
  codeValue: { fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  roleBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 10 },
  roleText: { color: '#2563eb', fontSize: 10, fontWeight: 'bold' },
  section: { marginBottom: 25 },
  sectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  inputGroup: { height: 55, borderRadius: 15, borderWidth: 1, paddingHorizontal: 15, justifyContent: 'center', marginBottom: 10 },
  input: { fontSize: 16, fontWeight: '600' },
  pickerTrigger: { 
    height: 55, 
    borderRadius: 15, 
    borderWidth: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15 
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  pickerTriggerText: { fontSize: 16, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 15, borderWidth: 1, gap: 12 },
  actionText: { fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { width: '100%', borderRadius: 30, padding: 30, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 15 },
  modalSub: { textAlign: 'center', color: '#888', marginTop: 8 },
  modalActions: { flexDirection: 'row', gap: 15, marginTop: 25 },
  cancelBtn: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 15, backgroundColor: '#f1f5f9' },
  cancelBtnText: { fontWeight: 'bold', color: '#64748b' },
  confirmBtn: { flex: 2, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 15 },
  confirmBtnText: { color: 'white', fontWeight: 'bold' },
  locationModalContent: { 
    width: '100%', 
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '75%',
    paddingBottom: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  locationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  locationModalTitle: { 
    fontSize: 18, 
    fontWeight: '900',
    letterSpacing: 1
  },
  locationItem: { 
    width: '100%', 
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  locationItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  locationItemText: { 
    fontSize: 16,
    fontWeight: '500'
  }
});