// Kullanıcı rolleri
export type UserRole = 'ADMIN' | 'STAFF';

// Login isteği (Staff ID + PIN)
export interface LoginRequest {
  staffCode: string;  // S-XXXXXX formatında
  pin: string;        // 4 haneli PIN
}

// Checkpoint bilgisi
export interface Checkpoint {
  id: number;
  name: string;
  orderIndex: number;
}

// Staff bilgisi (Login response'dan)
export interface StaffInfo {
  id: number;
  staffCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  checkpoint: Checkpoint | null;
}

// Login yanıtı
export interface LoginResponse {
  token: string;
  staff: StaffInfo;
}

// Token validation yanıtı
export interface ValidateResponse {
  valid: boolean;
  staff?: StaffInfo;
}

// Kullanıcı oturum bilgileri (lokal storage)
export interface UserSession {
  token: string;
  staffId: number;
  staffCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  checkpointId: number | null;
  checkpointName: string | null;
  loginDate: string;
}

// Event bilgisi
export interface Event {
  id: number;
  name: string;
  date: string;
  isActive: boolean;
}

// Racer bilgisi
export interface Racer {
  id: number;
  bibNumber: string;
  firstName: string;
  lastName: string;
  nationality?: string;
  age?: number;
  bloodType?: string;
  phone?: string;
  tagId?: string;
}