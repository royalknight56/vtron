export function parseShellArguments(input: string): string[] {
  const result: string[] = [];
  let value = '';
  let quote = '';
  let started = false;
  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (char === '\\' && input[index + 1] && quote !== "'" && (quote !== '"' || ['"', '\\'].includes(input[index + 1]))) { value += input[++index]; started = true; }
    else if (quote) { if (char === quote) quote = ''; else value += char; }
    else if (char === '"' || char === "'") { quote = char; started = true; }
    else if (/\s/.test(char)) { if (started) { result.push(value); value = ''; started = false; } }
    else { value += char; started = true; }
  }
  if (quote) throw new Error('Unclosed quote in command');
  if (started) result.push(value);
  return result;
}
