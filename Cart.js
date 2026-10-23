/* PawForward cart. Include on every page (after script.js).
   Flow: "Add to cart" -> drawer slides in -> "Checkout" -> checkout summary.
   Data is stored in localStorage for now; the back end replaces loadCart/saveCart later. */

const CART_KEY = "pawforwardCart";
const CURRENCY = "\u20B1";
const FREE_SHIPPING_OVER = 1000;
const SHIPPING_FEE = 80;

const money = (n) => CURRENCY + n.toLocaleString("en-US", { maximumFractionDigits: 2 });

function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch (e) { return []; }
}
function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
}
function totals(cart) {
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
    return { subtotal, shipping, total: subtotal + shipping, count: cart.reduce((s, i) => s + i.qty, 0) };
}
function addToCart(item) {
    const cart = loadCart();
    const found = cart.find((i) => i.id === item.id);
    if (found) found.qty += 1; else cart.push({ ...item, qty: 1 });
    saveCart(cart);
}

function updateCartCount() {
    const count = totals(loadCart()).count;
    document.querySelectorAll("[data-cart]").forEach((a) => {
        const badge = a.querySelector(".cart-badge");
        if (badge) { badge.textContent = count; badge.hidden = !count; }
        else a.textContent = count ? "Cart (" + count + ")" : "Cart";
    });
}

/* ---------- Drawer ---------- */
const overlay = document.createElement("div");
overlay.className = "drawer-overlay";
const drawer = document.createElement("aside");
drawer.className = "drawer";
drawer.setAttribute("role", "dialog");
drawer.setAttribute("aria-modal", "true");
drawer.setAttribute("aria-label", "Your cart");
drawer.innerHTML =
    '<div class="drawer-head"><h2></h2><button type="button" class="drawer-close" aria-label="Close cart">&times;</button></div>' +
    '<div class="drawer-body"></div><div class="drawer-foot"></div>';
document.body.append(overlay, drawer);

function renderDrawer(mode) {
    const cart = loadCart(), t = totals(cart), summary = mode === "summary";
    drawer.classList.toggle("added", !summary);
    drawer.querySelector("h2").textContent = summary ? "Checkout summary" : "Added to your cart";

    const body = drawer.querySelector(".drawer-body");
    body.innerHTML = "";
    if (!cart.length) body.innerHTML = '<p class="drawer-empty">Your cart is empty.</p>';
    cart.forEach((item) => {
        const row = document.createElement("div");
        row.className = "d-item";
        row.innerHTML = '<img alt=""><div><h3></h3><p></p></div><span class="d-total"></span>';
        row.querySelector("img").src = item.img;
        row.querySelector("img").onerror = function () { this.removeAttribute("src"); };
        row.querySelector("h3").textContent = item.name;
        row.querySelector("p").textContent = item.qty + " \u00D7 " + money(item.price);
        row.querySelector(".d-total").textContent = money(item.price * item.qty);
        body.appendChild(row);
    });

    const foot = drawer.querySelector(".drawer-foot");
    foot.innerHTML =
        '<div class="row"><span>Subtotal</span><span data-k="sub"></span></div>' +
        (summary
            ? '<div class="row"><span>Shipping</span><span data-k="ship"></span></div>' +
              '<p class="summary-note" data-k="note"></p>' +
              '<div class="row total"><span>Total</span><span data-k="total"></span></div>'
            : "") +
        '<div class="drawer-actions"></div><p class="thanks" id="orderNote" role="status"></p>' +
        (!summary && !document.getElementById("cartList") ? '<a href="cart.html" class="drawer-link">View full cart</a>' : "");
    const set = (k, v) => { const n = foot.querySelector('[data-k="' + k + '"]'); if (n) n.textContent = v; };
    set("sub", money(t.subtotal));
    set("ship", t.shipping ? money(t.shipping) : "Free");
    set("total", money(t.total));
    set("note", t.subtotal >= FREE_SHIPPING_OVER ? "Your order ships free." : "Add " + money(FREE_SHIPPING_OVER - t.subtotal) + " more for free shipping.");

    const actions = foot.querySelector(".drawer-actions");
    actions.innerHTML = summary
        ? '<button type="button" class="btn btn-outline" data-act="close">Keep shopping</button><button type="button" class="btn" data-act="order">Place order</button>'
        : '<button type="button" class="btn btn-outline" data-act="close">Continue shopping</button><button type="button" class="btn" data-act="checkout">Checkout</button>';
}

