/* Shared front-end data layer (loaded by every page AND the sign-in popup).
   DEMO ONLY: accounts live in this browser's localStorage so you can test the flow.
   When we build the back end, only the bodies of these functions change. */

const Auth = (() => {
    const USERS = "pawforwardUsers", SESSION = "pawforwardSession";
    const read = (k, fallback) => {
        try { const v = JSON.parse(localStorage.getItem(k)); return v === null ? fallback : v; }
        catch (e) { return fallback; }
    };
    // Light obfuscation for the demo. Real password hashing happens on the server.
    const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h); };
    const start = (u) => localStorage.setItem(SESSION, JSON.stringify({ email: u.email, firstName: u.firstName }));

    return {
        current: () => read(SESSION, null),
        signUp(d) {
            const users = read(USERS, []);
            const email = d.email.trim().toLowerCase();
            if (users.some((u) => u.email === email)) {
                return { ok: false, error: "An account with this email already exists. Try signing in." };
            }
            const user = { firstName: d.firstName.trim(), lastName: d.lastName.trim(), dob: d.dob, city: d.city.trim(), email, pw: hash(d.password) };
            users.push(user);
            localStorage.setItem(USERS, JSON.stringify(users));
            start(user);
            return { ok: true };
        },
        signIn(emailRaw, password) {
            const email = emailRaw.trim().toLowerCase();
            const user = read(USERS, []).find((u) => u.email === email);
            if (!user) return { ok: false, error: "We couldn't find an account with that email. Sign up to create one." };
            if (user.pw !== hash(password)) return { ok: false, error: "Wrong password. Please try again." };
            start(user);
            return { ok: true };
        },
        signOut: () => localStorage.removeItem(SESSION)
    };
})();

const Fund = {
    goal: 50000,
    key: "pawforwardRaised",
    raised() { const n = Number(localStorage.getItem(this.key)); return n > 0 ? n : 34000; },
    add(n) { localStorage.setItem(this.key, String(this.raised() + n)); },
    percent() { return Math.min((this.raised() / this.goal) * 100, 100); }
};


/* ============================ Animals ============================
   Sample data. Replace with your real animals (later this comes from the back end).
   Each animal needs: ageMonths (whole number) and arrivalDate ("YYYY-MM-DD", the day it reached the shelter).
   Age text, age group and days in shelter are all worked out from those two values. */
const HIDDEN_GEM_DAYS = 90;      // in the shelter longer than this = Hidden Gem
const SENIOR_FROM_MONTHS = 84;   // 7 years and up
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);   // sample-data helper only

const ANIMALS = [
    { name: "Bantay",   type: "Dog", sex: "Male",   ageMonths: 24,  arrivalDate: daysAgo(140), img: "images/animal-bantay.jpg",   desc: "Loyal and playful. Loves long walks and learns tricks fast." },
    { name: "Mingming", type: "Cat", sex: "Female", ageMonths: 12,  arrivalDate: daysAgo(35),  img: "images/animal-mingming.jpg", desc: "Gentle lap cat who purrs the moment you sit down." },
    { name: "Choco",    type: "Dog", sex: "Male",   ageMonths: 48,  arrivalDate: daysAgo(20),  img: "images/animal-choco.jpg",    desc: "Calm and cuddly. Great with kids and other dogs." },
    { name: "Luna",     type: "Cat", sex: "Female", ageMonths: 36,  arrivalDate: daysAgo(95),  img: "images/animal-luna.jpg",     desc: "Curious and clever. Happiest near a sunny window." },
    { name: "Tagpi",    type: "Dog", sex: "Female", ageMonths: 6,   arrivalDate: daysAgo(12),  img: "images/animal-tagpi.jpg",    desc: "Energetic puppy who needs a patient, active family." },
    { name: "Kiko",     type: "Cat", sex: "Male",   ageMonths: 24,  arrivalDate: daysAgo(60),  img: "images/animal-kiko.jpg",     desc: "Shy at first, then your best friend. Loves treats." },
    { name: "Brownie",  type: "Dog", sex: "Male",   ageMonths: 96,  arrivalDate: daysAgo(210), img: "images/animal-brownie.jpg",  desc: "A gentle old soul who loves slow walks and warm laps." },
    { name: "Pusit",    type: "Cat", sex: "Male",   ageMonths: 3,   arrivalDate: daysAgo(8),   img: "images/animal-pusit.jpg",    desc: "Tiny, fluffy and very playful. Chases anything that moves." },
    { name: "Lola",     type: "Cat", sex: "Female", ageMonths: 120, arrivalDate: daysAgo(48),  img: "images/animal-lola.jpg",     desc: "Calm senior who just wants a quiet home and a soft bed." }
];

function formatAge(months) {
    if (months < 12) return months + (months === 1 ? " Month" : " Months");
    const y = Math.floor(months / 12), r = months % 12;
    return y + (y === 1 ? " Year" : " Years") + (r ? " " + r + (r === 1 ? " Month" : " Months") : "");
}
function ageGroup(a) { return a.ageMonths < 12 ? "young" : a.ageMonths >= SENIOR_FROM_MONTHS ? "senior" : "adult"; }
function ageGroupLabel(a) { const g = ageGroup(a); return g === "young" ? (a.type === "Dog" ? "Puppy" : "Kitten") : g === "senior" ? "Senior" : "Adult"; }
function daysInShelter(a) { return Math.max(0, Math.floor((Date.now() - new Date(a.arrivalDate + "T00:00:00").getTime()) / 86400000)); }
function isHiddenGem(a) { return daysInShelter(a) > HIDDEN_GEM_DAYS; }

// Hidden Gems first, then everyone by longest wait
function sortAnimals(list) {
    return list.slice().sort((a, b) => (isHiddenGem(b) - isHiddenGem(a)) || (daysInShelter(b) - daysInShelter(a)));
}

function animalCard(a, i) {
    const days = daysInShelter(a), gem = isHiddenGem(a);
    const card = document.createElement("article");
    card.className = "animal-card" + (gem ? " is-gem" : "");
    card.style.setProperty("--i", i || 0);
    card.innerHTML =
        '<div class="animal-pic ph"><img loading="lazy" onerror="this.remove()">' + (gem ? '<span class="gem-badge">\u2605 Hidden Gem</span>' : "") + "</div>" +
        '<div class="animal-info"><h3></h3>' +
        '<ul class="badges" aria-label="Details"><li class="badge badge-type"></li><li class="badge badge-age"></li><li class="badge badge-sex"></li><li class="badge badge-group"></li></ul>' +
        '<p class="animal-desc"></p><p class="wait"></p><a class="btn"></a></div>';
    const img = card.querySelector("img");
    img.src = a.img; img.alt = a.name;
    card.querySelector("h3").textContent = a.name;
    card.querySelector(".badge-type").textContent = a.type;
    card.querySelector(".badge-age").textContent = formatAge(a.ageMonths);
    card.querySelector(".badge-sex").textContent = a.sex;
    card.querySelector(".badge-group").textContent = ageGroupLabel(a);
    card.querySelector(".animal-desc").textContent = a.desc;
    card.querySelector(".wait").textContent = gem
        ? "Waiting " + days + " days for a home. Give " + a.name + " a second look."
        : "In our shelter " + days + (days === 1 ? " day" : " days");
    const btn = card.querySelector(".btn");
    btn.textContent = "Meet " + a.name;
    btn.href = "contact.html?pet=" + encodeURIComponent(a.name);
    return card;
}