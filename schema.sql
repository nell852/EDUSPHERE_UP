-- ##########################################################################
-- #                             SCHEMA PUBLIC                              #
-- ##########################################################################

-- Table des Utilisateurs
-- Cette table est liée à `auth.users` de Supabase via l'ID.
-- Elle contient les informations de profil spécifiques à l'application.
CREATE TABLE IF NOT EXISTS public.utilisateurs (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Clé étrangère vers Supabase Auth
    matricule TEXT UNIQUE, -- Matricule unique généré par l'application, peut être NULL initialement pour le trigger
    nom TEXT, -- Ces champs peuvent être NULL car ils peuvent être remplis par le trigger handle_new_user après l'insertion initiale par Supabase Auth
    prenom TEXT,
    email TEXT UNIQUE NOT NULL, -- Devrait correspondre à l'email dans auth.users
    date_de_naissance DATE,
    sexe TEXT CHECK (sexe IN ('Masculin', 'Féminin', 'Autre')), -- Contrainte sur le sexe
    photo_profil_url TEXT, -- URL vers l'image de profil stockée dans Supabase Storage
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour une recherche rapide sur le matricule et l'email
CREATE INDEX IF NOT EXISTS idx_utilisateurs_matricule ON public.utilisateurs (matricule);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON public.utilisateurs (email);

-- Table des Livres
CREATE TABLE IF NOT EXISTS public.livres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titre TEXT NOT NULL,
    domaine TEXT NOT NULL,
    sous_domaine TEXT,
    description TEXT,
    couverture_url TEXT, -- URL vers l'image de couverture
    document_url TEXT NOT NULL, -- URL vers le fichier PDF du livre (stocké de manière sécurisée)
    particularite TEXT, -- ex: "Accessible en ligne uniquement", "Interdiction de capture"
    popularite INTEGER DEFAULT 0, -- Nombre de consultations ou likes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour la recherche et le filtrage des livres
CREATE INDEX IF NOT EXISTS idx_livres_titre ON public.livres (titre);
CREATE INDEX IF NOT EXISTS idx_livres_domaine ON public.livres (domaine);

-- Table des Examens (Épreuves)
CREATE TABLE IF NOT EXISTS public.examens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matiere TEXT NOT NULL,
    ecole TEXT NOT NULL, -- ex: "Ecole Polytechnique", "ENSET"
    niveau TEXT NOT NULL, -- ex: "B1", "B2", "M1"
    annee INTEGER NOT NULL,
    contenu_url TEXT NOT NULL, -- URL vers le fichier PDF de l'examen (stocké de manière sécurisée)
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour la recherche et le filtrage des examens
CREATE INDEX IF NOT EXISTS idx_examens_matiere ON public.examens (matiere);
CREATE INDEX IF NOT EXISTS idx_examens_ecole_niveau ON public.examens (ecole, niveau);


-- Table des Clubs
CREATE TABLE IF NOT EXISTS public.clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL UNIQUE,
    domaine TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'public' CHECK (type IN ('public', 'privé')),
    proprietaire_id UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL, -- L'utilisateur qui a créé le club
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de jonction pour les membres des clubs
CREATE TABLE IF NOT EXISTS public.club_membres (
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    membre_id UUID REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'membre' CHECK (role IN ('membre', 'modérateur', 'administrateur')),
    date_adhesion TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (club_id, membre_id) -- Un membre ne peut appartenir qu'une fois à un club
);

-- Table des Ateliers de Travail (au sein des clubs)
CREATE TABLE IF NOT EXISTS public.ateliers_travail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    description TEXT,
    proprietaire_id UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL,
    visibilite TEXT DEFAULT 'privé' CHECK (visibilite IN ('privé')), -- Les ateliers sont privés
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de jonction pour les participants aux ateliers
CREATE TABLE IF NOT EXISTS public.atelier_participants (
    atelier_id UUID REFERENCES public.ateliers_travail(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
    date_rejoint TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (atelier_id, participant_id)
);

-- Table des Publications (dans les clubs)
CREATE TABLE IF NOT EXISTS public.publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
    auteur_id UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL,
    titre TEXT NOT NULL,
    contenu TEXT NOT NULL,
    type TEXT DEFAULT 'discussion' CHECK (type IN ('discussion', 'probleme', 'annonce', 'defi', 'sondage')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des Commentaires sur les publications
CREATE TABLE IF NOT EXISTS public.commentaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_id UUID REFERENCES public.publications(id) ON DELETE CASCADE,
    auteur_id UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL,
    contenu TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table pour les sondages (type de publication)
CREATE TABLE IF NOT EXISTS public.sondages (
    publication_id UUID PRIMARY KEY REFERENCES public.publications(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options TEXT[] NOT NULL, -- Tableau de chaînes pour les options
    date_cloture TIMESTAMPTZ
);

-- Table de jonction pour les votes de sondages
CREATE TABLE IF NOT EXISTS public.votes_sondage (
    sondage_id UUID REFERENCES public.sondages(publication_id) ON DELETE CASCADE,
    electeur_id UUID REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
    option_votee TEXT NOT NULL, -- L'option choisie
    voted_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (sondage_id, electeur_id) -- Un utilisateur ne peut voter qu'une fois par sondage
);


-- Table des Messages (pour le chat temps réel)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expediteur_id UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL,
    destinataire_id UUID REFERENCES public.utilisateurs(id) ON DELETE SET NULL, -- Pour chat privé
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE, -- Pour chat de club (si destinataire_id est NULL)
    contenu TEXT,
    type TEXT DEFAULT 'texte' CHECK (type IN ('texte', 'image', 'fichier', 'audio')),
    media_url TEXT, -- URL si le message est une image, un fichier ou un audio
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ -- Horodatage de lecture
);

-- Index pour optimiser les requêtes de messages
CREATE INDEX IF NOT EXISTS idx_messages_expediteur ON public.messages (expediteur_id);
CREATE INDEX IF NOT EXISTS idx_messages_destinataire ON public.messages (destinataire_id);
CREATE INDEX IF NOT EXISTS idx_messages_club ON public.messages (club_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at DESC);


-- Table des Projets (Mon Parcours)
CREATE TABLE IF NOT EXISTS public.projets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proprietaire_id UUID REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    description TEXT,
    langages_utilises TEXT[], -- Tableau de chaînes (ex: ['JavaScript', 'Python'])
    statut TEXT DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'termine', 'archive')),
    visibilite TEXT DEFAULT 'prive' CHECK (visibilite IN ('public', 'prive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table de jonction pour les collaborateurs de projets
CREATE TABLE IF NOT EXISTS public.projet_collaborateurs (
    projet_id UUID REFERENCES public.projets(id) ON DELETE CASCADE,
    collaborateur_id UUID REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'collaborateur' CHECK (role IN ('collaborateur', 'viewer')),
    date_ajout TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (projet_id, collaborateur_id)
);

-- Table pour les fichiers associés aux projets
CREATE TABLE IF NOT EXISTS public.projet_fichiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projet_id UUID REFERENCES public.projets(id) ON DELETE CASCADE,
    nom_fichier TEXT NOT NULL,
    url_fichier TEXT NOT NULL, -- URL du fichier stocké
    type_fichier TEXT, -- ex: 'PDF', 'TXT', 'MD', 'MP4', 'MP3'
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Table des CV générés
CREATE TABLE IF NOT EXISTS public.cvs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id UUID REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
    contenu_pdf_url TEXT NOT NULL, -- URL vers le fichier PDF du CV
    type_entreprise_cible TEXT, -- Description libre ou tag (ex: 'Tech', 'Finance')
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id UUID REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- ex: 'nouveau_livre', 'message_non_lu', 'invitation_club', 'reponse_ia'
    message TEXT NOT NULL,
    source TEXT, -- ex: 'bibliotheque', 'chat', 'club', 'ia'
    url_cible TEXT, -- URL ou chemin pour rediriger l'utilisateur vers le contenu pertinent
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ##########################################################################
-- #                     FONCTIONS ET TRIGGERS SQL                          #
-- ##########################################################################

-- Fonction trigger pour générer automatiquement le matricule unique
-- Cette fonction est appelée par un trigger BEFORE INSERT sur la table utilisateurs.
CREATE OR REPLACE FUNCTION generate_matricule_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    new_matricule_val TEXT;
    prefixe TEXT := 'UNIV'; -- Exemple de préfixe
BEGIN
    LOOP
        -- Génère une partie aléatoire basée sur un UUID, pour s'assurer de l'unicité
        new_matricule_val := prefixe || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 8));
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.utilisateurs WHERE matricule = new_matricule_val);
    END LOOP;
    NEW.matricule := new_matricule_val; -- Assigne la valeur du matricule à la nouvelle ligne
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement le matricule lors de l'insertion d'un nouvel utilisateur
DROP TRIGGER IF EXISTS assign_matricule ON public.utilisateurs; -- S'assurer qu'il n'y a pas de doublons
CREATE TRIGGER assign_matricule
BEFORE INSERT ON public.utilisateurs
FOR EACH ROW
WHEN (NEW.matricule IS NULL) -- Ne génère un matricule que s'il n'est pas déjà fourni
EXECUTE FUNCTION generate_matricule_trigger_func();

