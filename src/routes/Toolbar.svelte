<!-- Toolbar.svelte -->
<script lang="ts">
  import { importSong, exportSong, type Block } from "$lib/store";

  let {
    bpm = $bindable(),
    isPlaying = $bindable(),
    sound = $bindable(),
    measures = $bindable()
  }: {
    bpm: number;
    isPlaying: boolean;
    sound: string;
    measures: Block[];
  } = $props();

  const togglePlay = () => {
    isPlaying = !isPlaying;
  };

  const handleExport = async () => {
    try {
      const data = exportSong({ bpm, sound, measures });
      await navigator.clipboard.writeText(data);
      alert("Song data copied to clipboard!");
    } catch (e) {
      alert("Failed to copy to clipboard.");
    }
  };

  const handleImport = () => {
    const data = prompt("Paste song data here:");
    if (!data) return;
    try {
      const song = importSong(data);
      bpm = song.bpm;
      measures = song.measures;
    } catch (e) {
      alert("Invalid song data.");
    }
  };

  const handleGlobalKeydown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && document.activeElement === document.body) {

    }
  }
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<div class="toolbar">
  <button class="play-btn" onclick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
    {#if isPlaying}
      <svg viewBox="0 0 24 24" class="icon" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
      </svg>
    {:else}
      <svg viewBox="0 0 24 24" class="icon" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    {/if}
  </button>
  
  <div class="control">
    <label for="bpm" class="label">BPM</label>
    <input id="bpm" type="number" class="input" bind:value={bpm} min="30" max="300" />
  </div>

  <div class="control">
    <label for="sound" class="label">Sound</label>
    <select id="sound" class="select" bind:value={sound}>
      <option value="snap">Snap</option>
      <option value="kick">Kick</option>
      <option value="hihat">Hi-Hat</option>
    </select>
  </div>

  <div class="actions">
    <button class="action-btn" onclick={handleImport}>Import</button>
    <button class="action-btn" onclick={handleExport}>Export</button>
  </div>
</div>

<style lang="postcss">
  @reference "$lib/layout.css";

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  input[type=number] {
    -moz-appearance: textfield;
  }

  .toolbar {
    @apply flex h-14 shrink-0 items-center gap-6 border-b border-zinc-800 bg-zinc-900/80 px-6;
  }

  .play-btn {
    @apply cursor-pointer flex h-8 w-8 items-center justify-center rounded bg-zinc-200 text-zinc-900 transition-colors hover:bg-white;
  }

  .icon {
    @apply h-5 w-5;
  }

  .control {
    @apply flex items-center gap-2;
  }

  .label {
    @apply text-xs font-medium uppercase tracking-wider text-zinc-400;
  }

  .input, .select {
    @apply h-8 rounded border border-zinc-700 bg-zinc-950 px-2 text-sm text-zinc-200 outline-none transition-colors focus:border-zinc-500;
  }

  .input {
    @apply w-20;
  }

  .actions {
    @apply ml-auto flex items-center gap-2;
  }

  .action-btn {
    @apply cursor-pointer rounded bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white;
  }
</style>