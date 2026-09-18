<script lang="ts">
  import { onMount } from 'svelte';
  import type { Thread } from '$lib/types/chat';
  import { getConversations, deleteConversation } from '$lib/api/agents';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import ChatArea from '$lib/components/ChatArea.svelte';

  let selectedThreadId = $state<string | null>(null);
  let conversations = $state<Thread[]>([]);
  let isLoadingConversations = $state(true);
  let sidebarError = $state<string | null>(null);

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
  });

  function handleSelectThread(threadId: string | null) {
    selectedThreadId = threadId;
  }

  function handleNewChat() {
    selectedThreadId = null;
  }

  async function handleDeleteThread(threadId: string) {
    try {
      await deleteConversation(threadId);
      conversations = conversations.filter((c) => c.id !== threadId);
      if (selectedThreadId === threadId) {
        selectedThreadId = null;
      }
    } catch (err: unknown) {
      sidebarError = err instanceof Error ? err.message : 'Failed to delete conversation';
    }
  }

  async function handleThreadCreated(newThreadId: string) {
    selectedThreadId = newThreadId;
    await fetchConversations();
  }
</script>

<div
  class="bg-background text-foreground flex h-screen w-screen overflow-hidden font-sans antialiased"
>
  <Sidebar
    {selectedThreadId}
    {conversations}
    isLoading={isLoadingConversations}
    errorMessage={sidebarError}
    onSelectThread={handleSelectThread}
    onNewChat={handleNewChat}
    onDeleteThread={handleDeleteThread}
    onRefresh={fetchConversations}
  />
  <ChatArea
    {selectedThreadId}
    onNewConversationCreated={handleThreadCreated}
    onStartNewChat={handleNewChat}
  />
</div>
