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
          client_id: string | null
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
          client_id?: string | null
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
          client_id?: string | null
          original_image_url?: string
          generated_image_url?: string | null
          prompt_settings?: Json
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          fal_request_id?: string | null
        }
      }
      clients: {
        Row: {
          id: string
          slug: string
          name: string
          base_prompt: string | null
          custom_environments: Json
          custom_garment_types: Json
          custom_model_genders: Json
          custom_models: Json
          default_environment: string | null
          default_model: string | null
          default_garment_type: string | null
          default_model_gender: string | null
          branding: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          base_prompt?: string | null
          custom_environments?: Json
          custom_garment_types?: Json
          custom_model_genders?: Json
          custom_models?: Json
          default_environment?: string | null
          default_model?: string | null
          default_garment_type?: string | null
          default_model_gender?: string | null
          branding?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          base_prompt?: string | null
          custom_environments?: Json
          custom_garment_types?: Json
          custom_model_genders?: Json
          custom_models?: Json
          default_environment?: string | null
          default_model?: string | null
          default_garment_type?: string | null
          default_model_gender?: string | null
          branding?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
