const $ = (id) => document.getElementById(id);


function openAuthModal(noticeText = "") {
    const overlay = $("overlay");
    if (!overlay) return;
    
    $("notice").textContent = noticeText;
    $("notice").hidden = !noticeText;
    
    $("signInForm").reset();
    $("signUpForm").reset();
    
    
    document.querySelectorAll('.password-wrapper input').forEach(input => input.setAttribute('type', 'password'));
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    });

    overlay.style.display = "flex";
    show("in");
}

function closeAuthModal() {
    $("overlay").style.display = "none";
}

function showError(id, text) { 
    const el = $(id); 
    el.textContent = text; 
    el.hidden = !text; 
}

function show(which) {
    $("signInSection").hidden = which !== "in";
    $("signUpSection").hidden = which !== "up";
    showError("signInError", "");
    showError("signUpError", "");
    $(which === "in" ? "email" : "fName").focus();
}


document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
        const input = this.previousElementSibling;
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        
        
        if (type === 'text') {
            this.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
        } else {
            this.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
        }
    });
});


$("closeBtn").addEventListener("click", closeAuthModal);
$("overlay").addEventListener("mousedown", (e) => { if (e.target === $("overlay")) closeAuthModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("overlay").style.display === "flex") closeAuthModal(); });

$("showSignUp").addEventListener("click", (e) => { e.preventDefault(); show("up"); });
$("showSignIn").addEventListener("click", (e) => { e.preventDefault(); show("in"); });

if ($("dob")) {
    $("dob").max = new Date().toISOString().split("T")[0];
}


$("signInForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("email").value, password = $("password").value;
    if (!email || !password) return showError("signInError", "Enter your email and password.");
    
    const result = Auth.signIn(email, password);
    if (!result.ok) return showError("signInError", result.error);
    

    closeAuthModal();
    window.location.reload(); 
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
    
    
    closeAuthModal();
    window.location.reload();
});