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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      business_settings: {
        Row: {
          accent_color: string
          admin_passkey: string
          background_color: string
          body_font: string
          business_address: string
          business_email: string
          business_name: string
          business_phone: string
          color_scheme_name: string
          confirmation_email_template: string
          confirmation_whatsapp_template: string
          copyright_text: string
          currency_code: string
          currency_symbol: string
          facebook_url: string | null
          favicon_url: string | null
          google_maps_url: string | null
          heading_font: string
          id: number
          instagram_url: string | null
          logo_url: string | null
          onboarding_completed: boolean
          primary_color: string
          ready_email_template: string
          ready_whatsapp_template: string
          text_color: string
          whatsapp_business_number: string | null
        }
        Insert: {
          accent_color?: string
          admin_passkey?: string
          background_color?: string
          body_font?: string
          business_address?: string
          business_email?: string
          business_name?: string
          business_phone?: string
          color_scheme_name?: string
          confirmation_email_template?: string
          confirmation_whatsapp_template?: string
          copyright_text?: string
          currency_code?: string
          currency_symbol?: string
          facebook_url?: string | null
          favicon_url?: string | null
          google_maps_url?: string | null
          heading_font?: string
          id?: number
          instagram_url?: string | null
          logo_url?: string | null
          onboarding_completed?: boolean
          primary_color?: string
          ready_email_template?: string
          ready_whatsapp_template?: string
          text_color?: string
          whatsapp_business_number?: string | null
        }
        Update: {
          accent_color?: string
          admin_passkey?: string
          background_color?: string
          body_font?: string
          business_address?: string
          business_email?: string
          business_name?: string
          business_phone?: string
          color_scheme_name?: string
          confirmation_email_template?: string
          confirmation_whatsapp_template?: string
          copyright_text?: string
          currency_code?: string
          currency_symbol?: string
          facebook_url?: string | null
          favicon_url?: string | null
          google_maps_url?: string | null
          heading_font?: string
          id?: number
          instagram_url?: string | null
          logo_url?: string | null
          onboarding_completed?: boolean
          primary_color?: string
          ready_email_template?: string
          ready_whatsapp_template?: string
          text_color?: string
          whatsapp_business_number?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      catering_orders: {
        Row: {
          admin_notes: string | null
          balance: number
          balance_paid: boolean | null
          balance_paid_at: string | null
          cancelled_at: string | null
          catering_discount: number | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_notes: string | null
          customer_phone: string
          delivery_address: string | null
          delivery_fee: number | null
          delivery_type: string | null
          deposit_amount: number
          deposit_paid: boolean | null
          deposit_paid_at: string | null
          event_date: string
          event_time: string | null
          event_type: string | null
          headcount: number
          id: string
          invoice_sent: boolean | null
          invoice_sent_at: string | null
          items: Json
          order_number: string | null
          quote_sent_at: string | null
          status: string | null
          subtotal: number
          total_amount: number
          updated_at: string | null
          whatsapp_sent: boolean | null
          whatsapp_sent_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          balance: number
          balance_paid?: boolean | null
          balance_paid_at?: string | null
          cancelled_at?: string | null
          catering_discount?: number | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_notes?: string | null
          customer_phone: string
          delivery_address?: string | null
          delivery_fee?: number | null
          delivery_type?: string | null
          deposit_amount: number
          deposit_paid?: boolean | null
          deposit_paid_at?: string | null
          event_date: string
          event_time?: string | null
          event_type?: string | null
          headcount: number
          id?: string
          invoice_sent?: boolean | null
          invoice_sent_at?: string | null
          items: Json
          order_number?: string | null
          quote_sent_at?: string | null
          status?: string | null
          subtotal: number
          total_amount: number
          updated_at?: string | null
          whatsapp_sent?: boolean | null
          whatsapp_sent_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          balance?: number
          balance_paid?: boolean | null
          balance_paid_at?: string | null
          cancelled_at?: string | null
          catering_discount?: number | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_notes?: string | null
          customer_phone?: string
          delivery_address?: string | null
          delivery_fee?: number | null
          delivery_type?: string | null
          deposit_amount?: number
          deposit_paid?: boolean | null
          deposit_paid_at?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: string | null
          headcount?: number
          id?: string
          invoice_sent?: boolean | null
          invoice_sent_at?: string | null
          items?: Json
          order_number?: string | null
          quote_sent_at?: string | null
          status?: string | null
          subtotal?: number
          total_amount?: number
          updated_at?: string | null
          whatsapp_sent?: boolean | null
          whatsapp_sent_at?: string | null
        }
        Relationships: []
      }
      contact_form_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      content_sections: {
        Row: {
          content: Json
          display_order: number
          id: number
          image_url: string | null
          is_active: boolean
          page_slug: string
          section_type: string
          title: string | null
        }
        Insert: {
          content?: Json
          display_order?: number
          id?: number
          image_url?: string | null
          is_active?: boolean
          page_slug: string
          section_type: string
          title?: string | null
        }
        Update: {
          content?: Json
          display_order?: number
          id?: number
          image_url?: string | null
          is_active?: boolean
          page_slug?: string
          section_type?: string
          title?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string | null
          display_order: number | null
          id: number
          is_active: boolean | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          display_order?: number | null
          id?: number
          is_active?: boolean | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      footer_settings: {
        Row: {
          copyright_text: string
          footer_background_color: string
          footer_text_color: string
          id: number
          show_contact_info: boolean
          show_newsletter: boolean
          show_social_icons: boolean
        }
        Insert: {
          copyright_text?: string
          footer_background_color?: string
          footer_text_color?: string
          id?: number
          show_contact_info?: boolean
          show_newsletter?: boolean
          show_social_icons?: boolean
        }
        Update: {
          copyright_text?: string
          footer_background_color?: string
          footer_text_color?: string
          id?: number
          show_contact_info?: boolean
          show_newsletter?: boolean
          show_social_icons?: boolean
        }
        Relationships: []
      }
      header_settings: {
        Row: {
          header_background_color: string
          header_text_color: string
          id: number
          show_admin_icon: boolean
          show_cart_icon: boolean
          show_logo: boolean
          show_theme_toggle: boolean
        }
        Insert: {
          header_background_color?: string
          header_text_color?: string
          id?: number
          show_admin_icon?: boolean
          show_cart_icon?: boolean
          show_logo?: boolean
          show_theme_toggle?: boolean
        }
        Update: {
          header_background_color?: string
          header_text_color?: string
          id?: number
          show_admin_icon?: boolean
          show_cart_icon?: boolean
          show_logo?: boolean
          show_theme_toggle?: boolean
        }
        Relationships: []
      }
      loyalty_customers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          last_order_at: string | null
          lifetime_stamps: number | null
          name: string | null
          phone: string
          stamp_count: number | null
          tier: string | null
          total_orders: number | null
          total_spent: number | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          last_order_at?: string | null
          lifetime_stamps?: number | null
          name?: string | null
          phone: string
          stamp_count?: number | null
          tier?: string | null
          total_orders?: number | null
          total_spent?: number | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          last_order_at?: string | null
          lifetime_stamps?: number | null
          name?: string | null
          phone?: string
          stamp_count?: number | null
          tier?: string | null
          total_orders?: number | null
          total_spent?: number | null
        }
        Relationships: []
      }
      loyalty_rewards: {
        Row: {
          claimed_at: string | null
          created_at: string | null
          customer_id: string | null
          customer_phone: string
          discount_amount: number | null
          earned_at: string | null
          expires_at: string | null
          id: string
          is_claimed: boolean | null
          reward_code: string
          reward_type: string | null
          status: string | null
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_phone: string
          discount_amount?: number | null
          earned_at?: string | null
          expires_at?: string | null
          id?: string
          is_claimed?: boolean | null
          reward_code: string
          reward_type?: string | null
          status?: string | null
        }
        Update: {
          claimed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_phone?: string
          discount_amount?: number | null
          earned_at?: string | null
          expires_at?: string | null
          id?: string
          is_claimed?: boolean | null
          reward_code?: string
          reward_type?: string | null
          status?: string | null
        }
        Relationships: []
      }
      loyalty_stamp_log: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          invoice_number: string | null
          order_id: string | null
          order_total: number | null
          stamps_earned: number | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          invoice_number?: string | null
          order_id?: string | null
          order_total?: number | null
          stamps_earned?: number | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          invoice_number?: string | null
          order_id?: string | null
          order_total?: number | null
          stamps_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_stamp_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "loyalty_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_stamps: {
        Row: {
          created_at: string | null
          customer_phone: string
          id: string
          order_id: string
          stamps_awarded: number | null
        }
        Insert: {
          created_at?: string | null
          customer_phone: string
          id?: string
          order_id: string
          stamps_awarded?: number | null
        }
        Update: {
          created_at?: string | null
          customer_phone?: string
          id?: string
          order_id?: string
          stamps_awarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_stamps_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          closed_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivery_address: string | null
          delivery_type: string
          email_confirmation_sent: boolean
          email_ready_sent: boolean
          id: string
          invoice_number: string | null
          items: Json
          order_source: string | null
          order_status: string
          ordered_at: string | null
          paid_at: string | null
          paid_via: string | null
          payment_method: string
          payment_status: string
          profit: number
          ready_at: string | null
          ready_to_pay_at: string | null
          reward_code_used: string | null
          seated_at: string | null
          served_at: string | null
          staff_id: string | null
          subtotal: number
          table_number: number | null
          total_price: number
          whatsapp_confirmation_sent: boolean
          whatsapp_ready_sent: boolean
        }
        Insert: {
          closed_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          delivery_address?: string | null
          delivery_type?: string
          email_confirmation_sent?: boolean
          email_ready_sent?: boolean
          id: string
          invoice_number?: string | null
          items?: Json
          order_source?: string | null
          order_status?: string
          ordered_at?: string | null
          paid_at?: string | null
          paid_via?: string | null
          payment_method?: string
          payment_status?: string
          profit?: number
          ready_at?: string | null
          ready_to_pay_at?: string | null
          reward_code_used?: string | null
          seated_at?: string | null
          served_at?: string | null
          staff_id?: string | null
          subtotal?: number
          table_number?: number | null
          total_price?: number
          whatsapp_confirmation_sent?: boolean
          whatsapp_ready_sent?: boolean
        }
        Update: {
          closed_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_address?: string | null
          delivery_type?: string
          email_confirmation_sent?: boolean
          email_ready_sent?: boolean
          id?: string
          invoice_number?: string | null
          items?: Json
          order_source?: string | null
          order_status?: string
          ordered_at?: string | null
          paid_at?: string | null
          paid_via?: string | null
          payment_method?: string
          payment_status?: string
          profit?: number
          ready_at?: string | null
          ready_to_pay_at?: string | null
          reward_code_used?: string | null
          seated_at?: string | null
          served_at?: string | null
          staff_id?: string | null
          subtotal?: number
          table_number?: number | null
          total_price?: number
          whatsapp_confirmation_sent?: boolean
          whatsapp_ready_sent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "fk_orders_staff_id"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          display_order: number
          id: number
          is_enabled: boolean
          method_name: string
          qr_code_url: string | null
        }
        Insert: {
          display_order?: number
          id?: number
          is_enabled?: boolean
          method_name: string
          qr_code_url?: string | null
        }
        Update: {
          display_order?: number
          id?: number
          is_enabled?: boolean
          method_name?: string
          qr_code_url?: string | null
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          bank_account_name: string | null
          bank_account_number: string | null
          bank_branch: string | null
          bank_name: string | null
          cod_instructions: string | null
          cop_instructions: string | null
          gcash_qr_url: string | null
          id: number
          invoice_layout: string
          phqr_qr_url: string | null
          show_bank_on_invoice: boolean
          show_cod_on_invoice: boolean
          show_cop_on_invoice: boolean
          show_gcash_on_invoice: boolean
          show_phqr_on_invoice: boolean
        }
        Insert: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          cod_instructions?: string | null
          cop_instructions?: string | null
          gcash_qr_url?: string | null
          id?: number
          invoice_layout?: string
          phqr_qr_url?: string | null
          show_bank_on_invoice?: boolean
          show_cod_on_invoice?: boolean
          show_cop_on_invoice?: boolean
          show_gcash_on_invoice?: boolean
          show_phqr_on_invoice?: boolean
        }
        Update: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          cod_instructions?: string | null
          cop_instructions?: string | null
          gcash_qr_url?: string | null
          id?: number
          invoice_layout?: string
          phqr_qr_url?: string | null
          show_bank_on_invoice?: boolean
          show_cod_on_invoice?: boolean
          show_cop_on_invoice?: boolean
          show_gcash_on_invoice?: boolean
          show_phqr_on_invoice?: boolean
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          cost_of_goods: number
          created_at: string
          description: string | null
          has_tray_pricing: boolean | null
          id: string
          image_url: string | null
          inventory: number
          inventory_min_threshold: number
          is_available: boolean
          is_special: boolean
          name: string
          price: number
          special_end_date: string | null
          special_price: number | null
          tray_large_pax: number | null
          tray_large_price: number | null
          tray_medium_pax: number | null
          tray_medium_price: number | null
          tray_small_pax: number | null
          tray_small_price: number | null
          unit: string
        }
        Insert: {
          category?: string
          cost_of_goods?: number
          created_at?: string
          description?: string | null
          has_tray_pricing?: boolean | null
          id?: string
          image_url?: string | null
          inventory?: number
          inventory_min_threshold?: number
          is_available?: boolean
          is_special?: boolean
          name: string
          price?: number
          special_end_date?: string | null
          special_price?: number | null
          tray_large_pax?: number | null
          tray_large_price?: number | null
          tray_medium_pax?: number | null
          tray_medium_price?: number | null
          tray_small_pax?: number | null
          tray_small_price?: number | null
          unit?: string
        }
        Update: {
          category?: string
          cost_of_goods?: number
          created_at?: string
          description?: string | null
          has_tray_pricing?: boolean | null
          id?: string
          image_url?: string | null
          inventory?: number
          inventory_min_threshold?: number
          is_available?: boolean
          is_special?: boolean
          name?: string
          price?: number
          special_end_date?: string | null
          special_price?: number | null
          tray_large_pax?: number | null
          tray_large_price?: number | null
          tray_medium_pax?: number | null
          tray_medium_price?: number | null
          tray_small_pax?: number | null
          tray_small_price?: number | null
          unit?: string
        }
        Relationships: []
      }
      restaurant_tables: {
        Row: {
          capacity: number | null
          id: number
          is_available: boolean | null
          qr_code_url: string | null
          table_number: number
        }
        Insert: {
          capacity?: number | null
          id?: number
          is_available?: boolean | null
          qr_code_url?: string | null
          table_number: number
        }
        Update: {
          capacity?: number | null
          id?: number
          is_available?: boolean | null
          qr_code_url?: string | null
          table_number?: number
        }
        Relationships: []
      }
      social_media_links: {
        Row: {
          display_order: number
          icon_name: string
          id: number
          is_enabled: boolean
          platform_name: string
          url: string
        }
        Insert: {
          display_order?: number
          icon_name: string
          id?: number
          is_enabled?: boolean
          platform_name: string
          url?: string
        }
        Update: {
          display_order?: number
          icon_name?: string
          id?: number
          is_enabled?: boolean
          platform_name?: string
          url?: string
        }
        Relationships: []
      }
      specials: {
        Row: {
          description: string
          discount_percent: number | null
          end_date: string
          id: string
          image_url: string | null
          is_active: boolean
          products_included: Json
          special_type: string
          start_date: string
          title: string
        }
        Insert: {
          description?: string
          discount_percent?: number | null
          end_date?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          products_included?: Json
          special_type?: string
          start_date?: string
          title: string
        }
        Update: {
          description?: string
          discount_percent?: number | null
          end_date?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          products_included?: Json
          special_type?: string
          start_date?: string
          title?: string
        }
        Relationships: []
      }
      staff_users: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          passkey: string
          role: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          passkey: string
          role: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          passkey?: string
          role?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          created_at: string
          customer_image: string | null
          customer_name: string
          id: string
          is_approved: boolean
          rating: number
          review_text: string
        }
        Insert: {
          created_at?: string
          customer_image?: string | null
          customer_name: string
          id?: string
          is_approved?: boolean
          rating?: number
          review_text: string
        }
        Update: {
          created_at?: string
          customer_image?: string | null
          customer_name?: string
          id?: string
          is_approved?: boolean
          rating?: number
          review_text?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          created_at: string
          example: string | null
          id: number
          label: string
          value: string
        }
        Insert: {
          created_at?: string
          example?: string | null
          id?: number
          label: string
          value: string
        }
        Update: {
          created_at?: string
          example?: string | null
          id?: number
          label?: string
          value?: string
        }
        Relationships: []
      }
      website_pages: {
        Row: {
          content: Json
          display_order: number
          id: number
          is_published: boolean
          seo_description: string | null
          seo_title: string | null
          slug: string
          title: string
        }
        Insert: {
          content?: Json
          display_order?: number
          id?: number
          is_published?: boolean
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          title: string
        }
        Update: {
          content?: Json
          display_order?: number
          id?: number
          is_published?: boolean
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_catering: {
        Row: {
          admin_notes: string | null
          balance: number | null
          customer_name: string | null
          customer_phone: string | null
          deposit_amount: number | null
          deposit_paid: boolean | null
          event_date: string | null
          headcount: number | null
          items: Json | null
          order_number: string | null
          status: string | null
          total_amount: number | null
        }
        Insert: {
          admin_notes?: string | null
          balance?: number | null
          customer_name?: string | null
          customer_phone?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          event_date?: string | null
          headcount?: number | null
          items?: Json | null
          order_number?: string | null
          status?: string | null
          total_amount?: number | null
        }
        Update: {
          admin_notes?: string | null
          balance?: number | null
          customer_name?: string | null
          customer_phone?: string | null
          deposit_amount?: number | null
          deposit_paid?: boolean | null
          event_date?: string | null
          headcount?: number | null
          items?: Json | null
          order_number?: string | null
          status?: string | null
          total_amount?: number | null
        }
        Relationships: []
      }
      all_orders_for_invoice: {
        Row: {
          balance: number | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          delivery_type: string | null
          deposit_amount: number | null
          deposit_paid: boolean | null
          event_date: string | null
          headcount: number | null
          items: Json | null
          order_id: string | null
          order_number: string | null
          order_source: string | null
          status: string | null
          subtotal: number | null
          total_price: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
