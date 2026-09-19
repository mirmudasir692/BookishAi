import { tick } from 'svelte';
import type { ChatMessage, Message } from '$lib/types/chat.types';
import { chatWithAgentStream, getConversation, deleteMessage } from '$lib/api/agents';
import { toast } from '$lib/state/toast.svelte';

export class ChatState {
  messages = $state<ChatMessage[]>([]);
  inputQuery = $state('');
  isLoadingHistory = $state(false);
  isSending = $state(false);
  deletingMessageId = $state<string | null>(null);
  historyError = $state<string | null>(null);
  sendError = $state<string | null>(null);
  showScrollBottomBtn = $state(false);
  activeThreadId = $state<string | null>(null);

  scrollContainer: HTMLDivElement | null = null;
  textareaRef: HTMLTextAreaElement | null = null;
  private abortController: AbortController | null = null;

  async scrollToBottom(smooth = false): Promise<void> {
    await tick();
    if (this.scrollContainer) {
      if (smooth) {
        this.scrollContainer.scrollTo({
          top: this.scrollContainer.scrollHeight,
          behavior: 'smooth',
        });
      } else {
        this.scrollContainer.scrollTop = this.scrollContainer.scrollHeight;
      }
    }
  }

  handleScroll(): void {
    if (!this.scrollContainer) return;
    const distanceToBottom =
      this.scrollContainer.scrollHeight -
      this.scrollContainer.scrollTop -
      this.scrollContainer.clientHeight;
    this.showScrollBottomBtn = distanceToBottom > 150;
  }

  adjustTextareaHeight(): void {
    if (!this.textareaRef) return;
    this.textareaRef.style.height = 'auto';
    const newHeight = Math.min(this.textareaRef.scrollHeight, 200);
    this.textareaRef.style.height = `${Math.max(newHeight, 44)}px`;
  }

