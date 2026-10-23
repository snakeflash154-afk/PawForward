/* Site-wide behavior. Needs core.js and layout.js loaded first. */

const popup = document.getElementById("popFrame");
const signInBtn = document.getElementById("openPopup");
const greeting = document.getElementById("greeting");
const header = document.getElementById("siteHeader");

/* ---------- Sign-in popup + auth state ---------- */
let popReady = false;
let pendingNotice = null;

function sendOpen(notice) { popup.contentWindow.postMessage({ type: "open", notice: notice }, "*"); }
function openAuth(notice) {
    popup.style.display = "block";
    if (popReady) sendOpen(notice || "");
    else pendingNotice = notice || "";
}
function closeAuth() { popup.style.display = "none"; }

// Returns true if signed in. Otherwise opens the popup with a message and returns false.
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

window.addEventListener("message", (event) => {
    if (event.source !== popup.contentWindow) return;
    const type = typeof event.data === "string" ? event.data : event.data && event.data.type;
    if (type === "ready") {
        popReady = true;
        if (pendingNotice !== null) { sendOpen(pendingNotice); pendingNotice = null; }
    }
    if (type === "closePopup" || type === "close") closeAuth();
    if (type === "authChanged") { closeAuth(); refreshAuth(); }
});

signInBtn.addEventListener("click", () => {
    if (Auth.current()) { Auth.signOut(); refreshAuth(); }
    else openAuth();
});
window.addEventListener("storage", refreshAuth);   // keeps other tabs in sync
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAuth(); });
refreshAuth();

/* ---------- Footer loader ---------- */
const footerPlaceholder = document.getElementById("footer-placeholder");
if (footerPlaceholder) {
    fetch("footer/footer.html")
        .then((r) => { if (!r.ok) throw new Error("Footer could not be loaded."); return r.text(); })
        .then((html) => { footerPlaceholder.innerHTML = html; })
        .catch((err) => console.error("Error loading footer:", err));
}

/* ---------- Header: solid after scroll, hides on scroll down ---------- */
const mainNav = document.getElementById("mainNav");
const menuToggle = document.getElementById("menuToggle");
const progressBar = document.getElementById("scrollProgress");
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
    header.classList.toggle("scrolled", open || window.scrollY > 60);
});

/* ---------- Reveal, counters, progress bar ---------- */
function animateCount(el) {
    const target = +el.dataset.count, start = performance.now(), duration = 1800;
    (function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
    })(start);
}

// Quick-donate progress bar reads the real total
const homeFill = document.getElementById("progressFill");
const homeText = document.getElementById("progressText");
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
document.querySelectorAll(".reveal, [data-count], [data-percent]").forEach((el) => observer.observe(el));

/* ---------- Quick-donate widget (any page that has #donateNow) ---------- */
const donateNow = document.getElementById("donateNow");
if (donateNow) {
    const amountBtns = document.querySelectorAll(".amount-btn");
    const customInput = document.getElementById("customAmount");
    const impactText = document.getElementById("donateImpact");

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
    // Signed-out visitors are asked to sign in before they can donate
    donateNow.addEventListener("click", (e) => {
        if (!requireAuth("Please sign in to donate.")) e.preventDefault();
    });
    showImpact(250);
}

/* ---------- Smooth page transitions ---------- */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === "_blank" || a.hasAttribute("download") || reduceMotion) return;
    let url;
    try { url = new URL(a.href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;   // same page or #anchor
    e.preventDefault();
    document.body.classList.add("leaving");
    setTimeout(() => { location.href = a.href; }, 260);
});
window.addEventListener("pageshow", (e) => { if (e.persisted) document.body.classList.remove("leaving"); });