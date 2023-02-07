export type Point = { position: number };

export type Tile = Point & {
  scrapAmount: number;
  owner: number;
  units: number;
  recycler: boolean;
  canBuild: boolean;
  canSpawn: boolean;
  inRangeOfRecycler: boolean;
};

export type TileMap = Record<string, Tile>;

export type DirectionVector = {
  target: number;
  distance: number;
};

export type Board = {
  width: number;
  height: number;
};

interface Options {
  type: string;
  position: number;
}

interface BuildOptions extends Options {
  type: "BUILD";
}

interface SpawnOptions extends Options {
  type: "SPAWN";
  amount: number;
}

interface MoveOptions extends Options {
  type: "MOVE";
  amount: number;
  targetPosition: number;
}

export type ActionOptions = BuildOptions | SpawnOptions | MoveOptions;
