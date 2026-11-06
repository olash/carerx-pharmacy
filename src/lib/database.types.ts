
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "categories": {
                  Row: {
                    "created_at": string,"description": string | null,"id": string,"name": string,"slug": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"name": string,"slug": string,"sort_order"?: number
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: string,"name"?: string,"slug"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"consultation_hours": {
                  Row: {
                    "end_time": string,"is_open": boolean,"start_time": string,"weekday": number
                  }
                  ComputedFields: never
                  Insert: {
                    "end_time"?: string,"is_open"?: boolean,"start_time"?: string,"weekday": number
                  }
                  Update: {
                    "end_time"?: string,"is_open"?: boolean,"start_time"?: string,"weekday"?: number
                  }
                  Relationships: [
                    
                  ]
                },"consultation_messages": {
                  Row: {
                    "attachment_path": string | null,"body": string | null,"consultation_id": string,"created_at": string,"id": number,"sender_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attachment_path"?: string | null,"body"?: string | null,"consultation_id": string,"created_at"?: string,"id"?: never,"sender_id": string
                  }
                  Update: {
                    "attachment_path"?: string | null,"body"?: string | null,"consultation_id"?: string,"created_at"?: string,"id"?: never,"sender_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "consultation_messages_consultation_id_fkey"
      columns: ["consultation_id"]
isOneToOne: false
      referencedRelation: "consultations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consultation_messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"consultation_notes": {
                  Row: {
                    "consultation_id": string,"notes": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "consultation_id": string,"notes"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "consultation_id"?: string,"notes"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "consultation_notes_consultation_id_fkey"
      columns: ["consultation_id"]
isOneToOne: true
      referencedRelation: "consultations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consultation_notes_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"consultations": {
                  Row: {
                    "created_at": string,"details": string | null,"duration_min": number,"id": string,"patient_id": string,"pharmacist_id": string | null,"ref": string,"scheduled_at": string,"status": Database["public"]['Enums']["consult_status"],"topic": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"details"?: string | null,"duration_min"?: number,"id"?: string,"patient_id": string,"pharmacist_id"?: string | null,"ref"?: string,"scheduled_at": string,"status"?: Database["public"]['Enums']["consult_status"],"topic": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"details"?: string | null,"duration_min"?: number,"id"?: string,"patient_id"?: string,"pharmacist_id"?: string | null,"ref"?: string,"scheduled_at"?: string,"status"?: Database["public"]['Enums']["consult_status"],"topic"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "consultations_patient_id_fkey"
      columns: ["patient_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consultations_pharmacist_id_fkey"
      columns: ["pharmacist_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"drug_request_items": {
                  Row: {
                    "created_at": string,"drug_id": string | null,"id": string,"is_available": boolean | null,"name": string,"pharmacist_note": string | null,"quantity": number,"request_id": string,"unit_price": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"drug_id"?: string | null,"id"?: string,"is_available"?: boolean | null,"name": string,"pharmacist_note"?: string | null,"quantity"?: number,"request_id": string,"unit_price"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"drug_id"?: string | null,"id"?: string,"is_available"?: boolean | null,"name"?: string,"pharmacist_note"?: string | null,"quantity"?: number,"request_id"?: string,"unit_price"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "drug_request_items_drug_id_fkey"
      columns: ["drug_id"]
isOneToOne: false
      referencedRelation: "drugs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "drug_request_items_drug_id_fkey"
      columns: ["drug_id"]
isOneToOne: false
      referencedRelation: "inventory_view"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "drug_request_items_request_id_fkey"
      columns: ["request_id"]
isOneToOne: false
      referencedRelation: "drug_requests"
      referencedColumns: ["id"]
    }
                  ]
                },"drug_requests": {
                  Row: {
                    "contact_phone": string,"created_at": string,"delivery_address": string | null,"delivery_fee": number,"fulfilment": Database["public"]['Enums']["fulfilment_type"],"id": string,"patient_id": string,"patient_note": string | null,"pharmacist_note": string | null,"prescription_path": string | null,"ref": string,"reviewed_by": string | null,"status": Database["public"]['Enums']["request_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "contact_phone": string,"created_at"?: string,"delivery_address"?: string | null,"delivery_fee"?: number,"fulfilment"?: Database["public"]['Enums']["fulfilment_type"],"id"?: string,"patient_id": string,"patient_note"?: string | null,"pharmacist_note"?: string | null,"prescription_path"?: string | null,"ref"?: string,"reviewed_by"?: string | null,"status"?: Database["public"]['Enums']["request_status"],"updated_at"?: string
                  }
                  Update: {
                    "contact_phone"?: string,"created_at"?: string,"delivery_address"?: string | null,"delivery_fee"?: number,"fulfilment"?: Database["public"]['Enums']["fulfilment_type"],"id"?: string,"patient_id"?: string,"patient_note"?: string | null,"pharmacist_note"?: string | null,"prescription_path"?: string | null,"ref"?: string,"reviewed_by"?: string | null,"status"?: Database["public"]['Enums']["request_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "drug_requests_patient_id_fkey"
      columns: ["patient_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "drug_requests_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"drugs": {
                  Row: {
                    "brand": string | null,"category_id": string | null,"created_at": string,"description": string | null,"dosage_form": string | null,"generic_name": string | null,"id": string,"image_url": string | null,"is_active": boolean,"low_stock_threshold": number,"nafdac_no": string | null,"name": string,"pack_size": string | null,"price": number,"requires_prescription": boolean,"slug": string,"stock_qty": number,"strength": string | null,"updated_at": string,"usage_notes": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "brand"?: string | null,"category_id"?: string | null,"created_at"?: string,"description"?: string | null,"dosage_form"?: string | null,"generic_name"?: string | null,"id"?: string,"image_url"?: string | null,"is_active"?: boolean,"low_stock_threshold"?: number,"nafdac_no"?: string | null,"name": string,"pack_size"?: string | null,"price"?: number,"requires_prescription"?: boolean,"slug": string,"stock_qty"?: number,"strength"?: string | null,"updated_at"?: string,"usage_notes"?: string | null
                  }
                  Update: {
                    "brand"?: string | null,"category_id"?: string | null,"created_at"?: string,"description"?: string | null,"dosage_form"?: string | null,"generic_name"?: string | null,"id"?: string,"image_url"?: string | null,"is_active"?: boolean,"low_stock_threshold"?: number,"nafdac_no"?: string | null,"name"?: string,"pack_size"?: string | null,"price"?: number,"requires_prescription"?: boolean,"slug"?: string,"stock_qty"?: number,"strength"?: string | null,"updated_at"?: string,"usage_notes"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "drugs_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"pharmacy_settings": {
                  Row: {
                    "booking_window_days": number,"delivery_fee": number,"id": number,"slot_minutes": number,"timezone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "booking_window_days"?: number,"delivery_fee"?: number,"id"?: number,"slot_minutes"?: number,"timezone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "booking_window_days"?: number,"delivery_fee"?: number,"id"?: number,"slot_minutes"?: number,"timezone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string | null,"full_name": string | null,"id": string,"phone": string | null,"role": Database["public"]['Enums']["app_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email"?: string | null,"full_name"?: string | null,"id": string,"phone"?: string | null,"role"?: Database["public"]['Enums']["app_role"]
                  }
                  Update: {
                    "created_at"?: string,"email"?: string | null,"full_name"?: string | null,"id"?: string,"phone"?: string | null,"role"?: Database["public"]['Enums']["app_role"]
                  }
                  Relationships: [
                    
                  ]
                },"request_events": {
                  Row: {
                    "actor_id": string | null,"created_at": string,"id": number,"note": string | null,"request_id": string,"status": Database["public"]['Enums']["request_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"created_at"?: string,"id"?: never,"note"?: string | null,"request_id": string,"status": Database["public"]['Enums']["request_status"]
                  }
                  Update: {
                    "actor_id"?: string | null,"created_at"?: string,"id"?: never,"note"?: string | null,"request_id"?: string,"status"?: Database["public"]['Enums']["request_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "request_events_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "request_events_request_id_fkey"
      columns: ["request_id"]
isOneToOne: false
      referencedRelation: "drug_requests"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "inventory_view": {
                  Row: {
                    "brand": string | null,"category_id": string | null,"category_name": string | null,"created_at": string,"description": string | null,"dosage_form": string | null,"generic_name": string | null,"id": string,"image_url": string | null,"is_active": boolean,"low_stock_threshold": number,"nafdac_no": string | null,"name": string,"pack_size": string | null,"price": number,"requires_prescription": boolean,"slug": string,"stock_qty": number,"stock_status": string | null,"strength": string | null,"updated_at": string,"usage_notes": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "drugs_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "admin_dashboard_stats":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"book_consultation":
{ Args: { "p_details": string,"p_scheduled_at": string,"p_topic": string }; Returns: string
                           },
"can_access_consultation":
{ Args: { "p_id": string }; Returns: boolean
                           },
"get_booked_slots":
{ Args: { "p_from": string,"p_to": string }; Returns: string[]
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_staff":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"patient_cancel_consultation":
{ Args: { "p_id": string }; Returns: undefined
                           },
"patient_request_action":
{ Args: { "p_action": string,"p_request_id": string }; Returns: Database["public"]['Enums']["request_status"]
                           },
"staff_directory":
{ Args: Record<PropertyKey, never>; Returns: {
              "full_name": string,"id": string,"role": Database["public"]['Enums']["app_role"]
            }[]
                           },
"submit_drug_request":
{ Args: { "p_contact_phone": string,"p_delivery_address": string,"p_fulfilment": Database["public"]['Enums']["fulfilment_type"],"p_items": Json,"p_patient_note": string,"p_prescription_path": string }; Returns: string
                           }
          }
          Enums: {
            "app_role": "patient"|"pharmacist"|"admin","consult_status": "booked"|"in_progress"|"completed"|"cancelled"|"no_show","fulfilment_type": "pickup"|"delivery","request_status": "submitted"|"reviewing"|"quoted"|"confirmed"|"ready"|"out_for_delivery"|"completed"|"cancelled"|"rejected"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "app_role": ["patient", "pharmacist", "admin"],"consult_status": ["booked", "in_progress", "completed", "cancelled", "no_show"],"fulfilment_type": ["pickup", "delivery"],"request_status": ["submitted", "reviewing", "quoted", "confirmed", "ready", "out_for_delivery", "completed", "cancelled", "rejected"]
          }
        }
} as const
