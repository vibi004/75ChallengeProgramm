import { supabase } from '../database/supabase.js'
import { getPreference, getDuration, getStartDate, getNumberChallenges} from "../database/preference.js";
import {formatDate} from "../service/service.js";
import {getAllUsers, getUserByName} from "../database/user.js";
import {addChallenges, getChallengesByUserId} from "../database/challenge.js";
import {getTodayDayId} from "../database/day.js";
import {
    checkIfAllChecked,
    getProgressByDayAndUser,
    getProgressByUserForTodayLength,
} from "../database/progress.js";
import {getPoints, incrementPerfectDays, incrementPoints, upsertPoints} from "../database/points.js";

document.addEventListener('DOMContentLoaded', init)

// --------------- Init-Funktion ----------------
async function init() {
    try {
        const currentUserName = localStorage.getItem('user') || 'Du'
        document.getElementById('user-name').textContent = `Hallo ${currentUserName}! 🎉`

        const preference = await getPreference();
        if (!preference) return

        localStorage.setItem('numberChallenges', await getNumberChallenges())
        showBaseData(preference)

        const users = await getAllUsers()
        if (!users) return
        await renderUserAvatars(users)

        const currentUser = await getUserByName(currentUserName)
        if (!currentUser) return

        const hasChallenges = await userHasChallenges(currentUser.id)
        toggleChallengeButton(!hasChallenges) // Button zeigen, wenn noch keine Challenges

        if (hasChallenges) {
            await renderUserChallenges(currentUser.id)
            await updateDailyProgress(currentUser.id)
            await (currentUser.id);
        }

        document.getElementById('logout').addEventListener('click', () => {
            localStorage.removeItem('user');     // Benutzer entfernen
            window.location.href = '../index.html'; // Zur Startseite weiterleiten
        });


    } catch (error) {
        console.error('Fehler im Init:', error)
    }
}

// --------------- Basisdaten anzeigen ----------------
function showBaseData(preference) {
    const startDate = new Date(preference.start_date)
    const formattedDate = formatDate(startDate)

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 74);

    const formattedEndDate = formatDate(endDate)
    const text = `Start: ${formattedDate}<br>Ende: ${formattedEndDate}`;
    document.getElementById('baseData').innerHTML = text;
}

// --------------- Avatare rendern ----------------
export async function renderUserAvatars(users) {
    const avatarContainer = document.getElementById('avatar-container')

    // Für alle Benutzer die Punkte laden
    const usersWithPoints = await Promise.all(
        users.map(async user => {
            const points = await getPoints(user.id)
            return { ...user, points }
        })
    )

    // HTML rendern
    avatarContainer.innerHTML = usersWithPoints.map(user => `
    <div class="text-center mx-2 my-3" style="min-width: 120px;">
        <img id="${user.name}AvatarFoto" src="../assets/avatars/${user.name}.png" alt="${user.name}"
             class="rounded-circle mb-2 img-fluid" style="max-width: 100px;" />
        <div class="fw-semibold">${user.name}</div>
        <div><strong>${user.points}</strong> Punkte</div>
    </div>
`).join('')
}

// --------------- Prüfen ob User Challenges hat ----------------
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

// --------------- Button anzeigen/verstecken ----------------
function toggleChallengeButton(show) {
    const btn = document.getElementById('openChallengeForm')
    btn.style.display = show ? 'inline-block' : 'none'
}

// --------------- Eventlistener für Button ----------------
document.getElementById('openChallengeForm').addEventListener('click', openChallengeModal)

// --------------- Modal mit Challenge-Formular öffnen ----------------
async function openChallengeModal() {
    const numberChallenges = parseInt(localStorage.getItem('numberChallenges'), 10)
    const currentUserName = localStorage.getItem('user')
    const currentUser = await getUserByName(currentUserName)
    if (!currentUser) return

    const modal = document.getElementById('challengeModal')

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
    modal.style.display = 'flex'

    document.getElementById('challengeForm').addEventListener('submit', async (e) => {
        e.preventDefault()
        const inputs = Array.from(e.target.elements).filter(el => el.tagName === 'INPUT')
        const challenges = inputs.map(input => ({
            title: input.value,
            user_id: currentUser.id,
        }))

        addChallenges(challenges)

    }, { once: true })
}

// --------------- Challenges rendern ----------------
async function renderUserChallenges(userId) {
    const challenges = await getChallengesByUserId(userId);

    const challengeList = document.getElementById('challengeList');

    if (!challenges || challenges.length === 0) {
        challengeList.innerHTML = '<p>Keine Challenges gefunden.</p>';
        return;
    }

    // 👉 Hole dayId für heute
    const dayId = await getTodayDayId();
    if (!dayId) {
        console.error('Kein gültiger dayId gefunden');
        return;
    }

    // 👉 Hole alle heutigen Fortschritte
    const progressData = await getProgressByDayAndUser(userId, dayId);

    const completedChallengeIds = progressData.map(p => p.challenge_id);

    // 👉 HTML generieren
    challengeList.innerHTML = `
  <div class="row justify-content-center g-3 mt-3">
    ${challenges.map(challenge => {
        const isCompleted = completedChallengeIds.includes(challenge.id);
        return `
          <div class="col-6 col-sm-4 col-md-3 col-lg-2">
            <div class="p-3 border rounded text-center challenge-box h-100"
                 data-challenge-id="${challenge.id}"
                 style="background-color: #fff5fa; border-color: #f5d0e0; opacity: ${isCompleted ? '0.6' : '1'}">
              <div class="fw-bold text-danger-emphasis mb-2">${challenge.title}</div>
              <input type="checkbox" class="challenge-checkbox" ${isCompleted ? 'checked disabled' : ''} />
            </div>
          </div>
        `;
    }).join('')}
  </div>
`

    // 👉 Checkbox-Logik nur für nicht deaktivierte Checkboxen anhängen
    document.querySelectorAll('.challenge-checkbox').forEach((checkbox, index) => {
        const challengeId = challenges[index].id;

        // Nur wenn nicht disabled
        if (!checkbox.disabled) {
            checkbox.addEventListener('change', async (event) => {
                const checked = event.target.checked;
                const dayId = await getTodayDayId();
                const challengeBox = checkbox.closest('.challenge-box');

                if (!dayId) return;

                if (checked) {
                    const { error } = await supabase
                        .from('Progress')
                        .upsert({
                            user_id: userId,
                            challenge_id: challengeId,
                            day_id: dayId,
                            completed: true
                        }, { onConflict: ['user_id', 'challenge_id', 'day_id'] });

                    if (error) {
                        console.error('Fehler beim Speichern:', error.message);
                    } else {
                        checkbox.disabled = true;
                        challengeBox.style.opacity = '0.6';
                        await updateDailyProgress(userId);
                        await incrementPoints(userId, 1);
                        if( await checkIfAllChecked(userId)) {
                            await incrementPoints(userId, 2);
                            await incrementPerfectDays(userId, 1);
                            alert("You got a perfect Day!")
                        }
                    }
                }
            });
        }
    });
}


// --------------- Täglichen Fortschritt anzeigen ----------------
async function updateDailyProgress(userId) {
    let count = await getProgressByUserForTodayLength(userId)
    document.getElementById('dailyProgress').textContent = `Tägliche Erledigte: ${count}`
}