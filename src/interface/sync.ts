export interface PendingSync {
  [x: string]: any;
  id: string;
  payload: string;
  tagId?: string; // Ekledik: Hangi kart olduğu belli olsun
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  timestamp: number;
  pointName: string; // START, CHECK 1, FINISH vb.
  location?: {
    lat: number;
    lon: number;
  };
}