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
          user_id: string | null
          original_image_url: string
          generated_image_url: string | null
          prompt_settings: Json
        }
        Insert: {
          id?: string
          created_at?: string
          user_id?: string | null
          original_image_url: string
          generated_image_url?: string | null
          prompt_settings?: Json
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string | null
          original_image_url?: string
          generated_image_url?: string | null
          prompt_settings?: Json
        }
      }
    }
  }
}
