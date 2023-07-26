const electron = require('electron');
const amp = require('../lib/createAmplifier');
const {fileUrl, saveCurrentVideo, 
    createDirectories} = require('../lib/fileUtil');
const dragElement = require('../lib/dragable');
const path = require('path');
const fs = require('fs');
const ipc = electron.ipcRenderer;
const shell = electron.shell;
const homedir = require('os').homedir();
// variables-------------------------//
(function() {
    const openBtn = document.getElementById('load-video'),
        video = document.getElementById('media-video'),
        openFile = document.getElementById("file-to-upload"),
        openFolderInput = document.getElementById('open-folder'),
        openFolderBtn = document.getElementById('folder'),
        mediaControls = document.getElementById('video-controls'),
        playPuaseBtn = document.getElementById('play-pause'),
        muteBtn = document.getElementById('mute'),
        snapshotBtn = document.getElementById('snapshot'),
        btnGo = document.getElementById('btn-go'),
        numb = document.getElementById('go-input'),
        volSlider = document.getElementById('volume'),
        progressBar = document.getElementById('progress-bar'),
        progress = document.getElementById('progress'),
        vdTimer = document.getElementById('timer'),
        vdDuration = document.getElementById('duration'),
        fullscreenBtn = document.getElementById('full-screen'),
        videoDiv = document.getElementById('media-player'),
        openPlaylist = document.querySelector('#open-playlist'),
        videoTitle = document.querySelector('.video-title')
        closePlaylist = document.querySelector('.playlist-header .x-close'),
        playlist = document.querySelector('#video-list'),
        folderpath = document.querySelector('.playlist-info span'),
        videosList = document.getElementById("videoList"),
        menuBtn = document.querySelector('#app-menu'),
        menu = document.querySelector('#menuDiv'),
        menuTg = document.getElementById('menu-fs'),
        menuSnap = document.getElementById('menu-snap'),
        btnClearList = document.querySelector('.folder-name'),
        playerStatus = document.getElementById('file-name'),
        dragPargs = document.querySelector('.drag-parags'),
        dragInfo =  document.querySelector('.drag-files-here'),
        aboutOverlay = document.querySelector('.about-overlay');

    const aboutDialog = document.querySelector('#about-dialog');
    const aboutDragZone = document.querySelector('#dialog-heaeder');
    const dialog = document.querySelector('#confirmDialog');
    const dragzone = document.querySelector('#dragzone');
    const modal = document.querySelector('.overlay');
    const btnResume = document.querySelector('.resume-card')
    // const btnResume = document.querySelector('.continue-last-video');

    var playicon = '<img width="24px" height="24px" src="../svg/play.svg" />',
        pauseicon = '<img width="24px" height="24px" src="../svg/pause.svg" />',
        muteicon = '<img width="24px" height="24px" src="../svg/volume-mute.svg" />',
        volumeicon = '<img width="24px" height="24px" src="../svg/volume-medium.svg" />',
        f_screenicon = '<img width="24px" height="24px" src="../svg/fullscreen.svg" />',
        e_screenicon = '<img width="24px" height="24px" src="../svg/fullscreen-exit.svg" />';


    var mousedown = false;
    var videolist = [];
    var dragSrcEl = null;
    var index = null;
    var listindex = null;
    mediaControls.style.display = 'none'
    var current = '';
    let contextFilePath = '';
    let contextFile = '';
    scaleFactor:number=0.25;
    let videoDuration = 0;
    let videosObj = [];
    let currentVideo = null;

    const lstMenu = remote.Menu.buildFromTemplate([
        {
            label: 'Remove This...',
            // visible: false,
            click: function (evt){
                removeFile(contextFilePath)
                contextFile.parentNode.removeChild(contextFile);
            }
        },
        {
            label: 'Show in file Manager',
            visible: false,
            click: () => {
                openVideoInFolder();
            }
        }
    ]);
    const ctxMenu = remote.Menu.buildFromTemplate([
        {
            label: 'Open Files...',
            click: () => {
                openFolder();
            },
        },
        {
            type: 'separator'
        },
        {
             label: 'Play',
            click: () => {
                playPuase()
            },
            enabled: false
        },
        {
            label: 'Pause',
           click: () => {          
                playPuase() 
           }
        },
        {
            label: 'Mute',
            click: () => { muteVideo() },
            enabled: false
        },
        {
            label: 'Unmute',
            click: () => { muteVideo() }
        },
        {
            label: 'Playback Speed',
            enabled: false,
            submenu: [
                {
                    label: 'Normal Speed',
                    type: 'checkbox',
                    checked: true,
                    click: (item) => {
                        video.playbackRate = 1.0;
                        item.checked = true
                        if(item.checked){
                            ctxMenu.items[7].submenu.items[1].checked = false
                            ctxMenu.items[7].submenu.items[2].checked = false
                         }

                    }
                },
                {
                    label: 'Faster',
                    type: 'checkbox',
                    click: (item) => {
                        video.playbackRate = 2.0;
                        item.checked = true
                        if(item.checked){
                           ctxMenu.items[7].submenu.items[0].checked = false
                           ctxMenu.items[7].submenu.items[2].checked = false
                        }
                    }
                },
                {
                    label: 'Slower',
                    type: 'checkbox',
                    click: (item) => {
                        video.playbackRate = 0.5;
                        item.checked = true
                        if(item.checked){
                            ctxMenu.items[7].submenu.items[0].checked = false
                            ctxMenu.items[7].submenu.items[1].checked = false
                         }
                    }
                }
            ]
        },
        {
            label: 'Full Screen',
            click: () => { toggleFullscreen() },
            enabled: false
        },
        {
            label: 'Exit Full Screen',
            click: () => { toggleFullscreen() }
        },
        {
            type: 'separator'
        },
        {
            label: 'Playlist',
            click: () => { openNav() }
        },
        {
            label: 'Save Snapshot As...',
            click: () => { saveSnapshot() },
            enabled: false
        },
        {
            type: 'separator'
        },
        {
            label: 'Exit',
            role: 'quit'
        }
    ])
// end of variables-------------------//

    function playPuase(){
        if(video.src == "")
        {
            return
        }else{
            if (video.paused) {
                video.play();
                playPuaseBtn.title = "Pause";
                playPuaseBtn.innerHTML = pauseicon;
                playerStatus.textContent = "Playing...";
              } else if(video.play) {
                video.pause();
                playPuaseBtn.innerHTML =  playicon;
                playPuaseBtn.title = "Play";
                playerStatus.textContent = "Paused";
                //======= save current video and current time lapse
                let title = videoTitle.textContent.substring(0, videoTitle.textContent.lastIndexOf('-'));
                let videoURL = video.src;
                if(currentVideo !== null){
                    videoURL = currentVideo
                }
                 saveCurrentVideo(videoURL, title, video.currentTime, snapCurrentFrame()) 
              }
        }
    }

//  snapCurrentFrame();
    function snapCurrentFrame(){
        let canvas = document.createElement('canvas');
        let context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        let image = canvas.toDataURL();
        return image;
    }

    function timeDuration(){
        vdTimer.innerHTML = format(video.currentTime)
        vdDuration.innerHTML = format(video.duration)
    }
    function format(time){
        var hours = parseInt((time / 60 / 60) % 60, 10),
            mins = parseInt((time / 60) % 60, 10),
            secs = parseInt(time, 10) % 60,
            hourss = (hours < 10 ? '0' : '') + parseInt(hours, 10) + ':',
            minss = (mins < 10 ? '0' : '') + parseInt(mins, 10) + ':',
            secss  = (secs < 10 ? '0' : '') +(secs % 60),
            timestring = ( hourss !== '00:' ? hourss : '' ) + minss + secss;
        return timestring;
    }
    function muteVideo(){
        var volumeValue = video.volume;
        if (video.muted) {
            video.muted = false;
            muteBtn.innerHTML = volumeicon;
             muteBtn.title = "Mute";
             volSlider.value = volumeValue.value;
          } else {
            video.muted = true;
            volSlider.value = 0;
            muteBtn.innerHTML = muteicon;
            muteBtn.title = "Unmute";
          }
    }
    function volumeChange(){
        video.volume = volSlider.value;
        if(video.volume === 0){
            video.muted = true;
            muteBtn.innerHTML =  muteicon;
        }else{
            video.muted = false;
            muteBtn.innerHTML = volumeicon;
        }
    }
    function handleProgress() {
        var percent = (video.currentTime / video.duration) * 100;
        progress.style.flexBasis = `${percent}%`;
        timeDuration();
    }
    function scrub(e, progress) {
        var scrubTime = (e.offsetX / progress.offsetWidth) * video.duration;
        video.currentTime = scrubTime;
    }
    function saveSnapshot(){
        let canvas = document.createElement('canvas');
        let context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        canvas.toBlob(function(blob) {
        let link = document.createElement('a');
        link.download = `img-${Date.now()}.png`;

        link.href = URL.createObjectURL(blob);
        link.click();

        URL.revokeObjectURL(link.href);
        }, 'image/png');
    }

    function videoEnded(){
        var a = document.querySelector('li.active');
        try{
            if(a !== null)
            var next = a.nextSibling;
        if(next){
            playNextItem();
        }else{
            video.pause();
            video.currentTime = 0;
            playPuaseBtn.innerHTML = playicon;
            vdTimer.innerHTML = "--";
            vdDuration.innerHTML = "--";   
            playerStatus.textContent = "Ready";   
        }
        }catch(e){
            console.log(e.message);
        }   
    }
    function videoMouseWheel(event){
        let delta = Math.max(0, Math.min(1, (event.wheelDelta || -event.detail)));
        if (delta === 1) {
         video.volume += 0.05;
         volSlider.value = video.volume;
        } else if (delta === 0) {
         video.volume -= 0.05;
         volSlider.value = video.volume;
        }
    }
    function progressBarClick(event){
        scrub(event, progressBar);
    }
    function progressMouseMove(evt){
        var scrubTime = (evt.offsetX / progressBar.offsetWidth) * video.duration;
        progressBar.setAttribute("title", format(scrubTime)) // video time tooltip
        return mousedown && scrub(evt, progressBar);
    }
    function progressMouseDowmn(){
        return mousedown = true;
    }
    function progressMouseUp(){
        return mousedown = false;
    }
    function toggleFullscreen(){
        toggleFullScreen(videoDiv, fullscreenBtn);
    }
    function myFunction() {
        myVar = setTimeout(function(){
            mediaControls.style.opacity = 0;
        }, 2000);
    }
    function myStopFunction() {
        if(typeof myVar != 'undefined'){
            clearTimeout(myVar);
        }
    }
    function toggleFullScreen() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            videoDiv.classList.add('media-div')

            if (videoDiv.requestFullscreen) {
                videoDiv.requestFullscreen();
            } else if (videoDiv.webkitRequestFullscreen) {
                videoDiv.webkitRequestFullscreen();
            }
            isFullscreen = true;
            document.getElementById('video-info').style.display = 'none';
            fullscreenBtn.innerHTML = e_screenicon;
            fullscreen = true;
        } else {
            exitFullscreen();
        }
    }
    function exitFullscreen(){
        videoDiv.classList.remove('media-div')
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        isFullscreen = false;
        document.getElementById('video-info').style.display = 'flex';
        fullscreenBtn.innerHTML = f_screenicon;
        fullscreen = false;
    }
    function onFullScreen(e) {
        var isFullscreenNow = document.webkitFullscreenElement !== null;
        if (!isFullscreenNow) {
            videoDiv.classList.remove('media-div');
            fullscreenBtn.innerHTML = f_screenicon;
        } else {}
    }
    function addListenerMulti(element, eventNames, listener) {
        var events = eventNames.split(' ');
        for (var i = 0, iLen = events.length; i < iLen; i++) {
            element.addEventListener(events[i], listener, false);
        }
    }

    function dropVideo(ev){
            var file = ev.dataTransfer.files[0];
        try{
            if (file.type.match('video/mp4')) {
                selectFiles(ev);
                ev.preventDefault();
        }else { 
                alert('File format not supported');
            return; 
        }
        }catch(e){
            console.log(e.message);
        }
       
    }

    function toggleFullScreenCM(){
        var isFullscreen = document.webkitFullscreenElement !== null;
        if (!isFullscreen){
            ctxMenu.items[7].visible = true;
            ctxMenu.items[8].visible = false;
        }else{
            ctxMenu.items[8].visible = true;
            ctxMenu.items[7].visible = false;
        }
     }

    function togglePlayCM(){
        if(video.paused){
            ctxMenu.items[2].visible = true;
            ctxMenu.items[3].visible = false;
        }else{
            ctxMenu.items[3].visible = true;
            ctxMenu.items[2].visible = false;
        }
     }

    function togglemutecM(){
         if(video.muted){
            ctxMenu.items[5].visible = true;
            ctxMenu.items[4].visible = false;
         }else{
            ctxMenu.items[4].visible = true;
            ctxMenu.items[5].visible = false;
         }
     }

    function selectFiles(e) { 
        if(e.target.files){
            files = e.target.files;
          }else{
            files = e.dataTransfer.files;
          }
        if (files[0]){
            video.src = URL.createObjectURL(files[0]);
            videoTitle.textContent = `${files[0].name} - ZVP`
            playlist.innerHTML = '';
            playPuase();
            clearListInfo();
            // this enables saving the current  video path in a normal string
            currentVideo = files[0].path; 
          }      

		for (const file of Array.from(files)) {
            if(['video/mp4'].indexOf(file.type) == -1) {
              return;
            }
            videolist = [];
            createThumbnail(file); 
            enabledCtrlButtons();
                                
        var directory = path.dirname(files[0].path);
            folderpath.title = directory;
            folderpath.innerHTML = "Playlist";
            hideMenu();
            enablingElements();
            folderName(directory) // get folder name
            };

          var cols = document.querySelectorAll("li");
           [].forEach.call(cols, addDnDHandlers);
    }

    function saveVideoDetails(file, image, duration){
        let tempDir = path.join(homedir, "ZVP/playlist/");
        let playlist = path.join(tempDir, "playlist.json");
        let obj = {
            name: file.name,
            path:  file.path,
            image: image,
            duration:duration
            }
            const data = fs.readFileSync(playlist)
            let reactions = JSON.parse(data);
            reactions.push(obj);
            let json = JSON.stringify(reactions, null, 2)
            fs.writeFileSync(playlist, json); 
    }

    function createPlaylist(){
        let tempDir = path.join(homedir, "ZVP/playlist/");
        let playlist = path.join(tempDir, "playlist.json");
        if(!fs.existsSync(playlist)){
            var json = JSON.stringify(videosObj, 2, null);   
            fs.writeFile(playlist, json, 'utf8', (error) => {
                if(error){
                    console.log(error);
                    return;
                } 
            });
        }
      
    }

    function folderName(fullPath){
        var startIndex = (fullPath.indexOf('\\') >= 0 ? fullPath.lastIndexOf('\\') : fullPath.lastIndexOf('/'));
        var foldername = fullPath.substring(startIndex);
        if (foldername.indexOf('\\') === 0 || foldername.indexOf('/') === 0) {
            foldername = foldername.substring(1);
        }
    }

    function doImgClick(event){
        var el = event.target;
        var current = document.querySelector('li.active');  
        if(current){
            current.classList.remove('active');
        } 
        el.parentNode.classList.add('active')    
        video.src = el.getAttribute("url");
        videoTitle.textContent = `${el.title} - ZVP`
        closeNav();
        playPuase();
        // enablingElements();
    }

    function createThumbnail(file){        
            var url = URL.createObjectURL(file);
            var srcvideo = document.createElement('video');
            var timeupdate = function() {
              if (snapImage()) {
                srcvideo.removeEventListener('timeupdate', timeupdate);
                srcvideo.pause();
              }
            };
            srcvideo.addEventListener('loadeddata', function() {
              if (snapImage(srcvideo)) {
                srcvideo.removeEventListener('timeupdate', timeupdate);
              }
            });
            const snapImage = function(srcvideo) {
              var canvas = document.createElement('canvas');
              canvas.width = srcvideo.videoWidth;
              canvas.height = srcvideo.videoHeight;
              canvas.getContext('2d').drawImage(srcvideo, 0, 0, canvas.width, canvas.height);
              var image = canvas.toDataURL();
              var success = image.length >= 4000;
              if (success) {
                btnClearList.style.display = 'block';
                const listItem = document.createElement('li');
                listItem.className = 'recent-file';
                listItem.setAttribute('draggable', 'true');
                listItem.setAttribute("url", URL.createObjectURL(file));
                listItem.style.height = srcvideo.videoHeight;
                let card = document.createElement('div');
                card.innerHTML = `<img src="${image}" url="${URL.createObjectURL(file)}"
                title="${file.name}"/>
                <span class="video-duration">${format(srcvideo.duration)}</span>`;
             
                listItem.addEventListener('click', (e) => {
                    doImgClick(e)
                    currentVideo = file.path;
                })
                listItem.addEventListener('contextmenu', (event) => {
                    event.preventDefault();
                    lstMenu.popup(remote.getCurrentWindow());
                    listindex = videolist.indexOf(event.target)
                })
                listItem.title = file.name;
                saveVideoDetails(file, image,  format(srcvideo.duration)) //======== save video details)
                listItem.appendChild(card);
                playlist.appendChild(listItem);
                videolist.push(listItem) //=============== put items into videolist array 
                    try{
                        videolist.forEach(function(element, index){
                            var title = element.title
                            var x = files[0].name           
                            if(title == x){
                                var fst = document.querySelectorAll("li")[index]; 
                                fst.classList.add('active');
                            }
                        });
                    }catch(error){
                        console.log(error)
                    }                               
                URL.revokeObjectURL(url);                 
              }      
              return success;            
            };         
            srcvideo.addEventListener('timeupdate', timeupdate);
            srcvideo.preload = 'metadata';
            srcvideo.src = url;  
         closeNav();
    }

    function windowMouseMove(e){
        var pro = format(video.currentTime)
        if( video.src != "" && pro >= '00:01'){
            mediaControls.style.display = 'flex';
            mediaControls.style.opacity = 1;
        }else if(video.paused && vdTimer.innerHTML == '00:00'){
            mediaControls.style.display = 'flex';
            mediaControls.style.opacity = 1;
        }else{   mediaControls.style.opacity = 0;}
        myStopFunction();
        myFunction();
    }

    function windowContextMenu(event){
        event.preventDefault();
        togglePlayCM();
        togglemutecM();
        toggleFullScreenCM();
        ctxMenu.popup(remote.getCurrentWindow());
        closeNav();
    }
    function openFolder(){
      openFolderInput.click();
    }
    function preventDefault(event){
        event.preventDefault()
    }
    function openNav() {
        if(videosList.style.width == "35%"){
            videosList.style.width = "0";
        }else{
            videosList.style.width = "35%";
        }
       hideMenu();
    var cols = document.querySelectorAll("li");
    [].forEach.call(cols, addDnDHandlers);
        
        //========== select current video in the playlist
        cols.forEach((col) => { 
            let path = col.getAttribute("url");
            if(video.src == path)
                col.classList.add("active");
        });
    }

    function closeNav() {
        videosList.style.width = "0";
        menu.style.display = 'none';
        btnResume.style.width = '0em';
        if(modal.style.display == "flex"){
            modal.style.display = "none";
        }
    }
    function showVolume(){
        document.querySelector('.volume').style.width = '100px';
    }
    function hideVolume(){
        document.querySelector('.volume').style.width = '0';
    }
    function openAppMenu(evt){
        // evt.preventDefault();
        var x = document.querySelectorAll('#menuDiv > span');
        for(var i = 0; i < x.length; i++){
            x[i].onclick = function(){

                switch(this.innerHTML){
                    case 'Save Snapshot...':
                        saveSnapshot();
                    break;
                    case 'Open Files':
                        openFolder();
                    break;
                    case 'Playlist':
                        openNav();
                    break;
                    case 'Fullscreen':
                        toggleFullscreen();
                    break;
                    case 'About':
                        showAboutDialog();
                    break;
                    case 'Exit':
                        ipc.send('exit');
                    break;
                }

                hideMenu();
            }
        }
    }

    function showAboutDialog(){
        aboutOverlay.classList.add('show-about');
       closeAboutDialog();
    }

    function closeAboutDialog(){
        document.querySelector('.about-btn-ok').addEventListener('click', () =>{
            aboutOverlay.classList.remove('show-about');
        });

        document.querySelector('.btn-close-dialodg').addEventListener('click', () =>{
            aboutOverlay.classList.remove('show-about');
        });
    }

    function isPlaying(){
        try{
            vdDuration.innerHTML = format(video.duration);  
            video.style.cursor = "default";        
        } catch(e){
           console.log(e.message);
        }
    }
    function clearListInfo(){
        var vd = document.querySelector('.drag-files-here');
        vd.style.display = 'none';
    }
    function toggleAppMenu(){
        const btn = document.getElementById('app-menu');
        const rect = btn.getBoundingClientRect();
        let top = rect.top;
        left = rect.left;

        if(menu.style.display == 'flex'){
            menu.style.display = 'none';
        }else{
            menu.style.top = top + 20 + 'px';
            menu.style.left = left  - 8 + 'px';
            menu.style.display = 'flex';
        }
       openAppMenu();
    }

    function hideMenu(){
        menu.style.display = 'none';
    }

    function playNextItem(){
        current = document.querySelector('li.active');  
        if(index !== (videolist.length - 1)){ 
            var next = current
                .parentNode.querySelector("li.active + li");
                
            if(current){
                current.classList.remove('active');
            }
            if(next){
                next.classList.add('active');
                var src = next.getAttribute("url");               
                video.src = src;
                videoTitle.textContent = `${next.title} - ZVP`
                playPuase();
            }else {
                atLastItemOnPlaylist();
                current.classList.add('active');
            }
        }else{
            atLastItemOnPlaylist();
        }
    }

    function atLastItemOnPlaylist(){
        video.pause();
        video.currentTime = 0;
        playPuaseBtn.innerHTML = playicon;
        vdTimer.innerHTML = "--";
        vdDuration.innerHTML = "--";
    }

    function enablingElements(){
        if(video.src.includes("mp4")){
            ctxMenu.items[2].enabled = true;
            ctxMenu.items[4].enabled = true;
            ctxMenu.items[6].enabled = true;
            ctxMenu.items[7].enabled = true;
            ctxMenu.items[8].enabled = true;
            ctxMenu.items[11].enabled = true;
            ctxMenu.items[12].enabled = true;
            enabledCtrlButtons();
        }else{
            ctxMenu.items[2].enabled = false;
            ctxMenu.items[4].enabled = false;
            ctxMenu.items[6].enabled = false;
            ctxMenu.items[7].enabled = false;
            ctxMenu.items[8].enabled = false;
            ctxMenu.items[11].enabled = false;
            ctxMenu.items[12].enabled = false;
        }
    }
    function enabledCtrlButtons(){
        snapshotBtn.classList.remove('disabled');
        btnGo.removeAttribute('disabled');
        menuTg.classList.remove('disabled');
        menuSnap.classList.remove('disabled');
        fullscreenBtn.classList.remove('disabled');
        playPuaseBtn.classList.remove('disabled');
        muteBtn.classList.remove('disabled');
        // document.querySelector('.folder-name img').style. visibility = 'visible';
    }

    function openVideoInFolder(){
        var x = videolist[listindex]
        var filename = x.title;
        var path = folderpath.innerHTML;
        var dir = path + "\\"+  filename;
        shell.showItemInFolder(dir);

    }
    function goToVideoTime(time) {
        video.currentTime = time * 60;
    }

    function getVideoDetails(){
        try{
            let dir = appFolders();
        let database = path.join(dir, "playlist.json");
        if(fs.existsSync(dir)){
            fs.readdir(dir, function(err, files) {
                if(err) return
               if(files.length > 0){
                fs.readFile(database, "utf8", (err, data) => {
                    if(data.length > 2){
                         btnClearList.style.display = 'block';
                         dragPargs.style.display = 'none';        
                    }
                    if (err) return console.error(err);
                    let mydata = JSON.parse(data);
                    mydata.forEach((key) =>{
                        let list = document.createElement('li');
                        let card = document.createElement('div');
                        card.innerHTML = `<img src="${key.image}" url="${key.path}"
                        title="${key.name}"/>
                        <span class="video-duration">${key.duration}</span>`;
                        list.className = 'recent-file';
                        list.setAttribute('url', fileUrl(key.path));
                        list.setAttribute('title', key.name);
                        list.setAttribute('draggable', 'true');
                        list.appendChild(card)
                        let folder = dir.substring(0, dir.lastIndexOf('\\'));
                        folder = folder.substring(folder.lastIndexOf('\\') + 1);
                        folderpath.title = dir ;
                        folderpath.innerHTML = "Playlist";;

                        list.addEventListener('click', (evt) =>{
                            let url = list.getAttribute('url');
                            let current = document.querySelector('li.active'); 
                            video.src = url;
                            videoTitle.textContent = `${key.name} - ZVP`
                            closeNav();
                            playPuase();
                            hideMenu();
                            enablingElements();
        
                            if(current){
                                current.classList.remove('active');
                            } 
                            list.classList.add('active') 
                           
                        });
        
                        list.addEventListener('contextmenu', (event) => {
                            event.preventDefault();
                            lstMenu.popup(remote.getCurrentWindow());
                            contextFilePath = key.path;
                            contextFile = list;
                        })                     
                        if(key.name.includes('.mp4') && key.image !== undefined)
                        playlist.appendChild(list)
                    })
                   
                }); 
               }
            })
        }
        videoEnded();  
        }catch(e){
            console.log(e.message);
        }  
    }

    function appFolders(){
        let tempDir = path.join(homedir, "ZVP/playlist/");
        return tempDir;
    }

    function clearRecents(directory) {
        fs.readdir(directory, (err, files) => {
            if (err) throw err;
          
            for (const file of files) {
              fs.unlink(path.join(directory, file), (err) => {
                if (err) throw err;           
                var listLength = playlist.children.length;
                for (i = 0; i < listLength; i++) {
                    playlist.removeChild(playlist.children[0]);
                }
                    dragPargs.style.display = 'block';
                    btnClearList.style.display = 'none';
                    createPlaylist();
              });
            }
          });
    }

    function removeJsonObject(filename) {
        let dir = appFolders();
        let dbfile = path.join(dir, "playlist.json");

        const data = fs.readFileSync(dbfile);
        let jsonData = JSON.parse(data);
        const index = jsonData.findIndex(obj => obj.path === filename);

        if (index !== -1) {
            jsonData.splice(index, 1);
          }       
          // Write the updated JSON data back to the file
          fs.writeFileSync(dbfile, JSON.stringify(jsonData, null, 2));           
    }

    function removeFile(file){
        let dir = appFolders();
        if(fs.existsSync(dir)){
            fs.readdir(dir, function(err, files) {
                if(err) return
                if(files.length){
                   files.forEach(item => {
                        if(file  === path.join(dir, item)){
                            removeJsonObject(file);
                            fs.unlink(file, (err) => {
                                if (err) throw err;
                            });
                        }
                   })
                }
            });
        }
    
    }

