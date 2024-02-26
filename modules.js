import * as THREE from  "https://cdn.jsdelivr.net/npm/three@0.127.0/build/three.module.js"
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.127.0/examples/jsm/controls/OrbitControls.js"
import { PLYLoader } from "https://cdn.jsdelivr.net/npm/three@0.127.0/examples/jsm/loaders/PLYLoader.js"

$.getScript("https://cdn.plot.ly/plotly-2.25.2.min.js")
$.getScript("https://3Dmol.org/build/3Dmol-min.js")

const MIMETYPES = {
  'png': 'image/png', 'jpeg': 'image/jpeg', 'jpg': 'image/jpeg',
  'gif': 'image/gif', 'bmp': 'image/bmp', 'tiff': 'image/tiff',
  'tif': 'image/tiff', 'webp': 'image/webp', 'svg': 'image/svg+xml'
};

const IMAGEFORMATS = Object.keys(MIMETYPES);

var BACKGROUND_COLOR = "#FFF9DE"

class github_api {
  constructor() {
    this.repo = "";
    this.accept = "application/vnd.github+object";
    this.authorization = "";
  }
  have_auth(){
    return this.authorization.length > 0
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

function set_token(token) {
  github_auth.set_authorization(token)
}
function set_repo(repo_url) {
  github_auth.set_repo(repo_url)
}
function set_bgcolor(color){
  BACKGROUND_COLOR = color
}


async function getUrlContents(url){
  // Fetch file from Github via content API
  // Assume it is the file path to the image in the repo
  var ret;
  if (github_auth.have_auth() == false) {
    console.log("No authorization token")
    ret = await fetch(url);
  } else {
    ret = await fetch(url, {headers: github_auth.get_auth()});
  }
  const data = await ret.json();
  if (data.hasOwnProperty("content") && data.content.length > 0){
    /* Small files for which the content is returned directly */
    console.log("Download file from github (Content): ", url);
    return data.content
  } else if (data.hasOwnProperty("git_url")){
    console.log("Download file from github (Blob): ", data.git_url);
    let ret_blob = await fetch(data.git_url, {headers: github_auth.get_auth()});
    let data2 = await ret_blob.json();
    return data2.content
  } else if (data.hasOwnProperty("sha")){
    /* This route is mainly for big files */
    const blob_url =  url.replace(/contents.*/, "git/blobs")+"/"+data.sha;
    console.log("Download file from github: route 3", blob_url);
    let ret_blob = await fetch(blob_url, {headers: github_auth.get_auth()});
    let data2 = await ret_blob.json();
    return data2.content
  }
}



async function getImageb64(fileurl) {
  // Read image Github URL to base64 encoded string
  const supported_image_types = Object.keys(MIMETYPES);
  // Convert the format to lowercase
  const format = fileurl.split('/').pop().split('.').pop().toLowerCase();
  if (!supported_image_types.includes(format)) {
    throw new Error('Unsupported image format: '+format);
  }
  try {
    const data = await getUrlContents(fileurl);
    const dataUriPrefix = MIMETYPES[format];
    return `data:${dataUriPrefix};base64,${data}`;
  } catch (error) {
    console.error('An error occurred while fetching the file:'+fileurl+'; Because of ', error);
  }
}

function sleep(ms) {
  console.log("Sleeping for ", ms, "ms")
  return new Promise(resolve => setTimeout(resolve, ms));
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
  if (figContent.startsWith("data")){
    console.log("Setting up image via base64 encoded string")
    img.src = figContent;
  } else if (figContent.startsWith("http") && figContent.includes("github.com")) {
    console.log("Setting up image via github url")
    const fig_content = await getImageb64(figContent);
    img.src = fig_content;
  } else if (figContent.startsWith("http") && ! figContent.includes("github.com")) {
    console.log("Setting up image via non-github url")
    img.src = figContent;
  } else if (IMAGEFORMATS.includes(figContent.split('.').pop().toLowerCase())) {
    console.log("Setting up image via file path in the repo")
    const fig_content = await getImageb64(github_auth.repo + figContent);
    img.src = fig_content;
  } else {
    // Actual file in the root folder as input
    img.src = figContent;
  }
}

async function listAndFetch(theurl){
  var ret_data = {}
  let response = await fetch(theurl, {headers: github_auth.get_auth()});
  let data = await response.json();
  if (!Array.isArray(data)) {
    console.log("Warning: Failed to retrieve the contents as an array: ", data)
    return ret_data
  }
  for (let file of data) {
    if (file.type == "dir"){
      var newpath = theurl+file.name+"/"
      let tempdata = await listAndFetch(newpath)
      for (let key in tempdata){
        ret_data[key] = tempdata[key]
      }
    } else if (file.type == "file" && IMAGEFORMATS.includes(file.name.split('.').pop().toLowerCase())){
      ret_data[file.name] = await getImageb64(theurl + file.name);
    }
  }
  return ret_data
}

async function getAllImages(FIGURES) {
  // Get all images from the repo asynchonously
  // Lazy mode: Automatically get all images from the repo; Save to the global object: FIGURES
  // try {
  // Get the contents of the repo
  let tempimgs = await listAndFetch(github_auth.repo);
  for (let key in tempimgs){
    FIGURES[key] = tempimgs[key]
  }
  // await sleep(2000);
  // } catch (error) {
  //   console.error("An error occurred:", error);
  // }
}



function linspace(start, end, num) {
  const step = (end - start) / (num - 1);
  const result = new Array(num);
  for (let i = 0; i < num; i++) {
    result[i] = start + i * step;
  }
  return result;
}

function renderGridPoints(viewer, center, lengths, dims) {
  const sphereRadius = 0.1;
  const sphereColor = 0xff0000;
  var xs = linspace(center[0]-lengths[0]/2, center[0]+lengths[0]/2, dims[0]);
  var ys = linspace(center[1]-lengths[1]/2, center[1]+lengths[1]/2, dims[1]);
  var zs = linspace(center[2]-lengths[2]/2, center[2]+lengths[2]/2, dims[2]);
  var newshape = viewer.addShape({color: sphereColor})
  for (let x = 0; x < xs.length; x++) {
    for (let y = 0; y < ys.length; y++) {
      for (let z = 0; z < zs.length; z++) {
        //combinedShape.addSphere({ center: { x: xs[x], y: ys[y], z: zs[z] }, radius: sphereRadius, color: sphereColor });
        newshape.addSphere({ center: { x: xs[x], y: ys[y], z: zs[z] }, radius: sphereRadius});
      }
    }
  }
  viewer.zoomTo();
  viewer.render();
}

function resetCanvas(parent_div, viewer){
  var container = document.getElementById(parent_div);
  var width = container.offsetWidth;
  var height = container.clientHeight;
  console.log("Set the width/height of the canvas: ",parent_div, "height/width:", height, width)
  viewer.setWidth(width);
  viewer.setHeight(height);
  viewer.render();
  // $("#"+parent_div+" canvas").css({"position": "relative", "width":"100%", "height": "100%"})
}

async function add3DMolObject(divid, fileurl){
  var container = document.getElementById(divid);
  var viewer = $3Dmol.createViewer(container);
  let format = fileurl.split("/").pop().split(".").pop();
  console.log("Adding 3D molObj: Reading the file as ", format)

  var mol_string;
  if (fileurl.includes("github.com")){
    mol_string = atob(await getUrlContents(fileurl))
  } else {
    mol_string = await fetchFileFromCDN(fileurl);
  }
  
  viewer.addModel(mol_string, format);
  viewer.setStyle({}, { stick: {} });
  viewer.setBackgroundColor(BACKGROUND_COLOR); 
  // Zoom to fit the molecule in the viewer and Render the molecule
  resetCanvas(divid, viewer);
  viewer.zoomTo();
  viewer.render();
  return viewer;
}

async function addModel(viewer, fileurl, style={}){
  let format = fileurl.split("/").pop().split(".").pop();
  console.log("Adding 3D molObj: Reading the file as ", format)

  var mol_string;
  if (fileurl.includes("github.com")){
    mol_string = atob(await getUrlContents(fileurl))
  } else {
    mol_string = await fetchFileFromCDN(fileurl);
  }
  
  viewer.addModel(mol_string, format);
  // viewer.setStyle({}, { stick: {} });
  viewer.setBackgroundColor(BACKGROUND_COLOR); 
  // Zoom to fit the molecule in the viewer and Render the molecule
  viewer.zoomTo();
  viewer.render();
  return viewer;
}

async function fetchFileFromCDN(fileurl){
  // Fetch file from Github via content API
  // Assume it is the file path to the image in the repo
  const ret = await fetch(fileurl);
  if (!ret.ok){
    console.log("Failed to fetch the file from CDN: ", fileurl)
    return ""
  } else {
    return ret.text()
  }
}


async function initPLYObject(divid, fileurl){
  // Initialize the scene with a ply object
  const THREE = window.THREE;
  const OrbitControls = window.OrbitControls ;
  // Setup for Renderer
  const renderer = new THREE.WebGLRenderer();
  var camera
  if (divid.length > 0){
    var container = document.getElementById(divid);
    console.log("using divid", divid, "Width", container.clientWidth, "Height: ", container.clientHeight)
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    const aspectRatio = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    camera.position.z = 5;
  } else {
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
  }
  // Setup for the Scene, Background color, and light
  const scene = new THREE.Scene();
  renderer.setClearColor(BACKGROUND_COLOR);
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // 0.5 intensity
  scene.add(ambientLight);
  const light = new THREE.DirectionalLight(0xffffff, 1, 0);
  light.position.set(10, 10, 10);
  scene.add(light);

  // Add Orbit controler
  const controls = new OrbitControls(camera, renderer.domElement);

  // Convert the content from base 64 to string
  console.log("Loading the plyfile", fileurl)
  const plycontent = await fetchFileFromCDN(fileurl);
  var mesh = loadPLYMesh(plycontent, scene, camera, light);

  scene.add(mesh);
  camera.position.set(0, 0, 20);
  camera.near = 0.1;
  camera.far = 1000;
  camera.updateProjectionMatrix();
  return [scene, renderer, camera, light]
}


function loadPLYMesh(plycontent, scene, camera, light) {
  // Load PLY file from base64 encoded string and return mesh
  const loader = new PLYLoader();
  const geometry = loader.parse(plycontent);
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({vertexColors: true, flatShading: true});
  const mesh = new THREE.Mesh(geometry, material);
  geometry.computeBoundingBox();
  const boundingBox = geometry.boundingBox;
  const center = boundingBox.getCenter(new THREE.Vector3());
  mesh.position.set(-center.x, -center.y, -center.z);
  mesh.onBeforeRender = function (renderer, scene, camera) {
    light.position.copy(camera.position);
  };
  return mesh
}

async function addPLYtoStage(fileurl, scene, renderer, camera, light, offsets){
  const plycontent = atob(await getUrlContents(fileurl));
  var themesh = loadPLYMesh(plycontent, scene, camera, light);
  themesh.geometry.computeBoundingBox();
  const boundingBox = themesh.geometry.boundingBox;
  const center = boundingBox.getCenter(new THREE.Vector3());
  themesh.position.set(-center.x + offsets[0], -center.y + offsets[1], -center.z +offsets[2]);
  scene.add(themesh);
  return [scene, renderer, camera, light]
}


function testfunc(){
  // Test function for the module development
  console.log("test function");
}


export {
  testfunc,
  sleep,

  // Setup global variables 
  set_repo,
  set_token,
  set_bgcolor,

  // Fetch the contents 
  getUrlContents,
  getImageb64,
  
  setupImage,
  getAllImages,


  // Render the molecule and set the canvas for 3D objects
  initPLYObject,
  addPLYtoStage,
  add3DMolObject,
  addModel,
  renderGridPoints,
  resetCanvas,
  
}
