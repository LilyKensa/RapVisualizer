<!-- +page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import TitleBar from "./TitleBar.svelte";
  import Sidebar from "./Sidebar.svelte";
  import Toolbar from "./Toolbar.svelte";
  import Editor from "./Editor.svelte";
  import type { Project } from "$lib/store";

  let projects = $state<Project[]>([]);
  let currentProjectId = $state("");
  let isPlaying = $state(false);

  let currentIndex = $derived(projects.findIndex(p => p.id === currentProjectId));

  onMount(() => {
    const stored = localStorage.getItem("projects");
    if (stored) projects = JSON.parse(stored);
    
    if (projects.length === 0) {
      projects = [{
        id: crypto.randomUUID(),
        name: "Project 1",
        song: { bpm: 120, sound: "snap", measures: [] }
      }];
    }
    
    currentProjectId = projects[0].id;
  });

  $effect(() => {
    if (projects.length > 0) {
      localStorage.setItem("projects", JSON.stringify(projects));
    }
  });
</script>

<svelte:head>
  {#if projects[currentIndex]}
    <title>{projects[currentIndex].name} | Rap Visualizer</title>
  {/if}
</svelte:head>

<div class="app">
  <TitleBar />
  <div class="content">
    {#if currentIndex !== -1}
      <Sidebar bind:projects bind:currentProjectId />
      <main class="main">
        <Toolbar 
          bind:bpm={projects[currentIndex].song.bpm} 
          bind:isPlaying 
          bind:sound={projects[currentIndex].song.sound}
          bind:measures={projects[currentIndex].song.measures}
        />
        <Editor 
          bind:measures={projects[currentIndex].song.measures}
          bind:isPlaying
          bpm={projects[currentIndex].song.bpm}
          sound={projects[currentIndex].song.sound}
        />
      </main>
    {/if}
  </div>
</div>

<style lang="postcss">
  @reference "$lib/layout.css";

  .app {
    @apply flex h-screen w-screen flex-col bg-zinc-900 font-sans text-zinc-300;
  }

  .content {
    @apply flex flex-1 overflow-hidden;
  }

  .main {
    @apply flex flex-1 flex-col bg-zinc-950;
  }
</style>