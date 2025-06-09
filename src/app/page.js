"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowUp, Paperclip, ChevronDown } from "lucide-react"
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

*Let me know if you need any clarification!*`
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

    const userInputValue = input.trim()
    setInput("")
    setIsLoading(true)

    // Simulate AI response with formatted content
    setTimeout(
      () => {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: generateFormattedResponse(userInputValue, selectedModel),
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

  const handleRetry = (messageId) => {
    // Find the message to retry
    const messageIndex = messages.findIndex(msg => msg.id === messageId)
    if (messageIndex === -1) return

    const messageToRetry = messages[messageIndex]
    if (messageToRetry.role !== 'assistant') return

    // Find the user message that triggered this response
    const userMessage = messageIndex > 0 ? messages[messageIndex - 1] : null
    if (!userMessage || userMessage.role !== 'user') return

    // Remove the AI message and regenerate
    const newMessages = messages.slice(0, messageIndex)
    setMessages(newMessages)
    setIsLoading(true)

    // Generate new response
    setTimeout(() => {
      const newAiMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: generateFormattedResponse(userMessage.content, selectedModel),
        timestamp: new Date(),
      }
      
      setMessages(prev => [...prev, newAiMessage])
      
      // Update chat history
      setChats(prev =>
        prev.map(chat =>
          chat.id === currentChatId
            ? { ...chat, messages: [...newMessages, newAiMessage] }
            : chat
        )
      )
      
      setIsLoading(false)
    }, 1000 + Math.random() * 1500)
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
                  <div className="space-y-8">
                    {messages.map((message) => (
                      <div key={message.id} className="w-full">
                        {message.role === "user" ? (
                          /* User Message - Keep bubble style */
                          <div className="flex justify-end">
                            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-theme-primary text-theme-text-on-primary user-message break-words">
                              <p className="text-sm leading-relaxed break-words">{message.content}</p>
                              <p className="text-xs opacity-70 mt-2">
                                {message.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        ) : (
                          /* Assistant Message - With formatted content */
                          <div className="flex items-start gap-4">
                            {/* AI Avatar */}
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-theme-secondary flex items-center justify-center">
                              <span className="text-xs font-medium text-theme-text-on-secondary">AI</span>
                            </div>
                            
                            {/* Message Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm font-medium text-theme-text">{selectedModel}</span>
                                <span className="text-xs text-theme-text opacity-60">
                                  {message.timestamp.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              
                              {/* Formatted Message Content */}
                              <div className="text-sm leading-relaxed">
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
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-theme-secondary flex items-center justify-center">
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
                <p className="text-theme-text opacity-60 mt-4 text-lg">Your AI-powered conversation companion</p>
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