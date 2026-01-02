import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';

// Error tipi
export interface AppError {
  traceId?: string;
  message: string;
  statusCode?: number;
  details?: string;
  timestamp?: string;
}

// Context tipi
interface ErrorContextType {
  showError: (error: AppError) => void;
  hideError: () => void;
  currentError: AppError | null;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: React.ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [currentError, setCurrentError] = useState<AppError | null>(null);
  const [copied, setCopied] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const snapPoints = useMemo(() => ['35%', '50%'], []);

  const showError = useCallback((error: AppError) => {
    setCurrentError({
      ...error,
      timestamp: error.timestamp || new Date().toISOString(),
    });
    setCopied(false);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  const hideError = useCallback(() => {
    bottomSheetRef.current?.close();
    setTimeout(() => setCurrentError(null), 300);
  }, []);

  const copyTraceId = useCallback(async () => {
    if (currentError?.traceId) {
      await Clipboard.setStringAsync(currentError.traceId);
      setCopied(true);
      
      // Feedback animasyonu
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setCopied(false));
    }
  }, [currentError?.traceId, fadeAnim]);

  const copyAllDetails = useCallback(async () => {
    if (currentError) {
      const details = `
Hata Detayları
==============
TraceID: ${currentError.traceId || 'Yok'}
Mesaj: ${currentError.message}
Durum Kodu: ${currentError.statusCode || 'Yok'}
Zaman: ${currentError.timestamp}
Detaylar: ${currentError.details || 'Yok'}
      `.trim();
      
      await Clipboard.setStringAsync(details);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [currentError]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const getStatusColor = (statusCode?: number) => {
    if (!statusCode) return '#FF6B6B';
    if (statusCode >= 500) return '#FF4757'; // Server error - kırmızı
    if (statusCode >= 400) return '#FFA502'; // Client error - turuncu
    return '#FF6B6B';
  };

  return (
    <ErrorContext.Provider value={{ showError, hideError, currentError }}>
      {children}
      
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={styles.contentContainer}>
          {currentError && (
            <>
              {/* Header */}
              <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: getStatusColor(currentError.statusCode) }]}>
                  <Ionicons name="warning" size={28} color="#FFF" />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.title}>Bir Hata Oluştu</Text>
                  {currentError.statusCode && (
                    <Text style={styles.statusCode}>Kod: {currentError.statusCode}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={hideError} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              <View style={styles.messageContainer}>
                <Text style={styles.message}>{currentError.message}</Text>
              </View>

              {/* TraceID */}
              {currentError.traceId && (
                <TouchableOpacity 
                  style={styles.traceIdContainer} 
                  onPress={copyTraceId}
                  activeOpacity={0.7}
                >
                  <View style={styles.traceIdHeader}>
                    <Ionicons name="finger-print" size={18} color="#666" />
                    <Text style={styles.traceIdLabel}>Trace ID</Text>
                    <Ionicons 
                      name={copied ? "checkmark-circle" : "copy-outline"} 
                      size={18} 
                      color={copied ? "#4CAF50" : "#666"} 
                    />
                  </View>
                  <Text style={styles.traceIdValue} selectable>
                    {currentError.traceId}
                  </Text>
                  {copied && (
                    <Animated.View style={[styles.copiedBadge, { opacity: fadeAnim }]}>
                      <Text style={styles.copiedText}>Kopyalandı!</Text>
                    </Animated.View>
                  )}
                </TouchableOpacity>
              )}

              {/* Timestamp */}
              <View style={styles.timestampContainer}>
                <Ionicons name="time-outline" size={14} color="#999" />
                <Text style={styles.timestamp}>
                  {new Date(currentError.timestamp!).toLocaleString('tr-TR')}
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.secondaryButton]} 
                  onPress={copyAllDetails}
                >
                  <Ionicons name="document-text-outline" size={18} color="#666" />
                  <Text style={styles.secondaryButtonText}>Detayları Kopyala</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.primaryButton]} 
                  onPress={hideError}
                >
                  <Text style={styles.primaryButtonText}>Tamam</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    </ErrorContext.Provider>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  handleIndicator: {
    backgroundColor: '#DDD',
    width: 40,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statusCode: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  messageContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  message: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  traceIdContainer: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  traceIdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  traceIdLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  traceIdValue: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#333',
    letterSpacing: 0.5,
  },
  copiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  copiedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F0F0F0',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ErrorProvider;
