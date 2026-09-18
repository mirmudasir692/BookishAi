<script lang="ts">
  import type { SidebarProps } from '$lib/types/chat';
  import ConversationItem from '$lib/components/ConversationItem.svelte';
  import { Button } from '$lib/components/ui/button';
  import { ScrollArea } from '$lib/components/ui/scroll-area';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { Separator } from '$lib/components/ui/separator';
  import { Plus, Sparkles, AlertCircle, RefreshCw } from '@lucide/svelte';

  let {
    selectedThreadId,
    conversations,
    isLoading,
    errorMessage = null,
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
</script>

<aside class="bg-muted/20 flex h-full w-64 flex-col border-r select-none md:w-72">
  <div class="flex items-center justify-between gap-2 p-3 pb-2">
    <div class="flex items-center gap-2 px-1">
      <div
        class="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg text-xs font-semibold"
      >
        <Sparkles class="size-4" />
      </div>
      <span class="text-foreground text-sm font-semibold tracking-tight">Bookish AI</span>
    </div>
    {#if onRefresh}
      <Button
        variant="ghost"
        size="icon-xs"
        class="text-muted-foreground hover:text-foreground"
        onclick={onRefresh}
        disabled={isLoading}
        aria-label="Refresh conversations"
      >
        <RefreshCw class="size-3.5 {isLoading ? 'animate-spin' : ''}" />
      </Button>
    {/if}
  </div>

  <div class="p-3 pt-1">
    <Button
      variant="outline"
      class="w-full justify-start gap-2 border-dashed text-sm font-medium shadow-xs hover:border-solid"
      onclick={onNewChat}
    >
      <Plus class="size-4" />
      <span>New Chat</span>
    </Button>
  </div>

  <Separator class="my-1 opacity-50" />

  <div class="text-muted-foreground px-3 py-1.5 text-xs font-semibold tracking-wider uppercase">
    Conversations
  </div>

  <div class="min-h-0 flex-1 overflow-hidden">
    <ScrollArea class="h-full px-2">
      {#if isLoading && conversations.length === 0}
        <div class="space-y-2 p-1">
          <Skeleton class="h-9 w-full rounded-md" />
          <Skeleton class="h-9 w-full rounded-md" />
          <Skeleton class="h-9 w-full rounded-md" />
          <Skeleton class="h-9 w-full rounded-md" />
        </div>
      {:else if errorMessage}
        <div class="space-y-2 p-3 text-center">
          <div class="text-destructive flex items-center justify-center gap-1.5 text-xs">
            <AlertCircle class="size-4" />
            <span>{errorMessage}</span>
          </div>
          {#if onRefresh}
            <Button variant="ghost" size="xs" onclick={onRefresh}>Retry</Button>
          {/if}
        </div>
      {:else if conversations.length === 0}
        <div class="text-muted-foreground px-4 py-8 text-center text-xs">
          No conversations yet. Start a new chat to begin!
        </div>
      {:else}
        <div class="space-y-1 p-1">
          {#each conversations as thread (thread.id)}
            <ConversationItem
              {thread}
              isSelected={selectedThreadId === thread.id}
              onSelect={onSelectThread}
              onDelete={handleDelete}
              isDeleting={deletingThreadId === thread.id}
            />
          {/each}
        </div>
      {/if}
    </ScrollArea>
  </div>
</aside>
