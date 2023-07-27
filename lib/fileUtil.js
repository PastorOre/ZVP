const homedir = require('os').homedir();
const fs = require('fs');
const path = require('path');

function appFolders(){
    let tempDir = path.join(homedir, "ZVP/playlist/");
    return tempDir;
}

function fileUrl(str) {
    if (typeof str !== 'string') {
        throw new Error('Expected a string');
    }
    let pathName = path.resolve(str).replace(/\\/g, '/');
    // Windows drive letter must be prefixed with a slash
    if (pathName[0] !== '/') {
        pathName = '/' + pathName;
    }
    return encodeURI('file://' + pathName);
}

function saveCurrentVideo(path, title, time, image){
    let obj = {
        path: path,
        title: title,
        time: time,
        image: image
    }

    const json = JSON.stringify(obj);
    let videodb = appFolders() + "video.json";
    fs.writeFileSync(videodb, json);
    // localStorage.setItem("currentVideo", json);
}

function createDirectories(dir){
    let appDir = path.join(homedir, dir);
    if (!fs.existsSync(appDir)){
        fs.mkdirSync(appDir, { recursive: true });
    }
}

function copyToTempDirectory(frompath, topath){
    try{
        if(fs.existsSync(frompath)) {
            fs.createReadStream(frompath).pipe(fs.createWriteStream(topath));
        }
    }catch(e){
        alert(e.message);
    }
}

module.exports = {fileUrl, saveCurrentVideo, createDirectories, copyToTempDirectory};