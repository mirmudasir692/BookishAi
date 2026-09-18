<script lang="ts">
	import type { ConversationItemProps } from '$lib/types/chat';
	import { Button } from '$lib/components/ui/button';
	import { Trash2, MessageSquare, Loader2 } from '@lucide/svelte';

	let {
		thread,
		isSelected,
		onSelect,
		onDelete,
		isDeleting = false
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

<div class="group relative flex items-center w-full rounded-md transition-colors {isSelected ? 'bg-secondary text-secondary-foreground font-medium' : 'hover:bg-muted/70 text-muted-foreground hover:text-foreground'}">
	<Button
		variant="ghost"
		size="sm"
		class="w-full justify-start gap-2 px-2.5 py-5 text-left font-normal truncate pr-9 {isSelected ? 'bg-secondary text-secondary-foreground font-medium hover:bg-secondary' : 'hover:bg-transparent'}"
		onclick={handleSelect}
	>
		<MessageSquare class="size-4 shrink-0 opacity-70" />
		<span class="truncate text-sm">{displayTitle}</span>
	</Button>
	<div class="absolute right-1 top-1/2 -translate-y-1/2 {isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'} transition-opacity">
		<Button
			variant="ghost"
			size="icon-xs"
			class="size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
