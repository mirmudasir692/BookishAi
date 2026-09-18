<script lang="ts">
  import type { ConversationItemProps } from '$lib/types/chat';
  import { Button } from '$lib/components/ui/button';
  import { Trash2, MessageSquare, Loader2 } from '@lucide/svelte';

  let {
    thread,
    isSelected,
    onSelect,
    onDelete,
    isDeleting = false,
  }: ConversationItemProps = $props();

  function handleSelect() {
    onSelect(thread.id);
  }

  function handleDelete(event: MouseEvent) {
    event.stopPropagation();
    onDelete(thread.id);
  }

  const displayTitle = $derived(thread.title || 'Untitled Chat');
</script>

<div
  class="group relative flex w-full items-center rounded-xl transition-all duration-150 {isSelected
    ? 'bg-secondary text-secondary-foreground font-medium shadow-2xs'
    : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'}"
>
  <button
    type="button"
    class="flex w-full items-center gap-2.5 truncate px-3 py-2.5 pr-8 text-left text-xs font-normal select-none"
    onclick={handleSelect}
  >
    <MessageSquare class="size-3.5 shrink-0 opacity-70" />
    <span class="truncate">{displayTitle}</span>
  </button>

  <div
    class="absolute top-1/2 right-1.5 -translate-y-1/2 {isSelected
      ? 'opacity-100'
      : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'} transition-opacity"
  >
    <Button
      variant="ghost"
      size="icon-xs"
      class="text-muted-foreground hover:text-destructive hover:bg-destructive/10 size-6.5 rounded-lg"
      onclick={handleDelete}
      disabled={isDeleting}
      aria-label="Delete conversation"
    >
      {#if isDeleting}
        <Loader2 class="size-3 animate-spin" />
      {:else}
        <Trash2 class="size-3" />
      {/if}
    </Button>
  </div>
</div>
