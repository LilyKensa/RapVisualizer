<!-- Sidebar.svelte -->
<script lang="ts">
  import type { Project } from "$lib/store";

  let {
    projects = $bindable(),
    currentProjectId = $bindable()
  }: {
    projects: Project[];
    currentProjectId: string;
  } = $props();

  let editingId = $state<string | null>(null);

  const newProject = () => {
    const id = crypto.randomUUID();
    projects.push({
      id,
      name: `Project ${projects.length + 1}`,
      song: { bpm: 120, sound: "snap", measures: [] }
    });
    currentProjectId = id;
  };

  const editProject = (id: string) => {
    editingId = id;
  };

  const deleteProject = (id: string, e: MouseEvent) => {
    e.stopPropagation();

    const idx = projects.findIndex(p => p.id === id);
    if (idx === -1) return;

    if (e.shiftKey || confirm(`Are you sure you want to delete ${projects[idx].name}?`)) {
      projects.splice(idx, 1);
      if (projects.length === 0) {
        newProject();
      } else if (currentProjectId === id) {
        currentProjectId = projects[0].id;
      }
    }
  };

  const blurInput = () => {
    editingId = null;
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Escape") blurInput();
  };
</script>

<aside class="sidebar">
  <div class="header">
    <div class="title">Projects</div>
    <button class="add" onclick={newProject}>+</button>
  </div>
  
  <div class="list">
    {#each projects as project (project.id)}
      <div class="item-container group" class:active={project.id === currentProjectId}>
        {#if editingId === project.id}
          <!-- svelte-ignore a11y_autofocus -->
          <input
            type="text"
            class="item-input"
            bind:value={project.name}
            onblur={blurInput}
            onkeydown={handleKeydown}
            autofocus
          />
        {:else}
          <button 
            class="item-btn"
            onclick={() => currentProjectId = project.id}
            ondblclick={() => editProject(project.id)}
          >
            {project.name}
          </button>
          
          <button 
            class="delete-btn" 
            onclick={(e) => deleteProject(project.id, e)}
            aria-label="Delete project"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        {/if}
      </div>
    {/each}
  </div>
</aside>

<style lang="postcss">
  @reference "$lib/layout.css";

  .sidebar {
    @apply w-56 flex flex-col shrink-0 border-r border-zinc-800 bg-zinc-900/50 py-3;
  }

  .header {
    @apply px-4 mb-3 flex items-center justify-between text-zinc-400;
  }

  .title {
    @apply text-xs font-semibold uppercase tracking-wider;
  }

  .add {
    @apply cursor-pointer flex h-5 w-5 items-center justify-center rounded bg-zinc-800 pb-0.5 text-lg leading-none transition-colors hover:bg-zinc-700 hover:text-zinc-200;
  }

  .list {
    @apply px-3 flex flex-col gap-0.5 overflow-y-auto;
  }

  .item-container {
    @apply relative flex items-center rounded text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200;
  }

  .item-btn {
    @apply cursor-pointer flex-1 truncate px-2 py-1.5 text-left outline-none;
  }

  .item-input {
    @apply w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-200 outline-none;
  }

  .delete-btn {
    @apply cursor-pointer absolute right-2 p-1 text-zinc-500 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100;
  }

  .active {
    @apply bg-zinc-800 text-zinc-200;
  }
</style>