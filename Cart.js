/* PawForward cart. Include on every page (after script.js) so the header count and
   "Add to cart" buttons work everywhere. Data is stored in the browser's localStorage. */

const CART_KEY = "pawforwardCart";
const CURRENCY = "\u20B1";
const FREE_SHIPPING_OVER = 1000;
const SHIPPING_FEE = 80;

const money = (n) => CURRENCY + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch (e) { return []; }
}
function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
}

function addToCart(item) {
    const cart = loadCart();
    const found = cart.find((i) => i.id === item.id);
    if (found) found.qty += 1;
    else cart.push({ ...item, qty: 1 });
    saveCart(cart);
}

/* Header button shows "Cart (3)" */
function updateCartCount() {
    const count = loadCart().reduce((sum, i) => sum + i.qty, 0);
    document.querySelectorAll('[data-cart]').forEach((a) => {
        a.textContent = count ? "Cart (" + count + ")" : "Cart";
    });
}

/* Any button like <button class="add-to-cart" data-id="1" data-name="Dog Leash" data-price="350" data-img="images/leash.jpg">
   works on any page that includes this file. */
document.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-to-cart");
    if (!btn) return;
    e.preventDefault();
    addToCart({
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: parseFloat(btn.dataset.price),
        img: btn.dataset.img || ""
    });
    const old = btn.textContent;
    btn.textContent = "Added \u2713";
    setTimeout(() => (btn.textContent = old), 1200);
});

updateCartCount();

/* ---------- Cart page only ---------- */
const listEl = document.getElementById("cartList");
if (listEl) {

    const layout = document.getElementById("cartLayout");
    const emptyEl = document.getElementById("cartEmpty");

    function renderCart() {
        const cart = loadCart();
        layout.hidden = cart.length === 0;
        emptyEl.hidden = cart.length > 0;
        listEl.innerHTML = "";

        cart.forEach((item) => {
            const row = document.createElement("article");
            row.className = "cart-item";
            row.innerHTML =
                '<img alt="">' +
                '<div><h3></h3><p class="unit"></p></div>' +
                '<div class="cart-side">' +
                    '<div class="qty"><button type="button" data-act="dec" aria-label="Decrease quantity">&minus;</button><span></span><button type="button" data-act="inc" aria-label="Increase quantity">+</button></div>' +
                    '<div class="line-total"></div>' +
                    '<button type="button" class="remove-btn" data-act="remove">Remove</button>' +
                '</div>';
            row.querySelector("img").src = item.img;
            row.querySelector("h3").textContent = item.name;
            row.querySelector(".unit").textContent = money(item.price) + " each";
            row.querySelector(".qty span").textContent = item.qty;
            row.querySelector(".line-total").textContent = money(item.price * item.qty);
            row.dataset.id = item.id;
            listEl.appendChild(row);
        });

        const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
        const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
        document.getElementById("subtotal").textContent = money(subtotal);
        document.getElementById("shipping").textContent = shipping ? money(shipping) : "Free";
        document.getElementById("total").textContent = money(subtotal + shipping);
        document.getElementById("shipNote").textContent = subtotal >= FREE_SHIPPING_OVER || subtotal === 0
            ? "Your order ships free."
            : "Add " + money(FREE_SHIPPING_OVER - subtotal) + " more for free shipping.";
    }

    listEl.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-act]");
        if (!btn) return;
        const row = btn.closest(".cart-item");
        const cart = loadCart();
        const item = cart.find((i) => i.id === row.dataset.id);
        if (!item) return;

        if (btn.dataset.act === "inc") item.qty += 1;
        if (btn.dataset.act === "dec") item.qty = Math.max(1, item.qty - 1);

        if (btn.dataset.act === "remove") {
            row.classList.add("removing");
            setTimeout(() => {
                saveCart(cart.filter((i) => i.id !== item.id));
                renderCart();
            }, 300);
            return;
        }
        saveCart(cart);
        renderCart();
    });

    document.getElementById("checkoutBtn").addEventListener("click", () => {
        // TODO: send to your real checkout / payment flow
        const note = document.getElementById("checkoutNote");
        note.textContent = "Checkout isn't connected yet. Hook this button up to your payment page.";
        note.classList.add("show");
    });

    renderCart();
}