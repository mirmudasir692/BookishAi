<script lang="ts">
	import { tick } from 'svelte';
	import type { ChatAreaProps, Message } from '$lib/types/chat';
	import MessageBubble from '$lib/components/MessageBubble.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { chatWithAgent, getConversation } from '$lib/api/agents';
	import { Send, Sparkles, BookOpen, Bot, AlertCircle, RefreshCw } from '@lucide/svelte';

	let {
		selectedThreadId,
		onNewConversationCreated,
		onStartNewChat
	}: ChatAreaProps = $props();

	let messages = $state<Message[]>([]);
	let inputQuery = $state('');
	let isLoadingHistory = $state(false);
	let isSending = $state(false);
	let historyError = $state<string | null>(null);
	let sendError = $state<string | null>(null);
	let scrollContainer = $state<HTMLDivElement | null>(null);

	async function scrollToBottom() {
		await tick();
		if (scrollContainer) {
			scrollContainer.scrollTop = scrollContainer.scrollHeight;
		}
	}

	async function loadThread(threadId: string) {
		isLoadingHistory = true;
		historyError = null;
		try {
			const res = await getConversation(threadId);
			messages = res.messages ?? [];
			await scrollToBottom();
		} catch (err: unknown) {
			historyError = err instanceof Error ? err.message : 'Failed to load conversation messages';
			messages = [];
		} finally {
			isLoadingHistory = false;
		}
	}

	$effect(() => {
		if (selectedThreadId) {
			loadThread(selectedThreadId);
		} else {
			messages = [];
			historyError = null;
			sendError = null;
		}
	});

	async function handleSendMessage(event?: Event) {
		if (event) event.preventDefault();
		const query = inputQuery.trim();
		if (!query || isSending) return;

		inputQuery = '';
		sendError = null;

		const tempUserMessage: Message = {
			id: `temp-${Date.now()}`,
			role: 'user',
			content: query,
			createdAt: new Date()
		};

		messages = [...messages, tempUserMessage];
		await scrollToBottom();

		isSending = true;

		try {
			const payload: { query: string; threadId?: string } = {
				query
			};
			if (selectedThreadId) {
				payload.threadId = selectedThreadId;
			}

			const response = await chatWithAgent(payload);

			if (!selectedThreadId && response.threadId) {
				onNewConversationCreated?.(response.threadId);
			}

			const botMessage: Message = {
				id: `bot-${Date.now()}`,
				role: 'assistant',
				content: response.message,
				createdAt: new Date()
			};

			messages = [...messages, botMessage];
			await scrollToBottom();
		} catch (err: unknown) {
			sendError = err instanceof Error ? err.message : 'Failed to get agent response';
		} finally {
			isSending = false;
			await scrollToBottom();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
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

<main class="relative flex flex-1 flex-col h-full bg-background overflow-hidden">
	{#if !selectedThreadId && messages.length === 0 && !isLoadingHistory}
		<div class="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
			<div class="max-w-xl w-full flex flex-col items-center space-y-6">
				<div class="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
					<Sparkles class="size-7" />
				</div>

				<div class="space-y-2">
					<h1 class="text-3xl font-bold tracking-tight text-foreground">
						How can I assist you today?
					</h1>
					<p class="text-muted-foreground text-sm max-w-md mx-auto">
						Ask questions, search through books, brainstorm ideas, or analyze data with your AI assistant.
					</p>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
					<Card
						class="cursor-pointer border bg-card/60 hover:bg-muted/50 transition-all hover:shadow-xs"
						onclick={() => handleSuggestionClick('Summarize the key themes in my library')}
					>
						<CardContent class="p-3.5 flex items-start gap-3 text-left">
							<BookOpen class="size-4 text-primary shrink-0 mt-0.5" />
							<div>
								<div class="text-xs font-semibold text-foreground">Summarize key themes</div>
								<div class="text-xs text-muted-foreground">Explore top concepts in available books</div>
							</div>
						</CardContent>
					</Card>

					<Card
						class="cursor-pointer border bg-card/60 hover:bg-muted/50 transition-all hover:shadow-xs"
						onclick={() => handleSuggestionClick('Recommend books on artificial intelligence')}
					>
						<CardContent class="p-3.5 flex items-start gap-3 text-left">
							<Sparkles class="size-4 text-primary shrink-0 mt-0.5" />
							<div>
								<div class="text-xs font-semibold text-foreground">Discover books</div>
								<div class="text-xs text-muted-foreground">Find reads based on topics and tags</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	{:else}
		<div class="flex-1 min-h-0 relative overflow-hidden">
			<ScrollArea class="h-full w-full" bind:ref={scrollContainer}>
				<div class="max-w-3xl mx-auto py-6 px-2 md:px-4 flex flex-col min-h-full">
					{#if isLoadingHistory}
						<div class="space-y-6 py-6 px-4">
							<div class="flex gap-3">
								<Skeleton class="size-8 rounded-full shrink-0" />
								<div class="space-y-2 flex-1">
									<Skeleton class="h-4 w-24" />
									<Skeleton class="h-16 w-3/4 rounded-xl" />
								</div>
							</div>
							<div class="flex gap-3 flex-row-reverse">
								<Skeleton class="size-8 rounded-full shrink-0" />
								<div class="space-y-2 flex-1 items-end flex flex-col">
									<Skeleton class="h-4 w-16" />
									<Skeleton class="h-12 w-1/2 rounded-xl" />
								</div>
							</div>
						</div>
					{:else if historyError}
						<div class="my-auto p-6 text-center space-y-3">
							<div class="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
								<AlertCircle class="size-6" />
							</div>
							<h3 class="text-sm font-semibold text-foreground">Could not load chat</h3>
							<p class="text-xs text-muted-foreground max-w-sm mx-auto">{historyError}</p>
							{#if selectedThreadId}
								<Button variant="outline" size="sm" onclick={() => loadThread(selectedThreadId)}>
									<RefreshCw class="size-3.5 mr-1.5" />
									Try Again
								</Button>
							{/if}
						</div>
					{:else if messages.length === 0}
						<div class="my-auto p-8 text-center text-muted-foreground text-sm">
							Send a message to start this conversation.
						</div>
					{:else}
						<div class="space-y-1">
							{#each messages as msg (msg.id)}
								<MessageBubble
									role={msg.role}
									content={msg.content}
									createdAt={msg.createdAt}
								/>
							{/each}

							{#if isSending}
								<div class="flex w-full gap-3 px-4 py-3 flex-row justify-start">
									<div class="size-8 shrink-0 rounded-full border bg-muted flex items-center justify-center">
										<Bot class="size-4 text-primary" />
									</div>
									<div class="flex flex-col gap-2 max-w-[85%] md:max-w-[75%]">
										<div class="px-1 text-xs text-muted-foreground font-medium">Bookish AI</div>
										<Card class="border bg-card shadow-xs rounded-2xl rounded-tl-xs">
											<CardContent class="p-3.5 flex items-center gap-2">
												<Skeleton class="h-4 w-48" />
											</CardContent>
										</Card>
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</ScrollArea>
		</div>
	{/if}

	{#if sendError}
		<div class="max-w-3xl mx-auto w-full px-4 pb-2">
			<div class="flex items-center justify-between p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs border border-destructive/20">
				<div class="flex items-center gap-2">
					<AlertCircle class="size-4 shrink-0" />
					<span>{sendError}</span>
				</div>
				<Button variant="ghost" size="xs" onclick={() => (sendError = null)}>
					Dismiss
				</Button>
			</div>
		</div>
	{/if}

	<div class="p-3 md:p-4 bg-background/80 backdrop-blur-md border-t">
		<form
			onsubmit={handleSendMessage}
			class="max-w-3xl mx-auto flex items-center gap-2"
		>
			<Input
				bind:value={inputQuery}
				onkeydown={handleKeydown}
				placeholder="Message Bookish AI..."
				disabled={isSending}
				class="flex-1 py-5 px-4 text-sm bg-muted/40 focus-visible:bg-background transition-colors"
			/>
			<Button
				type="submit"
				size="icon"
				disabled={!inputQuery.trim() || isSending}
				class="size-10 shrink-0 rounded-lg shadow-xs"
				aria-label="Send message"
			>
				<Send class="size-4" />
			</Button>
		</form>
		<div class="text-[11px] text-center text-muted-foreground mt-2">
			Bookish AI may produce inaccurate information about people, places, or facts.
		</div>
	</div>
</main>
