import {
  calculateDistancesToPlayers,
  calculateDistanceToFrontier,
  calculateFrontier,
  getMovesWithoutFrontier,
} from "./algorithms";
import { ME, NONE, OPP } from "./constants";
import { createActionFactory, getNeighbours } from "./helpers";
import { readTurnInput } from "./input/read-turn";
import { DirectionVector } from "./types";

const MIN_REMAINING_MATTER = 10;

const BUILD_MATTER = 10;
const SPAWN_MATTER = 10;
const MAX_UNITS = 1_000_000;

// eslint-ignore
// @ts-ignore
const inputs = readline().split(" ");
const width = parseInt(inputs[0]);
const height = parseInt(inputs[1]);

const board = { width, height };
const createAction = createActionFactory(board);

// game loop
// eslint-disable-next-line
while (true) {
  const { myMatter, nonGrassNeutralTiles, myUnits, tiles, myTiles } =
    readTurnInput(height, width);
  let remainingMatter = myMatter;

  const actions: string[] = [];

  const { oppMap, directionVectorsToMe } = calculateDistancesToPlayers(
    tiles,
    board
  );
  const frontier = calculateFrontier({ directionVectorsToMe, oppMap });

  if (frontier.length) {
    const distanceToFrontier = calculateDistanceToFrontier(
      frontier,
      tiles,
      board
    );
    // Build a map of all cells every of my cells is responsible for
    const frontierOwners: Record<string, DirectionVector[]> = {};
    for (const position of frontier) {
      const { distance, target } = directionVectorsToMe[position];
      const newDirectionVector = { distance, target: position };
      if (frontierOwners[target]) {
        frontierOwners[target].push(newDirectionVector);
      } else {
        frontierOwners[target] = [newDirectionVector];
      }
    }

    // Evaluate build actions
    for (const position of myTiles) {
      if (tiles[position].canBuild) {
        const neighbours = getNeighbours(position, tiles, board);
        // Build if the opponent has units on a neighbouring cell
        const shouldBuild = neighbours.some((position) => {
          const { owner, units } = tiles[position];
          return owner === OPP && units;
        });
        if (remainingMatter >= BUILD_MATTER && shouldBuild) {
          actions.push(createAction({ type: "BUILD", position }));
          remainingMatter -= BUILD_MATTER;
        }
      }
    }

    // Evaluate move actions
    for (const position of myUnits) {
      // Sort all frontier cells this unit is responsible for
      const frontierChildren = frontierOwners[position]
        ? frontierOwners[position].sort((a, b) => a.distance - b.distance)
        : [];

      let remainingUnits = tiles[position].units;
      for (const frontierPosition of frontierChildren) {
        if (!remainingUnits) {
          break;
        }
        // If the cell is already on the frontier, keep one unit there (it will be handled by the neighbour decider)
        if (frontierPosition.distance > 1) {
          // This cell is responsible for holding the frontier at frontierPosition
          actions.push(
            createAction({
              type: "MOVE",
              amount: 1,
              position,
              targetPosition: frontierPosition.target,
            })
          );
          remainingUnits--;
        }
      }
      if (!remainingUnits) {
        continue;
      }
      const neighbours = getNeighbours(position, tiles, board);

      const neighboursOpponent = neighbours.some(
        (position) => tiles[position].owner === OPP
      );
      let bestScore = Infinity;
      let bestNeighbour: number;

      if (distanceToFrontier[position] === Infinity) {
        actions.push(
          ...getMovesWithoutFrontier(
            position,
            tiles,
            board,
            nonGrassNeutralTiles
          )
        );
      } else {
        // The best neighbour is the enemy cell with the least units
        // If there is no neighbouring enemy cell, go towards the frontier
        for (const neighbour of neighbours) {
          let neighbourScore: number;
          if (neighboursOpponent) {
            // If we are on the battlefront, occupy enemy cells with the least units
            const { units, owner } = tiles[neighbour];
            switch (owner) {
              case NONE:
                neighbourScore = 0;
                break;
              case OPP:
                neighbourScore = units - MAX_UNITS;
                break;
              case ME:
                neighbourScore = Infinity;
            }
          } else {
            neighbourScore = distanceToFrontier[neighbour];
          }
          if (neighbourScore < bestScore) {
            bestNeighbour = neighbour;
            bestScore = neighbourScore;
          }
        }
        if (bestNeighbour != undefined) {
          actions.push(
            createAction({
              type: "MOVE",
              amount: remainingUnits,
              position,
              targetPosition: bestNeighbour,
            })
          );
        }
      }
    }

    // Evaluate spawn actions
    const frontierOwnerPositions = Object.keys(frontierOwners);

    let spawnIndex = 0;
    let latestSpawnIndex = 0;

    if (remainingMatter >= MIN_REMAINING_MATTER + SPAWN_MATTER) {
      do {
        const position = frontierOwnerPositions[spawnIndex];
        const shouldSpawn =
          tiles[position].units < frontierOwners[position].length;

        if (shouldSpawn && tiles[position].canSpawn) {
          actions.push(
            createAction({
              type: "SPAWN",
              amount: 1,
              position: parseInt(position, 10),
            })
          );
          remainingMatter -= SPAWN_MATTER;
          latestSpawnIndex = spawnIndex;
          tiles[position].units++;
        }
        spawnIndex = (spawnIndex + 1) % frontierOwnerPositions.length;
      } while (spawnIndex !== latestSpawnIndex);
    }
  } else {
    for (const position of myTiles) {
      if (
        tiles[position].canSpawn &&
        remainingMatter >= MIN_REMAINING_MATTER + SPAWN_MATTER
      ) {
        if (tiles[position].units !== 0) {
          continue;
        }
        // Check if neighbour is neutral
        const neighbours = getNeighbours(position, tiles, board);
        for (const neighbourPosition of neighbours) {
          if (tiles[neighbourPosition].owner === NONE) {
            actions.push(
              createAction({
                type: "SPAWN",
                amount: 1,
                position,
              })
            );
            remainingMatter -= 10;
            break;
          }
        }
      }
    }

    for (const position of myUnits) {
      actions.push(
        ...getMovesWithoutFrontier(position, tiles, board, nonGrassNeutralTiles)
      );
    }
  }

  // eslint-disable-next-line
  console.log(actions.length > 0 ? actions.join(";") : "WAIT");
}
