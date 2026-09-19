import { tick } from 'svelte';
import type { ChatMessage, Message } from '$lib/types/chat.types';
import { chatWithAgentStream, getConversation } from '$lib/api/agents';

export class ChatState {
  messages = $state<ChatMessage[]>([]);
  inputQuery = $state('');
  isLoadingHistory = $state(false);
  isSending = $state(false);
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
