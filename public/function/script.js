document.addEventListener('DOMContentLoaded', () => {

    const startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
        //window.electronAPI.testLEDs();
        if (window.electronAPI && window.electronAPI.openNewWindow) {
            window.electronAPI.openNewWindow('/views/home.html');
        } else {
            console.error('Electron API not available');
        }
    });
});


/* Set the width of the side navigation to 250px and the left margin of the page content to 250px */
function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
    document.getElementById("main").style.marginLeft = "250px";
  }
  
  /* Set the width of the side navigation to 0 and the left margin of the page content to 0 */
  function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("main").style.marginLeft = "0";
  }

