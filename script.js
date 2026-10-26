/* Site-wide behavior. Needs layout.js (top of <body>) and core.js loaded first. */

const byId = (id) => document.getElementById(id);
const qs = (sel, root) => (root || document).querySelector(sel);
const qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));

/* =============================== Theme =============================== */
document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-theme-toggle]")) return;
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.classList.add("theme-anim");
    root.dataset.theme = next;
    try { localStorage.setItem("pawforwardTheme", next); } catch (err) {}
    qsa("[data-theme-toggle]").forEach((b) => b.setAttribute("aria-pressed", next === "dark"));
    setTimeout(() => root.classList.remove("theme-anim"), 450);
});

/* =============================== Toast =============================== */
const toastStack = document.createElement("div");
toastStack.className = "toast-stack";
toastStack.setAttribute("aria-live", "polite");
document.body.appendChild(toastStack);

// toast("Added to cart!", { type: "success", duration: 3600, action: { label: "Checkout", onClick: fn } })
function toast(message, opts) {
    const o = Object.assign({ type: "success", duration: 3600, action: null }, opts);
    const t = document.createElement("div");
    t.className = "toast " + o.type;
    t.setAttribute("role", "status");
    t.innerHTML = '<span class="t-icon" aria-hidden="true"></span><span class="t-msg"></span>';
    t.querySelector(".t-icon").textContent = o.type === "success" ? "\u2713" : "!";
    t.querySelector(".t-msg").textContent = message;
    let timer;
    function dismiss() { clearTimeout(timer); t.classList.remove("show"); setTimeout(() => t.remove(), 500); }
    if (o.action) {
        const b = document.createElement("button");
        b.type = "button"; b.className = "t-action"; b.textContent = o.action.label;
        b.addEventListener("click", () => { o.action.onClick(); dismiss(); });
        t.appendChild(b);
    }
    toastStack.appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add("show")));
    timer = setTimeout(dismiss, o.duration);
    t.addEventListener("mouseenter", () => clearTimeout(timer));
    t.addEventListener("mouseleave", () => { timer = setTimeout(dismiss, 1500); });
    return dismiss;
}

/* ====================== Form validation helpers ====================== */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const need = (label) => (v) => (v.trim() ? "" : label + " is required.");
const emailRule = (v) => !v.trim() ? "Email is required." : EMAIL_RE.test(v.trim()) ? "" : "Enter a valid email, like name@example.com.";

function setFieldState(input, error, okText) {
    const field = input.closest(".field");
    if (!field) return !error;
    const msg = field.querySelector(".field-msg");
    field.classList.toggle("is-invalid", !!error);
    field.classList.toggle("is-valid", !error && !!okText);
    input.setAttribute("aria-invalid", error ? "true" : "false");
    if (msg) msg.textContent = error || okText || "";
    return !error;
}
function clearFieldStates(root) {
    qsa(".field", root).forEach((f) => {
        f.classList.remove("is-invalid", "is-valid");
        const m = qs(".field-msg", f); if (m) m.textContent = "";
        const i = qs("input, select, textarea", f); if (i) i.removeAttribute("aria-invalid");
    });
}

// rules: { inputId: { check(value) -> error text or "", ok: "success text", also: [ids to re-check] } }
function wireForm(form, rules, onValid) {
    const ids = Object.keys(rules);
    const validate = (id) => { const input = byId(id); return setFieldState(input, rules[id].check(input.value), rules[id].ok); };
    ids.forEach((id) => {
        const input = byId(id);
        let touched = false;
        // Empty fields are only reported on submit, so clicking a link never makes the layout jump
        input.addEventListener("blur", () => { if (!input.value.trim()) return; touched = true; validate(id); });
        input.addEventListener("input", () => {
            if (touched || input.closest(".field").classList.contains("is-invalid")) validate(id);
            (rules[id].also || []).forEach((other) => { if (byId(other).value) validate(other); });
        });
    });
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        let first = null;
        ids.forEach((id) => { if (!validate(id) && !first) first = byId(id); });
        if (first) { first.focus(); return; }
        onValid();
    });
}

