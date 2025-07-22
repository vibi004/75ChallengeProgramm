import { supabase } from './supabase.js'

const form = document.getElementById('login-form')
const errorEl = document.getElementById('login-error')

form.addEventListener('submit', async (e) => {
    e.preventDefault()
    errorEl.textContent = ''
    errorEl.style.color = 'red' // Standardfarbe für Fehler

    const name = form.name.value
    const password = form.password.value.trim()

    if (!name || !password) {
        errorEl.textContent = 'Bitte Name und Passwort eingeben.'
        return
    }

    const { data, error } = await supabase
        .from('User')
        .select()
        .eq('name', name)  // hier name statt username

    if (error) {
        console.error('Supabase Fehler:', error)
        errorEl.textContent = 'Ein Fehler ist aufgetreten. Bitte versuche es später nochmal.'
        return
    }

    if (data.length === 0) {
        errorEl.textContent = 'Kein Benutzer mit diesem Namen gefunden.'
        return
    }

    if (data.length > 1) {
        errorEl.textContent = 'Mehrere Benutzer mit diesem Namen gefunden. Bitte wähle einen eindeutigen Namen.'
        return
    }

    const user = data[0]

    // Hier könntest du noch prüfen, ob Passwort stimmt (wenn du das so in DB hast)
    // Beispiel:
    if (user.password !== password) {
        errorEl.textContent = 'Falsches Passwort.'
        return
    }

    // Login erfolgreich
    errorEl.style.color = 'green'
    errorEl.textContent = `Hallo ${user.name}! Du bist eingeloggt.`

    localStorage.setItem('user', user.name)

        // 🟢 Leite zur Challenge-Seite weiter
    setTimeout(() => {
        window.location.href = 'challenge.html'
    }, 1000)

    // Hier weiterleiten oder Seite wechseln
})