-- Trigger pour mettre à jour automatiquement `updated_at`
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur les tables où `updated_at` est présent
DROP TRIGGER IF EXISTS update_utilisateurs_updated_at ON public.utilisateurs;
CREATE TRIGGER update_utilisateurs_updated_at
BEFORE UPDATE ON public.utilisateurs
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_livres_updated_at ON public.livres;
CREATE TRIGGER update_livres_updated_at
BEFORE UPDATE ON public.livres
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_examens_updated_at ON public.examens;
CREATE TRIGGER update_examens_updated_at
BEFORE UPDATE ON public.examens
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_clubs_updated_at ON public.clubs;
CREATE TRIGGER update_clubs_updated_at
BEFORE UPDATE ON public.clubs
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_ateliers_travail_updated_at ON public.ateliers_travail;
CREATE TRIGGER update_ateliers_travail_updated_at
BEFORE UPDATE ON public.ateliers_travail
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_publications_updated_at ON public.publications;
CREATE TRIGGER update_publications_updated_at
BEFORE UPDATE ON public.publications
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_projets_updated_at ON public.projets;
CREATE TRIGGER update_projets_updated_at
BEFORE UPDATE ON public.projets
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ##########################################################################
-- #                      ROW LEVEL SECURITY (RLS)                          #
-- ##########################################################################
-- Activer la RLS pour toutes les tables créées.
-- Supabase gère déjà la RLS par défaut, mais il est bon de l'activer explicitement
-- et de définir les politiques nécessaires.