//====== Dragging items in video  playlist =============
    function handleDragStart(e) {
    // Target (this) element is the source node.
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
     this.classList.add('dragElem');
    }
    function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault(); // Necessary. Allows us to drop.
    }
    this.classList.add('over');

    e.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.
    return false;
    }
    
    function handleDragEnter(e) {
    // this / e.target is the current hover target.
    }

    function handleDragLeave(e) {
    this.classList.remove('over');  // this / e.target is previous target element.
    }

    function handleDrop(e) {
    // this/e.target is current target element.
    if (e.stopPropagation) {
        e.stopPropagation(); // Stops some browsers from redirecting.
    }
    // Don't do anything if dropping the same column we're dragging.
    if (dragSrcEl != this) {
        this.parentNode.removeChild(dragSrcEl);
        var dropHTML = e.dataTransfer.getData('text/html');
        this.insertAdjacentHTML('beforebegin', dropHTML);
        var dropElem = this.previousSibling;
        
        // dropElem.addEventListener('click', doImgClick, false);
        dropElem.addEventListener('click', (evt) => {
             var current = document.querySelector('li.active'); 
             doImgClick(evt)
            if(current){
                current.classList.remove('active');
            } 
            dropElem.classList.add('active');  
            enablingElements();  
        
        });

        dropElem.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            lstMenu.popup(remote.getCurrentWindow());
        })

        addDnDHandlers(dropElem);
    }
        this.classList.remove('over');
        return false;
    }

    function handleDragEnd(e) {
    // this/e.target is the source node.
        this.classList.remove('over');
        // this.classList.add('.dragElem');
        listindex = videolist.indexOf(e.target)
    }
    
    function addDnDHandlers(elem) {
        elem.addEventListener('dragstart', handleDragStart, false);
        elem.addEventListener('dragenter', handleDragEnter, false)
        elem.addEventListener('dragover', handleDragOver, false);
        elem.addEventListener('dragleave', handleDragLeave, false);
        elem.addEventListener('drop', handleDrop, false);
        elem.addEventListener('dragend', handleDragEnd, false);
    }

