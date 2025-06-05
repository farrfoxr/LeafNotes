"use client"

import { useState, useEffect } from "react"
import { X, Key, Palette, Check } from "lucide-react"

const themes = [
  {
    name: "Leaf",
    class: "",
    label: "Leaf Theme",
    description: "Natural green theme",
    colors: {
      primary: "#6b886b",
      secondary: "#cbd0bf",
      bg: "#e4e4d4",
    },
  },
  {
    name: "Ocean",
    class: "theme-ocean",
    label: "Ocean Theme",
    description: "Cool blue theme",
    colors: {
      primary: "#4a90a4",
      secondary: "#a4c3cc",
      bg: "#d4e4e4",
    },
  },
  {
    name: "Cherry Witch",
    class: "theme-cherry-witch",
    label: "Cherry Witch Theme",
    description: "Soft pink and sage theme",
    colors: {
      primary: "#56786a",
      secondary: "#ddb4a7",
      bg: "#f3dbda",
    },
  },
  {
    name: "Choco Strawberry",
    class: "theme-choco-strawberry",
    label: "Choco Strawberry Theme",
    description: "Dark chocolate with cream",
    colors: {
      primary: "#f0d3c9",
      secondary: "#343231",
      bg: "#262727",
    },
  },
  {
    name: "Lavender",
    class: "theme-lavender",
    label: "Lavender Theme",
    description: "Dreamy purple theme",
    colors: {
      primary: "#2f2a41",
      secondary: "#a19bb9",
      bg: "#ada6c2",
    },
  },
  {
    name: "Paper",
    class: "theme-paper",
    label: "Paper Theme",
    description: "Clean paper-like theme",
    colors: {
      primary: "#444444",
      secondary: "#dddddd",
      bg: "#eeeeee",
    },
  },
  {
    name: "Nord",
    class: "theme-nord",
    label: "Nord Theme",
    description: "Arctic inspired theme",
    colors: {
      primary: "#6a7791",
      secondary: "#d8dee9",
      bg: "#242933",
    },
  },
  {
    name: "Nord Light",
    class: "theme-nord-light",
    label: "Nord Light Theme",
    description: "Light arctic theme",
    colors: {
      primary: "#929aaa",
      secondary: "#2e3440",
      bg: "#eceff4",
    },
  },
  {
    name: "Dark",
    class: "dark",
    label: "Dark Theme",
    description: "Dark mode theme",
    colors: {
      primary: "#6b886b",
      secondary: "#2a2a2a",
      bg: "#1a1a1a",
    },
  },
]

function cn(...inputs) {
  return inputs.filter(Boolean).join(" ")
}

export function SettingsModal({ isOpen, onClose }) {
  const [activeSection, setActiveSection] = useState("theme")
  const [currentTheme, setCurrentTheme] = useState("")
  const [isClosing, setIsClosing] = useState(false)

  const handleThemeChange = (themeClass) => {
    // Remove all theme classes
    document.documentElement.classList.remove(
      "theme-ocean",
      "theme-cherry-witch",
      "theme-choco-strawberry",
      "theme-lavender",
      "theme-paper",
      "theme-nord",
      "theme-nord-light",
      "dark",
    )

    // Add new theme class if not default
    if (themeClass) {
      document.documentElement.classList.add(themeClass)
    }

    setCurrentTheme(themeClass)
  }

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 150) // Match the animation duration
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      handleClose()
    }
  }

  // Add event listener for escape key
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  if (!isOpen && !isClosing) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        isClosing ? "backdrop-exit" : "backdrop-enter",
      )}
      onClick={handleBackdropClick}
      tabIndex={-1}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={cn(
          "relative bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[600px] mx-4 overflow-hidden",
          isClosing ? "modal-exit" : "modal-enter",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex h-[calc(600px-73px)]">
          {/* Settings Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveSection("api")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                  activeSection === "api"
                    ? "bg-theme-primary text-theme-text-on-primary"
                    : "text-gray-700 hover:bg-gray-100",
                )}
              >
                <Key className="w-5 h-5" />
                <span className="font-medium">API Key</span>
              </button>

              <button
                onClick={() => setActiveSection("theme")}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                  activeSection === "theme"
                    ? "bg-theme-primary text-theme-text-on-primary"
                    : "text-gray-700 hover:bg-gray-100",
                )}
              >
                <Palette className="w-5 h-5" />
                <span className="font-medium">Color Theme</span>
              </button>
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeSection === "api" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">API Key</h3>
                <p className="text-gray-600 mb-6">Configure your AI model API keys here.</p>

                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">API key configuration coming soon...</p>
                </div>
              </div>
            )}

            {activeSection === "theme" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Color Theme</h3>
                <p className="text-gray-600 mb-6">Choose a color theme for your interface.</p>

                <div className="grid grid-cols-1 gap-4">
                  {themes.map((theme) => (
                    <div
                      key={theme.name}
                      className={cn(
                        "relative border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md",
                        currentTheme === theme.class
                          ? "border-theme-primary bg-theme-primary/5"
                          : "border-gray-200 hover:border-gray-300",
                      )}
                      onClick={() => handleThemeChange(theme.class)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Theme Preview */}
                          <div className="flex gap-1">
                            <div
                              className="w-6 h-6 rounded-full border border-gray-200"
                              style={{ backgroundColor: theme.colors.primary }}
                            />
                            <div
                              className="w-6 h-6 rounded-full border border-gray-200"
                              style={{ backgroundColor: theme.colors.secondary }}
                            />
                            <div
                              className="w-6 h-6 rounded-full border border-gray-200"
                              style={{ backgroundColor: theme.colors.bg }}
                            />
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900">{theme.label}</h4>
                            <p className="text-sm text-gray-500">{theme.description}</p>
                          </div>
                        </div>

                        {/* Check mark for selected theme */}
                        {currentTheme === theme.class && (
                          <div className="w-6 h-6 bg-theme-primary rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Theme Preview Section */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Preview</h4>
                  <div className="bg-theme-bg rounded-lg p-4 border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-theme-primary rounded-lg"></div>
                      <div>
                        <div className="text-theme-text font-medium">Sample Chat</div>
                        <div className="text-theme-text/70 text-sm">This is how your chat will look</div>
                      </div>
                    </div>
                    <div className="bg-theme-secondary rounded-lg p-3 mb-2">
                      <div className="text-theme-text-on-secondary text-sm">AI response message</div>
                    </div>
                    <div className="bg-theme-primary rounded-lg p-3 ml-8">
                      <div className="text-theme-text-on-primary text-sm">Your message</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
