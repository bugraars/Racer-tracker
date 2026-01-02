import Colors from '@/constants/Colors';
import { useColorScheme } from '@/src/components/useColorScheme';
import { storageService } from '@/src/services/storageService';
import { authService } from '@/src/services/authService';
import { UserSession } from '@/src/interface/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, ToastAndroid, TouchableOpacity, View, ActivityIndicator } from 'react-native';

export default function ProfileScreen() {
  const theme = useColorScheme() ?? 'light';
  const colors = Colors[theme];
  const router = useRouter();

  const [staffInfo, setStaffInfo] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'CLEAR' | 'LOGOUT' | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const session = await authService.getOfflineSession();
      if (session) {
        setStaffInfo(session);
      }
    } catch (error) {
      console.error('Profil yüklenirken hata:', error);
    } finally {
      setLoading(false);
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

  const getRoleBadgeColor = (role: string) => {
    return role === 'ADMIN' 
      ? { bg: colors.palette.amber[100], text: colors.palette.amber[700] }
      : { bg: colors.palette.blue[100], text: colors.palette.blue[700] };
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.palette.blue[600]} />
        <Text style={[styles.loadingText, { color: colors.palette.gray[500] }]}>Yükleniyor...</Text>
      </View>
    );
  }

  if (!staffInfo) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="account-alert" size={64} color={colors.palette.gray[400]} />
        <Text style={[styles.errorText, { color: colors.text }]}>Oturum bilgisi bulunamadı</Text>
        <TouchableOpacity 
          style={[styles.loginBtn, { backgroundColor: colors.palette.blue[600] }]}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.loginBtnText}>Giriş Yap</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const roleColors = getRoleBadgeColor(staffInfo.role);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* STAFF CODE CARD */}
        <View style={[styles.codeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.codeLabel}>GÖREVLİ KİMLİK KODU</Text>
          <Text style={[styles.codeValue, { color: colors.palette.blue[600] }]}>{staffInfo.staffCode}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleColors.bg }]}>
            <Text style={[styles.roleText, { color: roleColors.text }]}>
              {staffInfo.role === 'ADMIN' ? 'YÖNETİCİ' : 'GÖREVLİ'}
            </Text>
          </View>
        </View>

        {/* STAFF INFO */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.palette.gray[500] }]}>GÖREVLİ BİLGİLERİ</Text>
          
          <View style={[styles.infoRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoIcon}>
              <MaterialCommunityIcons name="account" size={20} color={colors.palette.blue[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.palette.gray[500] }]}>Ad Soyad</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{staffInfo.fullName || 'Belirtilmemiş'}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoIcon}>
              <MaterialCommunityIcons name="phone" size={20} color={colors.palette.emerald[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.palette.gray[500] }]}>Telefon</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{staffInfo.phone || 'Belirtilmemiş'}</Text>
            </View>
          </View>
        </View>

        {/* CHECKPOINT INFO */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.palette.gray[500] }]}>ATANDIĞI NOKTA</Text>
          
          {staffInfo.checkpointId ? (
            <View style={[styles.checkpointCard, { backgroundColor: colors.card, borderColor: colors.palette.blue[200] }]}>
              <View style={[styles.checkpointIcon, { backgroundColor: colors.palette.blue[100] }]}>
                <MaterialCommunityIcons name="map-marker-check" size={28} color={colors.palette.blue[600]} />
              </View>
              <View style={styles.checkpointInfo}>
                <Text style={[styles.checkpointName, { color: colors.text }]}>{staffInfo.checkpointName}</Text>
                <Text style={[styles.checkpointHint, { color: colors.palette.gray[500] }]}>
                  Checkpoint ID: {staffInfo.checkpointId}
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.noCheckpointCard, { backgroundColor: colors.palette.amber[50], borderColor: colors.palette.amber[200] }]}>
              <MaterialCommunityIcons name="alert-circle" size={24} color={colors.palette.amber[600]} />
              <View style={styles.noCheckpointContent}>
                <Text style={[styles.noCheckpointText, { color: colors.palette.amber[700] }]}>
                  Henüz bir checkpoint atanmamış
                </Text>
                <Text style={[styles.noCheckpointHint, { color: colors.palette.amber[600] }]}>
                  Yöneticinizle iletişime geçin
                </Text>
              </View>
            </View>
          )}

          {staffInfo.role === 'STAFF' && (
            <Text style={[styles.readonlyHint, { color: colors.palette.gray[400] }]}>
              * Checkpoint ataması yönetici tarafından yapılır
            </Text>
          )}
        </View>

        <View style={styles.divider} />

        {/* SYSTEM ACTIONS */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.palette.rose[500] }]}>SİSTEM YÖNETİMİ</Text>
          
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]} 
            onPress={() => { setModalType('CLEAR'); setModalVisible(true); }}
          >
            <MaterialCommunityIcons name="database-off" size={20} color={colors.palette.amber[600]} />
            <Text style={[styles.actionText, { color: colors.text }]}>Yerel Kayıtları Sıfırla</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]} 
            onPress={() => { setModalType('LOGOUT'); setModalVisible(true); }}
          >
            <MaterialCommunityIcons name="power" size={20} color={colors.palette.rose[600]} />
            <Text style={[styles.actionText, { color: colors.palette.rose[600] }]}>Sistemden Çıkış Yap</Text>
          </TouchableOpacity>
        </View>

        {/* SESSION INFO */}
        <View style={[styles.sessionInfo, { backgroundColor: colors.palette.gray[100] }]}>
          <MaterialCommunityIcons name="information-outline" size={16} color={colors.palette.gray[500]} />
          <Text style={[styles.sessionText, { color: colors.palette.gray[500] }]}>
            Oturum 48 saat geçerlidir
          </Text>
        </View>
      </ScrollView>

      {/* CONFIRMATION MODAL */}
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
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 25, paddingTop: 50 },
  
  // Loading & Error
  loadingText: { marginTop: 12, fontSize: 14 },
  errorText: { marginTop: 16, fontSize: 16, fontWeight: '600' },
  loginBtn: { marginTop: 20, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 12 },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  // Code Card
  codeCard: { padding: 20, borderRadius: 20, borderWidth: 1, alignItems: 'center', marginBottom: 30, borderStyle: 'dashed' },
  codeLabel: { fontSize: 10, fontWeight: 'bold', color: '#aaa', marginBottom: 5 },
  codeValue: { fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, marginTop: 10 },
  roleText: { fontSize: 11, fontWeight: 'bold' },
  
  // Section
  section: { marginBottom: 25 },
  sectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  
  // Info Rows
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderRadius: 15, 
    borderWidth: 1, 
    marginBottom: 10 
  },
  infoIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#f0f9ff', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 12
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 16, fontWeight: '600' },
  
  // Checkpoint Card
  checkpointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  checkpointIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  checkpointInfo: { flex: 1 },
  checkpointName: { fontSize: 18, fontWeight: 'bold' },
  checkpointHint: { fontSize: 12, marginTop: 2 },
  
  // No Checkpoint
  noCheckpointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  noCheckpointContent: { flex: 1 },
  noCheckpointText: { fontSize: 14, fontWeight: '600' },
  noCheckpointHint: { fontSize: 12, marginTop: 2 },
  
  readonlyHint: { fontSize: 11, fontStyle: 'italic', marginTop: 10, textAlign: 'center' },
  
  // Divider
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  
  // Action Buttons
  actionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 18, 
    borderRadius: 15, 
    borderWidth: 1, 
    gap: 12 
  },
  actionText: { fontSize: 15, fontWeight: '700' },
  
  // Session Info
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 10,
  },
  sessionText: { fontSize: 12 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { width: '100%', borderRadius: 30, padding: 30, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 15 },
  modalSub: { textAlign: 'center', color: '#888', marginTop: 8 },
  modalActions: { flexDirection: 'row', gap: 15, marginTop: 25 },
  cancelBtn: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 15, backgroundColor: '#f1f5f9' },
  cancelBtnText: { fontWeight: 'bold', color: '#64748b' },
  confirmBtn: { flex: 2, height: 50, justifyContent: 'center', alignItems: 'center', borderRadius: 15 },
  confirmBtnText: { color: 'white', fontWeight: 'bold' },
});
