'use server'

import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

// Use anon key for public signup operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function submitTrialSignup(formData: {
  name: string
  email: string
  country: string
  zipcode: string
  userType: 'parent' | 'adult-t1d'
  isDesignPartner: boolean
  phone: string
  bestTimeToReach: string
}) {
  try {
    const { error } = await supabase
      .from('trial_signups')
      .insert({
        name: formData.name,
        email: formData.email,
        country: formData.country,
        zipcode: formData.zipcode || null,
        user_type: formData.userType,
        is_design_partner: formData.isDesignPartner,
        phone: formData.phone || null,
        best_time_to_reach: formData.bestTimeToReach || null,
      })

    if (error) {
      throw new Error(error.message)
    }

    redirect('/free-trial/success')
  } catch (error) {
    throw error
  }
}
