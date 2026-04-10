export interface LoginRequestDTO {
  username: string; // regNo for students, email for admin
  password: string;
}

export interface ResultRequestDTO {
  regNo: string;
  subject1: number;
  subject2: number;
  subject3: number;
  subject4: number;
  subject5: number;
}

export interface ResultResponseDTO {
  regNo: string;
  name: string;
  subject1: number;
  subject2: number;
  subject3: number;
  subject4: number;
  subject5: number;
  total: number;
  avg: number;
  result: string;
}
