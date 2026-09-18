<script lang="ts">
  import type { SidebarProps } from '$lib/types/chat';
  import ConversationItem from '$lib/components/ConversationItem.svelte';
  import { Button } from '$lib/components/ui/button';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { Separator } from '$lib/components/ui/separator';
  import { Plus, Sparkles, AlertCircle, RefreshCw, X, MessageSquarePlus } from '@lucide/svelte';

  let {
    selectedThreadId,
    conversations,
    isLoading,
    errorMessage = null,
    isOpenMobile = false,
    onCloseMobile,
    onSelectThread,
    onNewChat,
    onDeleteThread,
    onRefresh,
  }: SidebarProps = $props();

  let deletingThreadId = $state<string | null>(null);

  async function handleDelete(threadId: string) {
    deletingThreadId = threadId;
    try {
      await onDeleteThread(threadId);
    } finally {
      deletingThreadId = null;
    }
  }

  function handleSelect(threadId: string) {
    onSelectThread(threadId);
    onCloseMobile?.();
  }

  function handleNew() {
    onNewChat();
    onCloseMobile?.();
  }
</script>

<!-- Backdrop overlay for mobile drawer -->
{#if isOpenMobile}
  <button
    type="button"
    class="bg-background/80 fixed inset-0 z-40 backdrop-blur-xs transition-opacity md:hidden"
    onclick={onCloseMobile}
    aria-label="Close menu"
  ></button>
{/if}

<aside
  class="bg-sidebar bg-muted/30 border-border/80 fixed inset-y-0 left-0 z-50 flex h-full w-72 flex-col border-r transition-transform duration-300 ease-in-out md:static md:z-auto md:w-68 md:translate-x-0 lg:w-72 {isOpenMobile
    ? 'translate-x-0 shadow-2xl'
    : '-translate-x-full'}"
>
  <!-- Header with Brand & Close Button (on mobile) -->
  <div class="flex items-center justify-between p-3.5 pb-2">
    <div class="flex items-center gap-2.5 px-1">
      <div
        class="bg-primary text-primary-foreground flex size-7.5 items-center justify-center rounded-lg shadow-2xs"
      >
        <Sparkles class="size-4" />
      </div>
      <div class="flex flex-col">
        <span class="text-foreground text-sm font-semibold tracking-tight">Bookish AI</span>
        <span class="text-muted-foreground/70 text-[10px]">NCERT & Science Tutor</span>
      </div>
    </div>

    <div class="flex items-center gap-1">
      {#if onRefresh}
        <Button
          variant="ghost"
          size="icon-xs"
          class="text-muted-foreground hover:text-foreground size-7 rounded-md"
          onclick={onRefresh}
          disabled={isLoading}
          aria-label="Refresh conversations"
        >
          <RefreshCw class="size-3.5 {isLoading ? 'animate-spin' : ''}" />
        </Button>
      {/if}
      {#if onCloseMobile}
        <Button
          variant="ghost"
          size="icon-xs"
          class="text-muted-foreground hover:text-foreground size-7 rounded-md md:hidden"
          onclick={onCloseMobile}
          aria-label="Close sidebar"
        >
          <X class="size-4" />
        </Button>
      {/if}
    </div>
  </div>

  <!-- New Chat Action -->
  <div class="px-3 py-2">
    <Button
      variant="outline"
      class="bg-background/80 hover:bg-secondary border-border/80 text-foreground w-full justify-between gap-2 rounded-xl px-3 py-5 text-sm font-medium shadow-2xs transition-all hover:border-solid"
      onclick={handleNew}
    >
      <div class="flex items-center gap-2.5">
        <Plus class="size-4" />
        <span>New Chat</span>
      </div>
      <span class="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 font-mono text-[10px]"
        >⌘K</span
      >
    </Button>
  </div>

  <div
    class="text-muted-foreground/80 flex items-center justify-between px-4 pt-3 pb-1.5 text-[11px] font-semibold tracking-wider uppercase"
  >
    <span>Recent Chats</span>
    {#if conversations.length > 0}
      <span class="text-muted-foreground/60 font-mono text-[10px]">{conversations.length}</span>
    {/if}
  </div>

  <!-- Conversations List -->
  <div class="min-h-0 flex-1 overflow-hidden">
    <ScrollArea class="h-full px-2.5">
      {#if isLoading && conversations.length === 0}
        <div class="space-y-2 p-1">
          <Skeleton class="h-9 w-full rounded-xl" />
          <Skeleton class="h-9 w-full rounded-xl" />
          <Skeleton class="h-9 w-full rounded-xl" />
          <Skeleton class="h-9 w-full rounded-xl" />
        </div>
      {:else if errorMessage}
        <div class="space-y-2 p-3 text-center">
          <div class="text-destructive flex items-center justify-center gap-1.5 text-xs">
            <AlertCircle class="size-4" />
            <span class="line-clamp-2">{errorMessage}</span>
          </div>
          {#if onRefresh}
            <Button variant="ghost" size="xs" onclick={onRefresh}>Retry</Button>
          {/if}
        </div>
      {:else if conversations.length === 0}
        <div class="text-muted-foreground/70 px-4 py-8 text-center text-xs">
          No conversations yet.<br />Start a new chat to begin!
        </div>
      {:else}
        <div class="space-y-1 p-1">
          {#each conversations as thread (thread.id)}
            <ConversationItem
              {thread}
              isSelected={selectedThreadId === thread.id}
              onSelect={handleSelect}
              onDelete={handleDelete}
              isDeleting={deletingThreadId === thread.id}
            />
          {/each}
        </div>
      {/if}
    </ScrollArea>
  </div>

  <!-- Footer status -->
  <div class="border-border/60 bg-muted/20 border-t p-3">
    <div class="flex items-center justify-between px-1 text-xs">
      <div class="flex items-center gap-2">
        <span class="inline-block size-2 rounded-full bg-emerald-500"></span>
        <span class="text-muted-foreground text-xs font-medium">Model Active</span>
      </div>
      <span class="text-muted-foreground/60 font-mono text-[11px]">v1.0</span>
    </div>
  </div>
</aside>
