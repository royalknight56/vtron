/** Capture execution globals without writing into the host realm. The outer
 * environment keeps later global writes live while allowing strict module bodies. */
export function compileScopedFunction(scope: object, parameters: string[], body: string, asynchronous = false): (...args: any[]) => any {
  return new Function('scope', `with (scope) { return ${asynchronous ? 'async ' : ''}function(${parameters.join(',')}) {${body}\n}; }`)(scope);
}
