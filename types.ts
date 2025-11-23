export enum PointType {
  USER_ADDED = 'USER_ADDED', // User identifies a new spot (Value Assessment)
  OFFICIAL_POI = 'OFFICIAL_POI', // Existing official spot
  ISSUE_REPORT = 'ISSUE_REPORT' // User reports a problem
}

export enum AppView {
  MAP = 'MAP',
  LIST = 'LIST',
  STATS = 'STATS'
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RatingValues {
  recreational: number; // 休闲娱乐
  environmental: number; // 资源环境
  historical: number;   // 历史文化
  economic: number;     // 经济价值
  emotional: number;    // 情感联系
}

export interface CommentData {
  id: string;
  pointType: PointType;
  targetName?: string; // Name of the spot (e.g., "Central Park" or "Custom Point")
  text: string;
  coords: Coordinates;
  timestamp: number;
  author: string;
  
  // Value Assessment Data
  ratings: RatingValues; // For Issues, this might be all 0 or irrelevant
  
  // Issue Report Data
  issueTags?: string[]; // e.g., ['拥挤', '卫生差']

  averageScore: number;
  
  // AI Analyzed fields
  aiAnalysis?: string;
}

export interface OfficialPOI {
  id: string;
  name: string;
  coords: Coordinates;
  description: string;
}