<script lang="ts">
  import type { ChatAreaProps } from '$lib/types/chat.types';
  import MessageBubble from '$lib/components/MessageBubble.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { chat } from '$lib/state/chat.svelte';
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

  $effect(() => {
    chat.syncThread(selectedThreadId);
  });
</script>

<main class="bg-background relative flex h-full flex-1 flex-col overflow-hidden">
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

  <div
    class="relative min-h-0 flex-1 overflow-y-auto"
    bind:this={chat.scrollContainer}
    onscroll={() => chat.handleScroll()}
  >
    {#if !selectedThreadId && chat.messages.length === 0 && !chat.isLoadingHistory}
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

          <div class="grid w-full grid-cols-1 gap-3 pt-2 text-left sm:grid-cols-2">
            <button
              type="button"
              class="bg-card hover:bg-muted/50 border-border/80 flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 text-left transition-all hover:shadow-xs"
              onclick={() =>
                chat.handleSuggestionClick(
                  'What is the Universal Law of Gravitation?',
                  selectedThreadId,
                  onNewConversationCreated
                )}
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
              class="bg-card hover:bg-muted/50 border-border/80 flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 text-left transition-all hover:shadow-xs"
              onclick={() =>
                chat.handleSuggestionClick(
                  "Explain Newton's Laws of Motion with real examples",
                  selectedThreadId,
                  onNewConversationCreated
                )}
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
              class="bg-card hover:bg-muted/50 border-border/80 flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 text-left transition-all hover:shadow-xs"
              onclick={() =>
                chat.handleSuggestionClick(
                  'Derive the kinematic equations of motion',
                  selectedThreadId,
                  onNewConversationCreated
                )}
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
              class="bg-card hover:bg-muted/50 border-border/80 flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 text-left transition-all hover:shadow-xs"
              onclick={() =>
                chat.handleSuggestionClick(
                  'What is the difference between mass and weight?',
                  selectedThreadId,
                  onNewConversationCreated
                )}
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
      <div class="mx-auto flex min-h-full max-w-3xl flex-col px-3 py-6 sm:px-6">
        {#if chat.isLoadingHistory}
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
        {:else if chat.historyError}
          <div class="my-auto space-y-3 p-6 text-center">
            <div
              class="bg-destructive/10 text-destructive inline-flex size-12 items-center justify-center rounded-full"
            >
              <AlertCircle class="size-6" />
            </div>
            <h3 class="text-foreground text-sm font-semibold">Could not load chat</h3>
            <p class="text-muted-foreground mx-auto max-w-sm text-xs">{chat.historyError}</p>
            {#if selectedThreadId}
              <Button variant="outline" size="sm" onclick={() => chat.loadThread(selectedThreadId)}>
                <RefreshCw class="mr-1.5 size-3.5" />
                Try Again
              </Button>
            {/if}
          </div>
        {:else if chat.messages.length === 0}
          <div class="text-muted-foreground my-auto p-8 text-center text-xs">
            Send a message to start this conversation.
          </div>
        {:else}
          <div class="space-y-6 pb-8 sm:space-y-8">
            {#each chat.messages as msg (msg.id)}
              <MessageBubble
                id={msg.id}
                role={msg.role}
                content={msg.content}
                thinking={msg.thinking}
                isThinking={msg.isThinking}
                isStreaming={msg.isStreaming}
                createdAt={msg.createdAt}
                onDelete={(id) => chat.deleteMessage(id)}
                onRetry={(id) =>
                  chat.retryAssistantMessage(id, selectedThreadId, onNewConversationCreated)}
                isDeleting={chat.deletingMessageId === msg.id}
              />
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  {#if chat.showScrollBottomBtn}
    <div class="absolute right-6 bottom-28 z-20">
      <Button
        variant="secondary"
        size="icon-xs"
        class="bg-background/90 text-foreground hover:bg-background size-8 rounded-full border shadow-md backdrop-blur-xs"
        onclick={() => chat.scrollToBottom(true)}
        aria-label="Scroll to bottom"
      >
        <ArrowDown class="size-4" />
      </Button>
    </div>
  {/if}

  {#if chat.sendError}
    <div class="mx-auto w-full max-w-3xl px-4 pb-2">
      <div
        class="bg-destructive/10 border-destructive/20 text-destructive flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs"
      >
        <div class="flex items-center gap-2">
          <AlertCircle class="size-4 shrink-0" />
          <span>{chat.sendError}</span>
        </div>
        <Button
          variant="ghost"
          size="xs"
          onclick={() => chat.sendMessage(selectedThreadId, onNewConversationCreated)}
        >
          Retry
        </Button>
      </div>
    </div>
  {/if}

  <div class="from-background via-background/90 bg-gradient-to-t to-transparent p-3 pt-1 sm:p-4">
    <div class="mx-auto max-w-3xl">
      <form
        onsubmit={(e) => {
          e.preventDefault();
          chat.sendMessage(selectedThreadId, onNewConversationCreated);
        }}
        class="bg-muted/40 focus-within:bg-background focus-within:border-primary/40 focus-within:ring-primary/10 border-border/80 relative flex items-end gap-2 rounded-3xl border p-1.5 shadow-xs transition-all focus-within:ring-3"
      >
        <textarea
          bind:this={chat.textareaRef}
          bind:value={chat.inputQuery}
          oninput={() => chat.adjustTextareaHeight()}
          onkeydown={(e) => chat.handleKeydown(e, selectedThreadId, onNewConversationCreated)}
          placeholder="Ask anything about NCERT Science & Physics..."
          rows={1}
          class="text-foreground placeholder:text-muted-foreground/70 max-h-48 min-h-[44px] flex-1 resize-none bg-transparent px-3.5 py-2.5 text-sm leading-relaxed outline-none"
        ></textarea>

        <div class="flex items-center pr-1 pb-1">
          {#if chat.isSending}
            <Button
              type="button"
              variant="default"
              size="icon-xs"
              class="bg-foreground text-background hover:bg-foreground/90 flex size-8.5 cursor-pointer items-center justify-center rounded-full shadow-xs transition-all hover:scale-105 active:scale-95"
              onclick={() => chat.stopGeneration()}
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
              disabled={!chat.inputQuery.trim()}
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
