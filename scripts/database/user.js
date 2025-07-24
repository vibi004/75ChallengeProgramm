import { supabase } from './supabase.js'

// Benutzer anhand Name laden (mit Details)
export async function getUserByName(name) {
    const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('name', name)
        .single()

    if (error) {
        console.error('Fehler getUserByName:', error)
        return null
    }
    return data
}

// Benutzer anhand ID laden
export async function getUserById(id) {
    const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Fehler getUserById:', error)
        return null
    }
    return data
}

export async function getAllUsers() {
    const { data, error } = await supabase
    .from('User')
    .select('*')

    if (error) {
        console.error('Fehler beim Laden aller User:', error)
        return null
    }
    return data
}

// Passwort prüfen (Beispiel, falls Passwort als Hash in DB gespeichert)
export async function verifyPassword(name, passwordHash) {
    const user = await getUserByName(name)
    if (!user) return false
    return user.password === passwordHash
}