/* ========================= Password "eye" toggle ========================= */
const EYE =
    '<svg class="on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
    '<svg class="off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.9 17.9A10 10 0 0 1 12 20c-7 0-11-8-11-8a18.4 18.4 0 0 1 5.1-5.9M9.9 4.2A9 9 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2m-6.7-1.1a3 3 0 1 1-4.2-4.2"/><path d="M1 1l22 22"/></svg>';

function addPasswordToggles(root) {
    qsa('input[type="password"]', root).forEach((input) => {
        if (input.closest(".pw-wrap")) return;
        const wrap = document.createElement("div");
        wrap.className = "pw-wrap";
        input.parentNode.insertBefore(wrap, input);
        wrap.appendChild(input);
        const btn = document.createElement("button");
        btn.type = "button"; btn.className = "pw-toggle"; btn.innerHTML = EYE;
        btn.setAttribute("aria-label", "Show password");
        btn.setAttribute("aria-pressed", "false");
        btn.addEventListener("click", () => {
            const show = input.type === "password";
            input.type = show ? "text" : "password";
            btn.setAttribute("aria-pressed", show);
            btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
        });
        wrap.appendChild(btn);
    });
}

/* ===================== Sign-in dialog + auth state ===================== */
const dlg = byId("authDialog");
const signInBtn = byId("openPopup");
const greeting = byId("greeting");
const header = byId("siteHeader");

addPasswordToggles(dlg);

function showAuthView(which) {
    byId("signInSection").hidden = which !== "in";
    byId("signUpSection").hidden = which !== "up";
    byId("signInError").hidden = true;
    byId("signUpError").hidden = true;
    byId(which === "in" ? "email" : "fName").focus();
}
function openAuth(notice) {
    const n = byId("authNotice");
    n.textContent = notice || "";
    n.hidden = !notice;
    ["signInForm", "signUpForm"].forEach((id) => { byId(id).reset(); clearFieldStates(byId(id)); });
    qsa('.pw-toggle[aria-pressed="true"]', dlg).forEach((b) => b.click());
    byId("signInSection").hidden = false;
    byId("signUpSection").hidden = true;
    byId("signInError").hidden = true;
    byId("signUpError").hidden = true;
    if (!dlg.open) dlg.showModal();
    document.body.style.overflow = "hidden";
    byId("email").focus();
}
function closeAuth() { if (dlg.open) dlg.close(); }

// Returns true if signed in. Otherwise opens the dialog with a message and returns false.
function requireAuth(notice) {
    if (Auth.current()) return true;
    openAuth(notice);
    return false;
}

function refreshAuth() {
    const user = Auth.current();
    signInBtn.textContent = user ? "Sign out" : "Sign In";
    greeting.hidden = !user;
    greeting.textContent = user ? "Hi, " + user.firstName : "";
    window.dispatchEvent(new Event("authchange"));
}

dlg.addEventListener("close", () => { document.body.style.overflow = ""; });
dlg.addEventListener("click", (e) => { if (e.target === dlg) closeAuth(); });   // click on the backdrop
byId("authClose").addEventListener("click", closeAuth);
byId("showSignUp").addEventListener("click", (e) => { e.preventDefault(); showAuthView("up"); });
byId("showSignIn").addEventListener("click", (e) => { e.preventDefault(); showAuthView("in"); });

signInBtn.addEventListener("click", () => {
    if (Auth.current()) { Auth.signOut(); refreshAuth(); toast("You've been signed out."); }
    else openAuth();
});
window.addEventListener("storage", refreshAuth);   // keeps other tabs in sync

