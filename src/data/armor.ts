export interface Armor {
  id: string
  name: string
  base: number
  /** How much Dexterity applies: full, capped at +2, or none. */
  dex: 'full' | 'max2' | 'none'
  category: 'Sin armadura' | 'Ligera' | 'Media' | 'Pesada'
  strReq?: number
  stealthDisadvantage?: boolean
  /** Libras. La armadura puesta cuenta en la carga que llevas encima. */
  weight: number
  /** Precio en piezas de cobre, como el resto del equipo. */
  cost: number
}

export const ARMORS: Armor[] = [
  { id: 'none', name: 'Sin armadura', base: 10, dex: 'full', category: 'Sin armadura', weight: 0, cost: 0 },
  { id: 'padded', name: 'Acolchada', base: 11, dex: 'full', category: 'Ligera', stealthDisadvantage: true, weight: 8, cost: 500 },
  { id: 'leather', name: 'Cuero', base: 11, dex: 'full', category: 'Ligera', weight: 10, cost: 1000 },
  { id: 'studded', name: 'Cuero tachonado', base: 12, dex: 'full', category: 'Ligera', weight: 13, cost: 4500 },
  { id: 'hide', name: 'Pieles', base: 12, dex: 'max2', category: 'Media', weight: 12, cost: 1000 },
  { id: 'chain-shirt', name: 'Camisote de mallas', base: 13, dex: 'max2', category: 'Media', weight: 20, cost: 5000 },
  { id: 'scale-mail', name: 'Cota de escamas', base: 14, dex: 'max2', category: 'Media', stealthDisadvantage: true, weight: 45, cost: 5000 },
  { id: 'breastplate', name: 'Coraza', base: 14, dex: 'max2', category: 'Media', weight: 20, cost: 40000 },
  { id: 'half-plate', name: 'Media armadura', base: 15, dex: 'max2', category: 'Media', stealthDisadvantage: true, weight: 40, cost: 75000 },
  { id: 'ring-mail', name: 'Cota de anillas', base: 14, dex: 'none', category: 'Pesada', stealthDisadvantage: true, weight: 40, cost: 3000 },
  { id: 'chain-mail', name: 'Cota de malla', base: 16, dex: 'none', category: 'Pesada', strReq: 13, stealthDisadvantage: true, weight: 55, cost: 7500 },
  { id: 'splint', name: 'Armadura de bandas', base: 17, dex: 'none', category: 'Pesada', strReq: 15, stealthDisadvantage: true, weight: 60, cost: 20000 },
  { id: 'plate', name: 'Placas', base: 18, dex: 'none', category: 'Pesada', strReq: 15, stealthDisadvantage: true, weight: 65, cost: 150000 },
]

export const ARMOR_BY_ID = Object.fromEntries(ARMORS.map((a) => [a.id, a])) as Record<string, Armor>
