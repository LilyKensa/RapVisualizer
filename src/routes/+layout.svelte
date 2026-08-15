<script lang="ts">
	import favicon from "$lib/favicon.svg";

	import "$lib/layout.css";

	let { children } = $props();
</script>

<svelte:head>
	<title>Rap Visualizer</title>
	<link rel="icon" href={favicon} type="image/svg+xml">
</svelte:head>

{@render children()}
