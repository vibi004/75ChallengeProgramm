import { supabase } from './supabase.js'

document.addEventListener('DOMContentLoaded', init)

async function init() {
    try {
        // 1. Benutzername aus localStorage holen und anzeigen
        const currentUserName = localStorage.getItem('user') || 'Du'
        document.getElementById('user-name').textContent = `Hallo ${currentUserName}! 🎉`

        // 2. Preferences laden und speichern (z.B. numberChallenges)
        const preference = await loadPreference()
        if (!preference) return

        localStorage.setItem('numberChallenges', preference.number_challenges)

        // 3. Basisinfos anzeigen (Startdatum, Dauer, Anzahl Challenges)
        showBaseData(preference)

        // 4. Avatare aller Benutzer laden und anzeigen
        const users = await loadUsers()
        if (!users) return
        renderUserAvatars(users)

        // 5. Aktuellen Benutzer (mit ID) laden
        const currentUser = await loadUserByName(currentUserName)
        if (!currentUser) return

        // 6. Prüfen, ob User schon Challenges hat, Button sichtbar machen
        const hasChallenges = await userHasChallenges(currentUser.id)
        toggleChallengeButton(hasChallenges)

        if (hasChallenges) {
            renderUserChallenges(currentUser.id)
        }


    } catch (error) {
        console.error('Fehler im Init:', error)
    }
}

// Preference laden (einziger Eintrag)
async function loadPreference() {
    const { data, error } = await supabase
        .from('preferences')
        .select('*')
        .limit(1)
        .single()

    if (error) {
        console.error('Fehler beim Laden der Preference:', error)
        return null
    }
    return data
}

// Basisdaten anzeigen
function showBaseData(preference) {
    const startDate = new Date(preference.start_date)
    const formattedDate = startDate.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    const text = `Challenge will start on ${formattedDate} and will last for ${preference.length}, you have to choose ${preference.number_challenges} Challenges`
    document.getElementById('baseData').textContent = text
}

// Alle Benutzer laden
async function loadUsers() {
    const { data, error } = await supabase.from('User').select('name')
    if (error) {
        console.error('Fehler beim Laden der Benutzer:', error)
        document.getElementById('avatar-container').innerHTML = '<p>Fehler beim Laden der Avatare 😢</p>'
        return null
    }
    return data
}

// Benutzer Avatare anzeigen
function renderUserAvatars(users) {
    const avatarContainer = document.getElementById('avatar-container')
    avatarContainer.innerHTML = users.map(user => `
    <div class="text-center">
      <img id="${user.name}AvatarFoto" src="assets/avatars/${user.name}.png" alt="${user.name}" class="rounded-circle mb-2" width="150" />
      <div>${user.name}</div>
    </div>
  `).join('')
}

// Benutzer nach Namen laden
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

// Prüfen ob User schon Challenges hat
async function userHasChallenges(userId) {
    const { data, error } = await supabase
        .from('Challenges')
        .select('*')
        .eq('user_id', userId)

    if (error) {
        console.error('Fehler beim Abrufen der Challenges:', error)
        return false
    }
    return data.length > 0
}

// Button anzeigen/verstecken
function toggleChallengeButton(hasChallenges) {
    const btn = document.getElementById('openChallengeForm')
    btn.style.display = hasChallenges ? 'none' : 'inline-block'
}

// Eventlistener für den Button
document.getElementById('openChallengeForm').addEventListener('click', openChallengeModal)

// Modal mit Formular öffnen
async function openChallengeModal() {
    const numberChallenges = parseInt(localStorage.getItem('numberChallenges'), 10)
    const currentUserName = localStorage.getItem('user')

    // Aktuellen User nochmal laden, um ID sicher zu haben
    const currentUser = await loadUserByName(currentUserName)
    if (!currentUser) return

    const modal = document.getElementById('challengeModal')

    // Formular HTML dynamisch erzeugen
    let html = `
    <div class="modal-content p-3 border bg-light rounded">
      <h4>Gib deine ${numberChallenges} Challenges ein</h4>
      <form id="challengeForm">
  `

    for (let i = 1; i <= numberChallenges; i++) {
        html += `
      <div class="mb-2">
        <label for="challenge${i}">Challenge ${i}</label>
        <input type="text" class="form-control" id="challenge${i}" name="challenge${i}" required>
      </div>
    `
    }

    html += `
        <button type="submit" class="btn btn-success mt-2">Speichern</button>
      </form>
    </div>
  `

    modal.innerHTML = html
    modal.style.display = 'flex' // Flex für zentrierte Darstellung aus CSS

    // Formular absenden
    document.getElementById('challengeForm').addEventListener('submit', async (e) => {
        e.preventDefault()

        const inputs = Array.from(e.target.elements).filter(el => el.tagName === 'INPUT')
        const challenges = inputs.map(input => ({
            title: input.value,
            user_id: currentUser.id,
        }))

        const { error } = await supabase.from('Challenges').insert(challenges)

        if (error) {
            alert('Fehler beim Speichern 😢')
            console.error(error)
        } else {
            alert('Challenges gespeichert! 🎉')
            modal.style.display = 'none'
            // Button ausblenden, da Challenges jetzt existieren
            toggleChallengeButton(true)
        }
    }, { once: true }) // Listener nur einmal anhängen
}

async function renderUserChallenges(userId) {
    const { data: challenges, error } = await supabase
        .from('Challenges')
        .select('title')
        .eq('user_id', userId)
        .order('id', { ascending: true })

    if (error) {
        console.error('Fehler beim Laden der Challenges:', error)
        return
    }

    const challengeList = document.getElementById('challengeList')

    if (!challenges || challenges.length === 0) {
        challengeList.innerHTML = '<p>Keine Challenges gefunden.</p>'
        return
    }

    // HTML für Challenges generieren
    challengeList.innerHTML = challenges.map(challenge => `
    <div class="challenge-item">${challenge.title}</div>
  `).join('')
}

