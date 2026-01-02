import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Colors from '../constants/Colors';
import { useColorScheme } from '../src/components/useColorScheme';
import { authService } from '../src/services/authService';

export default function LoginScreen() {
  const [eventId, setEventId] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const currentColors = Colors[theme];

  const handleLogin = async () => {
    if (!eventId || !pin) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }

    setLoading(true);
    const success = await authService.login(eventId, pin);
    setLoading(false);

    if (success) {
      router.replace('/(tabs)'); 
    } else {
      Alert.alert("Hatalı Giriş", "Etkinlik Kodu veya PIN yanlış.");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: currentColors.background }]}
    >
      <View style={[styles.card, { 
        backgroundColor: currentColors.card,
        borderColor: currentColors.border,
        borderWidth: theme === 'dark' ? 1 : 0 
      }]}>
        <Text style={[styles.title, { color: currentColors.text }]}>Racer Tracker</Text>
        <Text style={[styles.subtitle, { color: currentColors.palette.gray[500] }]}>
          Giriş yaparak takibe başlayın
        </Text>

        <TextInput
          style={[styles.input, { 
            backgroundColor: theme === 'light' ? currentColors.palette.gray[100] : currentColors.palette.gray[800],
            color: currentColors.text,
            borderColor: currentColors.border
          }]}
          placeholder="Etkinlik Kodu: STAFF2026"
          placeholderTextColor={currentColors.palette.gray[400]}
          value={eventId}
          onChangeText={setEventId}
          autoCapitalize="characters"
        />

        <TextInput
          style={[styles.input, { 
            backgroundColor: theme === 'light' ? currentColors.palette.gray[100] : currentColors.palette.gray[800],
            color: currentColors.text,
            borderColor: currentColors.border
          }]}
          placeholder="PIN: 1234"
          placeholderTextColor={currentColors.palette.gray[400]}
          value={pin}
          onChangeText={setPin}
          keyboardType="numeric"
          secureTextEntry
        />

        <TouchableOpacity 
          style={[
            styles.button, 
            { backgroundColor: currentColors.palette.emerald[500] }, // Senin istediğin canlı yeşil tonu
            loading && { opacity: 0.7 }
          ]} 
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20 
  },
  card: { 
    padding: 25, 
    borderRadius: 20, 
    elevation: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 12 
  },
  title: { 
    fontSize: 32, 
    fontWeight: '800', 
    textAlign: 'center',
    letterSpacing: -0.5
  },
  subtitle: { 
    fontSize: 16, 
    textAlign: 'center', 
    marginBottom: 35,
    marginTop: 5
  },
  input: { 
    padding: 18, 
    borderRadius: 15, 
    borderWidth: 1, 
    marginBottom: 16, 
    fontSize: 16 
  },
  button: { 
    padding: 18, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginTop: 10,
    // Gölge efekti butonu öne çıkarır
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '700' 
  }
});