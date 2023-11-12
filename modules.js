import * as THREE from  "https://cdn.jsdelivr.net/npm/three@0.127.0/build/three.module.js"
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.127.0/examples/jsm/controls/OrbitControls.js"
import { PLYLoader } from "https://cdn.jsdelivr.net/npm/three@0.127.0/examples/jsm/loaders/PLYLoader.js"
console.log(THREE)
console.log(OrbitControls)
console.log(PLYLoader)

$.getScript("https://cdn.plot.ly/plotly-2.25.2.min.js")
$.getScript("https://3Dmol.org/build/3Dmol-min.js")


class github_api {
    constructor() {
        this.repo = "";
        this.accept = "application/vnd.github+object";
        this.authorization = ""; // "Bearer "+token
    }
    get_auth() {
        var ret_headers = {
            Accept: this.accept,
        }
        if (this.authorization.length > 0){
            ret_headers.Authorization = this.authorization
        }
        return ret_headers
    }
    set_authorization(token) {
        this.authorization = "Bearer "+token
    }
    set_repo(repo_url) {
        this.repo = repo_url
    }
}
const github_auth = new github_api();
const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'svg'];

function set_token(token) {
    github_auth.set_authorization(token)
}
function set_repo(repo_url) {
    github_auth.set_repo(repo_url)
}

const testfunc = function(){
    console.log("test function");
}

async function getContents(url){
    // Fetch file from Github via content API
    const ret = await fetch(url, {headers: github_auth.get_auth()});
    const data = await ret.json();
    if (data.hasOwnProperty("content") && data.content.length > 0){
        console.log("Download file from github: route 1", url);
        return data.content
    } else if (data.hasOwnProperty("git_url")){
        console.log("Download file from github: route 2", data.git_url);
        let ret_blob = await fetch(data.git_url, {headers: github_auth.get_auth()});
        let data2 = await ret_blob.json();
        return data2.content
    } else if (data.hasOwnProperty("sha")){
        const blob_url =  url.replace(/contents.*/, "git/blobs")+"/"+data.sha;
        console.log("Download file from github: route 3", blob_url);
        let ret_blob = await fetch(blob_url, {headers: github_auth.get_auth()});
        let data2 = await ret_blob.json();
        return data2.content
    }
}

async function getImageb64(fileurl) {
    // Read image Github URL to base64 encoded string
    try {
        const data = await getContents(fileurl);
        let format = fileurl.split('/').pop().split('.').pop().toLowerCase(); // Convert to lowercase
        const mimeTypes = {
            'png': 'image/png', 'jpeg': 'image/jpeg', 'jpg': 'image/jpeg', 'gif': 'image/gif',
            'bmp': 'image/bmp', 'tiff': 'image/tiff', 'webp': 'image/webp', 'svg': 'image/svg+xml'
        };
        const dataUriPrefix = mimeTypes[format];
        if (!dataUriPrefix) {
            throw new Error('Unsupported image format');
        }
        return `data:${dataUriPrefix};base64,${data}`;
    } catch (error) {
        console.error('An error occurred while fetching the file:', error);
    }
}


async function setupImage(image, figContent){
    // Setup an image to an Element ID or HTMLElement figContent could be based64 encoded string, Github URL,
    // or the file path to the image in the repo
    var img;
    // Check if image is an HTMLElement (like what's returned by document.getElementById)
    if (image instanceof HTMLElement) {
        img = image;
        console.log("Setting up an HTMLElement")
    } else if (typeof image === 'string') {
        // If it's not, assume it's an id
        img = document.getElementById(image);
        if (img == null) {
            console.log("No such image id: ", image, " in the slide.")
            return;
        }
    }
    console.log("Setting up image: ", img)

    if (figContent.startsWith("data")){
        // Base64 encoded image as input
        img.src = figContent;
    } else if (figContent.startsWith("http")) {
        // Assume it is the file path to the image in the repo
        const fig_content = await getImageb64(figContent);
        console.log("Setting up image: ", img, fig_content)
        img.src = fig_content;
    } else if (imageFormats.includes(figContent.split('.').pop().toLowerCase())) {
        // Image file url as input
        const fig_content = await getImageb64(github_auth.repo + figContent);
        img.src = fig_content;
    } else {
        // Actual file in the root folder as input
        img.src = figContent;
    }
}

async function getAllImages(FIGURES) {
    // Get all images from the repo asynchonously
    // Lazy mode: Automatically get all images from the repo; Save to the global object: FIGURES
    try {
        // Get the contents of the repo
        let response = await fetch(github_auth.repo, {headers: github_auth.get_auth()});
        let data = await response.json();
        // For each file in the repo
        // 1. Check image;
        // 2. Fetch the image and store the image in base64 format
        for (let file of data) {
            let extension = file.name.split('.').pop().toLowerCase()
            if (imageFormats.includes(extension)) {
                var filename = file.name.split('?')[0].split("/")[file.name.split('?')[0].split("/").length-1];
                FIGURES[filename] = await getImageb64(github_auth.repo + filename);
            }
        }
        // console.log(FIGURES)
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

function getFileName(element){
    // ??????????????????????????????? Is this necessary? //
    /////////////////////////////////////////////////
    // Shortcut function to resolve the file name of an element
    // The <src> attribute of the image element should be the name of the desired image file
    /////////////////////////////////////////////////
    if (typeof element === 'string' || element instanceof String){
        let elem = document.getElementById(element);
        // let src_str = elem.src.split("?")[0];
        return elem.src.split("/")[elem.src.split("/").length-1]
    } else if (element instanceof HTMLElement){
        let elem = element;
        return elem.src.split("/")[elem.src.split("/").length-1]
    }
}


export {
    testfunc,
    getContents,
    getImageb64,
    set_token,
    setupImage,
    getAllImages,
    set_repo,
}
