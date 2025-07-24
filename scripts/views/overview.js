import { supabase } from '../database/supabase.js'

document.addEventListener('DOMContentLoaded', init)

async function init() {
    try {
        const currentUserName = localStorage.getItem('user')
        if (!currentUserName) {
            alert('Kein eingeloggter Benutzer gefunden. Bitte erst einloggen.')
            return
        }

        const currentUser = await loadUserByName(currentUserName)
        if (!currentUser) {
            alert('Benutzer nicht gefunden.')
            return
        }

        await renderChallengeOverview(currentUser.id)
    } catch (error) {
        console.error('Fehler im Init:', error)
    }
}

async function loadUserByName(name) {
    const { data, error } = await supabase
        .from('User')
        .select('id')
        .eq('name', name)
        .single()

    if (error) {
        console.error('User nicht gefunden:', error)
        return null
    }
    return data
}

async function loadPreference() {
    const { data, error } = await supabase
        .from('preferences')
        .select('*')
        .limit(1)
        .single()

    if (error) {
        console.error('Fehler beim Laden der Preferences:', error)
        return null
    }
    return data
}

async function getDayIdByDate(dateString) {
    const { data, error } = await supabase
        .from('Days')
        .select('id')
        .eq('date', dateString)
        .single()

    if (error) {
        return null
    }
    return data?.id || null
}

function formatDate(date) {
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })
}

// Wochenstart (Montag) für gegebenes Datum ermitteln
function getMonday(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = (day === 0 ? -6 : 1) - day // Sonntag = 0, dann 6 Tage zurück
    d.setDate(d.getDate() + diff)
    return d
}

async function renderChallengeOverview(userId) {
    const overviewBody = document.getElementById('overviewBody')
    if (!overviewBody) return

    overviewBody.innerHTML = ''

    const preference = await loadPreference()
    if (!preference) return

    const startDate = new Date(preference.start_date)
    const totalDays = preference.length || 75
    const maxDate = new Date(startDate)
    maxDate.setDate(startDate.getDate() + totalDays - 1)

    const mondayStart = getMonday(startDate)
    const totalWeeks = Math.ceil(((maxDate - mondayStart) / (1000 * 60 * 60 * 24) + 1) / 7)

    for (let w = 0; w < totalWeeks; w++) {
        const row = document.createElement('tr')

        // Wochenstart und -ende
        const weekStart = new Date(mondayStart)
        weekStart.setDate(mondayStart.getDate() + w * 7)

        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)

        // Begrenzen auf maxDate
        if (weekEnd > maxDate) {
            weekEnd.setTime(maxDate.getTime())
        }

        // Linke Zelle mit Datumsbereich
        const weekCell = document.createElement('td')
        weekCell.textContent = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`
        row.appendChild(weekCell)

        for (let d = 0; d < 7; d++) {
            const currentDay = new Date(weekStart)
            currentDay.setDate(weekStart.getDate() + d)

            // Nur innerhalb des Challenge-Zeitraums Zellen füllen, sonst leer
            if (currentDay < startDate || currentDay > maxDate) {
                row.appendChild(document.createElement('td'))
                continue
            }

            const isoDate = currentDay.toISOString().slice(0, 10)
            const dayId = await getDayIdByDate(isoDate)

            let count = 0
            if (dayId) {
                const { data: progress, error } = await supabase
                    .from('Progress')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('day_id', dayId)

                if (!error && progress) {
                    count = progress.length
                }
            }

            const cell = document.createElement('td')
            cell.className = `progress-cell progress-${Math.min(count, 7)}`
            cell.textContent = count
            row.appendChild(cell)
        }

        overviewBody.appendChild(row)
    }
}
