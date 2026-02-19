export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ad_events: {
        Row: {
          ad_id: string
          created_at: string
          event_type: Database["public"]["Enums"]["ad_event_type"]
          id: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          event_type: Database["public"]["Enums"]["ad_event_type"]
          id?: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          event_type?: Database["public"]["Enums"]["ad_event_type"]
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_events_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_positions: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          name: string
          price_month_eur: number
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          name: string
          price_month_eur: number
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          name?: string
          price_month_eur?: number
        }
        Relationships: []
      }
      ad_transactions: {
        Row: {
          ad_id: string | null
          amount_paid: number
          created_at: string
          id: string
          status: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_intent_id: string | null
        }
        Insert: {
          ad_id?: string | null
          amount_paid: number
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_intent_id?: string | null
        }
        Update: {
          ad_id?: string | null
          amount_paid?: number
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_transactions_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          advertiser_email: string
          advertiser_name: string
          amount_paid: number | null
          country: string | null
          created_at: string
          end_date: string | null
          id: string
          link_url: string | null
          media_type: Database["public"]["Enums"]["media_type"]
          media_url: string | null
          position_id: string | null
          size: string
          start_date: string | null
          status: Database["public"]["Enums"]["ad_status"]
          stripe_payment_intent_id: string | null
          title: string
        }
        Insert: {
          advertiser_email: string
          advertiser_name: string
          amount_paid?: number | null
          country?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          link_url?: string | null
          media_type?: Database["public"]["Enums"]["media_type"]
          media_url?: string | null
          position_id?: string | null
          size?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["ad_status"]
          stripe_payment_intent_id?: string | null
          title: string
        }
        Update: {
          advertiser_email?: string
          advertiser_name?: string
          amount_paid?: number | null
          country?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          link_url?: string | null
          media_type?: Database["public"]["Enums"]["media_type"]
          media_url?: string | null
          position_id?: string | null
          size?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["ad_status"]
          stripe_payment_intent_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "ad_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_flags: {
        Row: {
          created_at: string
          id: string
          matched_keyword: string | null
          property_id: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          matched_keyword?: string | null
          property_id?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          matched_keyword?: string | null
          property_id?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_flags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_keywords: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          keyword: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          keyword: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          keyword?: string
        }
        Relationships: []
      }
      credit_packages: {
        Row: {
          created_at: string
          credits_amount: number
          id: string
          is_active: boolean
          name: string
          price_eur: number
        }
        Insert: {
          created_at?: string
          credits_amount: number
          id?: string
          is_active?: boolean
          name: string
          price_eur: number
        }
        Update: {
          created_at?: string
          credits_amount?: number
          id?: string
          is_active?: boolean
          name?: string
          price_eur?: number
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount_paid: number
          created_at: string
          credits_added: number
          id: string
          package_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          credits_added: number
          id?: string
          package_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          credits_added?: number
          id?: string
          package_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_packages: {
        Row: {
          created_at: string
          duration_days: number
          id: string
          is_active: boolean
          name: string
          price_eur: number
          type: Database["public"]["Enums"]["extra_type"]
        }
        Insert: {
          created_at?: string
          duration_days?: number
          id?: string
          is_active?: boolean
          name: string
          price_eur: number
          type: Database["public"]["Enums"]["extra_type"]
        }
        Update: {
          created_at?: string
          duration_days?: number
          id?: string
          is_active?: boolean
          name?: string
          price_eur?: number
          type?: Database["public"]["Enums"]["extra_type"]
        }
        Relationships: []
      }
      extra_transactions: {
        Row: {
          amount_paid: number
          created_at: string
          extra_package_id: string | null
          id: string
          property_id: string
          status: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          extra_package_id?: string | null
          id?: string
          property_id: string
          status?: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          extra_package_id?: string | null
          id?: string
          property_id?: string
          status?: Database["public"]["Enums"]["transaction_status"]
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extra_transactions_extra_package_id_fkey"
            columns: ["extra_package_id"]
            isOneToOne: false
            referencedRelation: "extra_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          area_m2: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string
          contacts_count: number
          country: string
          created_at: string
          currency: string
          description: string | null
          expires_at: string | null
          featured_until: string | null
          has_flete_poseduese: boolean
          has_leje_ndertimi: boolean
          has_pranim_teknik: boolean
          id: string
          images: string[] | null
          is_featured: boolean
          is_parcele: boolean
          is_urgent: boolean
          last_boosted_at: string | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          status: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at: string
          urgent_until: string | null
          user_id: string
          views_count: number
        }
        Insert: {
          address?: string | null
          area_m2?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          contacts_count?: number
          country?: string
          created_at?: string
          currency?: string
          description?: string | null
          expires_at?: string | null
          featured_until?: string | null
          has_flete_poseduese?: boolean
          has_leje_ndertimi?: boolean
          has_pranim_teknik?: boolean
          id?: string
          images?: string[] | null
          is_featured?: boolean
          is_parcele?: boolean
          is_urgent?: boolean
          last_boosted_at?: string | null
          listing_type: Database["public"]["Enums"]["listing_type"]
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          status?: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at?: string
          urgent_until?: string | null
          user_id: string
          views_count?: number
        }
        Update: {
          address?: string | null
          area_m2?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          contacts_count?: number
          country?: string
          created_at?: string
          currency?: string
          description?: string | null
          expires_at?: string | null
          featured_until?: string | null
          has_flete_poseduese?: boolean
          has_leje_ndertimi?: boolean
          has_pranim_teknik?: boolean
          id?: string
          images?: string[] | null
          is_featured?: boolean
          is_parcele?: boolean
          is_urgent?: boolean
          last_boosted_at?: string | null
          listing_type?: Database["public"]["Enums"]["listing_type"]
          price?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          status?: Database["public"]["Enums"]["property_status"]
          title?: string
          updated_at?: string
          urgent_until?: string | null
          user_id?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "properties_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      property_events: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          ip_hash: string | null
          property_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          ip_hash?: string | null
          property_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          ip_hash?: string | null
          property_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      social_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          sort_order: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          credits_remaining: number
          email: string
          full_name: string | null
          has_password: boolean
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits_remaining?: number
          email: string
          full_name?: string | null
          has_password?: boolean
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits_remaining?: number
          email?: string
          full_name?: string | null
          has_password?: boolean
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      ad_event_type: "impression" | "click"
      ad_status: "pending" | "active" | "expired" | "rejected"
      event_type:
        | "view"
        | "contact_click"
        | "phone_click"
        | "whatsapp_click"
        | "email_click"
      extra_type: "featured" | "boost" | "urgent"
      listing_type: "shitje" | "qira"
      media_type: "image" | "video"
      property_status:
        | "draft"
        | "active"
        | "blocked"
        | "sold"
        | "rented"
        | "archived"
      property_type: "apartment" | "house" | "land" | "commercial"
      transaction_status: "pending" | "paid" | "failed" | "refunded"
      user_role: "user" | "admin"
      user_status: "active" | "blocked" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ad_event_type: ["impression", "click"],
      ad_status: ["pending", "active", "expired", "rejected"],
      event_type: [
        "view",
        "contact_click",
        "phone_click",
        "whatsapp_click",
        "email_click",
      ],
      extra_type: ["featured", "boost", "urgent"],
      listing_type: ["shitje", "qira"],
      media_type: ["image", "video"],
      property_status: [
        "draft",
        "active",
        "blocked",
        "sold",
        "rented",
        "archived",
      ],
      property_type: ["apartment", "house", "land", "commercial"],
      transaction_status: ["pending", "paid", "failed", "refunded"],
      user_role: ["user", "admin"],
      user_status: ["active", "blocked", "suspended"],
    },
  },
} as const
