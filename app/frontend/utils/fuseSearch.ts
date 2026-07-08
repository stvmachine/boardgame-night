import Fuse, { type IFuseOptions } from 'fuse.js'

export interface FuseSearchableGame {
  name: string
  originalname?: string
}

const FUSE_OPTIONS: IFuseOptions<FuseSearchableGame> = {
  keys: ['name', 'originalname'],
  threshold: 0.3,
  isCaseSensitive: false,
  minMatchCharLength: 1,
}

const indexToGames = new WeakMap<Fuse<FuseSearchableGame>, readonly FuseSearchableGame[]>()

export function createFuseIndex(games: readonly FuseSearchableGame[]): Fuse<FuseSearchableGame> {
  const index = new Fuse([...games], FUSE_OPTIONS)
  indexToGames.set(index, games)
  return index
}

export function searchFuse(index: Fuse<FuseSearchableGame>, query: string): FuseSearchableGame[] {
  const trimmed = query.trim()
  if (!trimmed) {
    const games = indexToGames.get(index)
    return games ? [...games] : []
  }

  return index.search(trimmed).map(result => result.item)
}
