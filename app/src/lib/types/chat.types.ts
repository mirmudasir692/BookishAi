import type {
  Message,
  Thread,
  GetConversationsResponse,
  GetConversationResponse,
  DeleteConversationResponse,
  DeleteMessageResponse,
  StreamEvent,
} from '../../../../src/mastra/dto';

export type {
  Message,
  Thread,
  GetConversationsResponse,
  GetConversationResponse,
  DeleteConversationResponse,
  DeleteMessageResponse,
  StreamEvent,
};

export interface SelectedFile {
  file: File;
  name: string;
  contentType: string;
  base64: string;
  previewUrl?: string;
  isImage: boolean;
  size: number;
}

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  thinking?: string;
  isThinking?: boolean;
  isStreaming?: boolean;
  createdAt?: string | Date | null;
  threadId?: string | null;
  resourceId?: string | null;
}

export interface ChatSuggestion {
  title: string;
  description: string;
  prompt: string;
  iconName?: 'atom' | 'book' | 'compass' | 'sparkles';
}

export interface ConversationItemProps {
  thread: Thread;
  isSelected: boolean;
  onSelect: (threadId: string) => void;
  onDelete: (threadId: string) => Promise<void> | void;
  isDeleting?: boolean;
}

export interface SidebarProps {
  selectedThreadId: string | null;
  conversations: Thread[];
  isLoading: boolean;
  errorMessage?: string | null;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onSelectThread: (threadId: string | null) => void;
  onNewChat: () => void;
  onDeleteThread: (threadId: string) => Promise<void> | void;
  onRefresh?: () => Promise<void> | void;
}

export interface MessageBubbleProps {
  id: string;
  role: string;
  content: unknown;
  thinking?: string;
  isThinking?: boolean;
  isStreaming?: boolean;
  createdAt?: string | Date | null;
  onDelete?: (id: string) => Promise<void> | void;
  onRetry?: (id: string) => Promise<void> | void;
  isDeleting?: boolean;
}

export interface ChatAreaProps {
  selectedThreadId: string | null;
  onNewConversationCreated?: (threadId: string) => void;
  onStartNewChat?: () => void;
  onToggleMobileSidebar?: () => void;
}

export interface ChatStreamCallbacks {
  onMetadata?: (data: { threadId: string }) => void;
  onThinking?: (chunk: string, accumulated: string) => void;
  onAnswer?: (chunk: string, accumulated: string) => void;
  onError?: (error: string, details?: unknown[]) => void;
  onDone?: (finalResult: { threadId: string; thinking: string; answer: string }) => void;
}
