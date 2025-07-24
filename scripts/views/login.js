import {getUserByName, verifyPassword} from '../database/user.js'

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

    const userObject = getUserByName(name);

    if (userObject.length === 0) {
        errorEl.textContent = 'Kein Benutzer mit diesem Namen gefunden.'
        return
    }

    const user = await userObject

    if (!(await verifyPassword(name, password))) {
        errorEl.textContent = 'Falsches Passwort.'
        return
    }

    errorEl.style.color = 'green'
    errorEl.textContent = `Hallo ${user.name}! Du bist eingeloggt.`

    localStorage.setItem('user', user.name)

    setTimeout(() => {
        window.location.href = 'pages/challenge.html'
    }, 1000)
})