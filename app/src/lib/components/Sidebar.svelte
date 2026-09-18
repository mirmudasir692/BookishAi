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
		onRefresh
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

<aside class="flex flex-col h-full w-64 md:w-72 border-r bg-muted/20 select-none">
	<div class="p-3 pb-2 flex items-center justify-between gap-2">
		<div class="flex items-center gap-2 px-1">
			<div class="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold text-xs">
				<Sparkles class="size-4" />
			</div>
			<span class="font-semibold text-sm tracking-tight text-foreground">Bookish AI</span>
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
			class="w-full justify-start gap-2 shadow-xs border-dashed hover:border-solid text-sm font-medium"
			onclick={onNewChat}
		>
			<Plus class="size-4" />
			<span>New Chat</span>
		</Button>
	</div>

	<Separator class="my-1 opacity-50" />

	<div class="px-3 py-1.5 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
		Conversations
	</div>

	<div class="flex-1 min-h-0 overflow-hidden">
		<ScrollArea class="h-full px-2">
			{#if isLoading && conversations.length === 0}
				<div class="space-y-2 p-1">
					<Skeleton class="h-9 w-full rounded-md" />
					<Skeleton class="h-9 w-full rounded-md" />
					<Skeleton class="h-9 w-full rounded-md" />
					<Skeleton class="h-9 w-full rounded-md" />
				</div>
			{:else if errorMessage}
				<div class="p-3 text-center space-y-2">
					<div class="flex items-center justify-center text-destructive gap-1.5 text-xs">
						<AlertCircle class="size-4" />
						<span>{errorMessage}</span>
					</div>
					{#if onRefresh}
						<Button variant="ghost" size="xs" onclick={onRefresh}>
							Retry
						</Button>
					{/if}
				</div>
			{:else if conversations.length === 0}
				<div class="py-8 px-4 text-center text-xs text-muted-foreground">
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