  async loadThread(threadId: string): Promise<void> {
    this.isLoadingHistory = true;
    this.historyError = null;
    try {
      const res = await getConversation(threadId);
      this.messages = (res.messages ?? []).map((msg: Message) => ({
        id: msg.id,
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content ?? ''),
        thinking: msg.thinking ?? undefined,
        createdAt: msg.createdAt,
        threadId: msg.threadId,
        resourceId: msg.resourceId,
      }));
      await this.scrollToBottom();
    } catch (err: unknown) {
      this.historyError = err instanceof Error ? err.message : 'Failed to load conversation';
      this.messages = [];
    } finally {
      this.isLoadingHistory = false;
    }
  }

  syncThread(selectedThreadId: string | null): void {
    if (selectedThreadId === this.activeThreadId) return;

    this.activeThreadId = selectedThreadId;

    if (selectedThreadId) {
      if (!this.isSending) {
        this.loadThread(selectedThreadId);
      }
    } else {
      if (!this.isSending) {
        this.messages = [];
        this.historyError = null;
        this.sendError = null;
      }
    }
  }

  stopGeneration(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isSending = false;
    this.messages = this.messages.map((msg) =>
      msg.isStreaming ? { ...msg, isThinking: false, isStreaming: false } : msg
    );
  }

  async deleteMessage(messageId: string): Promise<void> {
    const confirmed = await toast.confirm({
      title: 'Delete Message',
      message: 'Are you sure you want to delete this message? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) return;

    this.deletingMessageId = messageId;
    try {
      let responseMessage = 'Message deleted successfully';
      if (!messageId.startsWith('temp-') && !messageId.startsWith('bot-')) {
        const res = await deleteMessage(messageId);
        if (res.message) {
          responseMessage = res.message;
        }
      }
      this.messages = this.messages.filter((m) => m.id !== messageId);
      toast.success(responseMessage);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete message';
      toast.error(errorMsg);
    } finally {
      this.deletingMessageId = null;
    }
  }

  async retryAssistantMessage(
    assistantMessageId: string,
    selectedThreadId?: string | null,
    onNewConversationCreated?: (threadId: string) => void
  ): Promise<void> {
    if (this.isSending) return;

    const targetIdx = this.messages.findIndex((m) => m.id === assistantMessageId);
    if (targetIdx === -1) return;

    let userQuery = '';
    for (let i = targetIdx - 1; i >= 0; i--) {
      if (this.messages[i].role === 'user') {
        userQuery = this.messages[i].content;
        break;
      }
    }

    if (!userQuery) return;

    if (!assistantMessageId.startsWith('bot-') && !assistantMessageId.startsWith('temp-')) {
      await deleteMessage(assistantMessageId).catch(() => {});
    }

    this.messages = this.messages.filter((_, idx) => idx !== targetIdx);

    const botMessageId = `bot-${Date.now()}`;
    const botPlaceholder: ChatMessage = {
      id: botMessageId,
      role: 'assistant',
      content: '',
      thinking: '',
      isThinking: true,
      isStreaming: true,
      createdAt: new Date(),
    };
    this.messages = [...this.messages, botPlaceholder];
    await this.scrollToBottom();

    this.isSending = true;
    this.abortController = new AbortController();

    try {
      const payload: { query: string; threadId?: string } = {
        query: userQuery,
      };
      const activeId = selectedThreadId || this.activeThreadId;
      if (activeId) {
        payload.threadId = activeId;
      }

      await chatWithAgentStream(
        payload,
        {
          onMetadata: (meta) => {
            if (!activeId && meta.threadId) {
              this.activeThreadId = meta.threadId;
              onNewConversationCreated?.(meta.threadId);
            }
          },
          onThinking: (_chunk, accumulated) => {
            this.messages = this.messages.map((msg) =>
              msg.id === botMessageId
                ? { ...msg, thinking: accumulated, isThinking: true, isStreaming: true }
                : msg
            );
            this.scrollToBottom();
          },
          onAnswer: (_chunk, accumulated) => {
            this.messages = this.messages.map((msg) =>
              msg.id === botMessageId
                ? { ...msg, content: accumulated, isThinking: false, isStreaming: true }
                : msg
            );
            this.scrollToBottom();
          },
          onError: (err) => {
            this.sendError = err;
          },
          onDone: () => {
            this.messages = this.messages.map((msg) =>
              msg.id === botMessageId ? { ...msg, isThinking: false, isStreaming: false } : msg
            );
            this.scrollToBottom();
          },
        },
        this.abortController.signal
      );
    } catch (err: unknown) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        this.sendError = err instanceof Error ? err.message : 'Failed to get agent response';
      }
    } finally {
      this.messages = this.messages.map((msg) =>
        msg.id === botMessageId ? { ...msg, isThinking: false, isStreaming: false } : msg
      );
      this.isSending = false;
      this.abortController = null;
      await this.scrollToBottom();
    }
  }

  async sendMessage(
    selectedThreadId?: string | null,
    onNewConversationCreated?: (threadId: string) => void
  ): Promise<void> {
    const query = this.inputQuery.trim();
    if (!query || this.isSending) return;

    this.inputQuery = '';
    this.sendError = null;
    if (this.textareaRef) {
      this.textareaRef.style.height = '44px';
    }

    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: query,
      createdAt: new Date(),
    };

    this.messages = [...this.messages, tempUserMessage];
    await this.scrollToBottom();

    const botMessageId = `bot-${Date.now()}`;
    const botPlaceholder: ChatMessage = {
      id: botMessageId,
      role: 'assistant',
      content: '',
      thinking: '',
      isThinking: true,
      isStreaming: true,
      createdAt: new Date(),
    };
    this.messages = [...this.messages, botPlaceholder];
    await this.scrollToBottom();

    this.isSending = true;
    this.abortController = new AbortController();

    try {
      const payload: { query: string; threadId?: string } = {
        query,
      };
      if (selectedThreadId) {
        payload.threadId = selectedThreadId;
      }

      await chatWithAgentStream(
        payload,
        {
          onMetadata: (meta) => {
            if (!selectedThreadId && meta.threadId) {
              this.activeThreadId = meta.threadId;
              onNewConversationCreated?.(meta.threadId);
            }
          },
          onThinking: (_chunk, accumulated) => {
            this.messages = this.messages.map((msg) =>
              msg.id === botMessageId
                ? { ...msg, thinking: accumulated, isThinking: true, isStreaming: true }
                : msg
            );
            this.scrollToBottom();
          },
          onAnswer: (_chunk, accumulated) => {
            this.messages = this.messages.map((msg) =>
              msg.id === botMessageId
                ? { ...msg, content: accumulated, isThinking: false, isStreaming: true }
                : msg
            );
            this.scrollToBottom();
          },
          onError: (err) => {
            this.sendError = err;
          },
          onDone: () => {
            this.messages = this.messages.map((msg) =>
              msg.id === botMessageId ? { ...msg, isThinking: false, isStreaming: false } : msg
            );
            this.scrollToBottom();
          },
        },
        this.abortController.signal
      );
    } catch (err: unknown) {
      if (!(err instanceof Error && err.name === 'AbortError')) {
        this.sendError = err instanceof Error ? err.message : 'Failed to get agent response';
      }
    } finally {
      this.messages = this.messages.map((msg) =>
        msg.id === botMessageId ? { ...msg, isThinking: false, isStreaming: false } : msg
      );
      this.isSending = false;
      this.abortController = null;
      await this.scrollToBottom();
    }
  }

  handleKeydown(
    event: KeyboardEvent,
    selectedThreadId?: string | null,
    onNewConversationCreated?: (threadId: string) => void
  ): void {
    if (event.key === 'Escape' && this.isSending) {
      event.preventDefault();
      this.stopGeneration();
      return;
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage(selectedThreadId, onNewConversationCreated);
    }
  }

  handleSuggestionClick(
    suggestion: string,
    selectedThreadId?: string | null,
    onNewConversationCreated?: (threadId: string) => void
  ): void {
    this.inputQuery = suggestion;
    this.sendMessage(selectedThreadId, onNewConversationCreated);
  }
}
