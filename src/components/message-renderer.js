// © 2025 Farrell Laurensius Suryadi. All rights reserved.
"use client"

import { useState } from "react"
import { Copy, RotateCcw, Check } from "lucide-react"

// Helper function to parse markdown-like text into React components
const parseFormattedText = (text) => {
  if (!text || typeof text !== "string") return text

  const elements = []
  const lines = text.split("\n")
  let currentIndex = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Handle horizontal dividers (---, ***, ___)
    if (/^[-*_]{3,}$/.test(line.trim())) {
      elements.push(<hr key={currentIndex++} className="my-3 sm:my-4 border-theme-text opacity-20" />)
      continue
    }

    // Handle headers (# ## ###)
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headerMatch) {
      const level = headerMatch[1].length
      const text = headerMatch[2]
      const HeaderTag = `h${Math.min(level, 6)}`
      const headerClasses = {
        1: "text-lg sm:text-xl font-semibold mb-2 sm:mb-3 mt-3 sm:mt-4",
        2: "text-base sm:text-lg font-semibold mb-2 mt-2 sm:mt-3",
        3: "text-sm sm:text-base font-semibold mb-2 mt-2 sm:mt-3",
        4: "text-sm font-semibold mb-1 mt-2",
        5: "text-sm font-medium mb-1 mt-2",
        6: "text-xs font-medium mb-1 mt-2",
      }

      elements.push(
        <HeaderTag key={currentIndex++} className={`text-theme-text ${headerClasses[level]}`}>
          {parseInlineText(text)}
        </HeaderTag>,
      )
      continue
    }

    // Handle unordered lists (- * +)
    if (/^[\s]*[-*+]\s+/.test(line)) {
      const listItems = []
      let j = i

      while (j < lines.length && /^[\s]*[-*+]\s+/.test(lines[j])) {
        const indent = lines[j].match(/^(\s*)/)[1].length
        const content = lines[j].replace(/^[\s]*[-*+]\s+/, "")
        const indentLevel = Math.floor(indent / 2)

        listItems.push({
          content: parseInlineText(content),
          level: indentLevel,
          index: j,
        })
        j++
      }

      elements.push(
        <ul key={currentIndex++} className="my-2 space-y-1">
          {listItems.map((item, idx) => (
            <li
              key={item.index}
              className={`flex items-start text-theme-text ${item.level > 0 ? `ml-${item.level * 3} sm:ml-${item.level * 4}` : ""}`}
            >
              <span className="text-theme-text opacity-60 mr-2 mt-0.5 flex-shrink-0">•</span>
              <span className="flex-1 text-sm sm:text-base">{item.content}</span>
            </li>
          ))}
        </ul>,
      )

      i = j - 1
      continue
    }

    // Handle ordered lists (1. 2. 3.)
    if (/^[\s]*\d+\.\s+/.test(line)) {
      const listItems = []
      let j = i

      while (j < lines.length && /^[\s]*\d+\.\s+/.test(lines[j])) {
        const indent = lines[j].match(/^(\s*)/)[1].length
        const content = lines[j].replace(/^[\s]*\d+\.\s+/, "")
        const indentLevel = Math.floor(indent / 2)
        const number = lines[j].match(/^[\s]*(\d+)\./)[1]

        listItems.push({
          content: parseInlineText(content),
          level: indentLevel,
          number: number,
          index: j,
        })
        j++
      }

      elements.push(
        <ol key={currentIndex++} className="my-2 space-y-1">
          {listItems.map((item, idx) => (
            <li
              key={item.index}
              className={`flex items-start text-theme-text ${item.level > 0 ? `ml-${item.level * 3} sm:ml-${item.level * 4}` : ""}`}
            >
              <span className="text-theme-text opacity-60 mr-2 mt-0.5 flex-shrink-0 font-medium text-sm sm:text-base">
                {item.number}.
              </span>
              <span className="flex-1 text-sm sm:text-base">{item.content}</span>
            </li>
          ))}
        </ol>,
      )

      i = j - 1
      continue
    }

    // Handle code blocks (```)
    if (line.trim().startsWith("```")) {
      const language = line.trim().substring(3)
      const codeLines = []
      let j = i + 1

      while (j < lines.length && !lines[j].trim().startsWith("```")) {
        codeLines.push(lines[j])
        j++
      }

      elements.push(
        <div key={currentIndex++} className="my-3">
          {language && <div className="text-xs text-theme-text opacity-60 mb-1 font-medium">{language}</div>}
          <pre className="bg-theme-secondary bg-opacity-20 rounded-lg p-3 overflow-x-auto">
            <code className="text-xs sm:text-sm text-theme-text font-mono">{codeLines.join("\n")}</code>
          </pre>
        </div>,
      )

      i = j
      continue
    }

    // Handle blockquotes (>)
    if (line.trim().startsWith(">")) {
      const quoteLines = []
      let j = i

      while (j < lines.length && lines[j].trim().startsWith(">")) {
        quoteLines.push(lines[j].replace(/^>\s?/, ""))
        j++
      }

      elements.push(
        <blockquote key={currentIndex++} className="my-3 pl-3 sm:pl-4 border-l-2 border-theme-text border-opacity-30">
          <div className="text-theme-text opacity-80 italic text-sm sm:text-base">
            {quoteLines.map((quoteLine, idx) => (
              <div key={idx}>{parseInlineText(quoteLine)}</div>
            ))}
          </div>
        </blockquote>,
      )

      i = j - 1
      continue
    }

    // Handle regular paragraphs
    if (line.trim()) {
      elements.push(
        <p key={currentIndex++} className="text-theme-text leading-relaxed my-2 text-sm sm:text-base">
          {parseInlineText(line)}
        </p>,
      )
    } else {
      // Empty line - add spacing
      elements.push(<div key={currentIndex++} className="h-2" />)
    }
  }

  return elements
}

