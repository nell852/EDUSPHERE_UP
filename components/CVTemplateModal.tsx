"use client"

import { useState, useEffect } from "react"
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated,
  TextInput,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import {
  X,
  FileText,
  Download,
  Sparkles,
  Check,
  Wand2,
  Eye,
  Brain,
  Zap,
  Star,
  ChevronRight,
  Mic,
  Cpu,
} from "lucide-react-native"
import * as Print from "expo-print"
import * as Sharing from "expo-sharing"

const { width, height } = Dimensions.get("window")

interface CVTemplateModalProps {
  visible: boolean
  onClose: () => void
  profile: any
  skills: any[]
  projects: any[]
  programmingLanguages: string[]
  spokenLanguages: any[]
  hobbies: any[]
}

interface CVTemplate {
  id: string
  name: string
  description: string
  preview: string
  style: "modern" | "classic" | "creative" | "minimal" | "tech" | "executive"
  color: string[]
  icon: string
  features: string[]
}

const CV_TEMPLATES: CVTemplate[] = [
  {
    id: "modern",
    name: "Moderne Pro",
    description: "Design épuré avec sections bien définies et couleurs subtiles",
    preview: "Parfait pour les profils tech et startup",
    style: "modern",
    color: ["#667eea", "#764ba2"],
    icon: "💼",
    features: ["Gradients modernes", "Sections organisées", "Responsive"],
  },
  {
    id: "tech",
    name: "Tech Expert",
    description: "Spécialement conçu pour les développeurs et ingénieurs",
    preview: "Met en valeur vos compétences techniques",
    style: "tech",
    color: ["#00c6ff", "#0072ff"],
    icon: "⚡",
    features: ["Focus technique", "Projets GitHub", "Compétences visuelles"],
  },
  {
    id: "creative",
    name: "Créatif Plus",
    description: "Design original avec mise en page dynamique et couleurs vives",
    preview: "Idéal pour les profils créatifs et artistiques",
    style: "creative",
    color: ["#ff6b6b", "#ee5a24"],
    icon: "🎨",
    features: ["Design unique", "Couleurs vives", "Layout créatif"],
  },
  {
    id: "executive",
    name: "Executive",
    description: "Style professionnel haut de gamme pour postes de direction",
    preview: "Élégant et sophistiqué",
    style: "executive",
    color: ["#2c3e50", "#34495e"],
    icon: "👔",
    features: ["Très professionnel", "Élégant", "Leadership"],
  },
  {
    id: "minimal",
    name: "Minimaliste",
    description: "Design simple et élégant, focus sur le contenu",
    preview: "Clarté et simplicité maximales",
    style: "minimal",
    color: ["#95a5a6", "#7f8c8d"],
    icon: "✨",
    features: ["Ultra clean", "Lisibilité parfaite", "Intemporel"],
  },
  {
    id: "classic",
    name: "Classique",
    description: "Format traditionnel et professionnel, valeurs sûres",
    preview: "Convient à tous les secteurs",
    style: "classic",
    color: ["#2c3e50", "#34495e"],
    icon: "📋",
    features: ["Traditionnel", "Universel", "Sobre"],
  },
]

