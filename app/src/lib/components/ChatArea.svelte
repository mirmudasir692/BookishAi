<script lang="ts">
  import { tick } from 'svelte';
  import type { ChatAreaProps, Message } from '$lib/types/chat';
  import MessageBubble from '$lib/components/MessageBubble.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { chatWithAgentStream, getConversation } from '$lib/api/agents';
  import {
    Send,
    Sparkles,
    BookOpen,
    Atom,
    Compass,
    AlertCircle,
    RefreshCw,
    Menu,
    Plus,
    Square,
    ArrowDown,
  } from '@lucide/svelte';

  let {
    selectedThreadId,
    onNewConversationCreated,
    onStartNewChat,
    onToggleMobileSidebar,
  }: ChatAreaProps = $props();

  let messages = $state<Message[]>([]);
  let inputQuery = $state('');
  let isLoadingHistory = $state(false);
  let isSending = $state(false);
  let historyError = $state<string | null>(null);
  let sendError = $state<string | null>(null);
  let scrollContainer = $state<HTMLDivElement | null>(null);
  let textareaRef = $state<HTMLTextAreaElement | null>(null);
  let showScrollBottomBtn = $state(false);

  let activeThreadId: string | null = null;
  let abortController: AbortController | null = null;

  async function scrollToBottom(smooth = false) {
    await tick();
    if (scrollContainer) {
      if (smooth) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth',
        });
      } else {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }

  function handleScroll() {
    if (!scrollContainer) return;
    const distanceToBottom =
      scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;
    showScrollBottomBtn = distanceToBottom > 150;
  }

  function adjustTextareaHeight() {
    if (!textareaRef) return;
    textareaRef.style.height = 'auto';
    const newHeight = Math.min(textareaRef.scrollHeight, 200);
    textareaRef.style.height = `${Math.max(newHeight, 44)}px`;
  }

  async function loadThread(threadId: string) {
    isLoadingHistory = true;
    historyError = null;
    try {
      const res = await getConversation(threadId);
      messages = res.messages ?? [];
      await scrollToBottom();
    } catch (err: unknown) {
      historyError = err instanceof Error ? err.message : 'Failed to load conversation';
      messages = [];
    } finally {
      isLoadingHistory = false;
    }
  }

  $effect(() => {
    const threadId = selectedThreadId;
    if (threadId === activeThreadId) return;

    activeThreadId = threadId;

    if (threadId) {
      if (!isSending) {
        loadThread(threadId);
      }
    } else {
      if (!isSending) {
        messages = [];
        historyError = null;
        sendError = null;
      }
    }
  });

  function handleStopGeneration() {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    isSending = false;
    messages = messages.map((msg) =>
      (msg as any).isStreaming ? { ...msg, isThinking: false, isStreaming: false } : msg
    );
  }

  async function handleSendMessage(event?: Event) {
    if (event) event.preventDefault();
    const query = inputQuery.trim();
    if (!query || isSending) return;

    inputQuery = '';
    sendError = null;
    if (textareaRef) {
      textareaRef.style.height = '44px';
    }

    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: query,
      createdAt: new Date(),
    };

    messages = [...messages, tempUserMessage];
    await scrollToBottom();

    const botMessageId = `bot-${Date.now()}`;
    messages = [
      ...messages,
      {
        id: botMessageId,
        role: 'assistant',
        content: '',
        thinking: '',
        isThinking: true,
        isStreaming: true,
        createdAt: new Date(),
      } as Message & { thinking?: string; isThinking?: boolean; isStreaming?: boolean },
    ];
    await scrollToBottom();

    isSending = true;
    abortController = new AbortController();

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
              activeThreadId = meta.threadId;
              onNewConversationCreated?.(meta.threadId);
            }
          },
          onThinking: (_chunk, accumulated) => {
            messages = messages.map((msg) =>
              msg.id === botMessageId
                ? { ...msg, thinking: accumulated, isThinking: true, isStreaming: true }
                : msg
            );
            scrollToBottom();
          },
          onAnswer: (_chunk, accumulated) => {
            messages = messages.map((msg) =>
              msg.id === botMessageId
                ? { ...msg, content: accumulated, isThinking: false, isStreaming: true }
                : msg
            );
            scrollToBottom();
          },
          onError: (err) => {
            sendError = err;
          },
          onDone: () => {
            messages = messages.map((msg) =>
              msg.id === botMessageId ? { ...msg, isThinking: false, isStreaming: false } : msg
            );
            scrollToBottom();
          },
        },
        abortController.signal
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User stopped generation
      } else {
        sendError = err instanceof Error ? err.message : 'Failed to get agent response';
      }
    } finally {
      messages = messages.map((msg) =>
        msg.id === botMessageId ? { ...msg, isThinking: false, isStreaming: false } : msg
      );
      isSending = false;
      abortController = null;
      await scrollToBottom();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isSending) {
      event.preventDefault();
      handleStopGeneration();
      return;
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }

  function handleSuggestionClick(suggestion: string) {
    inputQuery = suggestion;
    handleSendMessage();
  }
