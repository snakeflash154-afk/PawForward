/* One header for the whole site. Edit NAV here and every page updates.
   The nav is split in two halves; the logo glides from the right edge into the gap between them on scroll. */
(function () {
    const LEFT  = [["Home", "index.html"], ["About Us", "about.html"], ["Adopt", "adopt.html"]];
    const RIGHT = [["Donate", "donate.html"], ["Shop", "shop.html"], ["Contact Us", "contact.html"]];
    const page = location.pathname.split("/").pop() || "index.html";
    const list = (items) => items.map(([label, href]) =>
        '<li><a href="' + href + '"' + (href === page ? ' class="active" aria-current="page"' : "") + ">" + label + "</a></li>"
    ).join("");

    const cartIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 7H6"/></svg>';

    // Shown if images/logo.png is missing, so the badge never looks broken
    window.PAW = "data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><g fill='#b63737'><ellipse cx='32' cy='42' rx='13' ry='11'/><circle cx='15' cy='28' r='6'/><circle cx='27' cy='17' r='6'/><circle cx='41' cy='17' r='6'/><circle cx='53' cy='28' r='6'/></g></svg>");

    document.getElementById("header-mount").outerHTML =
        '<header class="site-header" id="siteHeader"><div class="header-container">' +
            '<a href="index.html" class="brand">PawForward</a>' +
            '<nav id="mainNav" aria-label="Main">' +
                "<ul>" + list(LEFT) + "</ul>" +
                "<ul>" + list(RIGHT) + '<li class="mobile-only"><a href="cart.html" data-cart>Cart</a></li></ul>' +
            "</nav>" +
            '<div class="header-right">' +
                '<a href="cart.html" class="header-button cart-link" data-cart aria-label="Cart">' + cartIcon + '<span class="cart-badge" hidden>0</span></a>' +
                '<span class="greeting" id="greeting" hidden></span>' +
                '<button type="button" class="header-button solid" id="openPopup">Sign In</button>' +
                '<button type="button" class="menu-toggle" id="menuToggle" aria-label="Open menu" aria-expanded="false">&#9776;</button>' +
            "</div>" +
            '<a href="index.html" class="logo-badge" aria-label="PawForward home"><img src="images/logo.png" alt="PawForward logo" onerror="this.onerror=null;this.src=PAW"></a>' +
        '</div><div class="scroll-progress" id="scrollProgress"></div></header>';

    const frame = document.createElement("iframe");
    frame.id = "popFrame";
    frame.className = "popup-frame";
    frame.title = "Sign in or create an account";
    frame.src = "popup/account-popup.html";
    document.body.appendChild(frame);
})();   