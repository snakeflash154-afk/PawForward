const openPopup = document.getElementById("openPopup");
const popupFrame = document.getElementById("popFrame");

openPopup.addEventListener("click", function() {
    popupFrame.style.display = "block";
});

window.addEventListener("message", function(event) {
    if(event.data === "closePopup") {
        popupFrame.style.display = "none";
    }
})

const footerPlaceholder = document.getElementById("footer-placeholder");

if(footerPlaceholder) {
    fetch("footer/footer.html")
    .then(response =>  {
        if(!response.ok) {
            throw new Error("Footer could not be loaded.");
        }
        return response.text();
    })
    .then(data => {
        footerPlaceholder.innerHTML = data;
    })
    .catch(error => {
        console.error("Error loading footer:", error);
    });
}