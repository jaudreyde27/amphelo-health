'use server'

import { headers } from 'next/headers'

import { stripe } from '../../lib/stripe'
import { PRODUCTS } from '../../lib/products'

export async function startCheckoutSession(productId: string) {
  const headersList = await headers()
  const origin = headersList.get('origin') || 'http://localhost:3000'
  
  const product = PRODUCTS.find((p) => p.id === productId)
  if (!product) {
    throw new Error(`Product with id "${productId}" not found`)
  }

  // Create Checkout Sessions from body params.
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded_page',
    return_url: `${origin}/get-started/success?session_id={CHECKOUT_SESSION_ID}`,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
  })

  return session.client_secret
}
