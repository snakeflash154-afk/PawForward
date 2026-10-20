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