import { ME, OPP } from "./constants";
import {
  getClosestNeutral,
  getNeighbours,
  createActionFactory,
  randomPick,
} from "./helpers";
import { Board, DirectionVector, TileMap } from "./types";

export const calculateDistancesToPlayers = (
  tiles: TileMap,
  board: Board
): {
  oppMap: Record<string, number>;
  directionVectorsToMe: Record<string, DirectionVector>;
} => {
  const directionVectorsToMe: Record<string, DirectionVector> = {};
  const oppMap: Record<string, number> = {};
  const meUnvisited: number[] = [];
  const oppUnvisited: number[] = [];
  for (const tile of Object.values(tiles)) {
    const { position, units, recycler, owner } = tile;
    directionVectorsToMe[position] = {
      distance: Infinity,
      target: position,
    };
    oppMap[position] = Infinity;

    const tileDist = units ? 0 : 1;
    if (!recycler && owner === ME) {
      directionVectorsToMe[position].distance = tileDist;
      meUnvisited.push(position);
    } else if (!recycler && owner === OPP) {
      oppMap[position] = tileDist;
      oppUnvisited.push(position);
    }
  }
  while (meUnvisited.length) {
    const position = meUnvisited.shift();
    const neighbours = getNeighbours(position, tiles, board);
    for (const neighbourPosition of neighbours) {
      if (directionVectorsToMe[neighbourPosition].distance === Infinity) {
        directionVectorsToMe[neighbourPosition].distance =
          directionVectorsToMe[position].distance + 1;
        directionVectorsToMe[neighbourPosition].target =
          directionVectorsToMe[position].target;

        meUnvisited.push(neighbourPosition);
      }
    }
  }
  while (oppUnvisited.length) {
    const position = oppUnvisited.shift();
    const neighbours = getNeighbours(position, tiles, board);
    for (const neighbourPosition of neighbours) {
      if (oppMap[neighbourPosition] === Infinity) {
        oppMap[neighbourPosition] = oppMap[position] + 1;
        oppUnvisited.push(neighbourPosition);
      }
    }
  }
  return { oppMap, directionVectorsToMe };
};

export const calculateFrontier = ({
  oppMap,
  directionVectorsToMe,
}: {
  oppMap: Record<string, number>;
  directionVectorsToMe: Record<string, DirectionVector>;
}) => {
  const frontier: number[] = [];
  for (const position of Object.keys(directionVectorsToMe)) {
    const distance = directionVectorsToMe[position].distance - oppMap[position];
    if (0 === distance || distance === 1) {
      frontier.push(parseInt(position, 10));
    }
  }
  return frontier;
};

export const calculateDistanceToFrontier = (
  frontier: number[],
  tiles: TileMap,
  board: Board
): Record<string, number> => {
  const directionVectorMap: Record<string, number> = {};
  const unvisitedTiles: number[] = [];
  for (const tile of Object.values(tiles)) {
    directionVectorMap[tile.position] = Infinity;
  }
  for (const position of frontier) {
    directionVectorMap[position] = 0;
    unvisitedTiles.push(position);
  }

  while (unvisitedTiles.length) {
    const position = unvisitedTiles.shift();
    const neighbours = getNeighbours(position, tiles, board);
    for (const neighbourPosition of neighbours) {
      if (directionVectorMap[neighbourPosition] === Infinity) {
        directionVectorMap[neighbourPosition] =
          directionVectorMap[position] + 1;

        unvisitedTiles.push(neighbourPosition);
      }
    }
  }

  return directionVectorMap;
};

export const getMovesWithoutFrontier = (
  position: number,
  tiles: TileMap,
  board: Board,
  nonGrassNeutralTiles: number[]
): string[] => {
  const createAction = createActionFactory(board);
  const actions: string[] = [];

  let randomMovementUnits = tiles[position].units;

  const targetPosition = getClosestNeutral(position, tiles, board);
  if (targetPosition !== undefined) {
    actions.push(
      createAction({
        type: "MOVE",
        amount: 1,
        position,
        targetPosition,
      })
    );
    randomMovementUnits--;
  }
  while (randomMovementUnits) {
    const targetPosition = randomPick(nonGrassNeutralTiles);
    if (targetPosition == undefined) {
      break;
    }
    actions.push(
      createAction({
        type: "MOVE",
        amount: 1,
        position,
        targetPosition,
      })
    );
    randomMovementUnits--;
  }
  return actions;
};
