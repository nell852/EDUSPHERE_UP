"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface AppContextType {
  language: string
  setLanguage: (lang: string) => void
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
  notifications: boolean
  setNotifications: (notif: boolean) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState("Français")
  const [darkMode, setDarkModeState] = useState(false)
  const [notifications, setNotificationsState] = useState(true)

  const setLanguage = (lang: string) => {
    setLanguageState(lang)
    // Ici vous pouvez ajouter la logique de sauvegarde
    console.log("Langue changée:", lang)
  }

  const setDarkMode = (dark: boolean) => {
    setDarkModeState(dark)
    // Ici vous pouvez ajouter la logique de sauvegarde
    console.log("Mode sombre:", dark)
  }

  const setNotifications = (notif: boolean) => {
    setNotificationsState(notif)
    // Ici vous pouvez ajouter la logique de sauvegarde
    console.log("Notifications:", notif)
  }

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        darkMode,
        setDarkMode,
        notifications,
        setNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
