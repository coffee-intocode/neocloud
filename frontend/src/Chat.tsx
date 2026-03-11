import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation'
import { Loader } from '@/components/ai-elements/loader'
import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input'
import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { AlertTriangleIcon, Settings2Icon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'

import { API_ENDPOINTS } from '@/config'
import { getToolIcon } from '@/lib/tool-icons'
import { Part } from './Part'

interface ModelConfig {
  id: string
  name: string
  builtin_tools: string[]
}

interface BuiltinTool {
  name: string
  id: string
}

interface RemoteConfig {
  models: ModelConfig[]
  builtinTools: BuiltinTool[]
}

function isSourceUrlPart(part: UIMessage['parts'][number]): part is UIMessage['parts'][number] & { type: 'source-url'; url: string } {
  return part.type === 'source-url' && 'url' in part && typeof (part as { url?: unknown }).url === 'string'
}

async function getModels() {
  const response = await fetch(API_ENDPOINTS.configure)
  if (!response.ok) {
    throw new Error('Failed to fetch chat configuration')
  }
  return (await response.json()) as RemoteConfig
}

const chatTransport = new DefaultChatTransport({
  api: API_ENDPOINTS.chatStream,
})

const Chat = () => {
  const [input, setInput] = useState('')
  const [model, setModel] = useState<string>('')
  const [enabledTools, setEnabledTools] = useState<string[]>([])
  const [errorBanner, setErrorBanner] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, sendMessage, status, regenerate } = useChat({
    transport: chatTransport,
    onError: (error) => {
      setErrorBanner(error.message || 'The chat request failed.')
    },
  })

  const configQuery = useQuery({
    queryKey: ['models'],
    queryFn: getModels,
  })

  useEffect(() => {
    if (configQuery.data?.models.length && !model) {
      setModel(configQuery.data.models[0].id)
    }
  }, [configQuery.data, model])

  useEffect(() => {
    if (!errorBanner) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setErrorBanner(null)
    }, 6000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [errorBanner])

  const availableTools = useMemo(() => {
    const enabledToolIds = configQuery.data?.models.find((entry) => entry.id === model)?.builtin_tools ?? []
    return configQuery.data?.builtinTools.filter((tool) => enabledToolIds.includes(tool.id)) ?? []
  }, [configQuery.data, model])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmedInput = input.trim()
    if (!trimmedInput || status === 'submitted' || status === 'streaming') {
      return
    }

    const nextInput = trimmedInput
    setInput('')
    sendMessage(
      { text: nextInput },
      { body: { model, builtinTools: enabledTools } },
    ).catch((error: unknown) => {
      console.error('Error sending message:', error)
      setInput(nextInput)
    })
  }

  function handleRegenerate(messageId: string) {
    regenerate({
      messageId,
      body: { model, builtinTools: enabledTools },
    }).catch((error: unknown) => {
      console.error('Error regenerating message:', error)
      setErrorBanner(error instanceof Error ? error.message : 'Unable to regenerate the response.')
    })
  }

  return (
    <>
      {errorBanner && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 px-3">
          <div
            role="alert"
            className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg"
          >
            <AlertTriangleIcon className="size-4 shrink-0" />
            <span>{errorBanner}</span>
          </div>
        </div>
      )}

      <Conversation className="h-full">
        <ConversationContent>
          {messages.length === 0 && (
            <div className="mx-auto mt-24 max-w-2xl rounded-3xl border bg-card/60 p-8 text-center shadow-sm">
              <h2 className="text-2xl font-semibold tracking-tight">Start with a prompt</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                This scaffold is stateless. There is no auth, no onboarding, and no persisted chat history in this version.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id}>
              {message.role === 'assistant' && message.parts.filter(isSourceUrlPart).length > 0 && (
                <Sources>
                  <SourcesTrigger count={message.parts.filter(isSourceUrlPart).length} />
                  {message.parts.filter(isSourceUrlPart).map((part, index) => (
                    <SourcesContent key={`${message.id}-${index}`}>
                      <Source href={part.url} title={part.url} />
                    </SourcesContent>
                  ))}
                </Sources>
              )}
              {message.parts.map((part, index) => (
                <Part
                  key={`${message.id}-${index}`}
                  part={part}
                  message={message}
                  status={status}
                  index={index}
                  regen={handleRegenerate}
                  lastMessage={message.id === messages.at(-1)?.id}
                />
              ))}
            </div>
          ))}
          {status === 'submitted' && <Loader />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="sticky bottom-0 p-3">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            ref={textareaRef}
            onChange={(event) => {
              setInput(event.target.value)
            }}
            value={input}
            autoFocus
          />
          <PromptInputToolbar>
            <PromptInputTools>
              {availableTools.length > 0 && (
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <PromptInputButton variant="outline">
                          <Settings2Icon className="size-4" />
                        </PromptInputButton>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Tools</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="start">
                    {availableTools.map((tool) => (
                      <div
                        key={tool.id}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-sm px-2 py-1.5 hover:bg-accent"
                        onClick={() => {
                          setEnabledTools((current) =>
                            current.includes(tool.id) ? current.filter((id) => id !== tool.id) : [...current, tool.id],
                          )
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {getToolIcon(tool.id)}
                          <span className="text-sm">{tool.name}</span>
                        </div>
                        <Switch
                          checked={enabledTools.includes(tool.id)}
                          onCheckedChange={(checked) => {
                            setEnabledTools((current) =>
                              checked ? [...current, tool.id] : current.filter((id) => id !== tool.id),
                            )
                          }}
                          onClick={(event) => {
                            event.stopPropagation()
                          }}
                        />
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {configQuery.data && model && (
                <PromptInputModelSelect
                  onValueChange={(value) => {
                    setModel(value)
                    setEnabledTools([])
                  }}
                  value={model}
                >
                  <PromptInputModelSelectTrigger>
                    <PromptInputModelSelectValue />
                  </PromptInputModelSelectTrigger>
                  <PromptInputModelSelectContent>
                    {configQuery.data.models.map((modelOption) => (
                      <PromptInputModelSelectItem key={modelOption.id} value={modelOption.id}>
                        {modelOption.name}
                      </PromptInputModelSelectItem>
                    ))}
                  </PromptInputModelSelectContent>
                </PromptInputModelSelect>
              )}
            </PromptInputTools>
            <PromptInputSubmit disabled={!input.trim() || status === 'submitted' || status === 'streaming'} status={status} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </>
  )
}

export default Chat
