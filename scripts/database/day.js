import {supabase} from "./supabase.js";

export async function getTodayDayId() {
    const today = new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase
        .from('Days')
        .select('id')
        .eq('date', today)
        .single()

    if (error) {
        console.error('Fehler beim Laden des Tages:', error.message)
        return null
    }

    return data?.id || null
}