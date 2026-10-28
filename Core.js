/* Shared front-end data layer (loaded by every page).
   DEMO ONLY: accounts and per-user data live in this browser's localStorage so you can test every flow.
   When we build the back end, only the bodies of Auth / UserData / Fund change. */

const ALLOW_GUEST_DONATIONS = false;   // true = visitors can donate without an account (they enter an email for the receipt)

const Auth = (() => {
    const USERS = "pawforwardUsers", SESSION = "pawforwardSession", CODE = "pawforwardCode";
    const read = (k, fallback, store) => {
        try { const v = JSON.parse((store || localStorage).getItem(k)); return v === null ? fallback : v; }
        catch (e) { return fallback; }
    };
    // Light obfuscation for the demo. Real password hashing happens on the server.
    const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h); };
    const users = () => read(USERS, []);
    const saveUsers = (list) => localStorage.setItem(USERS, JSON.stringify(list));
    const norm = (e) => e.trim().toLowerCase();
    const nameOf = (u) => {
        if (u.firstName) return u.firstName;
        const local = u.email.split("@")[0].split(/[._+\-\d]+/)[0] || u.email.split("@")[0];
        return local.charAt(0).toUpperCase() + local.slice(1);
    };
    const start = (u) => localStorage.setItem(SESSION, JSON.stringify({ email: u.email, firstName: nameOf(u) }));

    return {
        current: () => read(SESSION, null),
        name() { const s = this.current(); return s ? s.firstName : ""; },
        exists: (email) => users().some((u) => u.email === norm(email)),
        profile() { const s = this.current(); return s ? users().find((u) => u.email === s.email) || null : null; },

        // Sign-up is just email + password. The name is added later in My account.
        signUp(d) {
            const list = users(), email = norm(d.email);
            if (list.some((u) => u.email === email)) return { ok: false, error: "An account with this email already exists. Try signing in." };
            const user = { email, pw: hash(d.password), firstName: "", lastName: "", city: "", phone: "", createdAt: new Date().toISOString() };
            list.push(user); saveUsers(list); start(user);
            return { ok: true };
        },
        signIn(emailRaw, password) {
            const user = users().find((u) => u.email === norm(emailRaw));
            if (!user) return { ok: false, error: "We couldn't find an account with that email. Sign up to create one." };
            if (user.pw !== hash(password)) return { ok: false, error: "Wrong password. Please try again." };
            start(user);
            return { ok: true };
        },
        signOut: () => localStorage.removeItem(SESSION),

        updateProfile(fields) {
            const list = users(), s = this.current();
            const user = s && list.find((u) => u.email === s.email);
            if (!user) return { ok: false, error: "Please sign in again." };
            ["firstName", "lastName", "city", "phone"].forEach((k) => { if (k in fields) user[k] = String(fields[k]).trim(); });
            saveUsers(list); start(user);
            return { ok: true };
        },
        changePassword(current, next) {
            const list = users(), s = this.current();
            const user = s && list.find((u) => u.email === s.email);
            if (!user) return { ok: false, error: "Please sign in again." };
            if (user.pw !== hash(current)) return { ok: false, error: "Your current password is not right." };
            user.pw = hash(next); saveUsers(list);
            return { ok: true };
        },
        // Demo reset: the real version is an emailed link that expires.
        resetPassword(email, next) {
            const list = users(), user = list.find((u) => u.email === norm(email));
            if (!user) return { ok: false, error: "Account not found." };
            user.pw = hash(next); saveUsers(list);
            return { ok: true };
        },
        // Demo one-time code: the real version is emailed or texted and expires in minutes.
        sendCode(email) {
            if (!this.exists(email)) return null;
            const code = String(Math.floor(100000 + Math.random() * 900000));
            sessionStorage.setItem(CODE, JSON.stringify({ email: norm(email), code: code, exp: Date.now() + 10 * 60000 }));
            return code;
        },
        verifyCode(email, code) {
            const c = read(CODE, null, sessionStorage);
            if (!c || c.email !== norm(email) || Date.now() > c.exp) return { ok: false, error: "That code has expired. Ask for a new one." };
            if (c.code !== code.trim()) return { ok: false, error: "That code isn't right. Check it and try again." };
            sessionStorage.removeItem(CODE);
            start(users().find((u) => u.email === norm(email)));
            return { ok: true };
        }
    };
})();