export default function CVTemplateModal({
  visible,
  onClose,
  profile,
  skills,
  projects,
  programmingLanguages,
  spokenLanguages,
  hobbies,
}: CVTemplateModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [generating, setGenerating] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [showAIOptions, setShowAIOptions] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState<"template" | "ai" | "preview">("template")

  // Animations
  const fadeAnim = new Animated.Value(0)
  const slideAnim = new Animated.Value(50)

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible])

  const generateAISuggestions = async () => {
    setAiGenerating(true)
    try {
      const apiKey = process.env.GEMINI_API_KEY || "AIzaSyBOx6RTLImCCg4lGTVu0xF0oCqu-K-CJ0M"
      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`

      // Préparer le contexte utilisateur
      const userContext = {
        profile: {
          nom: profile?.nom || "",
          prenom: profile?.prenom || "",
          email: profile?.email || "",
          matricule: profile?.matricule || "",
        },
        competences: skills.map((skill) => ({
          nom: skill.nom,
          niveau: skill.niveau,
          description: skill.description,
        })),
        projets: projects.map((project) => ({
          nom: project.name,
          description: project.description,
          langages: project.languages,
        })),
        langages_programmation: programmingLanguages,
        langues_parlees: spokenLanguages.map((lang) => ({
          langue: lang.langue,
          niveau: lang.niveau,
        })),
        loisirs: hobbies.map((hobby) => hobby.nom),
      }

      const prompt = `
Tu es un expert en rédaction de CV et en ressources humaines. Analyse le profil suivant et génère des suggestions d'amélioration pour un CV professionnel.

PROFIL UTILISATEUR:
${JSON.stringify(userContext, null, 2)}

DEMANDE SPÉCIFIQUE: ${aiPrompt || "Optimise mon CV pour le rendre plus attractif"}

Génère une réponse JSON avec cette structure exacte:
{
  "titre_professionnel_suggere": "Un titre professionnel accrocheur basé sur le profil",
  "resume_professionnel": "Un résumé professionnel de 2-3 phrases qui met en valeur les points forts",
  "competences_optimisees": [
    {
      "nom": "nom de la compétence",
      "description_amelioree": "description optimisée et plus vendeuse",
      "mots_cles": ["mot-clé1", "mot-clé2"]
    }
  ],
  "projets_optimises": [
    {
      "nom": "nom du projet",
      "description_amelioree": "description plus impactante avec résultats quantifiés",
      "points_forts": ["point fort 1", "point fort 2"]
    }
  ],
  "template_recommande": "modern|tech|creative|executive|minimal|classic",
  "conseils_amelioration": [
    "conseil 1",
    "conseil 2",
    "conseil 3"
  ],
  "mots_cles_secteur": ["mot-clé industrie 1", "mot-clé industrie 2"],
  "score_attractivite": 85
}

Assure-toi que la réponse soit un JSON valide et complet.
`

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 2000,
            temperature: 0.7,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      const data = await response.json()
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

      // Extraire le JSON de la réponse
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0])
        setAiSuggestions(suggestions)

        // Recommander automatiquement le template suggéré
        if (suggestions.template_recommande) {
          setSelectedTemplate(suggestions.template_recommande)
        }

        setCurrentStep("ai")
        Alert.alert("✨ IA Activée", "Vos suggestions personnalisées sont prêtes !")
      } else {
        throw new Error("Format de réponse invalide")
      }
    } catch (error) {
      console.error("Erreur IA:", error)
      Alert.alert("Erreur IA", "Impossible de générer les suggestions. Utilisation du mode standard.")
    } finally {
      setAiGenerating(false)
    }
  }

  const generateCVWithAI = async (templateStyle: string) => {
    setGenerating(true)
    try {
      let htmlContent = ""

      // Utiliser les suggestions IA si disponibles
      const optimizedData = aiSuggestions
        ? {
            ...profile,
            titre_professionnel: aiSuggestions.titre_professionnel_suggere,
            resume_professionnel: aiSuggestions.resume_professionnel,
            competences_optimisees: aiSuggestions.competences_optimisees,
            projets_optimises: aiSuggestions.projets_optimises,
            mots_cles: aiSuggestions.mots_cles_secteur,
          }
        : null

      switch (templateStyle) {
        case "modern":
          htmlContent = generateModernTemplate(optimizedData)
          break
        case "tech":
          htmlContent = generateTechTemplate(optimizedData)
          break
        case "creative":
          htmlContent = generateCreativeTemplate(optimizedData)
          break
        case "executive":
          htmlContent = generateExecutiveTemplate(optimizedData)
          break
        case "minimal":
          htmlContent = generateMinimalTemplate(optimizedData)
          break
        case "classic":
          htmlContent = generateClassicTemplate(optimizedData)
          break
        default:
          htmlContent = generateModernTemplate(optimizedData)
      }

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        width: 612,
        height: 792,
        margins: {
          left: 40,
          top: 40,
          right: 40,
          bottom: 40,
        },
      })

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `CV ${profile?.prenom} ${profile?.nom} - ${templateStyle}${aiSuggestions ? " (IA Optimisé)" : ""}`,
      })

      Alert.alert("🎉 Succès", `CV ${aiSuggestions ? "optimisé par IA" : ""} généré et partagé avec succès !`)
      onClose()
    } catch (error) {
      console.error("Erreur génération CV:", error)
      Alert.alert("Erreur", "Impossible de générer le CV. Veuillez réessayer.")
    } finally {
      setGenerating(false)
    }
  }

  // Template amélioré avec IA
  const generateTechTemplate = (aiData?: any) => {
    const titlePro = aiData?.titre_professionnel || `Développeur ${programmingLanguages[0] || "Full Stack"}`
    const resume = aiData?.resume_professionnel || "Passionné par le développement et l'innovation technologique"

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>CV Tech - ${profile?.prenom} ${profile?.nom}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #1a202c; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .container { 
          max-width: 900px; 
          margin: 0 auto; 
          background: white;
          box-shadow: 0 20px 60px rgba(0,0,0,0.1);
          border-radius: 20px;
          overflow: hidden;
        }
        .header { 
          background: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%);
          color: white; 
          padding: 60px 40px; 
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: pulse 4s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.1); opacity: 0.2; }
        }
        .name { 
          font-size: 42px; 
          font-weight: 800; 
          margin-bottom: 10px; 
          position: relative; 
          z-index: 1;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .title-pro { 
          font-size: 20px; 
          font-weight: 600; 
          margin-bottom: 15px; 
          opacity: 0.95;
          position: relative; 
          z-index: 1;
        }
        .resume-pro {
          font-size: 16px;
          opacity: 0.9;
          margin-bottom: 20px;
          position: relative; 
          z-index: 1;
          font-style: italic;
        }
        .contact { 
          font-size: 16px; 
          margin: 8px 0; 
          position: relative; 
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .contact::before {
          content: '▶';
          color: rgba(255,255,255,0.7);
        }
        .main-content {
          padding: 40px;
        }
        .section { 
          margin-bottom: 40px; 
          position: relative;
        }
        .section-title { 
          font-size: 24px; 
          font-weight: 700; 
          background: linear-gradient(135deg, #00c6ff, #0072ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 25px; 
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .section-title::before {
          content: '';
          width: 4px;
          height: 30px;
          background: linear-gradient(135deg, #00c6ff, #0072ff);
          border-radius: 2px;
        }
        .item { 
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); 
          padding: 25px; 
          margin-bottom: 20px; 
          border-radius: 15px; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
          position: relative;
          overflow: hidden;
        }
        .item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(135deg, #00c6ff, #0072ff);
        }
        .item-title { 
          font-weight: 700; 
          font-size: 18px; 
          color: #1a202c; 
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .item-title::before {
          content: '⚡';
          font-size: 16px;
        }
        .item-subtitle { 
          color: #4a5568; 
          font-size: 14px; 
          margin-bottom: 12px; 
          font-weight: 500;
        }
        .item-description { 
          color: #2d3748; 
          line-height: 1.7; 
          font-size: 15px;
        }
        .skills-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); 
          gap: 15px; 
        }
        .skill-item { 
          background: linear-gradient(135deg, #00c6ff, #0072ff);
          color: white; 
          padding: 15px 12px; 
          border-radius: 12px; 
          text-align: center; 
          font-size: 14px; 
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(0, 198, 255, 0.3);
          transition: transform 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .skill-item::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
          transition: transform 0.3s ease;
        }
        .skill-item:hover {
          transform: translateY(-2px);
        }
        .project-languages { margin-top: 15px; }
        .project-lang { 
          display: inline-block; 
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white; 
          padding: 6px 12px; 
          border-radius: 20px; 
          font-size: 12px; 
          margin: 3px; 
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }
        .github-link { 
          color: #00c6ff; 
          text-decoration: none; 
          font-weight: 600; 
          margin-top: 12px; 
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: 2px solid #00c6ff;
          border-radius: 25px;
          transition: all 0.3s ease;
          font-size: 14px;
        }
        .github-link:hover {
          background: #00c6ff;
          color: white;
          transform: translateY(-1px);
        }
        .ai-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          background: linear-gradient(45deg, #ff6b6b, #ee5a24);
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
        }
        .score-section {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 20px;
          border-radius: 15px;
          text-align: center;
          margin-bottom: 30px;
        }
        .score-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        .score-value {
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 5px;
        }
        .score-subtitle {
          opacity: 0.9;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${aiData ? '<div class="ai-badge">✨ Optimisé par IA</div>' : ""}
        
        <div class="header">
          <div class="name">${profile?.prenom} ${profile?.nom}</div>
          <div class="title-pro">${titlePro}</div>
          <div class="resume-pro">${resume}</div>
          <div class="contact">${profile?.email}</div>
          <div class="contact">Matricule: ${profile?.matricule}</div>
          ${profile?.date_de_naissance ? `<div class="contact">Né(e) le ${new Date(profile.date_de_naissance).toLocaleDateString("fr-FR")}</div>` : ""}
        </div>

        <div class="main-content">
          ${
            aiData?.score_attractivite
              ? `
          <div class="score-section">
            <div class="score-title">Score d'Attractivité CV</div>
            <div class="score-value">${aiData.score_attractivite}/100</div>
            <div class="score-subtitle">Évaluation IA basée sur votre profil</div>
          </div>
          `
              : ""
          }

          ${
            programmingLanguages.length > 0
              ? `
          <div class="section">
            <div class="section-title">🚀 Stack Technique</div>
            <div class="skills-grid">
              ${programmingLanguages.map((lang) => `<div class="skill-item">${lang}</div>`).join("")}
            </div>
          </div>
          `
              : ""
          }

          ${
            projects.length > 0
              ? `
          <div class="section">
            <div class="section-title">💻 Projets Techniques</div>
            ${projects
              .map((project, index) => {
                const optimizedProject = aiData?.projets_optimises?.find((p: any) =>
                  p.nom.toLowerCase().includes(project.name.toLowerCase()),
                )
                return `
              <div class="item">
                <div class="item-title">${project.name}</div>
                <div class="item-description">
                  ${optimizedProject?.description_amelioree || project.description}
                </div>
                ${
                  optimizedProject?.points_forts
                    ? `
                <div style="margin-top: 10px;">
                  <strong>Points forts:</strong>
                  <ul style="margin-left: 20px; margin-top: 5px;">
                    ${optimizedProject.points_forts.map((point: string) => `<li>${point}</li>`).join("")}
                  </ul>
                </div>
                `
                    : ""
                }
                ${
                  project.languages.length > 0
                    ? `
                <div class="project-languages">
                  ${project.languages.map((lang: any) => `<span class="project-lang">${lang}</span>`).join("")}
                </div>
                `
                    : ""
                }
                ${project.github_url ? `<a href="${project.github_url}" class="github-link">🔗 Voir sur GitHub</a>` : ""}
              </div>
              `
              })
              .join("")}
          </div>
          `
              : ""
          }

          ${
            skills.length > 0
              ? `
          <div class="section">
            <div class="section-title">🎯 Compétences Techniques</div>
            ${skills
              .map((skill) => {
                const optimizedSkill = aiData?.competences_optimisees?.find((s: any) =>
                  s.nom.toLowerCase().includes(skill.nom.toLowerCase()),
                )
                return `
              <div class="item">
                <div class="item-title">${skill.nom}</div>
                <div class="item-subtitle">Niveau: ${skill.niveau}</div>
                <div class="item-description">
                  ${optimizedSkill?.description_amelioree || skill.description || "Compétence technique maîtrisée"}
                </div>
                ${
                  optimizedSkill?.mots_cles
                    ? `
                <div style="margin-top: 10px;">
                  <strong>Mots-clés:</strong> ${optimizedSkill.mots_cles.join(", ")}
                </div>
                `
                    : ""
                }
                ${skill.experience ? `<div class="item-subtitle">Expérience: ${skill.experience}</div>` : ""}
                ${skill.certifications ? `<div class="item-subtitle">Certifications: ${skill.certifications}</div>` : ""}
              </div>
              `
              })
              .join("")}
          </div>
          `
              : ""
          }

          ${
            spokenLanguages.length > 0
              ? `
          <div class="section">
            <div class="section-title">🌍 Langues</div>
            <div class="skills-grid">
              ${spokenLanguages
                .map(
                  (lang) => `
                <div class="skill-item">${lang.langue} - ${lang.niveau}</div>
              `,
                )
                .join("")}
            </div>
          </div>
          `
              : ""
          }

          ${
            hobbies.length > 0
              ? `
          <div class="section">
            <div class="section-title">🎨 Centres d'intérêt</div>
            <div class="item">
              <div class="item-description">${hobbies.map((hobby) => hobby.nom).join(", ")}</div>
            </div>
          </div>
          `
              : ""
          }

          ${
            aiData?.conseils_amelioration
              ? `
          <div class="section">
            <div class="section-title">💡 Conseils IA</div>
            <div class="item">
              <ul style="margin-left: 20px;">
                ${aiData.conseils_amelioration.map((conseil: string) => `<li style="margin-bottom: 8px;">${conseil}</li>`).join("")}
              </ul>
            </div>
          </div>
          `
              : ""
          }
        </div>
      </div>
    </body>
    </html>
    `
  }

  // Templates similaires pour les autres styles...
  const generateModernTemplate = (aiData?: any) => {
    // Template moderne amélioré avec IA
    return generateTechTemplate(aiData) // Réutiliser le template tech pour l'exemple
  }

  const generateCreativeTemplate = (aiData?: any) => {
    // Template créatif avec IA
    return generateTechTemplate(aiData)
  }

  const generateExecutiveTemplate = (aiData?: any) => {
    // Template executive avec IA
    return generateTechTemplate(aiData)
  }

  const generateMinimalTemplate = (aiData?: any) => {
    // Template minimal avec IA
    return generateTechTemplate(aiData)
  }

  const generateClassicTemplate = (aiData?: any) => {
    // Template classique avec IA
    return generateTechTemplate(aiData)
  }

  const renderTemplateCard = (template: CVTemplate) => (
    <TouchableOpacity
      key={template.id}
      style={[styles.templateCard, selectedTemplate === template.id && styles.templateCardSelected]}
      onPress={() => setSelectedTemplate(template.id)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={selectedTemplate === template.id ? ["#EBF4FF", "#DBEAFE"] : ["#FFFFFF", "#F8F9FA"]}
        style={styles.templateCardGradient}
      >
        <View style={styles.templatePreview}>
          <LinearGradient colors={template.color as [string, string, ...string[]]} style={styles.templatePreviewGradient}>
            <Text style={styles.templateIcon}>{template.icon}</Text>
          </LinearGradient>
        </View>

        <View style={styles.templateInfo}>
          <View style={styles.templateHeader}>
            <Text style={styles.templateName}>{template.name}</Text>
            {selectedTemplate === template.id && (
              <LinearGradient colors={["#10B981", "#34D399"]} style={styles.selectedBadge}>
                <Check size={12} color="#FFFFFF" />
              </LinearGradient>
            )}
          </View>

          <Text style={styles.templateDescription}>{template.description}</Text>
          <Text style={styles.templatePreviewText}>{template.preview}</Text>

          <View style={styles.templateFeatures}>
            {template.features.map((feature, index) => (
              <View key={index} style={styles.featureTag}>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )

  const renderAIStep = () => (
    <Animated.View
      style={[
        styles.aiStepContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.aiHeader}>
        <View style={styles.aiHeaderContent}>
          <Sparkles size={24} color="#FFFFFF" />
          <Text style={styles.aiHeaderTitle}>IA Personnalisée Activée</Text>
        </View>
        <Text style={styles.aiHeaderSubtitle}>Score d'attractivité: {aiSuggestions?.score_attractivite || 0}/100</Text>
      </LinearGradient>

      <ScrollView style={styles.aiContent} showsVerticalScrollIndicator={false}>
        {aiSuggestions?.titre_professionnel_suggere && (
          <View style={styles.aiSuggestionCard}>
            <View style={styles.aiSuggestionHeader}>
              <Star size={16} color="#F59E0B" />
              <Text style={styles.aiSuggestionTitle}>Titre Professionnel Suggéré</Text>
            </View>
            <Text style={styles.aiSuggestionText}>{aiSuggestions.titre_professionnel_suggere}</Text>
          </View>
        )}

        {aiSuggestions?.resume_professionnel && (
          <View style={styles.aiSuggestionCard}>
            <View style={styles.aiSuggestionHeader}>
              <Brain size={16} color="#8B5CF6" />
              <Text style={styles.aiSuggestionTitle}>Résumé Professionnel</Text>
            </View>
            <Text style={styles.aiSuggestionText}>{aiSuggestions.resume_professionnel}</Text>
          </View>
        )}

        {aiSuggestions?.conseils_amelioration && (
          <View style={styles.aiSuggestionCard}>
            <View style={styles.aiSuggestionHeader}>
              <Zap size={16} color="#10B981" />
              <Text style={styles.aiSuggestionTitle}>Conseils d'Amélioration</Text>
            </View>
            {aiSuggestions.conseils_amelioration.map((conseil: string, index: number) => (
              <View key={index} style={styles.conseilItem}>
                <Text style={styles.conseilText}>• {conseil}</Text>
              </View>
            ))}
          </View>
        )}

        {aiSuggestions?.mots_cles_secteur && (
          <View style={styles.aiSuggestionCard}>
            <View style={styles.aiSuggestionHeader}>
              <Cpu size={16} color="#EF4444" />
              <Text style={styles.aiSuggestionTitle}>Mots-clés Secteur</Text>
            </View>
            <View style={styles.motsClesContainer}>
              {aiSuggestions.mots_cles_secteur.map((motCle: string, index: number) => (
                <View key={index} style={styles.motCleTag}>
                  <Text style={styles.motCleText}>{motCle}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.aiStepFooter}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep("template")} activeOpacity={0.8}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.continueButton} onPress={() => setCurrentStep("preview")} activeOpacity={0.8}>
          <LinearGradient colors={["#10B981", "#34D399"]} style={styles.continueButtonGradient}>
            <Text style={styles.continueButtonText}>Continuer</Text>
            <ChevronRight size={16} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  )

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header amélioré */}
        <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.headerIcon}>
              <FileText size={20} color="#667eea" />
            </LinearGradient>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Générateur CV Pro</Text>
              <Text style={styles.headerSubtitle}>
                {currentStep === "template" && "Choisissez votre style"}
                {currentStep === "ai" && "Optimisation IA"}
                {currentStep === "preview" && "Aperçu final"}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
            <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.closeButtonGradient}>
              <X size={18} color="#667eea" />
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={["#10B981", "#34D399"]}
              style={[
                styles.progressFill,
                {
                  width: currentStep === "template" ? "33%" : currentStep === "ai" ? "66%" : "100%",
                },
              ]}
            />
          </View>
        </View>

        {/* Content basé sur l'étape */}
        {currentStep === "template" && (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Section IA */}
            <View style={styles.aiPromptSection}>
              <LinearGradient colors={["#F0F4FF", "#E0E7FF"]} style={styles.aiPromptCard}>
                <View style={styles.aiPromptHeader}>
                  <Mic size={20} color="#6366F1" />
                  <Text style={styles.aiPromptTitle}>Optimisation IA Personnalisée</Text>
                </View>
                <Text style={styles.aiPromptDescription}>Décrivez vos objectifs pour que l'IA optimise votre CV</Text>
                <TextInput
                  style={styles.aiPromptInput}
                  placeholder="Ex: Je vise un poste de développeur senior en startup..."
                  placeholderTextColor="#9CA3AF"
                  value={aiPrompt}
                  onChangeText={setAiPrompt}
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity
                  style={styles.aiPromptButton}
                  onPress={generateAISuggestions}
                  disabled={aiGenerating}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={["#6366F1", "#8B5CF6"]} style={styles.aiPromptButtonGradient}>
                    {aiGenerating ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Wand2 size={16} color="#FFFFFF" />
                    )}
                    <Text style={styles.aiPromptButtonText}>
                      {aiGenerating ? "Analyse IA..." : "Optimiser avec IA"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* Templates */}
            <View style={styles.templatesSection}>
              <Text style={styles.sectionTitle}>Templates Professionnels</Text>
              <Text style={styles.sectionDescription}>Choisissez le style qui correspond à votre profil</Text>
              {CV_TEMPLATES.map(renderTemplateCard)}
            </View>
          </ScrollView>
        )}

        {currentStep === "ai" && renderAIStep()}

        {currentStep === "preview" && (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.previewSection}>
              <LinearGradient colors={["#10B981", "#34D399"]} style={styles.previewHeader}>
                <Eye size={20} color="#FFFFFF" />
                <Text style={styles.previewTitle}>Aperçu Final</Text>
              </LinearGradient>

              <View style={styles.previewContent}>
                <Text style={styles.previewText}>
                  Votre CV {aiSuggestions ? "optimisé par IA" : ""} est prêt à être généré avec le template "
                  {CV_TEMPLATES.find((t) => t.id === selectedTemplate)?.name}".
                </Text>

                {aiSuggestions && (
                  <View style={styles.aiPreviewBadge}>
                    <Sparkles size={16} color="#6366F1" />
                    <Text style={styles.aiPreviewText}>
                      Score d'attractivité: {aiSuggestions.score_attractivite}/100
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        )}

        {/* Footer amélioré */}
        <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.footer}>
          {currentStep === "template" ? (
            <>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.8}>
                <LinearGradient colors={["#F3F4F6", "#E5E7EB"]} style={styles.cancelButtonGradient}>
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.generateButton, !selectedTemplate && styles.generateButtonDisabled]}
                onPress={() => {
                  if (aiSuggestions) {
                    setCurrentStep("ai")
                  } else {
                    generateCVWithAI(selectedTemplate)
                  }
                }}
                disabled={!selectedTemplate || generating}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={!selectedTemplate || generating ? ["#D1D5DB", "#9CA3AF"] : ["#3B82F6", "#60A5FA"]}
                  style={styles.generateButtonGradient}
                >
                  {generating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Download size={16} color="#FFFFFF" />
                  )}
                  <Text style={styles.generateButtonText}>
                    {generating ? "Génération..." : aiSuggestions ? "Voir Optimisations" : "Générer CV"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setCurrentStep("template")}
                activeOpacity={0.8}
              >
                <LinearGradient colors={["#F3F4F6", "#E5E7EB"]} style={styles.cancelButtonGradient}>
                  <Text style={styles.cancelButtonText}>← Retour</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.generateButton}
                onPress={() => generateCVWithAI(selectedTemplate)}
                disabled={generating}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={generating ? ["#D1D5DB", "#9CA3AF"] : ["#10B981", "#34D399"]}
                  style={styles.generateButtonGradient}
                >
                  {generating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Download size={16} color="#FFFFFF" />
                  )}
                  <Text style={styles.generateButtonText}>{generating ? "Génération..." : "Générer CV IA"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </LinearGradient>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.2)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  closeButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  closeButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  aiPromptSection: {
    padding: 20,
    paddingBottom: 10,
  },
  aiPromptCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#C7D2FE",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  aiPromptHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  aiPromptTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6366F1",
  },
  aiPromptDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    lineHeight: 20,
  },
  aiPromptInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: "#1F2937",
    textAlignVertical: "top",
    marginBottom: 16,
    minHeight: 80,
  },
  aiPromptButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  aiPromptButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  aiPromptButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  templatesSection: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 24,
    lineHeight: 22,
  },
  templateCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  templateCardSelected: {
    shadowColor: "#3B82F6",
    shadowOpacity: 0.2,
    transform: [{ scale: 1.02 }],
  },
  templateCardGradient: {
    flexDirection: "row",
    padding: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    borderRadius: 16,
  },
  templatePreview: {
    marginRight: 16,
  },
  templatePreviewGradient: {
    width: 60,
    height: 80,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  templateIcon: {
    fontSize: 24,
  },
  templateInfo: {
    flex: 1,
  },
  templateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  templateName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  templateDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    lineHeight: 20,
  },
  templatePreviewText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
    marginBottom: 12,
  },
  templateFeatures: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  featureTag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featureText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  aiStepContainer: {
    flex: 1,
  },
  aiHeader: {
    padding: 20,
    alignItems: "center",
  },
  aiHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  aiHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  aiHeaderSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  aiContent: {
    flex: 1,
    padding: 20,
  },
  aiSuggestionCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  aiSuggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  aiSuggestionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  aiSuggestionText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  conseilItem: {
    marginBottom: 8,
  },
  conseilText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  motsClesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  motCleTag: {
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  motCleText: {
    fontSize: 12,
    color: "#3B82F6",
    fontWeight: "500",
  },
  aiStepFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  continueButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  continueButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  previewSection: {
    padding: 20,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  previewContent: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  previewText: {
    fontSize: 16,
    color: "#4B5563",
    lineHeight: 24,
    marginBottom: 16,
  },
  aiPreviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0F4FF",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  aiPreviewText: {
    fontSize: 14,
    color: "#6366F1",
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  cancelButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  generateButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
    borderRadius: 12,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
})
