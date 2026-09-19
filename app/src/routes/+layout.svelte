<script lang="ts">
  import 'katex/dist/katex.min.css';
  import './layout.css';
  import favicon from '$lib/assets/favicon.svg';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import type { Thread } from '$lib/types/chat.types';
  import { getConversations, deleteConversation } from '$lib/api/agents';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import ChatArea from '$lib/components/ChatArea.svelte';
  import { Toaster, toast } from '$lib/components/ui/toast';

  let { children } = $props();

  let conversations = $state<Thread[]>([]);
  let isLoadingConversations = $state(true);
  let sidebarError = $state<string | null>(null);
  let isMobileSidebarOpen = $state(false);

  const selectedThreadId = $derived(page.params.id ?? null);

  async function fetchConversations() {
    isLoadingConversations = true;
    sidebarError = null;
    try {
      const res = await getConversations();
      conversations = Array.isArray(res) ? res : [];
    } catch (err: unknown) {
      sidebarError = err instanceof Error ? err.message : 'Failed to fetch conversations';
    } finally {
      isLoadingConversations = false;
    }
  }

  onMount(() => {
    fetchConversations();

    function handleGlobalKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    }

    window.addEventListener('keydown', handleGlobalKeydown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeydown);
    };
  });

  function handleSelectThread(threadId: string | null) {
    isMobileSidebarOpen = false;
    if (threadId) {
      goto(`/c/${threadId}`);
    } else {
      goto('/');
    }
  }

  function handleNewChat() {
    isMobileSidebarOpen = false;
    goto('/');
  }

  async function handleDeleteThread(threadId: string) {
    const confirmed = await toast.confirm({
      title: 'Delete Conversation',
      message:
        'Are you sure you want to delete this conversation? All messages will be permanently removed.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      const res = await deleteConversation(threadId);
      conversations = conversations.filter((c) => c.id !== threadId);
      if (selectedThreadId === threadId) {
        goto('/');
      }
      toast.success(res.message || 'Conversation deleted successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete conversation';
      sidebarError = msg;
      toast.error(msg);
    }
  }

  async function handleThreadCreated(newThreadId: string) {
    goto(`/c/${newThreadId}`, { replaceState: true, keepFocus: true });
    await fetchConversations();
  }

  function toggleMobileSidebar() {
    isMobileSidebarOpen = !isMobileSidebarOpen;
  }

  function closeMobileSidebar() {
    isMobileSidebarOpen = false;
  }
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>Bookish AI - NCERT Science & Physics Tutor</title>
</svelte:head>

<div
  class="bg-background text-foreground flex h-screen w-screen overflow-hidden font-sans antialiased"
>
  <Sidebar
    {selectedThreadId}
    {conversations}
    isLoading={isLoadingConversations}
    errorMessage={sidebarError}
    isOpenMobile={isMobileSidebarOpen}
    onCloseMobile={closeMobileSidebar}
    onSelectThread={handleSelectThread}
    onNewChat={handleNewChat}
    onDeleteThread={handleDeleteThread}
    onRefresh={fetchConversations}
  />
  <ChatArea
    {selectedThreadId}
    onNewConversationCreated={handleThreadCreated}
    onStartNewChat={handleNewChat}
    onToggleMobileSidebar={toggleMobileSidebar}
  />
</div>

<Toaster />

{@render children?.()}
