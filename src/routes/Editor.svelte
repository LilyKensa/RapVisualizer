<!-- Editor.svelte -->
<script lang="ts">
  import type { Block } from "$lib/store";

  let { 
    measures = $bindable(),
    isPlaying = $bindable(),
    bpm,
    sound
  }: { 
    measures: Block[];
    isPlaying: boolean;
    bpm: number;
    sound: string;
  } = $props();

  let editingId = $state<string | null>(null);
  let selectedId = $state<string | null>(null);
  let playheadId = $state<string | null>(null);
  
  let audioCtx: AudioContext | null = null;
  let timeoutId: ReturnType<typeof setTimeout>;

  const bgColors = [
    "bg-sky-900",
    "bg-blue-900",
    "bg-indigo-900",
    "bg-violet-900",
    "bg-purple-900",
    "bg-fuchsia-900",
    "bg-rose-900"
  ];

  const getDepth = (id: string) => id.split("-")[1].length;

  const getLeaves = (blocks: Block[]): Block[] => {
    const leaves: Block[] = [];
    for (const b of blocks) {
      if (b.left && b.right) {
        leaves.push(...getLeaves([b.left]), ...getLeaves([b.right]));
      } else {
        leaves.push(b);
      }
    }
    return leaves;
  };

  const addMeasure = () => {
    const id = `${measures.length}-`;
    measures.push({ id, text: "" });
    if (!selectedId) selectedId = id;
  };

  const splitBlock = (block: Block) => {
    if (block.left || block.right || getDepth(block.id) >= 6) return;
    
    block.left = { id: `${block.id}0`, text: block.text };
    block.right = { id: `${block.id}1`, text: "" };
    block.text = "";
    
    if (selectedId === block.id) selectedId = block.left.id;
  };

  const mergeBlock = (block: Block) => {
    const parts = block.id.split("-");
    const path = parts[1];
    if (!path) return;
    
    let current = measures[Number(parts[0])];
    for (let i = 0; i < path.length - 1; i++) {
      current = path[i] === "0" ? current.left! : current.right!;
    }
    
    current.text = (current.left?.text || "") + (current.right?.text || "");
    current.left = undefined;
    current.right = undefined;
    
    if (selectedId && selectedId.startsWith(current.id)) selectedId = current.id;
  };

  const reindexBlock = (b: Block, newPrefix: string) => {
    b.id = newPrefix;
    if (b.left) reindexBlock(b.left, newPrefix + "0");
    if (b.right) reindexBlock(b.right, newPrefix + "1");
  };

  const handleContextMenu = (e: MouseEvent, block: Block) => {
    e.preventDefault();
    if (e.shiftKey) {
      if (block.id.endsWith("-") && !block.left && !block.right && !block.text.trim()) {
        const idx = Number(block.id.split("-")[0]);
        measures.splice(idx, 1);
        measures.forEach((m, i) => reindexBlock(m, `${i}-`));
        if (selectedId === block.id) selectedId = measures[0]?.id || null;
        if (editingId === block.id) editingId = null;
      } else {
        mergeBlock(block);
      }
    } else if (e.ctrlKey) {
      splitBlock(block);
      splitBlock(block.left!);
      splitBlock(block.right!);
    } else {
      splitBlock(block);
    }
  };

  const editBlock = (block: Block) => {
    if (block.left || block.right) return;
    editingId = block.id;
    selectedId = block.id;
  };

  const blurInput = (id: string) => {
    // Only clear if the blurred input is STILL the currently editing one
    if (editingId === id) {
      editingId = null;
    }
  };

  const handleGlobalKeydown = (e: KeyboardEvent) => {
    if (editingId) return;
    const leaves = getLeaves(measures);
    if (!leaves.length) return;

    let idx = leaves.findIndex(l => l.id === selectedId);
    
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (idx > 0) selectedId = leaves[idx - 1].id;
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (idx < leaves.length - 1) selectedId = leaves[idx === -1 ? 0 : idx + 1].id;
    } else if (e.key === "Enter") {
      if (e.ctrlKey) {
        addMeasure();
      } else {
        if (!selectedId) return;
        editingId = selectedId;
      }
    }
  };

  const handleInputKeydown = (e: KeyboardEvent, id: string) => {
    if (e.key === "Enter" || e.key === "Escape") {
      e.stopPropagation();
      blurInput(id);
      return;
    }

    if ((e.ctrlKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) || e.key === "Tab") {
      e.preventDefault();
      e.stopPropagation(); // Stop event from bubbling to global window listener

      const leaves = getLeaves(measures);
      const idx = leaves.findIndex(l => l.id === id);
      if (idx === -1) return;

      if (((e.shiftKey && e.key === "Tab") || e.key === "ArrowLeft") && idx > 0) {
        const newId = leaves[idx - 1].id;
        selectedId = newId;
        editingId = newId;
      } else if ((e.key === "Tab" || e.key === "ArrowRight") && idx < leaves.length - 1) {
        const newId = leaves[idx + 1].id;
        selectedId = newId;
        editingId = newId;
      }
    }
  };

  const playSynth = (type: string) => {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const time = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === "kick") {
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
      gain.gain.setValueAtTime(1, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
      osc.start(time);
      osc.stop(time + 0.5);
    } else if (type === "hihat") {
      const bufferSize = audioCtx.sampleRate * 0.1;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = audioCtx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 7000;
      
      gain.gain.setValueAtTime(1, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start(time);
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, time);
      gain.gain.setValueAtTime(0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
      osc.start(time);
      osc.stop(time + 0.1);
    }
  };

  $effect(() => {
    if (isPlaying) {
      const leaves = getLeaves(measures);
      if (!leaves.length) {
        isPlaying = false;
        return;
      }
      
      let idx = leaves.findIndex(l => l.id === selectedId);
      if (idx === -1) idx = 0;
      
      const playNext = () => {
        if (!isPlaying) return;
        if (idx >= leaves.length) {
          isPlaying = false;
          playheadId = null;
          return;
        }

        const block = leaves[idx];
        playheadId = block.id;
        
        if (block.text.trim() !== "") {
          playSynth(sound);
        }
        
        const duration = ((60 / bpm) * 4 * 1000) / (2 ** getDepth(block.id));
        idx++;
        timeoutId = setTimeout(playNext, duration);
      };
      
      playNext();
    } else {
      clearTimeout(timeoutId);
      playheadId = null;
    }
  });

  $effect(() => {
    if (measures.length > 0 && !selectedId) {
      selectedId = getLeaves(measures)[0]?.id;
    }
  });
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

{#snippet renderBlock(block: Block)}
  <div class="node">
    {#if block.left && block.right}
      <div class="group">
        {@render renderBlock(block.left)}
        {@render renderBlock(block.right)}
      </div>
    {:else}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div
        class="block {bgColors[Math.min(getDepth(block.id), 6)]} {selectedId === block.id ? 'ring-2 ring-white z-10' : ''} {playheadId === block.id ? 'ring-2 ring-amber-400 brightness-150 z-20' : ''}"
        onclick={() => selectedId = block.id}
        ondblclick={() => editBlock(block)}
        oncontextmenu={(e) => handleContextMenu(e, block)}
      >
        {#if editingId === block.id}
          <!-- svelte-ignore a11y_autofocus -->
          <input
            type="text"
            class="editor-input"
            bind:value={block.text}
            onblur={() => blurInput(block.id)}
            onkeydown={(e) => handleInputKeydown(e, block.id)}
            autofocus
          />
        {:else}
          <span class="text">{block.text || "\u00A0"}</span>
        {/if}
      </div>
    {/if}
  </div>
{/snippet}

<div class="container">
  <div class="measures">
    {#each measures as measure (measure.id)}
      <div class="measure">
        {@render renderBlock(measure)}
      </div>
    {/each}
  </div>
  
  <button class="add-btn" onclick={addMeasure}>
    + Add Measure
  </button>
</div>

<style lang="postcss">
  @reference "$lib/layout.css";

  .container {
    @apply flex flex-1 flex-col gap-4 max-w-full overflow-y-auto p-6;
  }

  .measures {
    @apply flex flex-col gap-2;
  }

  .measure {
    @apply flex h-16 w-full;
  }

  .node {
    @apply flex flex-1;
  }

  .group {
    @apply flex flex-1 gap-1;
  }

  .block {
    @apply relative flex flex-1 cursor-pointer items-center justify-center rounded border border-zinc-900/50 transition-all duration-75 hover:brightness-110;
  }

  .text {
    @apply select-none text-sm font-medium text-zinc-200 drop-shadow-md;
  }

  .editor-input {
    @apply h-full w-full bg-transparent px-2 text-center text-sm font-medium text-white outline-none;
  }

  .add-btn {
    @apply cursor-pointer shrink-0 h-12 w-full rounded border-2 border-dashed border-zinc-700 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-300;
  }
</style>