function authSuccess(message) {
    closeAuth();
    refreshAuth();
    toast(message + Auth.current().firstName + "!");
}
function authFail(id, text) { const el = byId(id); el.textContent = text; el.hidden = false; }

wireForm(byId("signInForm"), {
    email:    { check: emailRule, ok: "" },
    password: { check: need("Password"), ok: "" }
}, () => {
    const r = Auth.signIn(byId("email").value, byId("password").value);
    if (!r.ok) return authFail("signInError", r.error);
    authSuccess("Welcome back, ");
});

wireForm(byId("signUpForm"), {
    fName: { check: need("First name"), ok: "Looks good" },
    lName: { check: need("Last name"), ok: "Looks good" },
    dob:   { check: (v) => !v ? "Date of birth is required." : new Date(v) > new Date() ? "Date of birth can't be in the future." : "", ok: "Looks good" },
    city:  { check: need("City"), ok: "Looks good" },
    signUpEmail: { check: emailRule, ok: "Email looks good" },
    signUpPassword: {
        check: (v) => !v ? "Password is required." : v.length < 8 ? "Use at least 8 characters (" + v.length + "/8)." : "",
        ok: "Password is long enough", also: ["confirmPassword"]
    },
    confirmPassword: {
        check: (v) => !v ? "Please confirm your password." : v !== byId("signUpPassword").value ? "The passwords don't match." : "",
        ok: "Passwords match"
    }
}, () => {
    const r = Auth.signUp({
        firstName: byId("fName").value, lastName: byId("lName").value, dob: byId("dob").value,
        city: byId("city").value, email: byId("signUpEmail").value, password: byId("signUpPassword").value
    });
    if (!r.ok) return authFail("signUpError", r.error);
    authSuccess("Welcome to PawForward, ");
});

refreshAuth();

/* ================== Header: solid on scroll, progress line ================== */
const mainNav = byId("mainNav");
const menuToggle = byId("menuToggle");
const progressBar = byId("scrollProgress");
function onScroll() {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 60 || mainNav.classList.contains("open"));
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
}
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll);
onScroll();

menuToggle.addEventListener("click", () => {
    const open = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", open);
    onScroll();
});

/* ========================= Smooth page transitions ========================= */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === "_blank" || a.hasAttribute("download") || reduceMotion) return;
    let url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.protocol !== location.protocol || url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;   // same page or #anchor
    e.preventDefault();
    document.body.classList.add("leaving");
    setTimeout(() => { location.href = a.href; }, 260);
});
window.addEventListener("pageshow", (e) => { if (e.persisted) document.body.classList.remove("leaving"); });

/* ===================== Reveal, counters, progress bar ===================== */
function animateCount(el) {
    const target = +el.dataset.count, start = performance.now(), duration = 1800;
    (function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
    })(start);
}
const homeFill = byId("progressFill"), homeText = byId("progressText");
if (homeFill && homeFill.dataset.percent) {
    const pct = Math.round(Fund.percent());
    homeFill.dataset.percent = pct;
    if (homeText) homeText.textContent = pct + "% of this month's goal reached";
}
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add("in");
        if (el.dataset.count) animateCount(el);
        if (el.dataset.percent) el.style.width = el.dataset.percent + "%";
        observer.unobserve(el);
    });
}, { threshold: 0.25 });
qsa(".reveal, [data-count], [data-percent]").forEach((el) => observer.observe(el));

