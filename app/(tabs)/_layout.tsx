import Colors from '@/constants/Colors'; // Alias kullanımına dikkat (@/)
import { useColorScheme } from '@/src/components/useColorScheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const theme = useColorScheme() ?? 'light';
  const currentColors = Colors[theme];
  const [isInfoVisible, setIsInfoVisible] = useState(false);

  const infoItems = useMemo(
    () => [
      'Profil sekmesinden checkpoint ve görevli bilgilerini güncelleyin.',
      'NFC Tarayıcı sekmesinde kartı okutun; mükerrer okumalarda uyarı çıkar.',
      'Veri Tablosu sekmesinde kayıtlar eskiden yeniye listelenir.',
      'Senkronizasyon veya bağlantı sorunu yaşarsanız tabloyu yenileyin.',
      'Destek: +90 555 555 55 55'
    ],
    []
  );

  const showInfo = () => setIsInfoVisible(true);

  return (
    <>
      <Tabs
        screenOptions={{
          // Aktif tab ikonu ve yazısı senin seçtiğin Primary renkte olsun
          tabBarActiveTintColor: currentColors.palette.emerald[600],
          tabBarInactiveTintColor: currentColors.palette.gray[400],
          tabBarStyle: {
            backgroundColor: currentColors.card,
            borderTopColor: currentColors.border,
            height: 60,
            paddingBottom: 8,
          },
          headerStyle: {
            backgroundColor: currentColors.card,
          },
          headerTitleStyle: {
            color: currentColors.text,
            fontWeight: 'bold',
          },
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={showInfo} style={{ paddingHorizontal: 12 }}>
              <MaterialCommunityIcons name="information-outline" size={22} color={currentColors.text} />
            </TouchableOpacity>
          ),
        }}>
        {/* Ana Sayfa (NFC Okuma Ekranı) */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'NFC Tarayıcı',
            tabBarLabel: 'NFC Tarayıcı',
            tabBarIcon: ({ color }) => <TabBarIcon name="qrcode" color={color} />,
          }}
        />

        <Tabs.Screen
          name="list"
          options={{
            title: 'Veri Tablosu',
            tabBarLabel: 'Veri Tablosu',
            tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
          }}
        />

        {/* Profil / Ayarlar Sayfası */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Görevli Profil',
            tabBarLabel: 'Görevli Profil',
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          }}
        />
      </Tabs>

      {/* Genel bilgi modali */}
      <Modal visible={isInfoVisible} transparent animationType="fade" onRequestClose={() => setIsInfoVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: currentColors.card }]}> 
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentColors.text }]}>Nasıl Kullanılır?</Text>
              <TouchableOpacity onPress={() => setIsInfoVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color={currentColors.palette.gray[500]} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {infoItems.map((item, idx) => (
                <View key={idx} style={styles.infoRow}>
                  <View style={[styles.bullet, { backgroundColor: currentColors.palette.blue[500] }]} />
                  <Text style={[styles.infoText, { color: currentColors.text }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    padding: 22,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  modalBody: { gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  infoText: { flex: 1, fontSize: 14, fontWeight: '600' },
});