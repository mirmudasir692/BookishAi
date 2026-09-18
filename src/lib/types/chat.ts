import type { Message, Thread } from '../../mastra/dto';

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
  onSelectThread: (threadId: string | null) => void;
  onNewChat: () => void;
  onDeleteThread: (threadId: string) => Promise<void> | void;
  onRefresh?: () => Promise<void> | void;
}

export interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system' | 'tool' | 'signal' | string;
  content: unknown;
  createdAt?: string | Date;
}

export interface ChatAreaProps {
  selectedThreadId: string | null;
  onNewConversationCreated?: (threadId: string) => void;
  onStartNewChat?: () => void;
}
