import { supabase } from './supabase.js'

export async function getChallengeById(id) {
    const { data, error } = await supabase
        .from('Challenges')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Fehler beim Laden der Challenge:', error)
        return null
    }
    return data
}

export async function getChallengesByUserId(userId) {
    const { data, error } = await supabase
        .from('Challenges')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: true });

    if (error) {
        console.error('Fehler beim Laden der Challenges für User:', error)
        return []
    }
    return data
}

export async function addChallenge(user_id, title) {
    const { data, error } = await supabase
        .from('Challenges')
        .insert([{ user_id, title }])
        .select()
        .single()

    if (error) {
        console.error('Fehler beim Hinzufügen der Challenge:', error)
        return null
    }
    return data
}

export async function addChallenges(challenges){
    const { error } = await supabase.from('Challenges').insert(challenges)

    if (error) {
        alert('Fehler beim Speichern 😢')
        console.error(error)
    } else {
        alert('Challenges gespeichert! 🎉')
        modal.style.display = 'none'
        toggleChallengeButton(false)
        await renderUserChallenges(currentUser.id)
        await updateDailyProgress(currentUser.id)
    }
}