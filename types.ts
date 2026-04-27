export interface Target {
  id: number;
  x: number;
  y: number;
  type: 'normal' | 'defectLeft' | 'defectRight' | 'distractor';
  checked?: boolean; // Used in Test mode
  checkedDefect?: boolean; // Used in Test mode (defect cases)
}

export interface Cutoffs {
  cocLower: number;
  cocUpper: number;
  omissionsLeft: number;
  omissionsRight: number;
  falsePositivesNormal: number;
  falsePositivesDefectLeft: number;
  falsePositivesDefectRight: number;
  falsePositivesDistractor: number;
}

export interface TestConfig {
  version: number;
  testName: string;
  comment: string;
  maxX: number;
  maxY: number;
  markDefectMode: boolean;
  perseverate: boolean;
  copyTask: boolean;
  targetSize: number;
  imageData: string;
  targets: Target[];
  cutoffs: Cutoffs;
}

export interface PatientData {
  name: string;
  date: string;
}
