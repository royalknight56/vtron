import type { StartTilePlacement, StartTileSize } from '@/packages/type/type';

// A Win10 tile group fits three medium tiles or six small ones across.
export const tileColumns = 6;
export const tileSpans = {
  small: [1, 1],
  medium: [2, 2],
  wide: [4, 2],
  large: [4, 4],
} as const;
export type TileLayout = Record<string, StartTilePlacement>;

export function arrangeTiles(
  paths: string[],
  saved: TileLayout = {},
  change?: { path: string; placement: StartTilePlacement }
): TileLayout {
  const layout: TileLayout = {};
  const occupied = new Set<number>();
  function place(path: string, column: number, row: number, size: StartTileSize) {
    const [width, height] = tileSpans[size];
    if (column + width > tileColumns) return false;
    const cells: number[] = [];
    for (let y = row; y < row + height; y++) {
      for (let x = column; x < column + width; x++) {
        const cell = y * tileColumns + x;
        if (occupied.has(cell)) return false;
        cells.push(cell);
      }
    }
    cells.forEach((cell) => occupied.add(cell));
    layout[path] = { column, row, size };
    return true;
  }
  const order = change ? [change.path, ...paths.filter((path) => path !== change.path)] : paths;
  const displaced = new Map<string, StartTileSize>();
  for (const path of order) {
    const tile = path === change?.path ? change.placement : saved[path];
    const size = tile && Object.hasOwn(tileSpans, tile.size) ? tile.size : 'medium';
    if (
      tile &&
      Number.isSafeInteger(tile.row) &&
      tile.row >= 0 &&
      tile.row < 10000 &&
      Number.isSafeInteger(tile.column) &&
      tile.column >= 0
    ) {
      const column = Math.min(tile.column, tileColumns - tileSpans[size][0]);
      if (place(path, column, tile.row, size)) continue;
    }
    displaced.set(path, size);
  }
  // Keep every unaffected tile anchored. Only collisions and new shortcuts fill free cells.
  for (const [path, size] of displaced) {
    let cell = 0;
    while (!place(path, cell % tileColumns, Math.floor(cell / tileColumns), size)) cell++;
  }
  return layout;
}
