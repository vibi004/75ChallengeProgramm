import { supabase } from './supabase.js'

export async function getPreference() {
    const { data, error } = await supabase
        .from('preferences')
        .select('*')
        .single()

    if (error) {
        console.error('Fehler beim Laden der Präferenz:', error)
        return null
    }
    return data
}

export async function getStartDate() {
    const preference = await getPreference()
    if (!preference) return null
    return preference.start_date
}

export async function getDuration() {
    const preference = await getPreference()
    if (!preference) return null
    return preference.length
}

export async function getNumberChallenges() {
    const preferences = await getPreference()
    if (!preferences) return null
    return preferences.number_challenges
}