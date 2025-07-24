import { getPreference, getNumberChallenges } from "../database/preference.js"
import { getChallengesByUserId } from "../database/challenge.js"
import { isChallengeChecked } from "../database/progress.js"
import { getUserByName } from "../database/user.js"
import {getDayByDate} from "../database/day.js";

document.addEventListener("DOMContentLoaded", async () => {
    const userName = localStorage.getItem('user')
    const user = await getUserByName(userName)
    if (!user) return

    const preference = await getPreference()
    const challenges = await getChallengesByUserId(user.id)
    const numberChallenges = await getNumberChallenges()

    const tableHead = document.getElementById("challenge-table-head")
    const tableBody = document.getElementById("challenge-table-body")

    // 👉 Kopfzeile mit Challenge-Titeln
    tableHead.innerHTML = `
    <tr>
        <th class="number-col">Nr.</th>
      <th class="date-col">Datum</th>
      ${challenges.map((c, i) => `<th><small>${c.title}</small></th>`).join('')}
    </tr>
  `

    const startDate = new Date(preference.start_date)
    const days = Array.from({ length: 75 }, (_, i) => {
        const d = new Date(startDate)
        d.setDate(d.getDate() + i)
        return d
    })

    for (let i = 0; i < days.length; i++) {
        const date = days[i];
        const dayISO = date.toISOString().split('T')[0];
        const matchingDay = await getDayByDate(dayISO);
        if (!matchingDay) continue;
        const dayId = matchingDay.id;

        const row = document.createElement("tr");

        const cells = [];

        // Nummerierung
        cells.push(`<td class="number-col">${i + 1}</td>`);
        // Datum (breiter)
        cells.push(`<td class="date-col">${dayISO}</td>`);

        // Challenges (gleich breit)
        const challengeCells = await Promise.all(challenges.map(async (challenge) => {
            const checked = await isChallengeChecked(dayId, user.id, challenge.id);
            return `<td class="challenge-col"><input type="checkbox" ${checked ? 'checked' : ''} disabled></td>`;
        }));

        cells.push(...challengeCells);

        row.innerHTML = cells.join('');
        tableBody.appendChild(row);
    }


})
