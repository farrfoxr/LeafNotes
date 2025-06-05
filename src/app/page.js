"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowUp, Paperclip, ChevronDown } from "lucide-react"
import { ChatSidebar } from "@/components/chat-sidebar"
import { SettingsModal } from "@/components/settings-modal"

function cn(...inputs) {
  // Simple className merger for this project
  return inputs.filter(Boolean).join(" ")
}

export default function ChatInterface() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState("GPT-4")
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentChatId, setCurrentChatId] = useState(null)
  const [chats, setChats] = useState([])
  const [folders, setFolders] = useState([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const models = ["GPT-4", "GPT-3.5", "Claude-3", "Gemini Pro"]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Helper function to generate chat title from user input
  const generateChatTitle = (userInput) => {
    const trimmedInput = userInput.trim()
    return trimmedInput.length > 50 ? trimmedInput.slice(0, 50) + "..." : trimmedInput
  }

  const handleSubmit = async (e, targetFolderId = null) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    const chatTitle = generateChatTitle(input.trim())

    // If this is the first message and no current chat, create a new chat
    if (!currentChatId) {
      const newChatId = Date.now().toString()
      const newChat = {
        id: newChatId,
        title: chatTitle,
        messages: [userMessage],
        createdAt: new Date(),
        folderId: targetFolderId || null,
      }
      setChats((prev) => [newChat, ...prev])
      setCurrentChatId(newChatId)
      setMessages([userMessage])
    } else {
      // Add to existing chat and update title if it's still "New Chat"
      setMessages((prev) => [...prev, userMessage])
      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id === currentChatId) {
            // Update title if it's still "New Chat" or if this is the first user message
            const shouldUpdateTitle = chat.title === "New Chat" || (chat.messages && chat.messages.length === 0)
            return {
              ...chat,
              title: shouldUpdateTitle ? chatTitle : chat.title,
              messages: [...(chat.messages || []), userMessage],
            }
          }
          return chat
        }),
      )
    }

    setInput("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(
      () => {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `I understand you're asking about "${userMessage.content}". This is a simulated response from ${selectedModel}. In a real implementation, this would connect to your chosen AI model's API.`,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiMessage])
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === currentChatId
              ? { ...chat, messages: [...(chat.messages || []), userMessage, aiMessage] }
              : chat,
          ),
        )
        setIsLoading(false)
      },
      1000 + Math.random() * 2000,
    )
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px"
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  const handleChatSelect = (chatId) => {
    const chat = chats.find((c) => c.id === chatId)
    if (chat) {
      setCurrentChatId(chatId)
      setMessages(chat.messages || [])
    }
  }

  const handleNewChat = (folderId = null) => {
    // Create a new chat with the specified folder ID
    const newChatId = Date.now().toString()
    const newChat = {
      id: newChatId,
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      folderId: folderId,
    }

    setChats((prev) => [newChat, ...prev])
    setCurrentChatId(newChatId)
    setMessages([])
    setInput("")
  }

  const handleNewFolder = () => {
    const newFolder = {
      id: Date.now().toString(),
      name: "New Folder",
      createdAt: new Date(),
    }
    setFolders((prev) => [...prev, newFolder])
  }

  const handleDeleteChat = (chatId) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId))
    if (currentChatId === chatId) {
      setCurrentChatId(null)
      setMessages([])
    }
  }

  const handleDeleteFolder = (folderId) => {
    // Move chats out of folder before deleting
    setChats((prev) => prev.map((chat) => (chat.folderId === folderId ? { ...chat, folderId: null } : chat)))
    setFolders((prev) => prev.filter((folder) => folder.id !== folderId))
  }

  const handleRenameChat = (chatId, newTitle) => {
    setChats((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, title: newTitle } : chat)))
  }

  const handleRenameFolder = (folderId, newName) => {
    setFolders((prev) => prev.map((folder) => (folder.id === folderId ? { ...folder, name: newName } : folder)))
  }

  const handleMoveChat = (chatId, targetFolderId) => {
    setChats((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, folderId: targetFolderId } : chat)))
  }

  const hasStartedChat = messages.length > 0

  // Get current chat title
  const currentChat = chats.find((chat) => chat.id === currentChatId)
  const currentChatTitle = currentChat?.title || "New Chat"

  return (
    <div className="h-screen bg-theme-bg font-monkeytype flex overflow-hidden">
      {/* Sidebar */}
      <ChatSidebar
        currentChatId={currentChatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        onNewFolder={handleNewFolder}
        chats={chats}
        folders={folders}
        onDeleteChat={handleDeleteChat}
        onDeleteFolder={handleDeleteFolder}
        onRenameChat={handleRenameChat}
        onRenameFolder={handleRenameFolder}
        onMoveChat={handleMoveChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {hasStartedChat ? (
          <>
            {/* Chat Title Header - Fixed position */}
            <div className="flex-shrink-0 py-4 px-6 bg-theme-bg">
              <h2 className="text-center text-theme-text text-lg font-normal tracking-wide">{currentChatTitle}</h2>
            </div>

            {/* Messages Container - Flexible height */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-6 py-6">
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 break-words ${
                            message.role === "user"
                              ? "bg-theme-primary text-theme-text-on-primary user-message"
                              : "bg-theme-secondary text-theme-text-on-secondary"
                          }`}
                        >
                          <p className="text-sm leading-relaxed break-words">{message.content}</p>
                          <p className="text-xs opacity-70 mt-2">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-theme-secondary text-theme-text-on-secondary rounded-2xl px-4 py-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-theme-text-on-secondary rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-theme-text-on-secondary rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-theme-text-on-secondary rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </div>

              {/* Input Section - Fixed at bottom */}
              <div className="flex-shrink-0 p-4 bg-theme-bg">
                <div className="max-w-3xl mx-auto">
                  <form onSubmit={handleSubmit} className="relative">
                    <div className="bg-theme-primary rounded-2xl p-4 shadow-lg">
                      <div className="flex items-center gap-3">
                        {/* Attachment Button */}
                        <button
                          type="button"
                          className="text-theme-text-on-primary hover:text-theme-text-on-primary/80 transition-colors p-1"
                        >
                          <Paperclip className="w-5 h-5" />
                        </button>

                        {/* Input Field */}
                        <div className="flex-1 relative flex items-center">
                          <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            className="w-full bg-transparent text-theme-text-on-primary placeholder-theme-text-on-primary/70 resize-none outline-none text-sm leading-relaxed min-h-[24px] max-h-[120px] flex items-center"
                            style={{
                              paddingTop: "0",
                              paddingBottom: "0",
                              lineHeight: "24px",
                              display: "flex",
                              alignItems: "center",
                            }}
                            rows={1}
                          />
                        </div>

                        {/* Send Button with Arrow Up */}
                        <button
                          type="submit"
                          disabled={!input.trim() || isLoading}
                          className="bg-theme-secondary text-theme-text-on-secondary p-2 rounded-lg hover:bg-theme-secondary/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                        >
                          <ArrowUp className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Initial State - Centered content when no messages */
          <div className="flex-1 flex flex-col justify-center">
            <div className="max-w-4xl mx-auto px-6 w-full">
              {/* Header */}
              <div className="text-center mb-16">
                <h1 className="text-5xl md:text-6xl font-light text-theme-text tracking-wide">Leaf Notes</h1>
              </div>

              {/* Input Section */}
              <div className="relative max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="relative">
                  <div className="bg-theme-primary rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      {/* Model Selector */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowModelDropdown(!showModelDropdown)}
                          className="flex items-center gap-2 bg-theme-secondary text-theme-text-on-secondary px-3 py-2 rounded-lg text-sm hover:bg-theme-secondary/80 transition-all duration-200"
                        >
                          <span>{selectedModel}</span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${showModelDropdown ? "rotate-180" : ""}`}
                          />
                        </button>

                        {/* Animated Dropdown - Updated with theme-aware colors */}
                        <div
                          className={`absolute bottom-full mb-2 left-0 bg-[hsl(var(--theme-dropdown-bg))] rounded-lg shadow-lg border border-theme-border min-w-[120px] z-10 transition-all duration-200 origin-bottom ${
                            showModelDropdown
                              ? "opacity-100 scale-100 translate-y-0"
                              : "opacity-0 scale-95 translate-y-2 pointer-events-none"
                          }`}
                        >
                          {models.map((model, index) => (
                            <button
                              key={model}
                              type="button"
                              onClick={() => {
                                setSelectedModel(model)
                                setShowModelDropdown(false)
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-[hsl(var(--theme-dropdown-text))] hover:bg-[hsl(var(--theme-dropdown-hover))] transition-colors first:rounded-t-lg last:rounded-b-lg"
                              style={{
                                transitionDelay: showModelDropdown ? `${index * 50}ms` : "0ms",
                              }}
                            >
                              {model}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Attachment Button */}
                      <button
                        type="button"
                        className="text-theme-text-on-primary hover:text-theme-text-on-primary/80 transition-colors p-1"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>

                      {/* Input Field */}
                      <div className="flex-1 relative flex items-center">
                        <textarea
                          ref={textareaRef}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Ask anything..."
                          className="w-full bg-transparent text-theme-text-on-primary placeholder-theme-text-on-primary/70 resize-none outline-none text-sm leading-relaxed min-h-[24px] max-h-[120px] flex items-center"
                          style={{
                            paddingTop: "0",
                            paddingBottom: "0",
                            lineHeight: "24px",
                            display: "flex",
                            alignItems: "center",
                          }}
                          rows={1}
                        />
                      </div>

                      {/* Send Button with Arrow Up */}
                      <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="bg-theme-secondary text-theme-text-on-secondary p-2 rounded-lg hover:bg-theme-secondary/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                      >
                        <ArrowUp className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </form>

                {/* Helper Text */}
                <p className="text-center text-theme-text opacity-60 mt-6 text-sm">
                  Start typing to begin your conversation...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
