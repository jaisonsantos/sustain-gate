export interface IntakeUploadResponse {
  intake_id: string;
  status: string;
  filename: string;
}

export interface IntakeIssue {
  field: string;
  message: string;
}

export interface ValidateResponse {
  status: string;
  errors: IntakeIssue[];
  warnings: IntakeIssue[];
}

export interface PublishResponse {
  status: string;
  intake_id: string;
}
