/* Sign in / sign up popup. Runs inside the iframe and talks to the page with postMessage. */
const $ = (id) => document.getElementById(id);
const tell = (msg) => window.parent.postMessage(msg, "*");

function showError(id, text) { const el = $(id); el.textContent = text; el.hidden = !text; }

function show(which) {
    $("signInSection").hidden = which !== "in";
    $("signUpSection").hidden = which !== "up";
    showError("signInError", "");
    showError("signUpError", "");
    $(which === "in" ? "email" : "fName").focus();
}

function close() { tell({ type: "close" }); }

// The page opens us with an optional message such as "Please sign in to donate."
window.addEventListener("message", (e) => {
    if (e.source !== window.parent || !e.data || e.data.type !== "open") return;
    $("notice").textContent = e.data.notice || "";
    $("notice").hidden = !e.data.notice;
    $("signInForm").reset();
    $("signUpForm").reset();
    show("in");
});

$("closeBtn").addEventListener("click", close);
$("overlay").addEventListener("mousedown", (e) => { if (e.target === $("overlay")) close(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
$("showSignUp").addEventListener("click", (e) => { e.preventDefault(); show("up"); });
$("showSignIn").addEventListener("click", (e) => { e.preventDefault(); show("in"); });

$("dob").max = new Date().toISOString().split("T")[0];

$("signInForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("email").value, password = $("password").value;
    if (!email || !password) return showError("signInError", "Enter your email and password.");
    const result = Auth.signIn(email, password);
    if (!result.ok) return showError("signInError", result.error);
    tell({ type: "authChanged" });
});

$("signUpForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = {
        firstName: $("fName").value, lastName: $("lName").value, dob: $("dob").value,
        city: $("city").value, email: $("signUpEmail").value, password: $("signUpPassword").value
    };
    if (!d.firstName.trim() || !d.lastName.trim() || !d.dob || !d.city.trim() || !d.email.trim() || !d.password) {
        return showError("signUpError", "Please fill in every field.");
    }
    if (!/^\S+@\S+\.\S+$/.test(d.email.trim())) return showError("signUpError", "Enter a valid email address.");
    if (d.password.length < 8) return showError("signUpError", "Your password needs at least 8 characters.");
    if (d.password !== $("confirmPassword").value) return showError("signUpError", "The passwords don't match.");
    const result = Auth.signUp(d);
    if (!result.ok) return showError("signUpError", result.error);
    tell({ type: "authChanged" });
});

tell({ type: "ready" });