-- Activer RLS pour chaque table (nécessaire avant de créer des politiques)
ALTER TABLE public.utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_membres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ateliers_travail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atelier_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commentaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sondages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes_sondage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projet_collaborateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projet_fichiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS de base (à affiner selon les besoins précis)

-- Politiques pour la table 'utilisateurs'
-- Permet aux utilisateurs de voir leur propre profil et de créer un profil à l'insertion
CREATE POLICY "Utilisateurs : Les utilisateurs peuvent voir leur propre profil."
ON public.utilisateurs FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Utilisateurs : Les utilisateurs peuvent mettre à jour leur propre profil."
ON public.utilisateurs FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Utilisateurs : Permettre la création de profil par la fonction trigger."
ON public.utilisateurs FOR INSERT WITH CHECK (true); -- Le handle_new_user gère l'insertion initiale

-- Politiques pour la table 'livres'
CREATE POLICY "Livres : Tous les utilisateurs authentifiés peuvent lire les livres."
ON public.livres FOR SELECT USING (true); -- Supposons que les livres sont publics pour les utilisateurs connectés

-- Politiques pour la table 'examens'
CREATE POLICY "Examens : Tous les utilisateurs authentifiés peuvent lire les examens."
ON public.examens FOR SELECT USING (true);

-- Politiques pour la table 'clubs'
CREATE POLICY "Clubs : Les utilisateurs authentifiés peuvent créer des clubs."
ON public.clubs FOR INSERT WITH CHECK (auth.uid() = proprietaire_id);

