export interface Armor {
  id: string
  name: string
  base: number
  /** How much Dexterity applies: full, capped at +2, or none. */
  dex: 'full' | 'max2' | 'none'
  category: 'Sin armadura' | 'Ligera' | 'Media' | 'Pesada'
  strReq?: number
  stealthDisadvantage?: boolean
}

export const ARMORS: Armor[] = [
  { id: 'none', name: 'Sin armadura', base: 10, dex: 'full', category: 'Sin armadura' },
  { id: 'padded', name: 'Acolchada', base: 11, dex: 'full', category: 'Ligera', stealthDisadvantage: true },
  { id: 'leather', name: 'Cuero', base: 11, dex: 'full', category: 'Ligera' },
  { id: 'studded', name: 'Cuero tachonado', base: 12, dex: 'full', category: 'Ligera' },
  { id: 'hide', name: 'Pieles', base: 12, dex: 'max2', category: 'Media' },
  { id: 'chain-shirt', name: 'Camisote de mallas', base: 13, dex: 'max2', category: 'Media' },
  { id: 'scale-mail', name: 'Cota de escamas', base: 14, dex: 'max2', category: 'Media', stealthDisadvantage: true },
  { id: 'breastplate', name: 'Coraza', base: 14, dex: 'max2', category: 'Media' },
  { id: 'half-plate', name: 'Media armadura', base: 15, dex: 'max2', category: 'Media', stealthDisadvantage: true },
  { id: 'ring-mail', name: 'Cota de anillas', base: 14, dex: 'none', category: 'Pesada', stealthDisadvantage: true },
  { id: 'chain-mail', name: 'Cota de malla', base: 16, dex: 'none', category: 'Pesada', strReq: 13, stealthDisadvantage: true },
  { id: 'splint', name: 'Armadura de bandas', base: 17, dex: 'none', category: 'Pesada', strReq: 15, stealthDisadvantage: true },
  { id: 'plate', name: 'Placas', base: 18, dex: 'none', category: 'Pesada', strReq: 15, stealthDisadvantage: true },
]

export const ARMOR_BY_ID = Object.fromEntries(ARMORS.map((a) => [a.id, a])) as Record<string, Armor>