/* ==================== Quick-donate widget (About page) ==================== */
const donateNow = byId("donateNow");
if (donateNow) {
    const amountBtns = qsa(".amount-btn");
    const customInput = byId("customAmount");
    const impactText = byId("donateImpact");
    const showImpact = (amount) => {
        if (!(amount >= 1)) { impactText.textContent = ""; donateNow.href = "donate.html"; return; }
        const days = Math.max(1, Math.floor(amount / 25));
        impactText.textContent = "\u20B1" + Number(amount).toLocaleString() + " feeds a rescued animal for " + days + (days === 1 ? " day" : " days");
        donateNow.href = "donate.html?amount=" + amount;
    };
    amountBtns.forEach((btn) => btn.addEventListener("click", () => {
        amountBtns.forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        customInput.value = "";
        showImpact(+btn.dataset.amount);
    }));
    customInput.addEventListener("input", () => {
        amountBtns.forEach((b) => b.classList.remove("selected"));
        showImpact(+customInput.value);
    });
    donateNow.addEventListener("click", (e) => { if (!requireAuth("Please sign in to donate.")) e.preventDefault(); });
    showImpact(250);
}

/* ========================= Home teaser + Adopt page ========================= */
const teaserGrid = byId("teaserGrid");
if (teaserGrid) sortAnimals(ANIMALS).slice(0, 3).forEach((a, i) => teaserGrid.appendChild(animalCard(a, i)));

const animalGrid = byId("animalGrid");
if (animalGrid) {
    const filters = { type: "all", age: "all", sex: "all", gem: false };
    const gemBtn = byId("gemOnly");

    function renderAnimals() {
        const list = sortAnimals(ANIMALS).filter((a) =>
            (filters.type === "all" || a.type === filters.type) &&
            (filters.age === "all" || ageGroup(a) === filters.age) &&
            (filters.sex === "all" || a.sex === filters.sex) &&
            (!filters.gem || isHiddenGem(a)));
        animalGrid.innerHTML = "";
        list.forEach((a, i) => animalGrid.appendChild(animalCard(a, i)));
        const gems = list.filter(isHiddenGem).length;
        byId("resultCount").textContent = "Showing " + list.length + " of " + ANIMALS.length + " animals" + (gems ? " \u00B7 " + gems + " Hidden Gem" + (gems === 1 ? "" : "s") + " first" : "");
        if (!list.length) animalGrid.innerHTML = '<p class="grid-empty">No animals match these filters. Try removing one.</p>';
    }
    function resetFilters() {
        Object.assign(filters, { type: "all", age: "all", sex: "all", gem: false });
        qsa("#filters .chip").forEach((c) => c.setAttribute("aria-pressed", c.dataset.value === "all" ? "true" : "false"));
        gemBtn.setAttribute("aria-pressed", "false");
        renderAnimals();
    }
    byId("filters").addEventListener("click", (e) => {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        if (chip === gemBtn) {
            filters.gem = !filters.gem;
            gemBtn.setAttribute("aria-pressed", filters.gem);
        } else {
            const group = chip.closest(".filter-group");
            qsa(".chip", group).forEach((c) => c.setAttribute("aria-pressed", c === chip));
            filters[group.dataset.group] = chip.dataset.value;
        }
        renderAnimals();
    });
    byId("clearFilters").addEventListener("click", resetFilters);
    renderAnimals();
}

/* ============================== Contact form ============================== */
const contactForm = byId("contactForm");
if (contactForm) {
    const pet = new URLSearchParams(location.search).get("pet");
    if (pet) {
        byId("cTopic").value = "Adopting a pet";
        byId("cMessage").value = "Hi! I'd like to know more about adopting " + pet + ".";
    }
    wireForm(contactForm, {
        cName:    { check: need("Name"), ok: "Looks good" },
        cEmail:   { check: emailRule, ok: "Email looks good" },
        cMessage: { check: need("Message"), ok: "" }
    }, () => {
        // TODO: send to your back end or a form service
        const name = byId("cName").value.trim();
        const msg = byId("formThanks");
        msg.textContent = "Thanks, " + name + "! We got your message and will reply soon.";
        msg.classList.add("show");
        toast("Message sent!");
        contactForm.reset();
        clearFieldStates(contactForm);
    });
}