//end dragging item in video list

    const showModal = function(elem) {
        const text = document.querySelector('[data-modal-text]');
        text.textContent = 'Are you sure you want to delete all these from playlist?';
        const btn = elem.querySelectorAll('button');

        btn[0].addEventListener('click', () => {
            clearRecents(appFolders());
            // removeDir(appFolders())
            elem.style.display = 'none';
        });
        btn[1].addEventListener('click', () => {elem.style.display = 'none';});

        elem.addEventListener('click', () => {
            elem.classList.add('apply-shake');
            setTimeout(() => {
                elem.classList.remove('apply-shake');
            }, 1000);
        });

        elem.style.display = 'flex';
    }

    // function getlastVideo(){
    //     let lastVideo = localStorage.getItem("currentVideo");
    //     let json = JSON.parse(lastVideo)
    //     if(json){
    //         video.currentTime = parseFloat(json.time);
    //         videoTitle.textContent = `${json.title} - ZVP`;  
    //         video.src = json.path;
    //         // timeDuration()
    //         closeNav(); 
    //         playPuase(); 
    //         hideMenu(); 
    //         enablingElements();     
    //     }else{
    //         console.log("No video found")
    //     }
    // }

    // function resumeLastVideo(){
    //     const myTimeOut =  setTimeout(hideResumeCard, 5000);
    //     btnResume.style.width = '6em';
    //     btnResume.addEventListener('click', () => {
    //         getlastVideo();
    //         btnResume.style.width = '0em';
    //     });

    //     btnResume.addEventListener('mouseover', () => {
    //       clearTimeout(myTimeOut)
    //     });

    //     btnResume.addEventListener('mouseout', () => {
    //         setTimeout(hideResumeCard, 5000);
    //     });  
    // }

    // function hideResumeCard(){
    //     btnResume.style.width = '0em';
    // }

    // function resumeWithThumbnail(){
    //     let lastVideo = localStorage.getItem("currentVideo");
    //     const poster = document.querySelector(".resume-card > img");
    //     let json = JSON.parse(lastVideo)
    //     if(json){
    //         videoTitle.textContent = `${json.title} - ZVP`;
    //         poster.src = json.image;        
    //     }else{
    //         console.log("No video found");
    //     }
    // }

    function resumeWithVideoPoster(){
        let lastVideo = localStorage.getItem("currentVideo");
        let json = JSON.parse(lastVideo)
        if(json){
            videoTitle.textContent = `${json.title} - ZVP`;
            playerStatus.textContent = "Paused";
            video.style.cursor = 'pointer';  
            video.src = json.path;
            video.currentTime = parseFloat(json.time);
            video.pause();
            ctxMenu.items[2].enabled = true; 
            ctxMenu.items[2].visible = true;  
            
        }else{
            console.log("No video found");
        }

        video.addEventListener("click", () => {
            closeNav(); 
            playPuase(); 
            hideMenu(); 
            enablingElements();
            video.play();
        });

    }

    function openWith(){
        try{
            var data = ipc.sendSync('get-file-data');    
                if (data ===  null) {return;
                } else if(data.includes('mp4')){
                    btnResume.style.width = '0em';
                    let filename = data.substring(data.lastIndexOf('\\') + 1);
                    const newData = fileUrl(data);     
                    video.src = newData;
                    videoTitle.textContent = `${filename} - ZVP`;
                    closeNav();
                    playPuase();
                    hideMenu();
                    enablingElements();
                }  
            
        }catch(e){
            console.log(e.message);
        }   
    }

    function windowKeyUp(evt){
        evt.preventDefault();
        evt.stopPropagation();
        switch(evt.key){
            case ' ': // space
                playPuase();
            break;
            case 'Escape':
                exitFullscreen();
            break;
            case 'ArrowLeft':
                video.currentTime -= 3 * 60; 
            break;
            case 'ArrowRight':
                video.currentTime += 3 * 60; 
            break;
        }
        if(evt.ctrlKey){
            switch(evt.key){
                case 'o':
                    openFolder();
                break;
            }
        }
    }

