import { NONE } from "./constants";
import { ActionOptions, Board, TileMap } from "./types";

const offsets = (width: number): number[] => [-1, 1, -width, width];

export const getNeighbours = (
  position: number,
  tiles: TileMap,
  { width, height }: Board
): number[] => {
  const neighbours: number[] = [];
  for (const offset of offsets(width)) {
    const neighbourPosition = position + offset;
    const outOfBoundsX =
      (position % width === 0 && offset === -1) ||
      (position % width === width - 1 && offset === 1);
    const outOfBoundsY =
      neighbourPosition >= width * height || neighbourPosition < 0;
    if (outOfBoundsX || outOfBoundsY) continue;

    const { scrapAmount, recycler } = tiles[neighbourPosition];
    if (scrapAmount && !recycler) neighbours.push(neighbourPosition);
  }
  return neighbours;
};

export const formatPosition = (position: number, board: Board): string => {
  const { x, y } = positionToCoordinates(position, board);
  return `${x};${y}`;
};

export const positionToCoordinates = (
  position: number,
  { width }: Board
): { x: number; y: number } => ({
  x: position % width,
  y: Math.floor(position / width),
});

export const createActionFactory =
  (board: Board) =>
  (options: ActionOptions): string => {
    const { type, position } = options;
    const { x, y } = positionToCoordinates(position, board);
    switch (type) {
      case "BUILD":
        return `${type} ${x} ${y}`;
      case "SPAWN": {
        const { amount } = options;
        return `${type} ${amount} ${x} ${y}`;
      }
      case "MOVE": {
        const { amount, targetPosition } = options;
        const { x: targetX, y: targetY } = positionToCoordinates(
          targetPosition,
          board
        );
        return `${type} ${amount} ${x} ${y} ${targetX} ${targetY}`;
      }
    }
  };

export const getClosestNeutral = (
  pointPosition: number,
  tiles: TileMap,
  board: Board
): number => {
  // TODO: Move to global function
  const knownCells = [pointPosition];
  let steps = 0;
  while (steps < 5) {
    const nextCells = [
      ...new Set(
        knownCells.flatMap((position) => getNeighbours(position, tiles, board))
      ),
    ];
    for (const position of nextCells) {
      if (tiles[position].owner === NONE) {
        return position;
      }
    }
    steps++;
  }
};

export const randomPick = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];
