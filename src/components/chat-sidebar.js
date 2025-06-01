"use client"

import { useState } from "react"
import {
  Plus,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Edit3,
  Trash2,
  Search,
  Settings,
  PanelLeft,
} from "lucide-react"

function cn(...inputs) {
  return inputs.filter(Boolean).join(" ")
}

export function ChatSidebar({
  currentChatId,
  onChatSelect,
  onNewChat,
  onNewFolder,
  chats = [],
  folders = [],
  onDeleteChat,
  onDeleteFolder,
  onRenameChat,
  onRenameFolder,
  onMoveChat,
  isOpen,
  onToggle,
}) {
  const [expandedFolders, setExpandedFolders] = useState(new Set())
  const [editingItem, setEditingItem] = useState(null)
  const [editingValue, setEditingValue] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverTarget, setDragOverTarget] = useState(null)

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const startEditing = (item, type) => {
    setEditingItem({ id: item.id, type })
    setEditingValue(item.name || item.title)
  }

  const finishEditing = () => {
    if (editingItem && editingValue.trim()) {
      if (editingItem.type === "chat") {
        onRenameChat(editingItem.id, editingValue.trim())
      } else if (editingItem.type === "folder") {
        onRenameFolder(editingItem.id, editingValue.trim())
      }
    }
    setEditingItem(null)
    setEditingValue("")
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      finishEditing()
    } else if (e.key === "Escape") {
      setEditingItem(null)
      setEditingValue("")
    }
  }

  // Drag and Drop handlers
  const handleDragStart = (e, item, type) => {
    setDraggedItem({ ...item, type })
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", "")
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDragEnter = (e, target) => {
    e.preventDefault()
    setDragOverTarget(target)
  }

  const handleDragLeave = (e) => {
    // Only clear if we're leaving the entire drop zone
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverTarget(null)
    }
  }

  const handleDrop = (e, targetFolderId = null) => {
    e.preventDefault()
    setDragOverTarget(null)

    if (!draggedItem || draggedItem.type !== "chat") return

    // Move chat to target folder (or unsorted if targetFolderId is null)
    if (onMoveChat) {
      onMoveChat(draggedItem.id, targetFolderId)
    }

    setDraggedItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverTarget(null)
  }

  const handleNewChatInFolder = (folderId) => {
    // Ensure folder is expanded when creating a new chat
    if (folderId && !expandedFolders.has(folderId)) {
      setExpandedFolders((prev) => new Set([...prev, folderId]))
    }
    onNewChat(folderId)
  }

  const renderChat = (chat, isInFolder = false) => {
    const isEditing = editingItem?.id === chat.id && editingItem?.type === "chat"
    const isActive = currentChatId === chat.id
    const isDragging = draggedItem?.id === chat.id

    return (
      <div
        key={chat.id}
        draggable={!isEditing}
        onDragStart={(e) => handleDragStart(e, chat, "chat")}
        onDragEnd={handleDragEnd}
        className={cn(
          "group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
          isActive ? "bg-[#6b886b] text-white shadow-sm" : "hover:bg-[#cbd0bf]/50 text-[#8a9b69]",
          isInFolder && "ml-6",
          !isOpen && "justify-center px-2",
          isDragging && "opacity-50",
        )}
        onClick={() => !isEditing && onChatSelect(chat.id)}
      >
        <MessageSquare className={cn("flex-shrink-0", isOpen ? "w-4 h-4" : "w-5 h-5")} />

        {isOpen && (
          <>
            {isEditing ? (
              <input
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={finishEditing}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-sm min-w-0 text-right"
                style={{
                  direction: "rtl",
                  textAlign: "right",
                  unicodeBidi: "plaintext",
                }}
                autoFocus
              />
            ) : (
              <span className="flex-1 text-sm truncate font-medium min-w-0">{chat.title}</span>
            )}

            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity flex-shrink-0">
              <button
                className="h-6 w-6 rounded-md hover:bg-black/10 flex items-center justify-center transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  startEditing(chat, "chat")
                }}
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                className="h-6 w-6 rounded-md hover:bg-black/10 flex items-center justify-center transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteChat(chat.id)
                }}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  const renderFolder = (folder) => {
    if (!isOpen) return null

    const isExpanded = expandedFolders.has(folder.id)
    const isEditing = editingItem?.id === folder.id && editingItem?.type === "folder"
    const folderChats = chats.filter((chat) => chat.folderId === folder.id)
    const isDropTarget = dragOverTarget === folder.id
    const canDrop = draggedItem?.type === "chat"

    return (
      <div key={folder.id} className="mb-1">
        <div
          className={cn(
            "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 min-h-[36px]",
            "hover:bg-[#cbd0bf]/50 text-[#8a9b69]",
            isDropTarget && canDrop && "bg-[#6b886b]/20 border-2 border-dashed border-[#6b886b]",
          )}
          onClick={() => !isEditing && toggleFolder(folder.id)}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder.id)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 flex-shrink-0" />
            )}

            {isEditing ? (
              <input
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={finishEditing}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-sm font-medium min-w-0 text-right"
                style={{
                  direction: "rtl",
                  textAlign: "right",
                  unicodeBidi: "plaintext",
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-sm truncate font-medium flex-1 min-w-0">{folder.name}</span>
            )}
          </div>

          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity flex-shrink-0">
            <button
              className="h-6 w-6 rounded-md hover:bg-black/10 flex items-center justify-center transition-colors flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                handleNewChatInFolder(folder.id)
              }}
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              className="h-6 w-6 rounded-md hover:bg-black/10 flex items-center justify-center transition-colors flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                startEditing(folder, "folder")
              }}
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              className="h-6 w-6 rounded-md hover:bg-black/10 flex items-center justify-center transition-colors flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteFolder(folder.id)
              }}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {isExpanded && <div className="ml-4 space-y-1 mt-1">{folderChats.map((chat) => renderChat(chat, true))}</div>}
      </div>
    )
  }

  // Sort folders alphabetically
  const sortedFolders = [...folders].sort((a, b) => a.name.localeCompare(b.name))

  // Sort unsorted chats by creation time (newest first)
  const unorganizedChats = chats
    .filter((chat) => !chat.folderId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const filteredChats = searchQuery
    ? unorganizedChats.filter((chat) => chat.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : unorganizedChats

  const isUnsortedDropTarget = dragOverTarget === "unsorted"
  const canDropInUnsorted = draggedItem?.type === "chat"

  return (
    <div
      className={cn(
        "h-screen bg-[#e4e4d4] border-r border-[#cbd0bf]/60 font-monkeytype transition-all duration-300 ease-in-out flex flex-col shadow-sm overflow-hidden",
        isOpen ? "w-64" : "w-14",
      )}
    >
      {/* Header */}
      <div className={cn("flex-shrink-0 p-3 border-b border-[#cbd0bf]/40", !isOpen && "px-2")}>
        <div className="flex flex-col gap-3">
          {/* Toggle Button */}
          <button
            onClick={onToggle}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#cbd0bf]/50 transition-colors text-[#8a9b69]",
              !isOpen && "mx-auto",
            )}
          >
            <PanelLeft className={cn("transition-transform duration-300", isOpen ? "w-4 h-4" : "w-5 h-5 rotate-180")} />
          </button>

          {/* New Chat Button */}
          <button
            onClick={() => handleNewChatInFolder()}
            className={cn(
              "flex items-center gap-3 bg-[#6b886b] hover:bg-[#6b886b]/90 text-white rounded-lg transition-all duration-200 font-medium shadow-sm",
              isOpen ? "px-3 py-2 justify-start" : "w-8 h-8 justify-center mx-auto",
            )}
          >
            <Plus className={cn(isOpen ? "w-4 h-4" : "w-5 h-5")} />
            {isOpen && <span className="text-sm">New Chat</span>}
          </button>

          {/* Search */}
          {isOpen ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8a9b69]/60" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#cbd0bf]/30 border border-[#cbd0bf]/40 rounded-lg text-sm text-[#8a9b69] placeholder-[#8a9b69]/60 focus:outline-none focus:ring-2 focus:ring-[#6b886b]/30 focus:border-[#6b886b]/50 transition-all"
              />
            </div>
          ) : (
            <button className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#cbd0bf]/50 transition-colors text-[#8a9b69] mx-auto">
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Items - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 min-h-0">
        <div className={cn("space-y-1", isOpen ? "px-3" : "px-2")}>
          {isOpen ? (
            <>
              {/* Folders Section */}
              <div className="space-y-1">
                {/* New Folder Button */}
                <button
                  onClick={onNewFolder}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#cbd0bf]/50 text-[#8a9b69]/70 transition-all duration-200 text-sm font-medium mb-2"
                >
                  <Folder className="w-4 h-4" />
                  <span>New Folder</span>
                </button>

                {/* Folders */}
                {sortedFolders.map(renderFolder)}
              </div>

              {/* Section Divider */}
              {(sortedFolders.length > 0 || filteredChats.length > 0) && (
                <div className="my-4">
                  <div className="h-px bg-[#cbd0bf]/40 mx-2"></div>
                </div>
              )}

              {/* Unsorted Chats Section */}
              {filteredChats.length > 0 && (
                <div
                  className={cn(
                    "space-y-1 min-h-[40px] rounded-lg transition-all duration-200",
                    isUnsortedDropTarget &&
                      canDropInUnsorted &&
                      "bg-[#6b886b]/10 border-2 border-dashed border-[#6b886b]",
                  )}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, "unsorted")}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, null)}
                >
                  {/* Section Label */}
                  <div className="px-3 py-1">
                    <span className="text-xs font-medium text-[#8a9b69]/60 uppercase tracking-wide">Recent Chats</span>
                  </div>

                  {/* Unsorted Chats */}
                  {filteredChats.map((chat) => renderChat(chat))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Show only active chat indicator in collapsed mode */}
              {unorganizedChats.slice(0, 3).map((chat) => renderChat(chat))}
            </>
          )}
        </div>
      </div>

      {/* Settings at Bottom - Fixed */}
      <div className={cn("flex-shrink-0 p-3 border-t border-[#cbd0bf]/40", !isOpen && "px-2")}>
        <button
          className={cn(
            "flex items-center gap-3 w-full rounded-lg hover:bg-[#cbd0bf]/50 transition-colors text-[#8a9b69]",
            isOpen ? "px-3 py-2 justify-start" : "w-8 h-8 justify-center mx-auto",
          )}
        >
          <Settings className={cn(isOpen ? "w-4 h-4" : "w-5 h-5")} />
          {isOpen && <span className="text-sm font-medium">Settings</span>}
        </button>
      </div>
    </div>
  )
}
