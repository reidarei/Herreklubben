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
      arrangement_chat: {
        Row: {
          arrangement_id: string
          id: string
          innhold: string
          opprettet: string
          profil_id: string
        }
        Insert: {
          arrangement_id: string
          id?: string
          innhold: string
          opprettet?: string
          profil_id: string
        }
        Update: {
          arrangement_id?: string
          id?: string
          innhold?: string
          opprettet?: string
          profil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arrangement_chat_arrangement_id_fkey"
            columns: ["arrangement_id"]
            isOneToOne: false
            referencedRelation: "arrangementer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arrangement_chat_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      arrangementmaler: {
        Row: {
          id: string
          navn: string
          opprettet: string | null
          purredato: string | null
          rekkefølge: number
          type: string | null
        }
        Insert: {
          id?: string
          navn: string
          opprettet?: string | null
          purredato?: string | null
          rekkefølge?: number
          type?: string | null
        }
        Update: {
          id?: string
          navn?: string
          opprettet?: string | null
          purredato?: string | null
          rekkefølge?: number
          type?: string | null
        }
        Relationships: []
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
      chat_reaksjoner: {
        Row: {
          emoji: string
          melding_id: string
          opprettet: string
          profil_id: string
        }
        Insert: {
          emoji: string
          melding_id: string
          opprettet?: string
          profil_id: string
        }
        Update: {
          emoji?: string
          melding_id?: string
          opprettet?: string
          profil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_reaksjoner_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kaaring_vinnere: {
        Row: {
          aar: number
          arrangement_id: string | null
          begrunnelse: string | null
          id: string
          mal_id: string | null
          oppdatert: string
          opprettet: string
          opprettet_av: string
          profil_id: string | null
        }
        Insert: {
          aar: number
          arrangement_id?: string | null
          begrunnelse?: string | null
          id?: string
          mal_id?: string | null
          oppdatert?: string
          opprettet?: string
          opprettet_av: string
          profil_id?: string | null
        }
        Update: {
          aar?: number
          arrangement_id?: string | null
          begrunnelse?: string | null
          id?: string
          mal_id?: string | null
          oppdatert?: string
          opprettet?: string
          opprettet_av?: string
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
            foreignKeyName: "kaaring_vinnere_mal_id_fkey"
            columns: ["mal_id"]
            isOneToOne: false
            referencedRelation: "kaaringmaler"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kaaring_vinnere_opprettet_av_fkey"
            columns: ["opprettet_av"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      kaaringmaler: {
        Row: {
          id: string
          navn: string
          opprettet: string
          rekkefolge: number
        }
        Insert: {
          id?: string
          navn: string
          opprettet?: string
          rekkefolge?: number
        }
        Update: {
          id?: string
          navn?: string
          opprettet?: string
          rekkefolge?: number
        }
        Relationships: []
      }
      klubb_chat: {
        Row: {
          id: string
          innhold: string
          opprettet: string
          profil_id: string
        }
        Insert: {
          id?: string
          innhold: string
          opprettet?: string
          profil_id: string
        }
        Update: {
          id?: string
          innhold?: string
          opprettet?: string
          profil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "klubb_chat_profil_id_fkey"
            columns: ["profil_id"]
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
          fodselsdato: string | null
          id: string
          navn: string
          oppdatert: string
          opprettet: string
          rolle: string
          telefon: string | null
          visningsnavn: string
        }
        Insert: {
          aktiv?: boolean
          bilde_url?: string | null
          epost: string
          fodselsdato?: string | null
          id: string
          navn: string
          oppdatert?: string
          opprettet?: string
          rolle?: string
          telefon?: string | null
          visningsnavn: string
        }
        Update: {
          aktiv?: boolean
          bilde_url?: string | null
          epost?: string
          fodselsdato?: string | null
          id?: string
          navn?: string
          oppdatert?: string
          opprettet?: string
          rolle?: string
          telefon?: string | null
          visningsnavn?: string
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
      varsel_logg: {
        Row: {
          arrangement_id: string | null
          id: string
          kanal: string | null
          lest: boolean
          melding: string
          opprettet: string | null
          profil_id: string
          tittel: string
          type: string | null
          url: string | null
        }
        Insert: {
          arrangement_id?: string | null
          id?: string
          kanal?: string | null
          lest?: boolean
          melding: string
          opprettet?: string | null
          profil_id: string
          tittel: string
          type?: string | null
          url?: string | null
        }
        Update: {
          arrangement_id?: string | null
          id?: string
          kanal?: string | null
          lest?: boolean
          melding?: string
          opprettet?: string | null
          profil_id?: string
          tittel?: string
          type?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personlige_varsler_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "varsel_logg_arrangement_id_fkey"
            columns: ["arrangement_id"]
            isOneToOne: false
            referencedRelation: "arrangementer"
            referencedColumns: ["id"]
          },
        ]
      }
      varsel_preferanser: {
        Row: {
          epost_aktiv: boolean
          oppdatert: string | null
          profil_id: string
          push_aktiv: boolean
        }
        Insert: {
          epost_aktiv?: boolean
          oppdatert?: string | null
          profil_id: string
          push_aktiv?: boolean
        }
        Update: {
          epost_aktiv?: boolean
          oppdatert?: string | null
          profil_id?: string
          push_aktiv?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "varsel_preferanser_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
