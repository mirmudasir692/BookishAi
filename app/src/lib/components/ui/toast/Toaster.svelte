<script lang="ts">
  import { toast } from '$lib/state/toast.svelte';
  import { Button } from '$lib/components/ui/button';
  import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from '@lucide/svelte';

  function handleConfirm(confirmed: boolean) {
    if (toast.confirmDialog) {
      toast.confirmDialog.resolve(confirmed);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (toast.confirmDialog) {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleConfirm(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm(true);
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if toast.confirmDialog}
  <div
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs transition-opacity"
  >
    <div
      class="bg-card text-card-foreground border-border/80 w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all"
    >
      <div class="flex items-start gap-3.5">
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-xl {toast.confirmDialog
            .variant === 'destructive'
            ? 'bg-destructive/10 text-destructive'
            : 'bg-primary/10 text-primary'}"
        >
          {#if toast.confirmDialog.variant === 'destructive'}
            <AlertCircle class="size-5" />
          {:else}
            <AlertTriangle class="size-5" />
          {/if}
        </div>
        <div class="flex-1 space-y-1.5">
          <h3 class="text-foreground text-base font-semibold tracking-tight">
            {toast.confirmDialog.title}
          </h3>
          <p class="text-muted-foreground text-xs leading-relaxed sm:text-sm">
            {toast.confirmDialog.message}
          </p>
        </div>
      </div>

      <div class="mt-6 flex items-center justify-end gap-2.5">
        <Button
          variant="outline"
          size="sm"
          class="rounded-xl px-4 text-xs font-medium"
          onclick={() => handleConfirm(false)}
        >
          {toast.confirmDialog.cancelText}
        </Button>
        <Button
          variant={toast.confirmDialog.variant === 'destructive' ? 'destructive' : 'default'}
          size="sm"
          class="rounded-xl px-4 text-xs font-medium"
          onclick={() => handleConfirm(true)}
        >
          {toast.confirmDialog.confirmText}
        </Button>
      </div>
    </div>
  </div>
{/if}

<div
  class="pointer-events-none fixed right-0 bottom-0 z-[90] flex max-h-screen w-full flex-col-reverse gap-2.5 p-4 sm:max-w-sm sm:p-6"
  aria-live="polite"
>
  {#each toast.toasts as item (item.id)}
    <div
      class="bg-card/95 text-card-foreground border-border/80 pointer-events-auto flex w-full items-start gap-3 rounded-2xl border p-3.5 shadow-lg backdrop-blur-md transition-all select-none"
    >
      <div
        class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg {item.type ===
        'success'
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : item.type === 'error'
            ? 'bg-destructive/10 text-destructive'
            : item.type === 'warning'
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              : 'bg-primary/10 text-primary'}"
      >
        {#if item.type === 'success'}
          <CheckCircle2 class="size-4" />
        {:else if item.type === 'error'}
          <AlertCircle class="size-4" />
        {:else if item.type === 'warning'}
          <AlertTriangle class="size-4" />
        {:else}
          <Info class="size-4" />
        {/if}
      </div>

      <div class="flex-1 space-y-0.5 text-left">
        {#if item.title}
          <div class="text-foreground text-xs font-semibold tracking-tight">
            {item.title}
          </div>
        {/if}
        <div class="text-muted-foreground text-xs leading-relaxed">
          {item.message}
        </div>
        {#if item.action}
          <div class="pt-1.5">
            <Button
              variant={item.action.variant ?? 'outline'}
              size="xs"
              class="h-6 rounded-lg px-2 text-[11px]"
              onclick={() => {
                item.action?.onClick();
                toast.dismiss(item.id);
              }}
            >
              {item.action.label}
            </Button>
          </div>
        {/if}
      </div>

      <button
        type="button"
        class="text-muted-foreground hover:text-foreground -mt-1 -mr-1 flex size-6 cursor-pointer items-center justify-center rounded-lg transition-colors"
        onclick={() => toast.dismiss(item.id)}
        aria-label="Dismiss toast"
      >
        <X class="size-3.5" />
      </button>
    </div>
  {/each}
</div>
