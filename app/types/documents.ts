export interface Document {
  bucket: string;
  key: string;
  job_id: string;
  status: string;
  created_at: string;
  completed_at: string;
  chunks_processed: number;
  error: string;
}
