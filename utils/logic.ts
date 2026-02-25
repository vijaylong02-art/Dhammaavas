
import { Student, StudentType, SpecialRequirement } from '../types';

export const formatCourseDateString = (startDate: string, endDate: string): string => {
  if (!startDate || !endDate) return "";
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const formatPart = (date: Date) => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleDateString('mr-IN', { month: 'short' }).toUpperCase();
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    return `${formatPart(start)} TO ${formatPart(end)}`;
  } catch (e) {
    return "";
  }
};

export const getAutoGridDimensions = (count: number): { rows: number; cols: number } => {
  if (count <= 4) return { cols: 2, rows: 2 };
  if (count <= 6) return { cols: 3, rows: 2 };
  if (count <= 8) return { cols: 4, rows: 2 };
  if (count <= 12) return { cols: 4, rows: 3 }; // Covers 10 and 12 range
  if (count <= 16) return { cols: 4, rows: 4 };
  if (count <= 20) return { cols: 5, rows: 4 };
  if (count <= 24) return { cols: 6, rows: 4 };
  if (count <= 25) return { cols: 5, rows: 5 };
  if (count <= 30) return { cols: 6, rows: 5 };
  if (count <= 35) return { cols: 7, rows: 5 };
  if (count <= 40) return { cols: 8, rows: 5 };
  
  // Default logic for more than 40 students
  const cols = 8;
  const rows = Math.ceil(count / cols);
  return { cols, rows };
};

export const calculateSeniority = (s: Student): number => {
  const isAT = /^(AT|A\.T\.)\s/i.test(s.originalName) || /^(AT|A\.T\.)\s/i.test(s.marathiName) || 
               /\s(AT|A\.T\.)\s/i.test(s.originalName) || /\s(AT|A\.T\.)\s/i.test(s.marathiName) ||
               /\(AT\)/i.test(s.originalName) || /\(AT\)/i.test(s.marathiName);

  if (isAT) return 1000000000;
  if (s.type === StudentType.NEW) return s.age; 

  const LEVEL_60 = 80000000;
  const LEVEL_45 = 70000000;
  const LEVEL_30 = 60000000;
  const LEVEL_20 = 50000000;
  const LEVEL_TSC = 40000000;
  const LEVEL_SPL = 30000000;
  const LEVEL_STP = 20000000;
  const LEVEL_10 = 10000000;
  const LEVEL_TEENAGER = 5000000;

  const SEVA_WEIGHT = 5000;
  const COUNT_WEIGHT = 100;

  let score = 0;
  if (s.courses.c60 > 0) score = LEVEL_60 + (s.courses.c60 * COUNT_WEIGHT) + (s.courses.seva * SEVA_WEIGHT);
  else if (s.courses.c45 > 0) score = LEVEL_45 + (s.courses.c45 * COUNT_WEIGHT) + (s.courses.seva * SEVA_WEIGHT);
  else if (s.courses.c30 > 0) score = LEVEL_30 + (s.courses.c30 * COUNT_WEIGHT) + (s.courses.seva * SEVA_WEIGHT);
  else if (s.courses.c20 > 0) score = LEVEL_20 + (s.courses.c20 * COUNT_WEIGHT) + (s.courses.seva * SEVA_WEIGHT);
  else if (s.courses.cTSC > 0) score = LEVEL_TSC + (s.courses.cTSC * COUNT_WEIGHT) + (s.courses.seva * SEVA_WEIGHT);
  else if (s.courses.cSPL > 0) score = LEVEL_SPL + (s.courses.cSPL * COUNT_WEIGHT) + (s.courses.seva * SEVA_WEIGHT);
  else if (s.courses.cSTP > 0) score = LEVEL_STP + (s.courses.cSTP * COUNT_WEIGHT) + (s.courses.seva * SEVA_WEIGHT);
  else if (s.courses.c10 > 0) score = LEVEL_10 + (s.courses.c10 * COUNT_WEIGHT) + (s.courses.seva * SEVA_WEIGHT);
  else score = LEVEL_TEENAGER + (s.courses.cTeenager * COUNT_WEIGHT) + (s.courses.seva * SEVA_WEIGHT);

  score += (s.age / 100);
  return score;
};

export const translateSpecialReq = (special: string): string => {
  if (!special || special === 'None') return '';
  const s = special.toLowerCase();
  if (s.includes('chauki') || s.includes('cw')) return 'चौकी';
  if (s.includes('chair')) return 'खुर्ची';
  if (s.includes('backrest') || s.includes('back rest')) return 'बॅक रेस्ट';
  return special;
};

export const formatTeacherName = (name: string, gender: 'Male' | 'Female' = 'Male'): string => {
  if (!name) return '';
  const cleanName = name.trim().replace(/^(Mr\.|Mr\s|Mrs\.|Mrs\s|Ms\.|Ms\s|Miss\.|Miss\s|Dr\.|Dr\s|Assistant Teacher|सा\. आचार्य|सा\. आचार्या|A\.T\.)/i, '').trim();
  const prefix = gender === 'Male' ? 'सा. आचार्य' : 'सा. आचार्या';
  return `${prefix} ${cleanName}`;
};

const getCenterOutIndices = (totalCols: number) => {
  const indices: number[] = [];
  let left = Math.floor((totalCols - 1) / 2);
  let right = left + 1;
  indices.push(left);
  while(left > 0 || right < totalCols) {
     if (right < totalCols) indices.push(right++);
     if (left > 0) indices.push(--left);
  }
  return indices;
};