//========= EventListener handlers =============
    openFolderInput.onchange = selectFiles;
    openFolderBtn.onclick = openFolder;
    playPuaseBtn.onclick = playPuase;
    muteBtn.onclick = muteVideo;
    muteBtn.onmouseenter = showVolume;
    muteBtn.onmouseleave = hideVolume;
    volSlider.onchange = volumeChange;
    volSlider.onmouseout = hideVolume;
    volSlider.onmouseenter = showVolume;
    snapshotBtn.onclick = saveSnapshot;
    video.ontimeupdate = handleProgress;
    video.onclick = closeNav;
    video.onended = videoEnded;
    video.onloadeddata = isPlaying;
    video.onmousewheel = videoMouseWheel;
    video.oncontextmenu = windowContextMenu;
    progressBar.onclick = progressBarClick;
    progressBar.onmousemove = progressMouseMove;
    progressBar.onmousedown = progressMouseDowmn;
    progressBar.onmouseup = progressMouseUp;
    fullscreenBtn.onclick = toggleFullscreen;
    videoDiv.ondrop = dropVideo;
    window.onmousemove = windowMouseMove;
    window.onkeyup = windowKeyUp;
    videoDiv.ondragover = preventDefault;
    openPlaylist.onclick = openNav;
    closePlaylist.onclick = closeNav;
    menuBtn.onclick = toggleAppMenu;

    addListenerMulti(videoDiv, 'webkitfullscreenchange', function (e) {
        return onFullScreen(e);
    }, false);

    btnGo.addEventListener('click', (evt) => {
        if(numb.value !== ''){
            goToVideoTime(numb.value);
            numb.value = "";
        }
    });

    btnClearList.addEventListener('click', () => {
        showModal(modal);
    });

    aboutOverlay.addEventListener('click', () => {
        aboutDialog.classList.add('apply-shake');
            setTimeout(() => {
                aboutDialog.classList.remove('apply-shake');
            }, 1000);
    });

//========== Button tooltips ===================
    snapshotBtn.title = "Take Snapshot";
    muteBtn.title = "Mute";
    playPuaseBtn.title = "Play";
    fullscreenBtn.title = "Toggle Video in Fullscreen";
    openPlaylist.title = "Open Playlist";
    menuBtn.title = "Menu";

//========== Inintialize Functions ===============
    dragElement(dialog, dragzone);
    dragElement(aboutDialog, aboutDragZone);
    createDirectories("zvp/playlist");;
    createPlaylist();
    getVideoDetails(); 
    // resumeWithThumbnail();
    resumeWithVideoPoster();
    // resumeLastVideo();
    openWith();
})();
