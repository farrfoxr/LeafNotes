// © 2025 Farrell Laurensius Suryadi. All rights reserved.
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
  X,
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
  onSettingsClick,
  isMobile = false,
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
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverTarget(null)
    }
  }

  const handleDrop = (e, targetFolderId = null) => {
    e.preventDefault()
    setDragOverTarget(null)

    if (!draggedItem || draggedItem.type !== "chat") return

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
          "group flex items-center rounded-lg cursor-pointer",
          isActive
            ? "bg-theme-primary text-theme-text-on-primary shadow-sm"
            : "hover:bg-theme-hover/50 text-theme-text",
          isDragging && "opacity-50",
          "px-3 sm:px-4 py-2.5 sm:py-3 gap-2 sm:gap-3 min-h-[40px] sm:min-h-[44px]",
          isInFolder && "ml-3 sm:ml-4",
        )}
        onClick={() => !isEditing && onChatSelect(chat.id)}
      >
        <MessageSquare className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5" />

        {isEditing ? (
          <input
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={finishEditing}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-sm min-w-0"
            autoFocus
          />
        ) : (
          <span className="flex-1 text-sm truncate font-medium min-w-0">{chat.title}</span>
        )}

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity flex-shrink-0">
          <button
            className="h-6 w-6 sm:h-7 sm:w-7 rounded-md hover:bg-black/10 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation()
              startEditing(chat, "chat")
            }}
          >
            <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
          <button
            className="h-6 w-6 sm:h-7 sm:w-7 rounded-md hover:bg-black/10 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation()
              onDeleteChat(chat.id)
            }}
          >
            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  const renderFolder = (folder) => {
    const isExpanded = expandedFolders.has(folder.id)
    const isEditing = editingItem?.id === folder.id && editingItem?.type === "folder"
    const folderChats = chats.filter((chat) => chat.folderId === folder.id)
    const isDropTarget = dragOverTarget === folder.id
    const canDrop = draggedItem?.type === "chat"

    return (
      <div key={folder.id} className="mb-1">
        <div
          className={cn(
            "group flex items-center rounded-lg cursor-pointer min-h-[40px] sm:min-h-[44px]",
            "hover:bg-theme-hover/50 text-theme-text",
            isDropTarget && canDrop && "bg-theme-primary/20 border-2 border-dashed border-theme-primary",
            "px-3 sm:px-4 py-2.5 sm:py-3 gap-2 sm:gap-3",
          )}
          onClick={() => !isEditing && toggleFolder(folder.id)}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder.id)}
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            )}

            {isEditing ? (
              <input
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={finishEditing}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none outline-none text-sm font-medium min-w-0"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-sm truncate font-medium flex-1 min-w-0">{folder.name}</span>
            )}
          </div>

          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity flex-shrink-0">
            <button
              className="h-6 w-6 sm:h-7 sm:w-7 rounded-md hover:bg-black/10 flex items-center justify-center flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                handleNewChatInFolder(folder.id)
              }}
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              className="h-6 w-6 sm:h-7 sm:w-7 rounded-md hover:bg-black/10 flex items-center justify-center flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                startEditing(folder, "folder")
              }}
            >
              <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              className="h-6 w-6 sm:h-7 sm:w-7 rounded-md hover:bg-black/10 flex items-center justify-center flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteFolder(folder.id)
              }}
            >
              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="ml-4 sm:ml-6 space-y-1 mt-1">{folderChats.map((chat) => renderChat(chat, true))}</div>
        )}
      </div>
    )
  }

  const sortedFolders = [...folders].sort((a, b) => a.name.localeCompare(b.name))
  const unorganizedChats = chats
    .filter((chat) => !chat.folderId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const filteredChats = searchQuery
    ? unorganizedChats.filter((chat) => chat.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : unorganizedChats

  const isUnsortedDropTarget = dragOverTarget === "unsorted"
  const canDropInUnsorted = draggedItem?.type === "chat"

  return (
    <>
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--theme-text) / 0.4) transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--theme-text) / 0.4);
          border-radius: 2px;
          min-height: 20px;
          background-clip: padding-box;
          border: 1px solid transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--theme-text) / 0.6);
        }
        
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }
      `}</style>

      <div
        className={cn(
          "h-screen bg-theme-bg border-r border-theme-border/60 font-monkeytype flex flex-col shadow-sm overflow-hidden",
          // Mobile: Fixed positioning with slide animation
          isMobile && "fixed top-0 left-0 z-40 transition-transform duration-300 ease-in-out",
          isMobile && isOpen ? "translate-x-0" : isMobile ? "-translate-x-full" : "",
          // Desktop: Normal flow with width transition
          !isMobile && "transition-[width] duration-300 ease-in-out",
          // Width classes
          isMobile ? "w-80" : isOpen ? "w-80" : "w-16",
        )}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-theme-border/40 p-3 sm:p-4">
          <div className={cn("flex flex-col gap-2 sm:gap-3", !isOpen && !isMobile && "items-center")}>
            {/* Mobile header with close button */}
            {isMobile && isOpen && (
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-theme-text font-medium text-lg">Leaf Notes</h2>
                <button onClick={onToggle} className="p-2 rounded-lg hover:bg-theme-hover/50 text-theme-text">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Toggle Button - Only show on desktop */}
            {!isMobile && (
              <button
                onClick={onToggle}
                className={cn(
                  "flex items-center rounded-lg hover:bg-theme-hover/50 text-theme-text h-9 sm:h-10",
                  isOpen ? "px-3 w-full" : "w-9 sm:w-10 justify-center",
                )}
              >
                <PanelLeft className={cn("w-4 h-4 sm:w-5 sm:h-5", !isOpen && "rotate-180")} />
              </button>
            )}

            {/* New Chat Button */}
            {(isOpen || isMobile) && (
              <button
                onClick={() => handleNewChatInFolder()}
                className="flex items-center bg-theme-primary text-theme-text-on-primary rounded-lg font-medium shadow-sm h-9 sm:h-10 transition-colors hover:brightness-110 w-full px-3 gap-2 sm:gap-3"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-sm whitespace-nowrap">New Chat</span>
              </button>
            )}

            {/* Collapsed New Chat Button */}
            {!isOpen && !isMobile && (
              <button
                onClick={() => handleNewChatInFolder()}
                className="w-9 sm:w-10 h-9 sm:h-10 flex items-center justify-center bg-theme-primary text-theme-text-on-primary rounded-lg font-medium shadow-sm hover:brightness-110"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Search */}
            {isOpen || isMobile ? (
              <div className="relative w-full h-9 sm:h-10">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-theme-text/60" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-full pl-9 sm:pl-10 pr-3 bg-theme-secondary/30 border border-theme-border/40 rounded-lg text-sm text-theme-text placeholder-theme-text/60 focus:outline-none focus:ring-2 focus:ring-theme-primary/30 focus:border-theme-primary/50"
                />
              </div>
            ) : (
              <button className="w-9 sm:w-10 h-9 sm:h-10 flex items-center justify-center rounded-lg hover:bg-theme-hover/50 text-theme-text">
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Items - Scrollable with Custom Scrollbar */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-3 sm:pt-4 min-h-0 custom-scrollbar">
          <div className={cn("space-y-1", isOpen || isMobile ? "px-3 sm:px-4" : "px-2")}>
            {isOpen || isMobile ? (
              <div>
                {/* Folders Section */}
                <div className="space-y-1">
                  {/* New Folder Button */}
                  <button
                    onClick={onNewFolder}
                    className="w-full h-9 sm:h-10 flex items-center rounded-lg hover:bg-theme-hover/50 text-theme-text/70 text-sm font-medium mb-2 sm:mb-3 px-3 sm:px-4 gap-2 sm:gap-3 overflow-hidden"
                  >
                    <Folder className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="whitespace-nowrap overflow-hidden">New Folder</span>
                  </button>

                  {/* Folders */}
                  {sortedFolders.map(renderFolder)}
                </div>

                {/* Section Divider */}
                {(sortedFolders.length > 0 || filteredChats.length > 0) && (
                  <div className="my-3 sm:my-4">
                    <div className="h-px bg-theme-border/40 mx-2"></div>
                  </div>
                )}

                {/* Unsorted Chats Section */}
                {filteredChats.length > 0 && (
                  <div
                    className={cn(
                      "space-y-1 min-h-[50px] rounded-lg",
                      isUnsortedDropTarget &&
                        canDropInUnsorted &&
                        "bg-theme-primary/10 border-2 border-dashed border-theme-primary",
                    )}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, "unsorted")}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, null)}
                  >
                    {/* Section Label */}
                    <div className="px-3 sm:px-4 py-2">
                      <span className="text-xs font-medium text-theme-text/60 uppercase tracking-wide">
                        Recent Chats
                      </span>
                    </div>

                    {/* Unsorted Chats */}
                    {filteredChats.map((chat) => renderChat(chat))}
                  </div>
                )}
              </div>
            ) : (
              /* Collapsed state - Show only chat icons */
              <div className="flex flex-col space-y-2 items-center w-full">
                {unorganizedChats.slice(0, 3).map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => onChatSelect(chat.id)}
                    className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg flex-shrink-0",
                      currentChatId === chat.id
                        ? "bg-theme-primary text-theme-text-on-primary shadow-sm"
                        : "hover:bg-theme-hover/50 text-theme-text",
                    )}
                  >
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Settings at Bottom */}
        <div className="flex-shrink-0 border-t border-theme-border/40 p-3 sm:p-4">
          <div className={cn(!(isOpen || isMobile) && "flex justify-center")}>
            <button
              onClick={onSettingsClick}
              className={cn(
                "flex items-center rounded-lg hover:bg-theme-hover/50 text-theme-text h-9 sm:h-10",
                isOpen || isMobile ? "w-full px-3 gap-2 sm:gap-3" : "w-8 h-8 sm:w-10 sm:h-10 justify-center",
              )}
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              {(isOpen || isMobile) && <span className="text-sm font-medium whitespace-nowrap">Settings</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