/* ===================== Payment picker (donate + checkout) ===================== */
let payCount = 0;
function paymentPicker() {
    const name = "pay" + (++payCount);
    const METHODS = [["card", "Card", "#6b7280"], ["gcash", "GCash", "#007cff"], ["maya", "Maya", "#12b76a"], ["bank", "Bank transfer", "#b63737"]];
    const input = (key, label, ph, ac, extra) =>
        '<div class="field"><label for="' + name + "-" + key + '">' + label + '<span class="req" aria-hidden="true">*</span></label>' +
        '<input id="' + name + "-" + key + '" inputmode="numeric" placeholder="' + ph + '" autocomplete="' + ac + '" ' + extra + '><small class="field-msg"></small></div>';

    const el = document.createElement("fieldset");
    el.className = "pay";
    el.innerHTML =
        "<legend>Payment method</legend>" +
        '<div class="pay-methods">' + METHODS.map((m, i) =>
            '<label class="pay-opt"><input type="radio" name="' + name + '" value="' + m[0] + '"' + (i === 0 ? " checked" : "") + '><span><i style="background:' + m[2] + '"></i>' + m[1] + "</span></label>").join("") + "</div>" +
        '<div class="pay-panel" data-for="card">' + input("num", "Card number", "1234 5678 9012 3456", "cc-number", 'maxlength="23"') +
            '<div class="pay-row">' + input("exp", "Expiry (MM/YY)", "MM/YY", "cc-exp", 'maxlength="5"') + input("cvc", "CVC", "123", "cc-csc", 'maxlength="4"') + "</div></div>" +
        '<div class="pay-panel" data-for="gcash" hidden><p>You\'ll be sent to GCash to approve this payment. Keep your registered mobile number handy.</p></div>' +
        '<div class="pay-panel" data-for="maya" hidden><p>You\'ll be sent to Maya to approve this payment. Have your Maya app or login ready.</p></div>' +
        '<div class="pay-panel" data-for="bank" hidden><p><strong>Bank transfer</strong><br>BDO &middot; PawForward Animal Rescue<br>Account no. 0000 0000 0000 (sample, replace with yours)<br>Email your receipt to hello@pawforward.org.</p></div>';

    const current = () => qs('input[name="' + name + '"]:checked', el).value;
    const get = (k) => qs("#" + name + "-" + k, el);   // look inside the picker: it may not be in the page yet

    el.addEventListener("change", (e) => {
        if (e.target.name !== name) return;
        qsa(".pay-panel", el).forEach((p) => { p.hidden = p.dataset.for !== current(); });
    });
    get("num").addEventListener("input", (e) => {
        const d = e.target.value.replace(/\D/g, "").slice(0, 19);
        e.target.value = d.replace(/(.{4})/g, "$1 ").trim();
    });
    get("exp").addEventListener("input", (e) => {
        let d = e.target.value.replace(/\D/g, "").slice(0, 4);
        if (d.length > 2) d = d.slice(0, 2) + "/" + d.slice(2);
        e.target.value = d;
    });
    get("cvc").addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4); });

    function validate() {
        if (current() !== "card") return true;
        const num = get("num"), exp = get("exp"), cvc = get("cvc");
        let ok = true;
        ok = setFieldState(num, /^\d{13,19}$/.test(num.value.replace(/\s/g, "")) ? "" : "Enter a valid card number.", "Card number looks good") && ok;
        const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(exp.value);
        const expError = !m ? "Use MM/YY." : new Date(2000 + +m[2], +m[1], 1) <= new Date() ? "This card has expired." : "";
        ok = setFieldState(exp, expError, "Looks good") && ok;
        ok = setFieldState(cvc, /^\d{3,4}$/.test(cvc.value) ? "" : "3 or 4 digits.", "Looks good") && ok;
        if (!ok) qs(".is-invalid input", el).focus();
        return ok;
    }
    const labels = { card: "card", gcash: "GCash", maya: "Maya", bank: "bank transfer" };
    return { el: el, validate: validate, method: current, label: () => labels[current()] };
}