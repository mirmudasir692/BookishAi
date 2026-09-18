import type { Message, Thread } from '../../../../src/mastra/dto';

export type { Message, Thread };

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

export interface ChatMessage extends Omit<Message, 'content'> {
  content: string;
  thinking?: string;
  isThinking?: boolean;
  isStreaming?: boolean;
}

export interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system' | 'tool' | 'signal' | string;
  content: unknown;
  thinking?: string;
  isThinking?: boolean;
  isStreaming?: boolean;
  createdAt?: string | Date | null;
}

export interface ChatAreaProps {
  selectedThreadId: string | null;
  onNewConversationCreated?: (threadId: string) => void;
  onStartNewChat?: () => void;
  onToggleMobileSidebar?: () => void;
}
