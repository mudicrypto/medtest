
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
            "attempts": {
                  Row: {
                    "answered_at": string,"client_id": string | null,"id": number,"is_correct": boolean,"mode": Database["public"]['Enums']["attempt_mode"],"question_id": string,"selected": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answered_at"?: string,"client_id"?: string | null,"id"?: never,"is_correct": boolean,"mode": Database["public"]['Enums']["attempt_mode"],"question_id": string,"selected"?: string | null,"user_id": string
                  }
                  Update: {
                    "answered_at"?: string,"client_id"?: string | null,"id"?: never,"is_correct"?: boolean,"mode"?: Database["public"]['Enums']["attempt_mode"],"question_id"?: string,"selected"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "attempts_question_id_fkey"
      columns: ["question_id"]
isOneToOne: false
      referencedRelation: "questions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attempts_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"bookmarks": {
                  Row: {
                    "created_at": string,"question_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"question_id": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"question_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "bookmarks_question_id_fkey"
      columns: ["question_id"]
isOneToOne: false
      referencedRelation: "questions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookmarks_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"content_sources": {
                  Row: {
                    "created_at": string,"created_by": string | null,"granted_by": string | null,"granted_on": string | null,"id": string,"license_notes": string | null,"permission_evidence": string | null,"publisher": string | null,"rights_status": Database["public"]['Enums']["rights_status"],"title": string,"url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"granted_by"?: string | null,"granted_on"?: string | null,"id"?: string,"license_notes"?: string | null,"permission_evidence"?: string | null,"publisher"?: string | null,"rights_status": Database["public"]['Enums']["rights_status"],"title": string,"url"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"granted_by"?: string | null,"granted_on"?: string | null,"id"?: string,"license_notes"?: string | null,"permission_evidence"?: string | null,"publisher"?: string | null,"rights_status"?: Database["public"]['Enums']["rights_status"],"title"?: string,"url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "content_sources_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"mock_attempts": {
                  Row: {
                    "answers": NonNullable<Json>,"blueprint_id": string,"duration_sec": number,"id": string,"passed": boolean,"question_slugs": (string)[],"score": number,"submitted_at": string,"total": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answers"?: NonNullable<Json>,"blueprint_id": string,"duration_sec": number,"id"?: string,"passed": boolean,"question_slugs": (string)[],"score": number,"submitted_at"?: string,"total": number,"user_id"?: string
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"blueprint_id"?: string,"duration_sec"?: number,"id"?: string,"passed"?: boolean,"question_slugs"?: (string)[],"score"?: number,"submitted_at"?: string,"total"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "mock_attempts_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string,"id": string,"role": Database["public"]['Enums']["user_role"],"show_russian": boolean,"target_exam_date": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name"?: string,"id": string,"role"?: Database["public"]['Enums']["user_role"],"show_russian"?: boolean,"target_exam_date"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string,"id"?: string,"role"?: Database["public"]['Enums']["user_role"],"show_russian"?: boolean,"target_exam_date"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"question_keys": {
                  Row: {
                    "correct": string,"exam_pearl": string | null,"explanation_en": string,"explanation_ru": string | null,"option_explanations": NonNullable<Json>,"question_id": string,"references": string | null,"tutor_hint": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "correct": string,"exam_pearl"?: string | null,"explanation_en": string,"explanation_ru"?: string | null,"option_explanations"?: NonNullable<Json>,"question_id": string,"references"?: string | null,"tutor_hint"?: string | null
                  }
                  Update: {
                    "correct"?: string,"exam_pearl"?: string | null,"explanation_en"?: string,"explanation_ru"?: string | null,"option_explanations"?: NonNullable<Json>,"question_id"?: string,"references"?: string | null,"tutor_hint"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "question_keys_question_id_fkey"
      columns: ["question_id"]
isOneToOne: true
      referencedRelation: "questions"
      referencedColumns: ["id"]
    }
                  ]
                },"question_options": {
                  Row: {
                    "position": string,"question_id": string,"text_en": string,"text_ru": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "position": string,"question_id": string,"text_en": string,"text_ru"?: string | null
                  }
                  Update: {
                    "position"?: string,"question_id"?: string,"text_en"?: string,"text_ru"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "question_options_question_id_fkey"
      columns: ["question_id"]
isOneToOne: false
      referencedRelation: "questions"
      referencedColumns: ["id"]
    }
                  ]
                },"questions": {
                  Row: {
                    "clinical_topic": string,"created_at": string,"difficulty": number,"id": string,"key_terms": NonNullable<Json>,"origin": Database["public"]['Enums']["content_origin"],"review_note": string | null,"review_status": Database["public"]['Enums']["review_status"],"reviewed_at": string | null,"reviewed_by": string | null,"rights_status": Database["public"]['Enums']["rights_status"],"slug": string,"source_id": string | null,"source_ref": string | null,"stem_en": string,"stem_ru": string | null,"subject": string,"subtopic": string | null,"topic": string,"updated_at": string,"version": number,"is_published": boolean | null
                  }
                  ComputedFields: "is_published"
                  Insert: {
                    "clinical_topic"?: string,"created_at"?: string,"difficulty"?: number,"id"?: string,"key_terms"?: NonNullable<Json>,"origin": Database["public"]['Enums']["content_origin"],"review_note"?: string | null,"review_status"?: Database["public"]['Enums']["review_status"],"reviewed_at"?: string | null,"reviewed_by"?: string | null,"rights_status": Database["public"]['Enums']["rights_status"],"slug": string,"source_id"?: string | null,"source_ref"?: string | null,"stem_en": string,"stem_ru"?: string | null,"subject"?: string,"subtopic"?: string | null,"topic": string,"updated_at"?: string,"version"?: number
                  }
                  Update: {
                    "clinical_topic"?: string,"created_at"?: string,"difficulty"?: number,"id"?: string,"key_terms"?: NonNullable<Json>,"origin"?: Database["public"]['Enums']["content_origin"],"review_note"?: string | null,"review_status"?: Database["public"]['Enums']["review_status"],"reviewed_at"?: string | null,"reviewed_by"?: string | null,"rights_status"?: Database["public"]['Enums']["rights_status"],"slug"?: string,"source_id"?: string | null,"source_ref"?: string | null,"stem_en"?: string,"stem_ru"?: string | null,"subject"?: string,"subtopic"?: string | null,"topic"?: string,"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "questions_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "questions_source_id_fkey"
      columns: ["source_id"]
isOneToOne: false
      referencedRelation: "content_sources"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "questions_topic_fkey"
      columns: ["topic"]
isOneToOne: false
      referencedRelation: "topics"
      referencedColumns: ["slug"]
    }
                  ]
                },"srs_cards": {
                  Row: {
                    "due": string,"ease": number,"interval_days": number,"item_id": string,"item_type": Database["public"]['Enums']["srs_item"],"lapses": number,"reps": number,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "due": string,"ease"?: number,"interval_days"?: number,"item_id": string,"item_type": Database["public"]['Enums']["srs_item"],"lapses"?: number,"reps"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "due"?: string,"ease"?: number,"interval_days"?: number,"item_id"?: string,"item_type"?: Database["public"]['Enums']["srs_item"],"lapses"?: number,"reps"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "srs_cards_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"topics": {
                  Row: {
                    "name_en": string,"name_ru": string,"slug": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "name_en": string,"name_ru": string,"slug": string,"sort_order"?: number
                  }
                  Update: {
                    "name_en"?: string,"name_ru"?: string,"slug"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "grade_mock":
{ Args: { "p_answers": Json,"p_slugs": (string)[] }; Returns: {
              "correct": string,"explanation_en": string,"is_correct": boolean,"selected": string,"slug": string,"topic": string
            }[]
                           },
"import_questions":
{ Args: { "p_rows": Json,"p_source"?: string }; Returns: {
              "action": string,"slug": string
            }[]
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_published":
{ Args: { "q": Omit<Database["public"]['Tables']["questions"]['Row'], Database["public"]['Tables']["questions"]['ComputedFields']> }; Returns: boolean
                           },
"is_staff":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"set_review_status":
{ Args: { "p_note"?: string,"p_slug": string,"p_status": Database["public"]['Enums']["review_status"] }; Returns: undefined
                           },
"submit_answer":
{ Args: { "p_client_id"?: string,"p_mode"?: Database["public"]['Enums']["attempt_mode"],"p_selected": string,"p_slug": string }; Returns: {
              "correct": string,"duplicate": boolean,"exam_pearl": string,"explanation_en": string,"explanation_ru": string,"is_correct": boolean,"option_explanations": Json,"selected": string,"topic": string,"tutor_hint": string
            }[]
                           }
          }
          Enums: {
            "attempt_mode": "practice"|"review"|"mock","content_origin": "original_practice"|"official_verified"|"adapted"|"demo","review_status": "draft"|"in_review"|"approved"|"retired","rights_status": "owned"|"licensed"|"public_domain"|"permission_pending"|"not_cleared","srs_item": "question"|"term","user_role": "student"|"reviewer"|"admin"
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
            "attempt_mode": ["practice", "review", "mock"],"content_origin": ["original_practice", "official_verified", "adapted", "demo"],"review_status": ["draft", "in_review", "approved", "retired"],"rights_status": ["owned", "licensed", "public_domain", "permission_pending", "not_cleared"],"srs_item": ["question", "term"],"user_role": ["student", "reviewer", "admin"]
          }
        }
} as const
