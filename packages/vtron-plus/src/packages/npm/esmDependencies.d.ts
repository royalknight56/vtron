declare module '@babel/standalone' {
  export function transform(source: string, options: Record<string, unknown>): { code?: string | null; map?: import('@jridgewell/trace-mapping').SourceMapInput | null };
  const babel: { transform: typeof transform };
  export default babel;
}