export const generateSeating = (
  students: Student[],
  rows: number,
  cols: number,
  specialSide: 'Left' | 'Right' = 'Right',
  specialFillDirection: 'Front' | 'Back' = 'Back'
): Student[] => {
  const seatGrid: (Student | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
  const assignedStudents: Student[] = [];
  const getSeatId = (r: number, c: number) => `${String.fromCharCode(65+c)}${r+1}`;

  students.filter(s => s.type === StudentType.SERVER).forEach(s => {
    assignedStudents.push({ ...s, seatNo: undefined });
  });

  const candidates = students.filter(s => s.type !== StudentType.SERVER);
  const manualAssignees = candidates.filter(s => s.manualSeat);
  const autoCandidates = candidates.filter(s => !s.manualSeat);

  manualAssignees.forEach(s => {
    if (s.manualSeat) {
      const match = s.manualSeat.match(/([A-Z])(\d+)/i);
      if (match) {
        const c = match[1].toUpperCase().charCodeAt(0) - 65;
        const r = parseInt(match[2], 10) - 1;
        if (r >= 0 && r < rows && c >= 0 && c < cols && !seatGrid[r][c]) {
          seatGrid[r][c] = s;
          assignedStudents.push({ ...s, seatNo: s.manualSeat });
        } else {
          autoCandidates.push({ ...s, manualSeat: '' });
        }
      }
    }
  });

  const specialComparator = (a: Student, b: Student) => {
    const aIsChair = a.special === SpecialRequirement.CHAIR;
    const bIsChair = b.special === SpecialRequirement.CHAIR;
    if (aIsChair && !bIsChair) return -1;
    if (!aIsChair && bIsChair) return 1;
    if (a.type === StudentType.OLD && b.type === StudentType.NEW) return -1;
    if (a.type === StudentType.NEW && b.type === StudentType.OLD) return 1;
    if (a.type === StudentType.OLD) return b.seniorityScore - a.seniorityScore;
    return b.age - a.age; 
  };

  const hearingStudents = autoCandidates.filter(s => s.hearing && s.hearing !== 'None').sort(specialComparator);
  const remainder = autoCandidates.filter(s => !hearingStudents.includes(s));
  
  const specialQueue = remainder.filter(s => 
    s.special === SpecialRequirement.CHAIR || 
    s.special === SpecialRequirement.CHAUKI || 
    (s.special as string) === 'CW'
  ).sort(specialComparator);

  const regularStudents = remainder.filter(s => !specialQueue.includes(s)).sort((a, b) => {
    if (a.type === StudentType.OLD && b.type === StudentType.NEW) return -1;
    if (a.type === StudentType.NEW && b.type === StudentType.OLD) return 1;
    if (a.type === StudentType.OLD && b.type === StudentType.OLD) return b.seniorityScore - a.seniorityScore;
    return b.age - a.age;
  });

  hearingStudents.forEach(s => {
    const r = rows - 1;
    let placed = false;
    if (s.hearing === 'Left') {
      for (let c = 0; c < cols; c++) {
        if (!seatGrid[r][c]) {
          seatGrid[r][c] = s;
          assignedStudents.push({ ...s, seatNo: getSeatId(r, c) });
          placed = true;
          break;
        }
      }
    } else {
       for (let c = cols - 1; c >= 0; c--) {
        if (!seatGrid[r][c]) {
          seatGrid[r][c] = s;
          assignedStudents.push({ ...s, seatNo: getSeatId(r, c) });
          placed = true;
          break;
        }
      }
    }
    if (!placed) regularStudents.push(s);
  });

  const specialColIdx = specialSide === 'Left' ? 0 : cols - 1;
  const availableRows: number[] = [];
  if (specialFillDirection === 'Front') {
      for (let r = 0; r < rows; r++) if (!seatGrid[r][specialColIdx]) availableRows.push(r);
  } else {
      for (let r = rows - 1; r >= 0; r--) if (!seatGrid[r][specialColIdx]) availableRows.push(r);
  }

  const targetIndices = availableRows.slice(0, specialQueue.length).sort((a, b) => a - b);

  specialQueue.forEach((s, i) => {
      const r = targetIndices[i];
      if (r !== undefined) {
          seatGrid[r][specialColIdx] = s;
          assignedStudents.push({ ...s, seatNo: getSeatId(r, specialColIdx) });
      } else {
          regularStudents.push(s);
      }
  });

  regularStudents.forEach(s => {
    let placed = false;
    if (s.type === StudentType.OLD) {
        for (let r = 0; r < rows; r++) {
            if (placed) break;
            const colIndices = getCenterOutIndices(cols);
            for (const c of colIndices) {
                if (!seatGrid[r][c]) {
                  seatGrid[r][c] = s;
                  assignedStudents.push({ ...s, seatNo: getSeatId(r, c) });
                  placed = true;
                  break;
                }
            }
        }
    } else {
        for (let r = 0; r < rows; r++) {
            if (placed) break;
            for (let c = 0; c < cols; c++) {
                if (!seatGrid[r][c]) {
                  seatGrid[r][c] = s;
                  assignedStudents.push({ ...s, seatNo: getSeatId(r, c) });
                  placed = true;
                  break;
                }
            }
        }
    }
    if (!placed) assignedStudents.push({ ...s, seatNo: 'WAITING' });
  });

  return assignedStudents;
};