CREATE POLICY "Clubs : Les utilisateurs authentifiés peuvent voir les clubs publics ou dont ils sont membres."
ON public.clubs FOR SELECT USING (type = 'public' OR auth.uid() = proprietaire_id OR EXISTS(SELECT 1 FROM public.club_membres WHERE club_id = clubs.id AND membre_id = auth.uid()));

CREATE POLICY "Clubs : Les propriétaires peuvent modifier leur club."
ON public.clubs FOR UPDATE USING (auth.uid() = proprietaire_id);

CREATE POLICY "Clubs : Les propriétaires peuvent supprimer leur club."
ON public.clubs FOR DELETE USING (auth.uid() = proprietaire_id);

-- Politiques pour 'club_membres'
CREATE POLICY "Club Membres : Les membres d'un club peuvent voir les autres membres."
ON public.club_membres FOR SELECT USING (EXISTS(SELECT 1 FROM public.club_membres WHERE club_id = club_membres.club_id AND membre_id = auth.uid()));

CREATE POLICY "Club Membres : Les utilisateurs peuvent rejoindre un club."
ON public.club_membres FOR INSERT WITH CHECK (auth.uid() = membre_id);

-- Politiques pour 'ateliers_travail' (similaires aux clubs mais privés)
CREATE POLICY "Ateliers : Les membres du club peuvent créer un atelier."
ON public.ateliers_travail FOR INSERT WITH CHECK (EXISTS(SELECT 1 FROM public.club_membres WHERE club_id = ateliers_travail.club_id AND membre_id = auth.uid()));

CREATE POLICY "Ateliers : Les membres de l'atelier ou du club associé peuvent voir les ateliers."
ON public.ateliers_travail FOR SELECT USING (
    EXISTS(SELECT 1 FROM public.atelier_participants WHERE atelier_id = ateliers_travail.id AND participant_id = auth.uid()) OR
    EXISTS(SELECT 1 FROM public.club_membres WHERE club_id = ateliers_travail.club_id AND membre_id = auth.uid())
);

-- Politiques pour 'publications'
CREATE POLICY "Publications : Les membres du club peuvent voir les publications."
ON public.publications FOR SELECT USING (EXISTS(SELECT 1 FROM public.club_membres WHERE club_id = publications.club_id AND membre_id = auth.uid()));

CREATE POLICY "Publications : Les membres du club peuvent créer des publications."
ON public.publications FOR INSERT WITH CHECK (auth.uid() = auteur_id AND EXISTS(SELECT 1 FROM public.club_membres WHERE club_id = publications.club_id AND membre_id = auth.uid()));

-- Politiques pour 'commentaires'
CREATE POLICY "Commentaires : Les utilisateurs peuvent voir les commentaires des publications de clubs dont ils sont membres."
ON public.commentaires FOR SELECT USING (EXISTS(SELECT 1 FROM public.publications p WHERE p.id = commentaires.publication_id AND EXISTS(SELECT 1 FROM public.club_membres WHERE club_id = p.club_id AND membre_id = auth.uid())));

CREATE POLICY "Commentaires : Les utilisateurs peuvent ajouter des commentaires."
ON public.commentaires FOR INSERT WITH CHECK (auth.uid() = auteur_id);

-- Politiques pour 'sondages'
CREATE POLICY "Sondages : Les utilisateurs peuvent voir les sondages des publications de clubs dont ils sont membres."
ON public.sondages FOR SELECT USING (EXISTS(SELECT 1 FROM public.publications p WHERE p.id = sondages.publication_id AND EXISTS(SELECT 1 FROM public.club_membres WHERE club_id = p.club_id AND membre_id = auth.uid())));