/* Per-user data: donations (with receipts), saved animals, adoption inquiries */
const UserData = (() => {
    const key = (email) => "pawforwardData:" + email;
    const empty = () => ({ donations: [], saved: [], inquiries: [] });
    const load = () => {
        const s = Auth.current();
        if (!s) return null;
        try { return Object.assign(empty(), JSON.parse(localStorage.getItem(key(s.email)))); } catch (e) { return empty(); }
    };
    const save = (d) => localStorage.setItem(key(Auth.current().email), JSON.stringify(d));
    return {
        donations() { const d = load(); return d ? d.donations : []; },
        addDonation(rec) { const d = load(); if (d) { d.donations.unshift(rec); save(d); } return rec; },
        saved() { const d = load(); return d ? d.saved : []; },
        isSaved(name) { return this.saved().includes(name); },
        toggleSaved(name) {
            const d = load(); if (!d) return false;
            const i = d.saved.indexOf(name);
            if (i >= 0) d.saved.splice(i, 1); else d.saved.push(name);
            save(d);
            return i < 0;
        },
        inquiries() { const d = load(); return d ? d.inquiries : []; },
        addInquiry(rec) { const d = load(); if (d) { d.inquiries.unshift(Object.assign({ date: new Date().toISOString(), status: "Sent" }, rec)); save(d); } }
    };
})();

function makeDonation(info) {
    const now = new Date();
    const stamp = now.toISOString().slice(0, 10).replace(/-/g, "");
    return { id: "PF-" + stamp + "-" + String(Math.floor(1000 + Math.random() * 9000)), date: now.toISOString(), amount: info.amount, method: info.method, email: info.email || "", name: info.name || "" };
}

const Fund = {
    goal: 50000,
    key: "pawforwardRaised",
    raised() { const n = Number(localStorage.getItem(this.key)); return n > 0 ? n : 34000; },
    add(n) { localStorage.setItem(this.key, String(this.raised() + n)); },
    percent() { return Math.min((this.raised() / this.goal) * 100, 100); }
};

/* Where donations go (sample percentages, replace with your real breakdown) */
const FUNDS = [
    { label: "Food and shelter",   pct: 45, color: "#b63737" },
    { label: "Vet care and vaccines", pct: 30, color: "#c8921a" },
    { label: "Rescue operations",  pct: 15, color: "#7a8f6a" },
    { label: "Admin and fundraising", pct: 10, color: "#b9a8a6" }
];

/* Rescue stories (sample). Before/after photos: images/story-<id>-before.jpg and -after.jpg */
const STORIES = [
    { id: "bantay", name: "Bantay", title: "From the roadside to the sofa", text: "Found limping beside a highway, hungry and scared. After three weeks of vet care and a lot of cuddles, Bantay now sleeps on a sofa and chases his tail." },
    { id: "luna",   name: "Luna",   title: "Small, silent and sick", text: "Luna arrived with an eye infection and barely any fur. A patient foster family nursed her back, and she learned to purr again." },
    { id: "choco",  name: "Choco",  title: "A second chance at a family", text: "Choco spent months alone on a construction site. Today he walks to school with the kids who adopted him." }
];

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
        '<div class="animal-pic ph"><img loading="lazy" onerror="this.remove()"><button type="button" class="heart" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg></button>' + (gem ? '<span class="gem-badge">\u2605 Hidden Gem</span>' : "") + "</div>" +
        '<div class="animal-info"><h3></h3>' +
        '<ul class="badges" aria-label="Details"><li class="badge badge-type"></li><li class="badge badge-age"></li><li class="badge badge-sex"></li><li class="badge badge-group"></li></ul>' +
        '<p class="animal-desc"></p><p class="wait"></p><a class="btn"></a></div>';
    const img = card.querySelector("img");
    img.src = a.img; img.alt = a.name;
    card.querySelector("h3").textContent = a.name;
    const heart = card.querySelector(".heart");
    heart.dataset.name = a.name;
    heart.setAttribute("aria-label", "Save " + a.name);
    heart.setAttribute("aria-pressed", UserData.isSaved(a.name));
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