<script lang="ts">
  import type { MessageBubbleProps } from '$lib/types/chat.types';
  import { Button } from '$lib/components/ui/button';
  import { renderMarkdown } from '$lib/markdown';
  import { parseMessageContent } from '$lib/message-parser';
  import { Sparkles, ChevronRight, BrainCircuit, Copy, Check } from '@lucide/svelte';

  let {
    role,
    content,
    thinking = '',
    isThinking = false,
    isStreaming = false,
    createdAt,
  }: MessageBubbleProps = $props();

  let userToggledOpen = $state<boolean | null>(null);
  let isCopied = $state(false);

  const isUser = $derived(role === 'user');

  const parsed = $derived.by(() => {
    return parseMessageContent(content);
  });

  const rawTextContent = $derived.by(() => {
    return parsed.text;
  });

  const effectiveThinking = $derived.by(() => {
    if (thinking && thinking.trim().length > 0) return thinking;
    return parsed.thinking;
  });

  const formattedHtml = $derived.by(() => {
    if (isUser) return '';
    return renderMarkdown(rawTextContent);
  });

  const formattedTime = $derived.by(() => {
    if (!createdAt) return null;
    const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
    if (isNaN(date.getTime())) return null;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  const isThinkingExpanded = $derived.by(() => {
    if (userToggledOpen !== null) return userToggledOpen;
    return isThinking && (!rawTextContent || rawTextContent.trim().length === 0);
  });

  function toggleThinking() {
    userToggledOpen = !isThinkingExpanded;
  }

  async function handleCopy() {
    if (!rawTextContent) return;
    try {
      await navigator.clipboard.writeText(rawTextContent);
      isCopied = true;
      setTimeout(() => {
        isCopied = false;
      }, 2000);
    } catch (e) {
      console.error('Failed to copy text:', e);
    }
  }
</script>

<div class="group/msg relative w-full py-3 transition-colors">
  {#if isUser}
    <div class="flex w-full justify-end px-2 sm:px-4">
      <div class="flex max-w-[85%] flex-col items-end gap-1.5 sm:max-w-[75%]">
        <div
          class="bg-secondary text-foreground border-border/80 inline-block rounded-[22px] rounded-br-xs border px-5 py-3 text-[15px] leading-relaxed break-words whitespace-pre-wrap shadow-2xs"
        >
          {rawTextContent}
        </div>
        {#if formattedTime}
          <span class="text-muted-foreground/70 px-1 text-[11px]">{formattedTime}</span>
        {/if}
      </div>
    </div>
  {:else}
    <div class="flex w-full items-start gap-3.5 px-2 sm:px-4">
      <div
        class="bg-primary text-primary-foreground flex size-7.5 shrink-0 items-center justify-center rounded-xl shadow-2xs"
      >
        <Sparkles class="size-4" />
      </div>

      <div class="flex min-w-0 flex-1 flex-col gap-2.5">
        <div class="flex items-center gap-2 text-xs">
          <span class="text-foreground font-semibold tracking-tight">Bookish AI</span>
          {#if isStreaming && !isThinking}
            <span class="bg-primary inline-flex size-1.5 animate-pulse rounded-full"></span>
          {/if}
          {#if formattedTime}
            <span class="text-muted-foreground/60">•</span>
            <span class="text-muted-foreground/70 text-[11px]">{formattedTime}</span>
          {/if}
        </div>

        {#if effectiveThinking || isThinking}
          <div
            class="bg-muted/40 border-border/80 my-1 overflow-hidden rounded-2xl border text-xs transition-all"
          >
            <button
              type="button"
              onclick={toggleThinking}
              class="hover:bg-muted/70 text-foreground/80 flex w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 text-left font-medium transition-colors select-none"
            >
              <div class="flex items-center gap-2">
                <BrainCircuit class="text-primary size-4 {isThinking ? 'animate-pulse' : ''}" />
                <span class="text-foreground font-medium">
                  {#if isThinking && (!rawTextContent || rawTextContent.length === 0)}
                    Thinking & searching knowledge base...
                  {:else}
                    Thought Process
                  {/if}
                </span>
                {#if isThinking}
                  <span class="bg-primary/80 inline-flex size-1.5 animate-ping rounded-full"></span>
                {/if}
              </div>
              <ChevronRight
                class="text-muted-foreground size-4 transition-transform duration-200 {isThinkingExpanded
                  ? 'rotate-90'
                  : ''}"
              />
            </button>

            {#if isThinkingExpanded}
              <div
                class="border-border/60 bg-background/50 text-foreground/80 border-t px-4 py-3 font-mono text-[12.5px] leading-relaxed break-words whitespace-pre-wrap"
              >
                {effectiveThinking}
                {#if isThinking}
                  <span class="bg-primary inline-block h-3.5 w-1 animate-pulse align-middle"></span>
                {/if}
              </div>
            {/if}
          </div>
        {/if}

        {#if rawTextContent}
          <div class="prose text-foreground max-w-none text-[15px] leading-7 break-words">
            {@html formattedHtml}
            {#if isStreaming && !isThinking}
              <span class="bg-primary ml-1 inline-block h-4.5 w-1.5 animate-pulse align-middle"
              ></span>
            {/if}
          </div>
        {:else if isStreaming && !effectiveThinking}
          <div class="text-muted-foreground flex items-center gap-1.5 py-2 text-xs">
            <span class="bg-primary size-2 animate-bounce rounded-full [animation-delay:-0.3s]"
            ></span>
            <span class="bg-primary size-2 animate-bounce rounded-full [animation-delay:-0.15s]"
            ></span>
            <span class="bg-primary size-2 animate-bounce rounded-full"></span>
          </div>
        {/if}

        {#if rawTextContent && !isStreaming}
          <div
            class="flex items-center gap-1 pt-1.5 opacity-0 transition-opacity group-hover/msg:opacity-100 focus-within:opacity-100"
          >
            <Button
              variant="ghost"
              size="icon-xs"
              class="text-muted-foreground hover:text-foreground size-7.5 rounded-lg"
              onclick={handleCopy}
              aria-label="Copy response"
            >
              {#if isCopied}
                <Check class="size-3.5 text-emerald-600 dark:text-emerald-400" />
              {:else}
                <Copy class="size-3.5" />
              {/if}
            </Button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
