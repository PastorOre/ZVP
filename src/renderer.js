const remote = require('electron').remote;

(function handleWindowControls() {
    // variables and constatnts declaration
    let window = remote.getCurrentWindow();      

    const minButton = document.getElementById('min-button'),
        maxButton = document.getElementById('max-button'),
        restoreButton = document.getElementById('restore-button'),
        closeButton = document.getElementById('close-button')

    function initApp() {    
        minButton.addEventListener("click", () => {
           // window = remote.getCurrentWindow();
            window.minimize();
        });

        maxButton.addEventListener("click", () => {
          //  window = remote.getCurrentWindow();
            window.maximize();
            toggleMaxRestoreButtons();
        });

        restoreButton.addEventListener("click", () => {
          //  window = remote.getCurrentWindow();
            window.unmaximize();
            toggleMaxRestoreButtons();
        });

        toggleMaxRestoreButtons();
        window.on('maximize', toggleMaxRestoreButtons);
        window.on('unmaximize', toggleMaxRestoreButtons);

        closeButton.addEventListener("click", () => {
           // window = remote.getCurrentWindow();
            window.close();
        });

        function toggleMaxRestoreButtons() {
          //  window = remote.getCurrentWindow();
            if (window.isMaximized()) {
                maxButton.style.display = "none";
                restoreButton.style.display = "flex";
            } else {
                restoreButton.style.display = "none";
                maxButton.style.display = "flex";
            }
        }

        maxButton.title = "Maximize";
        minButton.title = "Minimize";
        restoreButton.title = "Restore Down";
        closeButton.title = "Close";        
     } 
        // When document has loaded, initialise
    document.onreadystatechange = () => {
        if (document.readyState == "complete") {
            initApp();
        }
    };
})()