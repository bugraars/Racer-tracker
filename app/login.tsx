import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { syncService } from '../src/services/syncService';

export default function LoginScreen() {
  const [staffCode, setStaffCode] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const theme = useColorScheme() ?? 'light';
  const currentColors = Colors[theme];

  // Staff Code formatla (S-XXX) - Sadece sayıları al
  const formatStaffCode = (text: string) => {
    // Sadece rakam izin ver
    let numericOnly = text.replace(/[^0-9]/g, '');
    // Maksimum 3 rakam
    return 'S-' + numericOnly.substring(0, 3);
  };

  const handleLogin = async () => {
    if (!staffCode || staffCode.length < 5) {
      Alert.alert("Hata", "Lütfen geçerli bir Staff ID girin (S-XXX)");
      return;
    }

    if (!pin || pin.length !== 4) {
      Alert.alert("Hata", "PIN 4 haneli olmalıdır");
      return;
    }

    setLoading(true);
    const result = await authService.login(staffCode, pin);
    setLoading(false);

    if (result.success) {
      // Otomatik sync'i başlat
      syncService.startAutoSync();
      router.replace('/(tabs)'); 
    } else {
      Alert.alert("Giriş Hatası", result.error || "Staff ID veya PIN yanlış.");
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

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: currentColors.palette.gray[500] }]}>Staff ID</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme === 'light' ? currentColors.palette.gray[100] : currentColors.palette.gray[800],
              color: currentColors.text,
              borderColor: currentColors.border,
              fontSize: 28,
              letterSpacing: 8,
              textAlign: 'center',
              fontWeight: '700',
            }]}
            placeholder="S - ●●●"
            placeholderTextColor={currentColors.palette.gray[400]}
            value={staffCode}
            onChangeText={(text) => setStaffCode(formatStaffCode(text))}
            keyboardType="number-pad"
            autoCorrect={false}
            maxLength={5}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: currentColors.palette.gray[500] }]}>PIN</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme === 'light' ? currentColors.palette.gray[100] : currentColors.palette.gray[800],
              color: currentColors.text,
              borderColor: currentColors.border,
              fontSize: 28,
              letterSpacing: 12,
              textAlign: 'center',
            }]}
            placeholder="● ● ● ●"
            placeholderTextColor={currentColors.palette.gray[400]}
            value={pin}
            onChangeText={(text) => setPin(text.replace(/[^0-9]/g, '').substring(0, 4))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
          />
        </View>

        <TouchableOpacity 
          style={[
            styles.button, 
            { backgroundColor: currentColors.palette.emerald[500] },
            loading && { opacity: 0.7 }
          ]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Giriş Yap</Text>
          )}
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
    letterSpacing: -0.5,
    marginBottom: 35
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: { 
    padding: 18, 
    borderRadius: 15, 
    borderWidth: 1, 
    fontSize: 16 
  },
  button: { 
    padding: 18, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginTop: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18,
    fontWeight: '700',
  },
});