-- Politiques pour 'votes_sondage'
CREATE POLICY "Votes Sondage : Les utilisateurs peuvent voter sur les sondages des clubs dont ils sont membres."
ON public.votes_sondage FOR INSERT WITH CHECK (auth.uid() = electeur_id AND EXISTS(SELECT 1 FROM public.sondages s JOIN public.publications p ON s.publication_id = p.id JOIN public.club_membres cm ON p.club_id = cm.club_id WHERE s.publication_id = votes_sondage.sondage_id AND cm.membre_id = auth.uid()));

-- Politiques pour 'messages' (chat)
CREATE POLICY "Messages : Les utilisateurs peuvent voir les messages des conversations auxquelles ils participent (privées ou club)."
ON public.messages FOR SELECT USING (
    (auth.uid() = expediteur_id OR auth.uid() = destinataire_id) OR -- messages privés
    (messages.club_id IS NOT NULL AND EXISTS(SELECT 1 FROM public.club_membres WHERE club_id = messages.club_id AND membre_id = auth.uid())) -- messages de club
);

CREATE POLICY "Messages : Les utilisateurs peuvent envoyer des messages."
ON public.messages FOR INSERT WITH CHECK (
    auth.uid() = expediteur_id AND (
        (destinataire_id IS NOT NULL AND club_id IS NULL) OR -- message privé
        (club_id IS NOT NULL AND destinataire_id IS NULL AND EXISTS(SELECT 1 FROM public.club_membres WHERE club_id = messages.club_id AND membre_id = auth.uid())) -- message de club
    )
);

-- Politiques pour 'projets'
CREATE POLICY "Projets : Les utilisateurs peuvent voir leurs projets ou les projets publics ou ceux dont ils sont collaborateurs."
ON public.projets FOR SELECT USING (
    auth.uid() = proprietaire_id OR
    visibilite = 'public' OR
    EXISTS(SELECT 1 FROM public.projet_collaborateurs WHERE projet_id = projets.id AND collaborateur_id = auth.uid())
);

CREATE POLICY "Projets : Les utilisateurs peuvent créer leurs projets."
ON public.projets FOR INSERT WITH CHECK (auth.uid() = proprietaire_id);

-- Politiques pour 'projet_collaborateurs'
CREATE POLICY "Projet Collaborateurs : Les propriétaires de projet ou les collaborateurs peuvent voir la liste."
ON public.projet_collaborateurs FOR SELECT USING (EXISTS(SELECT 1 FROM public.projets WHERE id = projet_collaborateurs.projet_id AND (proprietaire_id = auth.uid() OR EXISTS(SELECT 1 FROM public.projet_collaborateurs pc WHERE pc.projet_id = projets.id AND pc.collaborateur_id = auth.uid()))));

CREATE POLICY "Projet Collaborateurs : Les propriétaires de projet peuvent ajouter/supprimer des collaborateurs."
ON public.projet_collaborateurs FOR INSERT WITH CHECK (EXISTS(SELECT 1 FROM public.projets WHERE id = projet_collaborateurs.projet_id AND proprietaire_id = auth.uid()));

CREATE POLICY "Projet Collaborateurs : Les propriétaires de projet peuvent mettre à jour les rôles des collaborateurs."
ON public.projet_collaborateurs FOR UPDATE USING (EXISTS(SELECT 1 FROM public.projets WHERE id = projet_collaborateurs.projet_id AND proprietaire_id = auth.uid()));

-- Politiques pour 'projet_fichiers'
CREATE POLICY "Projet Fichiers : Les propriétaires de projet ou les collaborateurs peuvent voir les fichiers."
ON public.projet_fichiers FOR SELECT USING (EXISTS(SELECT 1 FROM public.projets p WHERE p.id = projet_fichiers.projet_id AND (p.proprietaire_id = auth.uid() OR p.visibilite = 'public' OR EXISTS(SELECT 1 FROM public.projet_collaborateurs pc WHERE pc.projet_id = p.id AND pc.collaborateur_id = auth.uid()))));

