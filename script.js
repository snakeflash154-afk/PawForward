/* ---------- Sign-in popup (your original logic) ---------- */
const openPopup = document.getElementById("openPopup");
const popupFrame = document.getElementById("popFrame");

if (openPopup && popupFrame) {
    openPopup.addEventListener("click", () => { popupFrame.style.display = "block"; });
}
window.addEventListener("message", (event) => {
    if (event.data === "closePopup" && popupFrame) popupFrame.style.display = "none";
});

/* ---------- Footer loader (your original logic) ---------- */
const footerPlaceholder = document.getElementById("footer-placeholder");
if (footerPlaceholder) {
    fetch("footer/footer.html")
        .then((r) => { if (!r.ok) throw new Error("Footer could not be loaded."); return r.text(); })
        .then((html) => { footerPlaceholder.innerHTML = html; })
        .catch((err) => console.error("Error loading footer:", err));
}

/* ---------- Header: solid after scroll, hides on scroll down ---------- */
const header = document.getElementById("siteHeader");
let lastY = window.scrollY;
window.addEventListener("scroll", () => {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 60);
    header.classList.toggle("hide", y > lastY && y > 400);
    lastY = y;
}, { passive: true });

/* ---------- Mobile menu ---------- */
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
if (menuToggle) {
    menuToggle.addEventListener("click", () => {
        const open = mainNav.classList.toggle("open");
        menuToggle.setAttribute("aria-expanded", open);
        header.classList.toggle("scrolled", open || window.scrollY > 60);
    });
}

/* ---------- Scroll reveal + counters + progress bar ---------- */
function animateCount(el) {
    const target = +el.dataset.count;
    const duration = 1800;
    const start = performance.now();
    (function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
    })(start);
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

/* ---------- Donation widget ---------- */
// Homepage widget only (donate.html has its own inline logic)
const onHome = !!document.getElementById("donateNow");
const amountBtns = onHome ? document.querySelectorAll(".amount-btn") : [];
const customInput = onHome ? document.getElementById("customAmount") : null;
const impactText = document.getElementById("donateImpact");
const donateNow = document.getElementById("donateNow");

function showImpact(amount) {
    if (!impactText) return;
    if (!amount || amount < 1) { impactText.textContent = ""; return; }
    const meals = Math.max(1, Math.floor(amount / 25));
    impactText.textContent = "\u20B1" + Number(amount).toLocaleString() + " feeds a rescued animal for " + meals + (meals === 1 ? " day" : " days");
    donateNow.href = "donate.html?amount=" + amount;
}

amountBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        amountBtns.forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        customInput.value = "";
        showImpact(+btn.dataset.amount);
    });
});

if (customInput) {
    customInput.addEventListener("input", () => {
        amountBtns.forEach((b) => b.classList.remove("selected"));
        showImpact(+customInput.value);
    });
}
if (onHome) showImpact(250);s