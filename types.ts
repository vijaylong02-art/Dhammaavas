
export interface CourseHistory {
  c60: number;
  c45: number;
  c30: number;
  c20: number;
  cTSC: number;
  cSPL: number;
  cSTP: number;
  c10: number;
  cTeenager: number; // Added teenager course tracking
  seva: number;
}

export enum StudentType {
  NEW = 'NEW',
  OLD = 'OLD',
  SERVER = 'SERVER' // Dhamma Sevak
}

export enum SpecialRequirement {
  NONE = 'None',
  CHAIR = 'Chair',
  CHAUKI = 'Chauki',
  BACKREST = 'Backrest'
}

export interface Student {
  id: string;
  originalName: string;
  marathiName: string; // Translated name
  age: number;
  gender: 'M' | 'F';
  courses: CourseHistory;
  illness: string; // Only for new students (translated)
  special: SpecialRequirement;
  roomNo: string;
  type: StudentType;
  seniorityScore: number; // Calculated for sorting
  seatNo?: string; // Assigned seat
  manualSeat?: string; // Manually forced seat (e.g. "A1")
  hearing?: 'Left' | 'Right' | 'None'; // Good ear side
}

export interface AppState {
  rawInput: string;
  teacherName: string;
  courseDate: string;
  students: Student[];
  hallRows: number;
  hallCols: number;
  isProcessing: boolean;
}
