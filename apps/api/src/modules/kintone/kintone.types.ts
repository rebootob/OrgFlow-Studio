export const APP53_FIELD_MAPPINGS = {
  employeeId: 'emp_text',
  nameTH: 'Text_0',
  nameEN: 'Text',
  nickname: 'Text_1',
  departmentId: 'Drop_down_0',
  section: 'Drop_down_1',
  team: 'Drop_down_2',
  positionTitle: 'Text_2',
  email: 'Text_4',
  telephone: 'Text_11',
  internalNo: 'Text_12',
  joinDate: 'Date',
  status: 'Status',
  codeNumber: 'Number',
  branch: 'Radio_button',
  gender: 'Radio_button_0'
} as const;

export const EXCLUDED_SENSITIVE_FIELDS = [
  'salary',
  'citizen_id',
  'bank_account',
  'father',
  'mother',
  'Spouse',
  'first_child',
  'second_child',
  'third_child'
] as const;

export interface KintoneRawRecord {
  $id?: { value: string };
  $revision?: { value: string };
  [fieldCode: string]: any;
}

export interface KintoneSourceSnapshotMeta {
  snapshotId: string;
  loadedAt: string;
  sourceProvider: 'KINTONE_LIVE' | 'CANONICAL_AUTHENTIC_DEVELOPMENT';
  environment: string;
  app53Count: number;
  app791Count: number;
  app792Count: number;
  mappingVersion: string;
  treeHash: string;
}