// Helper function to parse inline formatting (bold, italic, code, links)
const parseInlineText = (text) => {
  if (!text || typeof text !== "string") return text

  const elements = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Bold text (**text** or __text__)
    const boldMatch = remaining.match(/^(.*?)(\*\*|__)(.*?)\2(.*)$/)
    if (boldMatch && boldMatch[3]) {
      if (boldMatch[1]) {
        elements.push(boldMatch[1])
      }
      elements.push(
        <strong key={key++} className="font-semibold">
          {parseInlineText(boldMatch[3])}
        </strong>,
      )
      remaining = boldMatch[4]
      continue
    }

    // Italic text (*text* or _text_)
    const italicMatch = remaining.match(/^(.*?)(\*|_)(.*?)\2(.*)$/)
    if (italicMatch && italicMatch[3] && !remaining.match(/^\*\*/)) {
      if (italicMatch[1]) {
        elements.push(italicMatch[1])
      }
      elements.push(
        <em key={key++} className="italic">
          {parseInlineText(italicMatch[3])}
        </em>,
      )
      remaining = italicMatch[4]
      continue
    }

    // Inline code (`code`)
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)$/)
    if (codeMatch) {
      if (codeMatch[1]) {
        elements.push(codeMatch[1])
      }
      elements.push(
        <code
          key={key++}
          className="bg-theme-secondary bg-opacity-20 px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono"
        >
          {codeMatch[2]}
        </code>,
      )
      remaining = codeMatch[3]
      continue
    }

    // Links [text](url)
    const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]$$([^)]+)$$(.*)$/)
    if (linkMatch) {
      if (linkMatch[1]) {
        elements.push(linkMatch[1])
      }
      elements.push(
        <a
          key={key++}
          href={linkMatch[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline transition-colors"
        >
          {linkMatch[2]}
        </a>,
      )
      remaining = linkMatch[4]
      continue
    }

    // No more matches, add the rest
    elements.push(remaining)
    break
  }

  return elements.length === 1 && typeof elements[0] === "string" ? elements[0] : elements
}

export const MessageRenderer = ({ content, onRetry, messageId }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry(messageId)
    }
  }

  return (
    <div className="group">
      <div className="prose prose-sm max-w-none">{parseFormattedText(content)}</div>

      {/* Action buttons - Responsive */}
      <div className="flex items-center gap-1 sm:gap-2 mt-2 sm:mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs text-theme-text opacity-60 hover:opacity-100 hover:bg-theme-secondary hover:bg-opacity-10 rounded transition-all duration-200"
          title="Copy message"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              <span className="hidden sm:inline">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>

        <button
          onClick={handleRetry}
          className="flex items-center gap-1 px-2 py-1 text-xs text-theme-text opacity-60 hover:opacity-100 hover:bg-theme-secondary hover:bg-opacity-10 rounded transition-all duration-200"
          title="Retry this message"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden sm:inline">Retry</span>
        </button>
      </div>
    </div>
  )
}