</script>

<main class="bg-background relative flex h-full flex-1 flex-col overflow-hidden">
  <!-- Top Navigation Bar -->
  <header
    class="border-border/60 bg-background/80 flex h-14 shrink-0 items-center justify-between border-b px-3.5 backdrop-blur-md"
  >
    <div class="flex items-center gap-2">
      {#if onToggleMobileSidebar}
        <Button
          variant="ghost"
          size="icon-xs"
          class="text-muted-foreground hover:text-foreground size-8 rounded-lg md:hidden"
          onclick={onToggleMobileSidebar}
          aria-label="Open sidebar"
        >
          <Menu class="size-4" />
        </Button>
      {/if}
      <div class="flex items-center gap-2">
        <span class="text-foreground text-sm font-semibold tracking-tight">Bookish AI</span>
        <span
          class="bg-primary/10 text-primary border-primary/20 hidden rounded-full border px-2 py-0.5 text-[10px] font-medium sm:inline-block"
        >
          NCERT Physics & Science
        </span>
      </div>
    </div>

    <div class="flex items-center gap-1.5">
      {#if onStartNewChat}
        <Button
          variant="ghost"
          size="sm"
          class="text-muted-foreground hover:text-foreground gap-1.5 rounded-lg text-xs"
          onclick={onStartNewChat}
        >
          <Plus class="size-3.5" />
          <span class="hidden sm:inline">New chat</span>
        </Button>
      {/if}
    </div>
  </header>

  <!-- Chat Content View -->
  <div
    class="relative min-h-0 flex-1 overflow-y-auto"
    bind:this={scrollContainer}
    onscroll={handleScroll}
  >
    {#if !selectedThreadId && messages.length === 0 && !isLoadingHistory}
      <!-- Modern Empty State (ChatGPT style) -->
      <div
        class="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center px-4 py-12 text-center"
      >
        <div class="flex flex-col items-center space-y-6">
          <div
            class="bg-primary/10 text-primary border-primary/20 flex size-14 items-center justify-center rounded-2xl border shadow-sm"
          >
            <Sparkles class="size-7" />
          </div>

          <div class="space-y-2">
            <h1 class="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              What can I help you learn today?
            </h1>
            <p class="text-muted-foreground mx-auto max-w-md text-xs sm:text-sm">
              Ask any question on physics formulas, NCERT concepts, derivations, or problem-solving.
            </p>
          </div>

          <!-- Quick Suggestion Cards -->
          <div class="grid w-full grid-cols-1 gap-3 pt-2 text-left sm:grid-cols-2">
            <button
              type="button"
              class="bg-card hover:bg-muted/50 border-border/80 flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all hover:shadow-xs"
              onclick={() => handleSuggestionClick('What is the Universal Law of Gravitation?')}
            >
              <div
                class="bg-primary/10 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl"
              >
                <Atom class="size-4" />
              </div>
              <div>
                <div class="text-foreground text-xs font-semibold">Law of Gravitation</div>
                <div class="text-muted-foreground line-clamp-1 text-[11px]">
                  Formula, derivation & physical significance
                </div>
              </div>
            </button>

            <button
              type="button"
              class="bg-card hover:bg-muted/50 border-border/80 flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all hover:shadow-xs"
              onclick={() =>
                handleSuggestionClick("Explain Newton's Laws of Motion with real examples")}
            >
              <div
                class="bg-primary/10 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl"
              >
                <BookOpen class="size-4" />
              </div>
              <div>
                <div class="text-foreground text-xs font-semibold">Laws of Motion</div>
                <div class="text-muted-foreground line-clamp-1 text-[11px]">
                  1st, 2nd, and 3rd laws with everyday applications
                </div>
              </div>
            </button>

            <button
              type="button"
              class="bg-card hover:bg-muted/50 border-border/80 flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all hover:shadow-xs"
              onclick={() => handleSuggestionClick('Derive the kinematic equations of motion')}
            >
              <div
                class="bg-primary/10 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl"
              >
                <Compass class="size-4" />
              </div>
              <div>
                <div class="text-foreground text-xs font-semibold">Equations of Motion</div>
                <div class="text-muted-foreground line-clamp-1 text-[11px]">
                  Step-by-step calculus and algebraic derivations
                </div>
              </div>
            </button>

            <button
              type="button"
              class="bg-card hover:bg-muted/50 border-border/80 flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all hover:shadow-xs"
              onclick={() =>
                handleSuggestionClick('What is the difference between mass and weight?')}
            >
              <div
                class="bg-primary/10 text-primary mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl"
              >
                <Sparkles class="size-4" />
              </div>
              <div>
                <div class="text-foreground text-xs font-semibold">Mass vs Weight</div>
                <div class="text-muted-foreground line-clamp-1 text-[11px]">
                  Key conceptual differences & SI units
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    {:else}
      <!-- Streamed Message Flow -->
      <div class="mx-auto flex min-h-full max-w-3xl flex-col px-3 py-6 sm:px-6">
        {#if isLoadingHistory}
          <div class="space-y-6 py-4">
            <div class="flex gap-3">
              <Skeleton class="size-7.5 shrink-0 rounded-lg" />
              <div class="flex-1 space-y-2">
                <Skeleton class="h-4 w-28 rounded-md" />
                <Skeleton class="h-16 w-3/4 rounded-xl" />
              </div>
            </div>
            <div class="flex flex-row-reverse gap-3">
              <div class="flex flex-1 flex-col items-end space-y-2">
                <Skeleton class="h-10 w-1/2 rounded-2xl" />
              </div>
            </div>
          </div>
        {:else if historyError}
          <div class="my-auto space-y-3 p-6 text-center">
            <div
              class="bg-destructive/10 text-destructive inline-flex size-12 items-center justify-center rounded-full"
            >
              <AlertCircle class="size-6" />
            </div>
            <h3 class="text-foreground text-sm font-semibold">Could not load chat</h3>
            <p class="text-muted-foreground mx-auto max-w-sm text-xs">{historyError}</p>
            {#if selectedThreadId}
              <Button variant="outline" size="sm" onclick={() => loadThread(selectedThreadId)}>
                <RefreshCw class="mr-1.5 size-3.5" />
                Try Again
              </Button>
            {/if}
          </div>
        {:else if messages.length === 0}
          <div class="text-muted-foreground my-auto p-8 text-center text-xs">
            Send a message to start this conversation.
          </div>
        {:else}
          <div class="space-y-6 pb-8 sm:space-y-8">
            {#each messages as msg (msg.id)}
              <MessageBubble
                role={msg.role}
                content={msg.content}
                thinking={(msg as any).thinking}
                isThinking={(msg as any).isThinking}
                isStreaming={(msg as any).isStreaming}
                createdAt={msg.createdAt}
              />
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Scroll To Bottom Floating Button -->
  {#if showScrollBottomBtn}
    <div class="absolute right-6 bottom-28 z-20">
      <Button
        variant="secondary"
        size="icon-xs"
        class="bg-background/90 text-foreground hover:bg-background size-8 rounded-full border shadow-md backdrop-blur-xs"
        onclick={() => scrollToBottom(true)}
        aria-label="Scroll to bottom"
      >
        <ArrowDown class="size-4" />
      </Button>
    </div>
  {/if}

  <!-- Error notification if sending failed -->
  {#if sendError}
    <div class="mx-auto w-full max-w-3xl px-4 pb-2">
      <div
        class="bg-destructive/10 border-destructive/20 text-destructive flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs"
      >
        <div class="flex items-center gap-2">
          <AlertCircle class="size-4 shrink-0" />
          <span>{sendError}</span>
        </div>
        <Button variant="ghost" size="xs" onclick={() => handleSendMessage()}>Retry</Button>
      </div>
    </div>
  {/if}

  <!-- Floating Bottom Input Area (ChatGPT style) -->
  <div class="from-background via-background/90 bg-gradient-to-t to-transparent p-3 pt-1 sm:p-4">
    <div class="mx-auto max-w-3xl">
      <form
        onsubmit={handleSendMessage}
        class="bg-muted/40 focus-within:bg-background focus-within:border-primary/40 focus-within:ring-primary/10 border-border/80 relative flex items-end gap-2 rounded-3xl border p-1.5 shadow-xs transition-all focus-within:ring-3"
      >
        <textarea
          bind:this={textareaRef}
          bind:value={inputQuery}
          oninput={adjustTextareaHeight}
          onkeydown={handleKeydown}
          placeholder="Ask anything about NCERT Science & Physics..."
          rows={1}
          class="text-foreground placeholder:text-muted-foreground/70 max-h-48 min-h-[44px] flex-1 resize-none bg-transparent px-3.5 py-2.5 text-sm leading-relaxed outline-none"
        ></textarea>

        <div class="flex items-center pr-1 pb-1">
          {#if isSending}
            <Button
              type="button"
              variant="default"
              size="icon-xs"
              class="bg-foreground text-background hover:bg-foreground/90 flex size-8.5 cursor-pointer items-center justify-center rounded-full shadow-xs transition-all hover:scale-105 active:scale-95"
              onclick={handleStopGeneration}
              title="Stop generating (Esc)"
              aria-label="Stop response"
            >
              <Square class="size-3.5 fill-current" />
            </Button>
          {:else}
            <Button
              type="submit"
              variant="default"
              size="icon-xs"
              disabled={!inputQuery.trim()}
              class="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground/50 size-8.5 cursor-pointer rounded-full shadow-xs transition-transform active:scale-95"
              aria-label="Send message"
            >
              <Send class="size-3.5" />
            </Button>
          {/if}
        </div>
      </form>

      <div class="text-muted-foreground/60 mt-1.5 px-2 text-center text-[10.5px]">
        Bookish AI is an AI tutor. Check important equations and concepts with official NCERT
        textbooks.
      </div>
    </div>
  </div>
</main>