CREATE POLICY "Projet Fichiers : Les propriétaires de projet peuvent ajouter des fichiers."
ON public.projet_fichiers FOR INSERT WITH CHECK (EXISTS(SELECT 1 FROM public.projets p WHERE p.id = projet_fichiers.projet_id AND p.proprietaire_id = auth.uid()));

-- Politiques pour 'cvs'
CREATE POLICY "CVs : Les utilisateurs peuvent voir et modifier leurs propres CVs."
ON public.cvs FOR SELECT USING (auth.uid() = utilisateur_id);
CREATE POLICY "CVs : Les utilisateurs peuvent créer leur propre CV."
ON public.cvs FOR INSERT WITH CHECK (auth.uid() = utilisateur_id);
CREATE POLICY "CVs : Les utilisateurs peuvent mettre à jour leur propre CV."
ON public.cvs FOR UPDATE USING (auth.uid() = utilisateur_id);

-- Politiques pour 'notifications'
CREATE POLICY "Notifications : Les utilisateurs peuvent voir leurs propres notifications."
ON public.notifications FOR SELECT USING (auth.uid() = utilisateur_id);

-- ##########################################################################
-- #                INTÉGRATION SUPABASE AUTH ET FONCTIONS                 #
-- ##########################################################################

-- Trigger pour créer un profil `public.utilisateurs` après l'inscription d'un utilisateur dans `auth.users`
-- Ceci est crucial pour lier l'ID de Supabase Auth à notre table `utilisateurs` et générer le matricule.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.utilisateurs (id, nom, prenom, email)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'nom', NEW.raw_user_meta_data->>'prenom', NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimez le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- Revoke public access (bonne pratique de sécurité)
REVOKE ALL ON SCHEMA public FROM public;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM public;

-- Grant usage to authenticated users (role 'authenticated')
GRANT USAGE ON SCHEMA public TO authenticated;
-- Pour les tables, n'accordez que les privilèges de base et laissez RLS gérer le reste.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- Grant EXECUTE sur les fonctions nécessaires.
GRANT EXECUTE ON FUNCTION generate_matricule_trigger_func() TO authenticated;
GRANT EXECUTE ON FUNCTION update_timestamp() TO authenticated;
-- Note: handle_new_user est exécuté par le système Supabase, pas directement par l'utilisateur authentifié.

-- ##########################################################################
-- #                         CONFIGURATION STORAGE                          #
-- ##########################################################################
-- Créer des buckets de stockage (à faire dans l'interface Supabase ou via des requêtes API)
-- Par exemple :
-- INSERT INTO storage.buckets (id, name, public) VALUES ('profile_pictures', 'profile_pictures', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('book_covers', 'book_covers', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('book_documents', 'book_documents', false); -- Privé pour la sécurité
-- INSERT INTO storage.buckets (id, name, public) VALUES ('exam_documents', 'exam_documents', false); -- Privé pour la sécurité
-- INSERT INTO storage.buckets (id, name, public) VALUES ('project_files', 'project_files', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('cv_pdfs', 'cv_pdfs', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('chat_media', 'chat_media', true); -- Ou false si les médias de chat sont privés

-- Politiques de stockage (à configurer dans l'interface Supabase Storage ou via des requêtes SQL)
-- Exemple pour les photos de profil (lecture publique, écriture par le propriétaire)
/*
CREATE POLICY "Allow public read access" ON storage.objects FOR SELECT USING (bucket_id = 'profile_pictures');
CREATE POLICY "Allow authenticated users to upload photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile_pictures' AND auth.uid()::text = owner);
CREATE POLICY "Allow authenticated users to update their photos" ON storage.objects FOR UPDATE USING (bucket_id = 'profile_pictures' AND auth.uid()::text = owner);
*/

-- N'oubliez pas d'adapter les politiques RLS et de stockage à vos besoins exacts en matière de sécurité et d'accès aux données.
-- Ce script est une base solide qui couvre les entités principales et les relations.