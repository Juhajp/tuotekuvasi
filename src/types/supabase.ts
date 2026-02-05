export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      generated_images: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          user_id: string | null
          original_image_url: string
          generated_image_url: string | null
          prompt_settings: Json
          status: 'pending' | 'processing' | 'completed' | 'failed'
          error_message: string | null
          fal_request_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string | null
          user_id?: string | null
          original_image_url: string
          generated_image_url?: string | null
          prompt_settings?: Json
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          fal_request_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          user_id?: string | null
          original_image_url?: string
          generated_image_url?: string | null
          prompt_settings?: Json
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          fal_request_id?: string | null
        }
      }
    }
  }
}
