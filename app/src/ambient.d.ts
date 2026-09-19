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

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}
