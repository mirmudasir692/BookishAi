declare module '*.svelte' {
  const component: import('svelte').Component<Record<string, unknown>>;
  export default component;
}

declare module '*.svelte.js' {
  const content: Record<string, unknown>;
  export default content;
}

declare module '*.svelte.ts' {
  const content: Record<string, unknown>;
  export default content;
}
