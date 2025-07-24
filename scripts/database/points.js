import { supabase } from './supabase.js'

export async function getPoints(user_id) {
    const { data, error } = await supabase
        .from('Points')
        .select('points')
        .eq('user_id', user_id)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error('Fehler beim Laden der Punkte:', error)
        return null
    }
    return data?.points || 0
}

export async function getPerfectDays(user_id) {
    const { data, error } = await supabase
        .from('Points')
        .select('completed_days')
        .eq('user_id', user_id)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error('Fehler beim Laden der perfekten Tage:', error)
        return null
    }
    return data?.completed_days || 0
}

export async function upsertPoints(user_id, points) {
    const { data, error } = await supabase
        .from('Points')
        .upsert({ user_id, points }, { onConflict: 'user_id' })
        .select()
        .single()

    if (error) {
        console.error('Fehler beim Upsert der Punkte:', error)
        return null
    }
    return data
}

export async function upsertPerfectDays(user_id, completed_days) {
    const { data, error } = await supabase
        .from('Points')
        .upsert({ user_id, completed_days }, { onConflict: 'user_id' })
        .select()
        .single()

    if (error) {
        console.error('Fehler beim Upsert der perfekten Tage:', error)
        return null
    }
    return data
}

export async function incrementPoints(user_id, incrementBy = 1) {
    let currentPoints = await getPoints(user_id)
    if (currentPoints === null) currentPoints = 0

    const newPoints = currentPoints + incrementBy
    return await upsertPoints(user_id, newPoints)
}

export async function incrementPerfectDays(user_id, incrementBy = 1) {
    let currentPerfectDays = await getPerfectDays(user_id)
    if (currentPerfectDays === null) currentPerfectDays = 0

    const newPerfectDays = currentPerfectDays + incrementBy
    return await upsertPerfectDays(user_id, newPerfectDays)
}
