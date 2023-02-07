import { ME, OPP } from "../constants";
import { TileMap } from "../types";

export const readTurnInput = (
  height: number,
  width: number
): {
  myMatter: number;
  nonGrassNeutralTiles: number[];
  myUnits: number[];
  myTiles: number[];
  tiles: TileMap;
} => {
  const tiles: TileMap = {};
  const myUnits: number[] = [];
  const oppUnits: number[] = [];
  const myRecyclers: number[] = [];
  const oppRecyclers: number[] = [];
  const oppTiles: number[] = [];
  const myTiles: number[] = [];
  const nonGrassNeutralTiles: number[] = [];

  // @ts-ignore
  const inputs = readline().split(" ");
  const myMatter = parseInt(inputs[0]);
  const _oppMatter = parseInt(inputs[1]);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // @ts-ignore
      const inputs = readline().split(" ");
      const scrapAmount = parseInt(inputs[0]);
      const owner = parseInt(inputs[1]); // 1 = me, 0 = foe, -1 = neutral
      const units = parseInt(inputs[2]);
      const recycler = inputs[3] == "1";
      const canBuild = inputs[4] == "1";
      const canSpawn = inputs[5] == "1";
      const inRangeOfRecycler = inputs[6] == "1";

      const position = y * width + x;
      const tile = {
        position,
        scrapAmount,
        owner,
        units,
        recycler,
        canBuild,
        canSpawn,
        inRangeOfRecycler,
      };

      tiles[position] = tile;

      if (tile.owner == ME) {
        myTiles.push(tile.position);
        if (tile.units > 0) {
          myUnits.push(tile.position);
        } else if (tile.recycler) {
          myRecyclers.push(tile.position);
        }
      } else if (tile.owner == OPP) {
        oppTiles.push(tile.position);
        if (tile.units > 0) {
          oppUnits.push(tile.position);
        } else if (tile.recycler) {
          oppRecyclers.push(tile.position);
        }
      } else if (tile.scrapAmount) {
        nonGrassNeutralTiles.push(tile.position);
      }
    }
  }
  return {
    myMatter,
    nonGrassNeutralTiles,
    myUnits,
    tiles,
    myTiles,
  };
};
