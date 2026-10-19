const closeButton = document.querySelector(".close-button");
const popupContainer = document.querySelector(".popup-container");

const signInForm = document.getElementById("signInForm");
const signUpForm = document.getElementById("signUpForm");

const signInSection = signInForm;
const signUpSection  = document.getElementById("signUpSection");

const showSignUp = document.getElementById("showSignUp");
const showSignIn = document.getElementById("showSignIn");

function animatePopup(changeForm) {
    const startHeight = popupContainer.offsetHeight;

    popupContainer.style.height = startHeight + "px";

    changeForm();

    popupContainer.style.height = "auto";
    const endHeight = popupContainer.offsetHeight;

    popupContainer.style.height = startHeight + "px";
    popupContainer.offsetHeight;

    requestAnimationFrame(function() {
        popupContainer.style.height = endHeight + "px";
    });

    popupContainer.addEventListener("transitionend", function handleTransition(event) {
        if(event.propertyName === "height") {
            popupContainer.style.height = "auto";
            popupContainer.removeEventListener("transitionend", handleTransition);
        }
    });
}

closeButton.addEventListener("click", function() {
    window.parent.postMessage("closePopup", "*");
});

showSignUp.addEventListener("click", function(event) {
    event.preventDefault();

    animatePopup(function(){
        signInSection.style.display = "none";
        document.querySelector(".popup-container > h2").style.display = "none";
        document.querySelector(".popup-container > p").style.display = "none";
        showSignUp.parentElement.style.display = "none";
        signUpSection.style.display = "block";
    });
});

showSignIn.addEventListener("click", function(event) {
    event.preventDefault();

    animatePopup(function() {
        signUpSection.style.display = "none";
        signInSection.style.display = "flex";
        document.querySelector(".popup-container > h2").style.display = "block";
        document.querySelector(".popup-container > p").style.display = "block";
        showSignUp.parentElement.style.display = "block";
    });
});

signInForm.addEventListener("submit", function(event) {
    event.preventDefault();

    alert("Sign In Button clicked!");
});

signUpForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const password = document.getElementById("signUpPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if(password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }
    alert("Sign up form submitted successfully!");
});