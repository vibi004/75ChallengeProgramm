import {supabase} from './supabase.js'
import {getTodayDayId} from "./day.js";
import {getPreference} from "./preference.js";

export async function getProgress(user_id, challenge_id, day_id, completed) {
    const { data, error } = await supabase
        .from('Progress')
        .select('*')
        .eq('user_id', user_id)
        .eq('challenge_id', challenge_id)
        .eq('day_id', day_id)
        .eq('completed', completed)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error('Fehler beim Laden des Progress:', error)
        return null
    }
    return data
}

export async function upsertProgress(user_id, challenge_id, day_id, complete) {
    const { data, error } = await supabase
        .from('Progress')
        .upsert([{ user_id, challenge_id, day_id, complete }], {
            onConflict: ['user_id', 'challenge_id', 'day_id']
        })
        .select()
        .single()

    if (error) {
        console.error('Fehler beim Upsert des Progress:', error)
        return null
    }
    return data
}

export async function deleteProgress(user_id, challenge_id, day_id) {
    const { error } = await supabase
        .from('Progress')
        .delete()
        .eq('user_id', user_id)
        .eq('challenge_id', challenge_id)
        .eq('day_id', day_id)

    if (error) {
        console.error('Fehler beim Löschen des Progress:', error)
        return false
    }
    return true
}

export async function getProgressByUser(user_id) {
    const { data, error } = await supabase
        .from('Progress')
        .select('*')
        .eq('user_id', user_id)

    if (error) {
        console.error('Fehler beim Laden des Progress:', error)
        return []
    }
    return data
}

export async function getProgressByUserForTodayLength(user_id) {
    const dayId = await getTodayDayId()
    if (!dayId) {
        document.getElementById('dailyProgress').textContent = 'Kein Tag gefunden'
        return
    }

    const elements =  await getProgressByDayAndUser(user_id, dayId)
    return elements.length
}

export async function getProgressByDayAndUser(user_id, day_id) {
    const { data: progressData, error: progressError } = await supabase
        .from('Progress')
        .select('challenge_id')
        .eq('user_id', user_id)
        .eq('day_id', day_id)
        .eq('completed', true);

    if (progressError) {
        console.error('Fehler beim Laden des Progress:', progressError);
        return [];
    }

    return progressData;
}

export async function checkIfAllChecked(user_id){
    let count = await getProgressByUserForTodayLength(user_id);
    return count === (await getPreference()).number_challenges;
}