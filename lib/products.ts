export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  images?: string[]
}

export const PRODUCTS: Product[] = [
  {
    id: 'amphelo-monthly',
    name: 'Amphelo Monthly',
    description: 'Monthly subscription for Amphelo diabetes care coordination service',
    priceInCents: 3500, // $35
  },
  {
    id: 'amphelo-yearly',
    name: 'Amphelo Yearly',
    description: 'Yearly subscription for Amphelo diabetes care coordination service (30% off)',
    priceInCents: 29400, // $294
  },
]
