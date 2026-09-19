import { tick } from 'svelte';
import type { ChatMessage, Message, SelectedFile } from '$lib/types/chat.types';
import { chatWithAgentStream, getConversation, deleteMessage } from '$lib/api/agents';
import { toast } from '$lib/state/toast.svelte';

export class ChatState {
  messages = $state<ChatMessage[]>([]);
  inputQuery = $state('');
  selectedFile = $state<SelectedFile | null>(null);
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

  clearSelectedFile(): void {
    if (this.selectedFile?.previewUrl) {
      URL.revokeObjectURL(this.selectedFile.previewUrl);
    }
    this.selectedFile = null;
  }

  async handleFileSelect(file: File): Promise<void> {
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'tiff'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const contentType = file.type || '';
    const isImage =
      contentType.startsWith('image/') ||
      (!!ext && ext !== 'pdf' && allowedExtensions.includes(ext));
    const isPdf = contentType === 'application/pdf' || ext === 'pdf';

    if (!isImage && !isPdf) {
      toast.error('Only PDF and image files (PNG, JPG, WebP, SVG, PDF, etc.) are allowed');
      return;
    }

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          const commaIdx = res.indexOf(',');
          resolve(commaIdx !== -1 ? res.slice(commaIdx + 1) : res);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      let previewUrl: string | undefined = undefined;
      if (isImage) {
        previewUrl = URL.createObjectURL(file);
      }

      this.clearSelectedFile();
      this.selectedFile = {
        file,
        name: file.name,
        contentType: contentType || (isPdf ? 'application/pdf' : `image/${ext}`),
        base64,
        previewUrl,
        isImage,
        size: file.size,
      };
    } catch (_e: unknown) {
      toast.error('Failed to process file');
    }
  }

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

      console.log(`[Thread Load] Thread ${threadId} loaded with ${this.messages.length} messages.`);
      this.messages.forEach((msg) => {
        if (msg.content) {
          const matches = msg.content.match(/\[Attached Media URL: (.*?) \|/g);
          if (matches) {
            console.log(`[Thread Load Media] Message ${msg.id} contains media URLs:`, matches);
          }
        }
      });

      await this.scrollToBottom();
    } catch (err: unknown) {
      this.historyError = err instanceof Error ? err.message : 'Failed to load conversation';
      this.messages = [];
    } finally {
      this.isLoadingHistory = false;
    }
  }

  reset(): void {
    this.stopGeneration();
    this.clearSelectedFile();
    this.messages = [];
    this.inputQuery = '';
    this.isLoadingHistory = false;
    this.historyError = null;
    this.sendError = null;
    this.activeThreadId = null;
    if (this.textareaRef) {
      this.textareaRef.style.height = '44px';
    }
  }

  syncThread(selectedThreadId: string | null): void {
    if (selectedThreadId === this.activeThreadId) return;

    if (!selectedThreadId) {
      if (!this.isSending && this.activeThreadId !== null) {
        this.reset();
      }
      return;
    }

    if (this.isSending) {
      this.activeThreadId = selectedThreadId;
      return;
    }

    this.stopGeneration();
    this.activeThreadId = selectedThreadId;
    this.loadThread(selectedThreadId);
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

      let createdThreadId: string | null = null;

      await chatWithAgentStream(
        payload,
        {
          onMetadata: (meta) => {
            if (meta.threadId) {
              this.activeThreadId = meta.threadId;
              if (!activeId) {
                createdThreadId = meta.threadId;
                if (typeof window !== 'undefined') {
                  window.history.replaceState(window.history.state, '', `/c/${meta.threadId}`);
                }
              }
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
            if (createdThreadId) {
              onNewConversationCreated?.(createdThreadId);
            }
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
    if ((!query && !this.selectedFile) || this.isSending) return;

    const currentFile = this.selectedFile;
    this.inputQuery = '';
    this.clearSelectedFile();
    this.sendError = null;
    if (this.textareaRef) {
      this.textareaRef.style.height = '44px';
    }

    const displayQuery = query || (currentFile ? `[Attached File: ${currentFile.name}]` : '');

    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: displayQuery,
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
      const payload: {
        query: string;
        threadId?: string;
        files?: { filename: string; contentType: string; base64: string }[];
      } = {
        query: displayQuery,
      };

      if (currentFile) {
        payload.files = [
          {
            filename: currentFile.name,
            contentType: currentFile.contentType,
            base64: currentFile.base64,
          },
        ];
      }

      const activeId = selectedThreadId || this.activeThreadId;
      if (activeId) {
        payload.threadId = activeId;
      }

      let createdThreadId: string | null = null;

      await chatWithAgentStream(
        payload,
        {
          onMetadata: (meta) => {
            if (meta.threadId) {
              this.activeThreadId = meta.threadId;
              if (!activeId) {
                createdThreadId = meta.threadId;
                if (typeof window !== 'undefined') {
                  window.history.replaceState(window.history.state, '', `/c/${meta.threadId}`);
                }
              }
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
            if (createdThreadId) {
              onNewConversationCreated?.(createdThreadId);
            }
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

export const chat = new ChatState();
