/* One header for the whole site. Edit the NAV list here and every page updates.
   Load this right after <div id="header-mount"></div> at the top of <body>. */
(function () {
    const NAV = [
        ["Home", "index.html"], ["About Us", "about.html"], ["Adopt", "adopt.html"],
        ["Donate", "donate.html"], ["Shop", "shop.html"], ["Contact Us", "contact.html"]
    ];
    const page = location.pathname.split("/").pop() || "index.html";
    const links = NAV.map(([label, href]) =>
        '<li><a href="' + href + '"' + (href === page ? ' class="active" aria-current="page"' : "") + ">" + label + "</a></li>"
    ).join("");

    document.getElementById("header-mount").outerHTML =
        '<header class="site-header" id="siteHeader"><div class="header-container">' +
            '<a href="index.html" class="brand" aria-label="PawForward home">' +
                '<img src="images/logo.png" alt="PawForward logo">' +
                "<span><strong>PawForward</strong><small>Helping Animals, One Paw at a Time</small></span></a>" +
            '<nav id="mainNav" aria-label="Main"><ul>' + links +
                '<li class="mobile-only"><a href="cart.html" data-cart>Cart</a></li></ul></nav>' +
            '<div class="header-right">' +
                '<a href="cart.html" class="header-button cart-link" data-cart>Cart</a>' +
                '<span class="greeting" id="greeting" hidden></span>' +
                '<button type="button" class="header-button solid" id="openPopup">Sign In</button>' +
                '<img src="images/user.png" alt="" class="profile-picture">' +
                '<button type="button" class="menu-toggle" id="menuToggle" aria-label="Open menu" aria-expanded="false">&#9776;</button>' +
            "</div></div></header>";

    const frame = document.createElement("iframe");
    frame.id = "popFrame";
    frame.className = "popup-frame";
    frame.title = "Sign in or create an account";
    frame.src = "popup/account-popup.html";
    document.body.appendChild(frame);
})();