export interface Database {
  public: {
    Tables: {
      utilisateurs: {
        Row: {
          id: string
          matricule: string | null
          nom: string | null
          prenom: string | null
          email: string
          date_de_naissance: string | null
          sexe: string | null
          photo_profil_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          matricule?: string | null
          nom?: string | null
          prenom?: string | null
          email: string
          date_de_naissance?: string | null
          sexe?: string | null
          photo_profil_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          matricule?: string | null
          nom?: string | null
          prenom?: string | null
          email?: string
          date_de_naissance?: string | null
          sexe?: string | null
          photo_profil_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clubs: {
        Row: {
          id: string
          nom: string
          domaine: string
          description: string | null
          type: string
          proprietaire_id: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nom: string
          domaine: string
          description?: string | null
          type?: string
          proprietaire_id?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nom?: string
          domaine?: string
          description?: string | null
          type?: string
          proprietaire_id?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      club_membres: {
        Row: {
          club_id: string
          membre_id: string
          role: string
          date_adhesion: string
        }
        Insert: {
          club_id: string
          membre_id: string
          role?: string
          date_adhesion?: string
        }
        Update: {
          club_id?: string
          membre_id?: string
          role?: string
          date_adhesion?: string
        }
      }
      publications: {
        Row: {
          id: string
          club_id: string
          auteur_id: string | null
          titre: string
          contenu: string
          type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          club_id: string
          auteur_id?: string | null
          titre: string
          contenu: string
          type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          auteur_id?: string | null
          titre?: string
          contenu?: string
          type?: string
          created_at?: string
          updated_at?: string
        }
      }
      commentaires: {
        Row: {
          id: string
          publication_id: string
          auteur_id: string | null
          contenu: string
          created_at: string
        }
        Insert: {
          id?: string
          publication_id: string
          auteur_id?: string | null
          contenu: string
          created_at?: string
        }
        Update: {
          id?: string
          publication_id?: string
          auteur_id?: string | null
          contenu?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          expediteur_id: string | null
          destinataire_id: string | null
          club_id: string | null
          contenu: string | null
          type: string
          media_url: string | null
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          expediteur_id?: string | null
          destinataire_id?: string | null
          club_id?: string | null
          contenu?: string | null
          type?: string
          media_url?: string | null
          created_at?: string
          read_at?: string | null
        }
        Update: {
          id?: string
          expediteur_id?: string | null
          destinataire_id?: string | null
          club_id?: string | null
          contenu?: string | null
          type?: string
          media_url?: string | null
          created_at?: string
          read_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          utilisateur_id: string
          type: string
          message: string
          source: string | null
          url_cible: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          utilisateur_id: string
          type: string
          message: string
          source?: string | null
          url_cible?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          utilisateur_id?: string
          type?: string
          message?: string
          source?: string | null
          url_cible?: string | null
          read?: boolean
          created_at?: string
        }
      }
      demandes_adhesion: {
        Row: {
          id: string
          club_id: string
          demandeur_id: string
          statut: string
          message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          club_id: string
          demandeur_id: string
          statut?: string
          message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          demandeur_id?: string
          statut?: string
          message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
