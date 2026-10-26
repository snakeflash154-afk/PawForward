/* Shared layout: theme, header, sign-in dialog, footer.
   Load right after <div id="header-mount"></div> at the top of <body>.
   Edit LEFT / RIGHT to change the nav on every page. */
(function () {
    /* ---------- Theme (applied immediately, so there is no flash) ---------- */
    let saved = null;
    try { saved = localStorage.getItem("pawforwardTheme"); } catch (e) {}
    const dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = dark ? "dark" : "light";

    /* ---------- Header ---------- */
    const LEFT  = [["Home", "index.html"], ["About Us", "about.html"], ["Adopt", "adopt.html"]];
    const RIGHT = [["Donate", "donate.html"], ["Shop", "shop.html"], ["Contact Us", "contact.html"]];
    const page = location.pathname.split("/").pop() || "index.html";
    const list = (items) => items.map(([label, href]) =>
        '<li><a href="' + href + '"' + (href === page ? ' class="active" aria-current="page"' : "") + ">" + label + "</a></li>"
    ).join("");
    const svg = (inner, cls) => '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + "</svg>";

    const cartIcon = svg('<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 7H6"/>');
    const moon = svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>', "moon");
    const sun = svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', "sun");

    // Fallback if images/logo.png is missing
    window.PAW = "data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><g fill='#b63737'><ellipse cx='32' cy='42' rx='13' ry='11'/><circle cx='15' cy='28' r='6'/><circle cx='27' cy='17' r='6'/><circle cx='41' cy='17' r='6'/><circle cx='53' cy='28' r='6'/></g></svg>");

    document.getElementById("header-mount").outerHTML =
        '<header class="site-header" id="siteHeader"><div class="header-container">' +
            '<a href="index.html" class="brand">PawForward</a>' +
            '<nav id="mainNav" aria-label="Main">' +
                "<ul>" + list(LEFT) + "</ul>" +
                "<ul>" + list(RIGHT) +
                    '<li class="mobile-only"><a href="cart.html" data-cart>Cart</a></li>' +
                    '<li class="mobile-only"><button type="button" class="linklike" data-theme-toggle>Switch theme</button></li>' +
                "</ul>" +
            "</nav>" +
            '<div class="header-right">' +
                '<button type="button" class="header-button theme-toggle" data-theme-toggle aria-label="Toggle dark mode" aria-pressed="' + dark + '">' + moon + sun + "</button>" +
                '<a href="cart.html" class="header-button cart-link" data-cart aria-label="Cart">' + cartIcon + '<span class="cart-badge" hidden>0</span></a>' +
                '<span class="greeting" id="greeting" hidden></span>' +
                '<button type="button" class="header-button solid" id="openPopup">Sign In</button>' +
                '<button type="button" class="menu-toggle" id="menuToggle" aria-label="Open menu" aria-expanded="false">&#9776;</button>' +
            "</div>" +
            '<a href="index.html" class="logo-badge" aria-label="PawForward home"><img src="images/logo.png" alt="PawForward logo" onerror="this.onerror=null;this.src=PAW"></a>' +
        '</div><div class="scroll-progress" id="scrollProgress"></div></header>';

    /* ---------- Sign-in / sign-up dialog (native <dialog>: focus trap, Esc, screen-reader modal) ---------- */
    const req = '<span class="req" aria-hidden="true">*</span>';
    const field = (id, label, type, ph, ac) =>
        '<div class="field"><label for="' + id + '">' + label + req + "</label>" +
        '<input type="' + type + '" id="' + id + '"' + (ph ? ' placeholder="' + ph + '"' : "") + (ac ? ' autocomplete="' + ac + '"' : "") +
        ' required aria-required="true" aria-describedby="' + id + '-msg"><small class="field-msg" id="' + id + '-msg"></small></div>';

    const dlg = document.createElement("dialog");
    dlg.id = "authDialog";
    dlg.className = "auth";
    dlg.setAttribute("aria-labelledby", "authTitle");
    dlg.innerHTML =
        '<div class="dlg-inner"><button type="button" class="dlg-close" id="authClose" aria-label="Close dialog">&times;</button>' +
        '<p class="notice" id="authNotice" role="status" hidden></p>' +

        '<section id="signInSection"><h2 id="authTitle">Welcome to PawForward</h2><p class="sub">Sign in to your account</p>' +
        '<p class="req-note">' + req + " Required</p>" +
        '<form id="signInForm" novalidate>' +
            field("email", "Email address", "email", "Enter your email", "email") +
            field("password", "Password", "password", "Enter your password", "current-password") +
            '<p class="form-error" id="signInError" role="alert" hidden></p>' +
            '<button type="submit">Sign in</button></form>' +
        '<p class="switch">Don\'t have an account? <a href="#" id="showSignUp">Sign up</a></p></section>' +

        '<section id="signUpSection" hidden><h2>Create an account</h2><p class="sub">Join the PawForward community</p>' +
        '<p class="req-note">' + req + " Required</p>" +
        '<form id="signUpForm" novalidate>' +
            field("fName", "First name", "text", "Enter your first name", "given-name") +
            field("lName", "Last name", "text", "Enter your last name", "family-name") +
            field("dob", "Date of birth", "date", "", "bday") +
            field("city", "City", "text", "Enter your city", "address-level2") +
            field("signUpEmail", "Email address", "email", "Enter your email", "email") +
            field("signUpPassword", "Password", "password", "At least 8 characters", "new-password") +
            field("confirmPassword", "Confirm password", "password", "Re-enter your password", "new-password") +
            '<p class="form-error" id="signUpError" role="alert" hidden></p>' +
            '<button type="submit">Create account</button></form>' +
        '<p class="switch">Already have an account? <a href="#" id="showSignIn">Sign in</a></p></section></div>';
    document.body.appendChild(dlg);

    /* ---------- Footer ---------- */
    const SOCIAL = [
        ["Facebook", "https://facebook.com/", svg('<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>')],
        ["Instagram", "https://instagram.com/", svg('<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>')],
        ["YouTube", "https://youtube.com/", svg('<path d="M22.5 6.4a2.8 2.8 0 0 0-2-2C18.9 4 12 4 12 4s-6.9 0-8.5.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 1 11.8a29 29 0 0 0 .5 5.3 2.8 2.8 0 0 0 2 2c1.6.5 8.5.5 8.5.5s6.9 0 8.5-.5a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .5-5.3 29 29 0 0 0-.5-5.4z"/><path d="M9.8 15l5.7-3.2L9.8 8.5z"/>')]
    ];
    const footerHTML =
        '<footer class="site-footer"><div class="footer-grid">' +
            '<div><div class="footer-brand">PawForward</div><p>Helping animals, one paw at a time. We rescue strays, heal them, and help them find loving homes.</p></div>' +
            '<div><h3>Explore</h3><ul>' + LEFT.concat(RIGHT, [["Cart", "cart.html"]]).map(([l, h]) => '<li><a href="' + h + '">' + l + "</a></li>").join("") + "</ul></div>" +
            '<div><h3>Contact</h3><ul>' +
                '<li><a href="mailto:hello@pawforward.org">hello@pawforward.org</a></li>' +
                '<li><a href="tel:+639000000000">+63 900 000 0000</a></li>' +
                "<li>Urdaneta City, Pangasinan</li>" +
                "<li>Mon to Sat, 9:00 AM to 5:00 PM</li></ul></div>" +
            '<div><h3>Follow us</h3><p>See new arrivals and happy adoptions.</p><div class="social">' +
                SOCIAL.map(([n, u, i]) => '<a href="' + u + '" target="_blank" rel="noopener" aria-label="' + n + '">' + i + "</a>").join("") + "</div></div>" +
        '</div><div class="footer-bottom">&copy; ' + new Date().getFullYear() + " PawForward. All rights reserved.</div></footer>";

    function mountFooter() {
        let slot = document.getElementById("footer-placeholder");
        if (!slot) { slot = document.createElement("div"); slot.id = "footer-placeholder"; document.body.appendChild(slot); }
        slot.innerHTML = footerHTML;
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountFooter);
    else mountFooter();
})();