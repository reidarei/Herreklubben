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
      arrangementer: {
        Row: {
          beskrivelse: string | null
          bilde_url: string | null
          destinasjon: string | null
          id: string
          oppdatert: string
          oppmoetested: string | null
          opprettet: string
          opprettet_av: string | null
          pris_per_person: number | null
          sensurerte_felt: Json
          slutt_tidspunkt: string | null
          start_tidspunkt: string
          tittel: string
          type: Database["public"]["Enums"]["arrangementstype"]
        }
        Insert: {
          beskrivelse?: string | null
          bilde_url?: string | null
          destinasjon?: string | null
          id?: string
          oppdatert?: string
          oppmoetested?: string | null
          opprettet?: string
          opprettet_av?: string | null
          pris_per_person?: number | null
          sensurerte_felt?: Json
          slutt_tidspunkt?: string | null
          start_tidspunkt: string
          tittel: string
          type: Database["public"]["Enums"]["arrangementstype"]
        }
        Update: {
          beskrivelse?: string | null
          bilde_url?: string | null
          destinasjon?: string | null
          id?: string
          oppdatert?: string
          oppmoetested?: string | null
          opprettet?: string
          opprettet_av?: string | null
          pris_per_person?: number | null
          sensurerte_felt?: Json
          slutt_tidspunkt?: string | null
          start_tidspunkt?: string
          tittel?: string
          type?: Database["public"]["Enums"]["arrangementstype"]
        }
        Relationships: [
          {
            foreignKeyName: "arrangementer_opprettet_av_fkey"
            columns: ["opprettet_av"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      arrangoransvar: {
        Row: {
          aar: number
          ansvarlig_id: string | null
          arrangement_id: string | null
          arrangement_navn: string
          id: string
          oppdatert: string
          opprettet: string
          purredato: string | null
        }
        Insert: {
          aar: number
          ansvarlig_id?: string | null
          arrangement_id?: string | null
          arrangement_navn: string
          id?: string
          oppdatert?: string
          opprettet?: string
          purredato?: string | null
        }
        Update: {
          aar?: number
          ansvarlig_id?: string | null
          arrangement_id?: string | null
          arrangement_navn?: string
          id?: string
          oppdatert?: string
          opprettet?: string
          purredato?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arrangoransvar_ansvarlig_id_fkey"
            columns: ["ansvarlig_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arrangoransvar_arrangement_id_fkey"
            columns: ["arrangement_id"]
            isOneToOne: false
            referencedRelation: "arrangementer"
            referencedColumns: ["id"]
          },
        ]
      }
      kaaring_vinnere: {
        Row: {
          arrangement_id: string | null
          begrunnelse: string | null
          id: string
          kaaring_id: string
          profil_id: string | null
        }
        Insert: {
          arrangement_id?: string | null
          begrunnelse?: string | null
          id?: string
          kaaring_id: string
          profil_id?: string | null
        }
        Update: {
          arrangement_id?: string | null
          begrunnelse?: string | null
          id?: string
          kaaring_id?: string
          profil_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kaaring_vinnere_arrangement_id_fkey"
            columns: ["arrangement_id"]
            isOneToOne: false
            referencedRelation: "arrangementer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kaaring_vinnere_kaaring_id_fkey"
            columns: ["kaaring_id"]
            isOneToOne: false
            referencedRelation: "kaaringer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kaaring_vinnere_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kaaringer: {
        Row: {
          aar: number
          id: string
          kategori: string
          oppdatert: string
          opprettet: string
          opprettet_av: string | null
        }
        Insert: {
          aar: number
          id?: string
          kategori: string
          oppdatert?: string
          opprettet?: string
          opprettet_av?: string | null
        }
        Update: {
          aar?: number
          id?: string
          kategori?: string
          oppdatert?: string
          opprettet?: string
          opprettet_av?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kaaringer_opprettet_av_fkey"
            columns: ["opprettet_av"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      paameldinger: {
        Row: {
          arrangement_id: string
          oppdatert: string
          profil_id: string
          status: Database["public"]["Enums"]["paameldingsstatus"]
        }
        Insert: {
          arrangement_id: string
          oppdatert?: string
          profil_id: string
          status: Database["public"]["Enums"]["paameldingsstatus"]
        }
        Update: {
          arrangement_id?: string
          oppdatert?: string
          profil_id?: string
          status?: Database["public"]["Enums"]["paameldingsstatus"]
        }
        Relationships: [
          {
            foreignKeyName: "paameldinger_arrangement_id_fkey"
            columns: ["arrangement_id"]
            isOneToOne: false
            referencedRelation: "arrangementer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paameldinger_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aktiv: boolean
          bilde_url: string | null
          epost: string
          id: string
          navn: string
          oppdatert: string
          opprettet: string
          rolle: string
          telefon: string | null
        }
        Insert: {
          aktiv?: boolean
          bilde_url?: string | null
          epost: string
          id: string
          navn: string
          oppdatert?: string
          opprettet?: string
          rolle?: string
          telefon?: string | null
        }
        Update: {
          aktiv?: boolean
          bilde_url?: string | null
          epost?: string
          id?: string
          navn?: string
          oppdatert?: string
          opprettet?: string
          rolle?: string
          telefon?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          endpoint: string
          id: string
          opprettet: string
          p256dh: string
          profil_id: string
        }
        Insert: {
          auth: string
          endpoint: string
          id?: string
          opprettet?: string
          p256dh: string
          profil_id: string
        }
        Update: {
          auth?: string
          endpoint?: string
          id?: string
          opprettet?: string
          p256dh?: string
          profil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      varsel_innstillinger: {
        Row: {
          aktiv: boolean
          beskrivelse: string | null
          dager_foer: number | null
          id: string
          noekkel: string
          oppdatert: string
        }
        Insert: {
          aktiv?: boolean
          beskrivelse?: string | null
          dager_foer?: number | null
          id?: string
          noekkel: string
          oppdatert?: string
        }
        Update: {
          aktiv?: boolean
          beskrivelse?: string | null
          dager_foer?: number | null
          id?: string
          noekkel?: string
          oppdatert?: string
        }
        Relationships: []
      }
      varsler_logg: {
        Row: {
          arrangement_id: string
          id: string
          sendt_at: string | null
          type: string
        }
        Insert: {
          arrangement_id: string
          id?: string
          sendt_at?: string | null
          type: string
        }
        Update: {
          arrangement_id?: string
          id?: string
          sendt_at?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "varsler_logg_arrangement_id_fkey"
            columns: ["arrangement_id"]
            isOneToOne: false
            referencedRelation: "arrangementer"
            referencedColumns: ["id"]
          },
        ]
      }
      vedtekter: {
        Row: {
          id: string
          innhold: string
          oppdatert: string
          slug: string
          tittel: string
        }
        Insert: {
          id?: string
          innhold: string
          oppdatert?: string
          slug: string
          tittel: string
        }
        Update: {
          id?: string
          innhold?: string
          oppdatert?: string
          slug?: string
          tittel?: string
        }
        Relationships: []
      }
      vedtekter_versjoner: {
        Row: {
          endret_av: string | null
          endringsnotat: string
          id: string
          innhold: string
          opprettet: string
          vedtaksdato: string
          vedtekt_id: string
        }
        Insert: {
          endret_av?: string | null
          endringsnotat: string
          id?: string
          innhold: string
          opprettet?: string
          vedtaksdato: string
          vedtekt_id: string
        }
        Update: {
          endret_av?: string | null
          endringsnotat?: string
          id?: string
          innhold?: string
          opprettet?: string
          vedtaksdato?: string
          vedtekt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vedtekter_versjoner_endret_av_fkey"
            columns: ["endret_av"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vedtekter_versjoner_vedtekt_id_fkey"
            columns: ["vedtekt_id"]
            isOneToOne: false
            referencedRelation: "vedtekter"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      er_admin: { Args: never; Returns: boolean }
      get_statistikk: { Args: never; Returns: Json }
    }
    Enums: {
      arrangementstype: "moete" | "tur"
      paameldingsstatus: "ja" | "nei" | "kanskje"
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
      arrangementstype: ["moete", "tur"],
      paameldingsstatus: ["ja", "nei", "kanskje"],
    },
  },
} as const