function openDrawer(mode) {
    renderDrawer(mode);
    overlay.classList.add("open");
    drawer.classList.add("open");
    document.body.style.overflow = "hidden";
    drawer.querySelector(".drawer-close").focus();
}
function closeDrawer() {
    overlay.classList.remove("open");
    drawer.classList.remove("open");
    document.body.style.overflow = "";
}

overlay.addEventListener("click", closeDrawer);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
drawer.addEventListener("click", (e) => {
    if (e.target.closest(".drawer-close")) return closeDrawer();
    const act = e.target.closest("[data-act]");
    if (!act) return;
    if (act.dataset.act === "close") closeDrawer();
    if (act.dataset.act === "checkout") renderDrawer("summary");
    if (act.dataset.act === "order") {
        // TODO: send to your real payment flow once the back end exists
        const note = document.getElementById("orderNote");
        note.textContent = "Placing orders isn't connected yet. It will work once the back end is built.";
        note.classList.add("show");
    }
});

/* Any button like <button class="add-to-cart" data-id data-name data-price data-img> works on every page */
document.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-to-cart");
    if (!btn) return;
    e.preventDefault();
    addToCart({ id: btn.dataset.id, name: btn.dataset.name, price: parseFloat(btn.dataset.price), img: btn.dataset.img || "" });
    openDrawer("added");
});

updateCartCount();

/* ---------- Cart page only ---------- */
const listEl = document.getElementById("cartList");
if (listEl) {
    const layout = document.getElementById("cartLayout");
    const emptyEl = document.getElementById("cartEmpty");

    function renderCart() {
        const cart = loadCart(), t = totals(cart);
        layout.hidden = cart.length === 0;
        emptyEl.hidden = cart.length > 0;
        listEl.innerHTML = "";
        cart.forEach((item) => {
            const row = document.createElement("article");
            row.className = "cart-item";
            row.dataset.id = item.id;
            row.innerHTML =
                '<img alt="">' +
                '<div><h3></h3><p class="unit"></p></div>' +
                '<div class="cart-side">' +
                    '<div class="qty"><button type="button" data-act="dec" aria-label="Decrease quantity">&minus;</button><span></span><button type="button" data-act="inc" aria-label="Increase quantity">+</button></div>' +
                    '<div class="line-total"></div>' +
                    '<button type="button" class="remove-btn" data-act="remove">Remove</button>' +
                '</div>';
            row.querySelector("img").src = item.img;
            row.querySelector("img").onerror = function () { this.removeAttribute("src"); };
            row.querySelector("h3").textContent = item.name;
            row.querySelector(".unit").textContent = money(item.price) + " each";
            row.querySelector(".qty span").textContent = item.qty;
            row.querySelector(".line-total").textContent = money(item.price * item.qty);
            listEl.appendChild(row);
        });
        document.getElementById("barCount").textContent = t.count + (t.count === 1 ? " item" : " items");
        document.getElementById("barSubtotal").textContent = money(t.subtotal);
    }

    listEl.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-act]");
        if (!btn) return;
        const row = btn.closest(".cart-item");
        const cart = loadCart();
        const item = cart.find((i) => i.id === row.dataset.id);
        if (!item) return;
        if (btn.dataset.act === "remove") {
            row.classList.add("removing");
            setTimeout(() => { saveCart(cart.filter((i) => i.id !== item.id)); renderCart(); }, 300);
            return;
        }
        if (btn.dataset.act === "inc") item.qty += 1;
        if (btn.dataset.act === "dec") item.qty = Math.max(1, item.qty - 1);
        saveCart(cart);
        renderCart();
    });

    document.getElementById("checkoutBtn").addEventListener("click", () => openDrawer("summary"));
    renderCart();
}