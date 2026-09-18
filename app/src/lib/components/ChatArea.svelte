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

  let { selectedThreadId, onNewConversationCreated, onStartNewChat }: ChatAreaProps = $props();

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
      createdAt: new Date(),
    };

    messages = [...messages, tempUserMessage];
    await scrollToBottom();

    isSending = true;

    try {
      const payload: { query: string; threadId?: string } = {
        query,
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
        createdAt: new Date(),
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

<main class="bg-background relative flex h-full flex-1 flex-col overflow-hidden">
  {#if !selectedThreadId && messages.length === 0 && !isLoadingHistory}
    <div class="flex flex-1 flex-col items-center justify-center overflow-y-auto p-6 text-center">
      <div class="flex w-full max-w-xl flex-col items-center space-y-6">
        <div
          class="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl shadow-xs"
        >
          <Sparkles class="size-7" />
        </div>

        <div class="space-y-2">
          <h1 class="text-foreground text-3xl font-bold tracking-tight">
            How can I assist you today?
          </h1>
          <p class="text-muted-foreground mx-auto max-w-md text-sm">
            Ask questions, search through books, brainstorm ideas, or analyze data with your AI
            assistant.
          </p>
        </div>

        <div class="grid w-full grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
          <Card
            class="bg-card/60 hover:bg-muted/50 cursor-pointer border transition-all hover:shadow-xs"
            onclick={() => handleSuggestionClick('Summarize the key themes in my library')}
          >
            <CardContent class="flex items-start gap-3 p-3.5 text-left">
              <BookOpen class="text-primary mt-0.5 size-4 shrink-0" />
              <div>
                <div class="text-foreground text-xs font-semibold">Summarize key themes</div>
                <div class="text-muted-foreground text-xs">
                  Explore top concepts in available books
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            class="bg-card/60 hover:bg-muted/50 cursor-pointer border transition-all hover:shadow-xs"
            onclick={() => handleSuggestionClick('Recommend books on artificial intelligence')}
          >
            <CardContent class="flex items-start gap-3 p-3.5 text-left">
              <Sparkles class="text-primary mt-0.5 size-4 shrink-0" />
              <div>
                <div class="text-foreground text-xs font-semibold">Discover books</div>
                <div class="text-muted-foreground text-xs">Find reads based on topics and tags</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  {:else}
    <div class="relative min-h-0 flex-1 overflow-hidden">
      <ScrollArea class="h-full w-full" bind:ref={scrollContainer}>
        <div class="mx-auto flex min-h-full max-w-3xl flex-col px-2 py-6 md:px-4">
          {#if isLoadingHistory}
            <div class="space-y-6 px-4 py-6">
              <div class="flex gap-3">
                <Skeleton class="size-8 shrink-0 rounded-full" />
                <div class="flex-1 space-y-2">
                  <Skeleton class="h-4 w-24" />
                  <Skeleton class="h-16 w-3/4 rounded-xl" />
                </div>
              </div>
              <div class="flex flex-row-reverse gap-3">
                <Skeleton class="size-8 shrink-0 rounded-full" />
                <div class="flex flex-1 flex-col items-end space-y-2">
                  <Skeleton class="h-4 w-16" />
                  <Skeleton class="h-12 w-1/2 rounded-xl" />
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
            <div class="text-muted-foreground my-auto p-8 text-center text-sm">
              Send a message to start this conversation.
            </div>
          {:else}
            <div class="space-y-1">
              {#each messages as msg (msg.id)}
                <MessageBubble role={msg.role} content={msg.content} createdAt={msg.createdAt} />
              {/each}

              {#if isSending}
                <div class="flex w-full flex-row justify-start gap-3 px-4 py-3">
                  <div
                    class="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full border"
                  >
                    <Bot class="text-primary size-4" />
                  </div>
                  <div class="flex max-w-[85%] flex-col gap-2 md:max-w-[75%]">
                    <div class="text-muted-foreground px-1 text-xs font-medium">Bookish AI</div>
                    <Card class="bg-card rounded-2xl rounded-tl-xs border shadow-xs">
                      <CardContent class="flex items-center gap-2 p-3.5">
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
    <div class="mx-auto w-full max-w-3xl px-4 pb-2">
      <div
        class="bg-destructive/10 text-destructive border-destructive/20 flex items-center justify-between rounded-lg border p-2.5 text-xs"
      >
        <div class="flex items-center gap-2">
          <AlertCircle class="size-4 shrink-0" />
          <span>{sendError}</span>
        </div>
        <Button variant="ghost" size="xs" onclick={() => (sendError = null)}>Dismiss</Button>
      </div>
    </div>
  {/if}

  <div class="bg-background/80 border-t p-3 backdrop-blur-md md:p-4">
    <form onsubmit={handleSendMessage} class="mx-auto flex max-w-3xl items-center gap-2">
      <Input
        bind:value={inputQuery}
        onkeydown={handleKeydown}
        placeholder="Message Bookish AI..."
        disabled={isSending}
        class="bg-muted/40 focus-visible:bg-background flex-1 px-4 py-5 text-sm transition-colors"
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
    <div class="text-muted-foreground mt-2 text-center text-[11px]">
      Bookish AI may produce inaccurate information about people, places, or facts.
    </div>
  </div>
</main>
