<script lang="ts">
	import type { MessageBubbleProps } from '$lib/types/chat';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { User, Bot } from '@lucide/svelte';

	let {
		role,
		content,
		createdAt
	}: MessageBubbleProps = $props();

	const isUser = $derived(role === 'user');

	const textContent = $derived.by(() => {
		if (typeof content === 'string') return content;
		if (content && typeof content === 'object') {
			if ('text' in content && typeof (content as { text: unknown }).text === 'string') {
				return (content as { text: string }).text;
			}
			try {
				return JSON.stringify(content, null, 2);
			} catch {
				return String(content);
			}
		}
		return String(content ?? '');
	});

	const formattedTime = $derived.by(() => {
		if (!createdAt) return null;
		const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
		if (isNaN(date.getTime())) return null;
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	});
</script>

<div class="flex w-full gap-3 px-4 py-3 {isUser ? 'flex-row-reverse justify-start' : 'flex-row justify-start'}">
	<Avatar class="size-8 shrink-0 border {isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}">
		<AvatarFallback class="text-xs font-semibold">
			{#if isUser}
				<User class="size-4" />
			{:else}
				<Bot class="size-4 text-primary" />
			{/if}
		</AvatarFallback>
	</Avatar>

	<div class="flex flex-col gap-1 max-w-[85%] md:max-w-[75%] {isUser ? 'items-end' : 'items-start'}">
		<div class="flex items-center gap-2 px-1 text-xs text-muted-foreground">
			<span class="font-medium capitalize">{isUser ? 'You' : 'Bookish AI'}</span>
			{#if formattedTime}
				<span>•</span>
				<span>{formattedTime}</span>
			{/if}
		</div>

		{#if isUser}
			<Card class="border-0 bg-primary text-primary-foreground shadow-sm rounded-2xl rounded-tr-xs">
				<CardContent class="p-3 text-sm leading-relaxed whitespace-pre-wrap break-words">
					{textContent}
				</CardContent>
			</Card>
		{:else}
			<Card class="border bg-card text-card-foreground shadow-xs rounded-2xl rounded-tl-xs">
				<CardContent class="p-3.5 text-sm leading-relaxed whitespace-pre-wrap break-words prose prose-zinc dark:prose-invert max-w-none">
					{textContent}
				</CardContent>
			</Card>
		{/if}
	</div>
</div>
