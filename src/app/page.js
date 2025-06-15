"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowUp, Paperclip, ChevronDown, Edit3, Check, X, Undo, Menu } from "lucide-react"
import { ChatSidebar } from "@/components/chat-sidebar"
import { SettingsModal } from "@/components/settings-modal"
import { MessageRenderer } from "@/components/message-renderer"

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
  const [sidebarOpen, setSidebarOpen] = useState(false) // Start closed on mobile
  const [currentChatId, setCurrentChatId] = useState(null)
  const [chats, setChats] = useState([])
  const [folders, setFolders] = useState([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editingText, setEditingText] = useState("")
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const editTextareaRef = useRef(null)

  // Add refs to track pending operations and current chat
  const pendingTimeoutsRef = useRef(new Set())
  const currentChatIdRef = useRef(currentChatId)

  const models = ["GPT-4", "GPT-3.5", "Claude-3", "Gemini Pro"]

  //check mobile hydration fouc fix
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
  setIsMounted(true);
  }, []);

  // Check if we're on mobile
  const [isMobile, setIsMobile] = useState(false)

  // useEffect(() => {
  //   if (!isMounted) return;

  //   const checkMobile = () => {
  //     setIsMobile(window.innerWidth < 768)
  //     // Auto-close sidebar on mobile, auto-open on desktop
  //     if (window.innerWidth < 768) {
  //       setSidebarOpen(false)
  //     } else {
  //       setSidebarOpen(true)
  //     }
  //   }

  //   checkMobile()
  //   window.addEventListener("resize", checkMobile)
  //   return () => window.removeEventListener("resize", checkMobile)
  // }, [isMounted])

  useEffect(() => {
  if (!isMounted) return;
  
  let timeoutId;
  const debouncedResize = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const isMobileDevice = window.innerWidth < 768;
      setIsMobile(isMobileDevice);
      
      if (isMobileDevice) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    }, 100);
  };

  debouncedResize();
  window.addEventListener("resize", debouncedResize);
  return () => {
    window.removeEventListener("resize", debouncedResize);
    clearTimeout(timeoutId);
  };
  }, [isMounted]);

    // Also add this useEffect to close the dropdown when clicking outside (add this after your existing useEffects):
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showModelDropdown && !event.target.closest('[data-model-dropdown]')) {
        setShowModelDropdown(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showModelDropdown])


  // Update the ref whenever currentChatId changes
  useEffect(() => {
    currentChatIdRef.current = currentChatId
  }, [currentChatId])

  // Cleanup function to clear pending timeouts
  const clearPendingTimeouts = () => {
    pendingTimeoutsRef.current.forEach((timeoutId) => {
      clearTimeout(timeoutId)
    })
    pendingTimeoutsRef.current.clear()
  }

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

  // Mock function to simulate formatted AI responses
  const generateFormattedResponse = (userInput, model) => {
    const responses = [
      `# Understanding "${userInput}"

This is a **formatted response** from ${model}. Here's what I can help you with:

## Key Points:
- *Detailed analysis* of your question
- **Comprehensive answers** with proper formatting
- Code examples when needed
- \`inline code\` for technical terms

### Features:
1. **Bold text** for emphasis
2. *Italic text* for subtle emphasis
3. \`code snippets\` for technical content
4. Lists for better organization

---

> This is a blockquote example to show how quoted text appears in responses.

\`\`\`javascript
// Here's a code block example
function example() {
  return "This is how code appears";
}
\`\`\`

Would you like me to elaborate on any of these points?`,

      `**Analysis Complete** ✓

Your query about "${userInput}" has been processed by ${model}. Here's my response:

## Summary
- Successfully understood your request
- Generated *contextual response*
- Applied **proper formatting**

### Technical Details:
\`\`\`
Response Format: Markdown
Processing Time: ~2s
Model: ${model}
\`\`\`

> **Note**: This is a simulated response demonstrating formatted text rendering.

**Next Steps:**
1. Review the information provided
2. Ask follow-up questions if needed
3. Request specific examples or clarifications

---

*Is there anything specific you'd like me to focus on?*`,

      `# ${model} Response

Hello! I understand you're asking about **"${userInput}"**.

## Here's how I can help:

### Formatting Features:
- **Bold text** works perfectly
- *Italics* are rendered correctly  
- \`inline code\` displays properly
- Lists maintain proper structure

### Code Examples:
\`\`\`python
def process_response(input_text):
    """Process user input and generate formatted response"""
    return {
        'status': 'success',
        'formatted': True,
        'model': '${model}'
    }
\`\`\`

---

> **Pro Tip**: This formatting system supports standard Markdown syntax including headers, lists, code blocks, and more!

**Available Actions:**
1. Copy this response using the copy button
2. Retry to get a different response  
3. Continue the conversation

*Let me know if you need any clarification!*`,
    ]

    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleSubmit = async (e, targetFolderId = null) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
      editHistory: [input.trim()], // Initialize edit history
    }

    const chatTitle = generateChatTitle(input.trim())
    const userInputValue = input.trim()
    setInput("")
    setIsLoading(true)

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

      // Update the ref immediately
      currentChatIdRef.current = newChatId
    } else {
      // Add to existing chat
      setMessages((prev) => [...prev, userMessage])
      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id === currentChatId) {
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

    // Simulate AI response with proper cleanup and stale closure protection
    const timeoutId = setTimeout(
      () => {
        // Remove this timeout from pending set
        pendingTimeoutsRef.current.delete(timeoutId)

        // Check if we're still on the same chat (prevent stale closure issues)
        const activeChatId = currentChatIdRef.current
        if (!activeChatId) {
          setIsLoading(false)
          return
        }

        const aiMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: generateFormattedResponse(userInputValue, selectedModel),
          timestamp: new Date(),
        }

        // Only update if we're still on the same chat
        if (activeChatId === currentChatIdRef.current) {
          setMessages((prev) => [...prev, aiMessage])
          setChats((prev) =>
            prev.map((chat) =>
              chat.id === activeChatId
                ? { ...chat, messages: [...(chat.messages || []), aiMessage] } // Only add AI message, user message already added
                : chat,
            ),
          )
        }
        setIsLoading(false)
      },
      1000 + Math.random() * 2000,
    )

    // Track the timeout
    pendingTimeoutsRef.current.add(timeoutId)
  }

  const handleRetry = (messageId) => {
    // Find the message to retry
    const messageIndex = messages.findIndex((msg) => msg.id === messageId)
    if (messageIndex === -1) return

    const messageToRetry = messages[messageIndex]
    if (messageToRetry.role !== "assistant") return

    // Find the user message that triggered this response
    const userMessage = messageIndex > 0 ? messages[messageIndex - 1] : null
    if (!userMessage || userMessage.role !== "user") return

    // Remove the AI message and regenerate
    const newMessages = messages.slice(0, messageIndex)
    setMessages(newMessages)
    setIsLoading(true)

    // Update chat history immediately
    setChats((prev) => prev.map((chat) => (chat.id === currentChatId ? { ...chat, messages: newMessages } : chat)))

    // Generate new response with proper cleanup
    const timeoutId = setTimeout(
      () => {
        pendingTimeoutsRef.current.delete(timeoutId)

        const activeChatId = currentChatIdRef.current
        if (!activeChatId || activeChatId !== currentChatId) {
          setIsLoading(false)
          return
        }

        const newAiMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: generateFormattedResponse(userMessage.content, selectedModel),
          timestamp: new Date(),
        }

        if (activeChatId === currentChatIdRef.current) {
          setMessages((prev) => [...prev, newAiMessage])
          setChats((prev) =>
            prev.map((chat) =>
              chat.id === activeChatId ? { ...chat, messages: [...newMessages, newAiMessage] } : chat,
            ),
          )
        }
        setIsLoading(false)
      },
      1000 + Math.random() * 1500,
    )

    pendingTimeoutsRef.current.add(timeoutId)
  }

  // Edit functionality
  const handleEditStart = (messageId, currentContent) => {
    setEditingMessageId(messageId)
    setEditingText(currentContent)
    // Focus the textarea after state update
    setTimeout(() => {
      if (editTextareaRef.current) {
        editTextareaRef.current.focus()
        editTextareaRef.current.setSelectionRange(currentContent.length, currentContent.length)
      }
    }, 0)
  }

  const handleEditCancel = () => {
    setEditingMessageId(null)
    setEditingText("")
  }

  const handleEditSave = async () => {
    if (!editingText.trim() || !editingMessageId) return

    const messageIndex = messages.findIndex((msg) => msg.id === editingMessageId)
    if (messageIndex === -1) return

    const originalMessage = messages[messageIndex]

    // Update the message with new content and add to edit history
    const updatedMessage = {
      ...originalMessage,
      content: editingText.trim(),
      editHistory: [...(originalMessage.editHistory || [originalMessage.content]), editingText.trim()],
      lastEdited: new Date(),
    }

    // Remove all messages after the edited message (including AI responses)
    const newMessages = [...messages.slice(0, messageIndex), updatedMessage]
    setMessages(newMessages)

    // Update chat history immediately
    setChats((prev) => prev.map((chat) => (chat.id === currentChatId ? { ...chat, messages: newMessages } : chat)))

    // Clear editing state
    setEditingMessageId(null)
    setEditingText("")
    setIsLoading(true)

    // Generate new AI response for the edited message with proper cleanup
    const timeoutId = setTimeout(
      () => {
        pendingTimeoutsRef.current.delete(timeoutId)

        const activeChatId = currentChatIdRef.current
        if (!activeChatId || activeChatId !== currentChatId) {
          setIsLoading(false)
          return
        }

        const aiMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: generateFormattedResponse(editingText.trim(), selectedModel),
          timestamp: new Date(),
        }

        if (activeChatId === currentChatIdRef.current) {
          setMessages((prev) => [...prev, aiMessage])
          setChats((prev) =>
            prev.map((chat) => (chat.id === activeChatId ? { ...chat, messages: [...newMessages, aiMessage] } : chat)),
          )
        }
        setIsLoading(false)
      },
      1000 + Math.random() * 1500,
    )

    pendingTimeoutsRef.current.add(timeoutId)
  }

  const handleEditUndo = (messageId) => {
    const messageIndex = messages.findIndex((msg) => msg.id === messageId)
    if (messageIndex === -1) return

    const message = messages[messageIndex]
    const editHistory = message.editHistory || []

    if (editHistory.length <= 1) return // No previous version to revert to

    // Get the previous version (second to last in history)
    const previousContent = editHistory[editHistory.length - 2]

    // Update message with previous content and remove last entry from history
    const updatedMessage = {
      ...message,
      content: previousContent,
      editHistory: editHistory.slice(0, -1),
      lastEdited: new Date(),
    }

    // Remove all messages after the edited message
    const newMessages = [...messages.slice(0, messageIndex), updatedMessage]
    setMessages(newMessages)

    // Update chat history immediately
    setChats((prev) => prev.map((chat) => (chat.id === currentChatId ? { ...chat, messages: newMessages } : chat)))

    setIsLoading(true)

    // Generate new AI response with proper cleanup
    const timeoutId = setTimeout(
      () => {
        pendingTimeoutsRef.current.delete(timeoutId)

        const activeChatId = currentChatIdRef.current
        if (!activeChatId || activeChatId !== currentChatId) {
          setIsLoading(false)
          return
        }

        const aiMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: generateFormattedResponse(previousContent, selectedModel),
          timestamp: new Date(),
        }

        if (activeChatId === currentChatIdRef.current) {
          setMessages((prev) => [...prev, aiMessage])
          setChats((prev) =>
            prev.map((chat) => (chat.id === activeChatId ? { ...chat, messages: [...newMessages, aiMessage] } : chat)),
          )
        }
        setIsLoading(false)
      },
      1000 + Math.random() * 1500,
    )

    pendingTimeoutsRef.current.add(timeoutId)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleEditKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleEditSave()
    } else if (e.key === "Escape") {
      handleEditCancel()
    }
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px"
    }
  }

  const adjustEditTextareaHeight = () => {
    const textarea = editTextareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      const newHeight = Math.min(textarea.scrollHeight, 200)
      textarea.style.height = `${newHeight}px`

      // If content is very long, allow scrolling but only internally
      if (newHeight >= 200) {
        textarea.style.overflowY = "auto"
      } else {
        textarea.style.overflowY = "hidden"
      }
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  useEffect(() => {
    adjustEditTextareaHeight()
  }, [editingText])

  const handleChatSelect = (chatId) => {
    // Clear any pending operations when switching chats
    clearPendingTimeouts()
    setIsLoading(false)

    const chat = chats.find((c) => c.id === chatId)
    if (chat) {
      setCurrentChatId(chatId)
      // Create a deep copy to avoid reference issues
      setMessages([...(chat.messages || [])])
    }

    // Close sidebar on mobile after selecting chat
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleNewChat = (folderId = null) => {
    // Clear any pending operations when creating new chat
    clearPendingTimeouts()
    setIsLoading(false)

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

    // Close sidebar on mobile after creating new chat
    if (isMobile) {
      setSidebarOpen(false)
    }
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
      clearPendingTimeouts()
      setIsLoading(false)
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPendingTimeouts()
    }
  }, [])

  const hasStartedChat = messages.length > 0

  // Get current chat title
  const currentChat = chats.find((chat) => chat.id === currentChatId)
  const currentChatTitle = currentChat?.title || "New Chat"

  //mobile view fix
  useEffect(() => {
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', setVH);

  return () => {
    window.removeEventListener('resize', setVH);
    window.removeEventListener('orientationchange', setVH);
  };
}, []);

  return (
    <div className="h-screen bg-theme-bg font-monkeytype flex overflow-hidden">
      {isMobile && !sidebarOpen && (
        <div className="fixed top-0 left-0 right-0 z-20 bg-theme-bg border-b border-theme-border/60 p-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-theme-hover/50 text-theme-text"
          >
            <Menu className="w-5 h-5" />
          </button>
          
        {/* Mobile Model Selector - Only show before chat starts */}
        {!hasStartedChat && (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="relative" data-model-dropdown>
              <button
                type="button"
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center gap-2 bg-theme-primary text-theme-text-on-primary px-3 py-1.5 rounded-lg text-sm hover:bg-theme-primary/80 transition-all duration-200 border border-theme-border/20"
              >
                <span className="font-medium">{selectedModel}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${showModelDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {/* Mobile Model Dropdown */}
              <div
                className={`absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-[hsl(var(--theme-dropdown-bg))] rounded-lg shadow-lg border border-theme-border min-w-[120px] z-30 transition-all duration-200 origin-top ${
                  showModelDropdown
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
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
                    className={`w-full text-left px-3 py-2.5 text-sm text-[hsl(var(--theme-dropdown-text))] hover:bg-[hsl(var(--theme-dropdown-hover))] transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      selectedModel === model ? 'bg-[hsl(var(--theme-dropdown-hover))] font-medium' : ''
                    }`}
                    style={{
                      transitionDelay: showModelDropdown ? `${index * 50}ms` : "0ms",
                    }}
                  >
                    {model}
                    {selectedModel === model && (
                      <span className="ml-2 text-theme-primary">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Title - Show when chat has started */}
        {hasStartedChat && (
          <div className="flex-1 flex items-center justify-center px-4">
            <h2 className="text-theme-text text-base font-normal tracking-wide truncate">
              {currentChatTitle}
            </h2>
          </div>
        )}

          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-lg hover:bg-theme-hover/50 text-theme-text"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      )}

      {/* Sidebar Overlay for Mobile */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

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
        isMobile={isMobile}
      />

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0",
          isMobile && "mt-14", // Add top margin for mobile navbar
        )}
      >
        {hasStartedChat ? (
          <>
            {/* Chat Title Header - Only show on desktop */}
            {!isMobile && (
              <div className="flex-shrink-0 py-4 px-6 bg-theme-bg">
                <h2 className="text-center text-theme-text text-lg font-normal tracking-wide">{currentChatTitle}</h2>
              </div>
            )}

            {/* Messages Container - Flexible height */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
                  <div className="space-y-6 sm:space-y-8">
                    {messages.map((message) => (
                      <div key={message.id} className="w-full">
                        {message.role === "user" ? (
                          /* User Message - With edit functionality */
                          <div className="flex justify-end">
                            <div className="max-w-[85%] sm:max-w-[80%] w-auto group relative">
                              {editingMessageId === message.id ? (
                                /* Editing Mode */
                                <div className="rounded-2xl px-3 sm:px-4 py-3 bg-theme-primary text-theme-text-on-primary w-full">
                                  <textarea
                                    ref={editTextareaRef}
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    onKeyDown={handleEditKeyDown}
                                    className="w-full bg-transparent text-theme-text-on-primary resize-none outline-none text-sm leading-relaxed min-h-[24px] overflow-hidden break-words overflow-wrap-anywhere"
                                    placeholder="Edit your message..."
                                    style={{
                                      scrollbarWidth: "none",
                                      msOverflowStyle: "none",
                                    }}
                                  />
                                  <div className="flex items-center justify-between mt-3">
                                    <p className="text-xs opacity-70">Press Enter to save, Esc to cancel</p>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={handleEditCancel}
                                        className="p-1 rounded hover:bg-theme-text-on-primary/10 transition-colors"
                                        title="Cancel"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={handleEditSave}
                                        className="p-1 rounded hover:bg-theme-text-on-primary/10 transition-colors"
                                        title="Save"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                /* Display Mode */
                                <>
                                  <div className="rounded-2xl px-3 sm:px-4 py-3 bg-theme-primary text-theme-text-on-primary user-message break-words">
                                    <p className="text-sm leading-relaxed break-words overflow-wrap-anywhere">
                                      {message.content}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                      <p className="text-xs opacity-70">
                                        {message.timestamp.toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                        {message.lastEdited && <span className="ml-2">(edited)</span>}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Edit Controls */}
                                  <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <button
                                      onClick={() => handleEditStart(message.id, message.content)}
                                      className="p-1.5 rounded-lg hover:bg-theme-text/10 transition-colors text-theme-text/60 hover:text-theme-text"
                                      title="Edit message"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    {message.editHistory && message.editHistory.length > 1 && (
                                      <button
                                        onClick={() => handleEditUndo(message.id)}
                                        className="p-1.5 rounded-lg hover:bg-theme-text/10 transition-colors text-theme-text/60 hover:text-theme-text"
                                        title="Undo last edit"
                                      >
                                        <Undo className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Assistant Message */
                          <div className="flex items-start gap-3 sm:gap-4">
                            {/* AI Avatar */}
                            <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-theme-secondary flex items-center justify-center">
                              <span className="text-xs font-medium text-theme-text-on-secondary">AI</span>
                            </div>

                            {/* Message Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                <span className="text-sm font-medium text-theme-text">{selectedModel}</span>
                                <span className="text-xs text-theme-text opacity-60">
                                  {message.timestamp.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              {/* Formatted Message Content */}
                              <div className="text-sm leading-relaxed break-words overflow-wrap-anywhere">
                                <MessageRenderer
                                  content={message.content}
                                  onRetry={handleRetry}
                                  messageId={message.id}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Loading Animation */}
                    {isLoading && (
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-theme-secondary flex items-center justify-center">
                          <span className="text-xs font-medium text-theme-text-on-secondary">AI</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-theme-text">{selectedModel}</span>
                          </div>
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-theme-text rounded-full animate-bounce opacity-60"></div>
                            <div
                              className="w-2 h-2 bg-theme-text rounded-full animate-bounce opacity-60"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-theme-text rounded-full animate-bounce opacity-60"
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
              <div className="flex-shrink-0 p-3 sm:p-4 bg-theme-bg">
                <div className="max-w-3xl mx-auto">
                  <form onSubmit={handleSubmit} className="relative">
                    <div className="bg-theme-primary rounded-2xl p-3 sm:p-4 shadow-lg">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {/* Attachment Button */}
                        <button
                          type="button"
                          className="text-theme-text-on-primary hover:text-theme-text-on-primary/80 transition-colors p-1"
                        >
                          <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
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

                        {/* Send Button */}
                        <button
                          type="submit"
                          disabled={!input.trim() || isLoading}
                          className="bg-theme-secondary text-theme-text-on-secondary p-2 rounded-lg hover:bg-theme-secondary/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                        >
                          <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
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
            <div className="max-w-4xl mx-auto px-3 sm:px-6 w-full">
              {/* Header */}
              <div className="text-center mb-8 sm:mb-16">
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-light text-theme-text tracking-wide">
                  Leaf Notes
                </h1>
                <p className="text-theme-text opacity-60 mt-2 sm:mt-4 text-base sm:text-lg">
                  Your AI-powered conversation companion
                </p>
              </div>

              {/* Input Section */}
              <div className="relative max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="relative">
                  <div className="bg-theme-primary rounded-2xl p-3 sm:p-4 shadow-lg">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Model Selector - Show on larger screens only */}
                      <div className="relative hidden md:block" data-model-dropdown>
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

                        {/* Dropdown */}
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
                        <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
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

                      {/* Send Button */}
                      <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="bg-theme-secondary text-theme-text-on-secondary p-2 rounded-lg hover:bg-theme-secondary/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                      >
                        <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </form>

                {/* Helper Text */}
                <p className="text-center text-theme-text opacity-60 mt-4 sm:mt-6 text-sm">
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
