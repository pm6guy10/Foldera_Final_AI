export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          causality_id: string
          action: string
          details: any
          user_id: string | null
          project_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          causality_id: string
          action: string
          details: any
          user_id?: string | null
          project_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          causality_id?: string
          action?: string
          details?: any
          user_id?: string | null
          project_id?: string | null
          created_at?: string
        }
      }
      discrepancies: {
        Row: {
          id: string
          type: 'date' | 'entity' | 'amount'
          file_a: string
          value_a: string
          file_b: string
          value_b: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          project_id: string
          created_at: string
        }
        Insert: {
          id?: string
          type: 'date' | 'entity' | 'amount'
          file_a: string
          value_a: string
          file_b: string
          value_b: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          project_id: string
          created_at?: string
        }
        Update: {
          id?: string
          type?: 'date' | 'entity' | 'amount'
          file_a?: string
          value_a?: string
          file_b?: string
          value_b?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          project_id?: string
          created_at?: string
        }
      }
    }
  }
}