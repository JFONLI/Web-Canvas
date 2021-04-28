let canvas;
let ctx;


let strokeColor = 'black';
let fillColor = 'black';
let line_Width = 8;

let Tool = 'brush'

let savedImageData;
let drawing = false;
let erasing = false;

let usingBrush = false;
let brushXPoints = new Array();
let brushYPoints = new Array();

let brushDownPos = new Array();

let imageIndex = 0;
let allImages = new Array();


var imageLoader = document.getElementById('imageLoader');
let palette = document.getElementById('palette');
let lWidth = document.getElementById('line_Width');

let myText = document.getElementById('myText');
let font_style = document.getElementById('font_style');
let font_size = document.getElementById('font_size');

let texting = "";
let fontStyle = "serif";
let fontSize = "24";
let hasInput = false;

class ShapeBoundingBox {
    constructor(left, top, width, height) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }
}

class downPoints {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Location {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class TrianglePoint {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

let shapeBoundingBox = new ShapeBoundingBox(0, 0, 0, 0);
let mousedown = new downPoints(0, 0);
let loc = new Location(0, 0);
//alert("Welcome");


function init() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = line_Width;
    canvas.style.cursor = "url('cursor/brush.cur'),auto";

    //download_btn.addEventListener('click', function(e){
        //var dataURL = canvas.toDataURL('image/png');
        //download_btn.href = dataURL;
   // });

    download_btn.addEventListener('click', downloadImage);
    imageLoader.addEventListener('change', uploadImage, false);
    palette.addEventListener('change', changeStrokeStyle, false);
    lWidth.addEventListener('change', changeLineWidth, false);

    //myText.addEventListener('change', changeText, false);
    font_style.addEventListener('change', changeFontStyle, false);
    font_size.addEventListener('change', changeFontSize, false);

    canvas.addEventListener('mousedown', ReactToMouseDown);
    canvas.addEventListener('mousemove', ReactToMouseMove);
    canvas.addEventListener('mouseup', ReactToMouseUp);
    canvas.addEventListener('click', startTexting);

    allImages.length = 0;
    allImages.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    palette.style.background = "black";
}

function changeText(){
    texting = myText.value;
}

function changeFontStyle(){
    
    fontStyle = font_style.value;
}

function changeFontSize(){
    fontSize = font_size.value;
}

function changeStrokeStyle(){
    palette.style.background = palette.value;
    palette.style.borderColor = palette.value;
    ctx.strokeStyle = palette.value;
    ctx.fillStyle = palette.value;
}

function changeLineWidth(){
    ctx.lineWidth = lWidth.value;
}

function radiansToDegrees(rad) {
    if (rad < 0) {
        return (360.0 + (rad * (180 / Math.PI))).toFixed(2);
    }
    else {
        return (rad * (180 / Math.PI)).toFixed(2);
    }
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180)
}

function getTrianglePoints() {
    let trianglePoints = [];
    if (mousedown.x < loc.x && mousedown.y < loc.y) {
        trianglePoints.push(new TrianglePoint(mousedown.x, loc.y));
        trianglePoints.push(new TrianglePoint((mousedown.x + loc.x) / 2, mousedown.y));
        trianglePoints.push(new TrianglePoint(loc.x, loc.y));
    }
    else if (mousedown.x < loc.x && mousedown.y > loc.y) {
        trianglePoints.push(new TrianglePoint(mousedown.x, mousedown.y));
        trianglePoints.push(new TrianglePoint((mousedown.x + loc.x) / 2, loc.y));
        trianglePoints.push(new TrianglePoint(loc.x, mousedown.y));
    }
    else if (mousedown.x > loc.x && mousedown.y < loc.y) {
        trianglePoints.push(new TrianglePoint(mousedown.x, loc.y));
        trianglePoints.push(new TrianglePoint((mousedown.x + loc.x) / 2, mousedown.y));
        trianglePoints.push(new TrianglePoint(loc.x, loc.y));
    }
    else {
        trianglePoints.push(new TrianglePoint(mousedown.x, mousedown.y));
        trianglePoints.push(new TrianglePoint((mousedown.x + loc.x) / 2, loc.y));
        trianglePoints.push(new TrianglePoint(loc.x, mousedown.y));
    }
    return trianglePoints;
}

function getTriangle() {
    let trianglePoints = getTrianglePoints();
    ctx.beginPath();
    ctx.moveTo(trianglePoints[0].x, trianglePoints[0].y);
    ctx.lineTo(trianglePoints[1].x, trianglePoints[1].y);
    ctx.lineTo(trianglePoints[2].x, trianglePoints[2].y);
    ctx.closePath();
}



function ChangeTool(text) {
    Tool = text;
    document.getElementById("brush").className = "button";
    document.getElementById("eraser").className = "button";
    document.getElementById("line").className = "button";
    document.getElementById("circle").className = "button";
    document.getElementById("triangle").className = "button";
    document.getElementById("rectangle").className = "button";
    document.getElementById("text").className = "button";
    document.getElementById(text).className = "selected";
    if (text == 'brush'){
        canvas.style.cursor = "url('cursor/brush.cur'),auto";
    }
    if (text == 'eraser'){
        canvas.style.cursor = "url('cursor/eraser.cur'),auto";
    }
    if (text == 'line'){
        canvas.style.cursor = "crosshair";
    }
    if (text == 'circle'){
        canvas.style.cursor = "url('cursor/circle.cur'),auto";
    }
    if (text == 'triangle'){
        canvas.style.cursor = "url('cursor/triangle.cur'),auto";
    }
    if (text == 'rectangle'){
        canvas.style.cursor = "url('cursor/rectangle.cur'),auto";
    }
    if (text == 'text'){
        canvas.style.cursor = "url('cursor/text.cur'),auto";
    }
}

function GetMousePosition(x, y) {
    // Get canvas size and position in web page
    let canvasSizeData = canvas.getBoundingClientRect();
    return {
        x: (x - canvasSizeData.left) * (canvas.width / canvasSizeData.width),
        y: (y - canvasSizeData.top) * (canvas.height / canvasSizeData.height)
    };
}

function SaveCanvasImage() {
    savedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function RedrawCanvasImage() {
    ctx.putImageData(savedImageData, 0, 0);
}

function UpdatePreviewSizeData(loc) {
    shapeBoundingBox.width = Math.abs(loc.x - mousedown.x);
    shapeBoundingBox.height = Math.abs(loc.y - mousedown.y);

    if (loc.x > mousedown.x) {
        shapeBoundingBox.left = mousedown.x;
    }
    else {
        shapeBoundingBox.left = loc.x;
    }
    if (loc.y > mousedown.y) {
        shapeBoundingBox.top = mousedown.y;
    }
    else {
        shapeBoundingBox.top = loc.y;
    }
}

let fontStyleSize;

function DrawPreviewShape() {
    if (Tool == "eraser") {
        erasing = true;
    }

    else if (Tool == "brush") {
        DrawBrush();
    }
    else if (Tool == "line") {
        ctx.beginPath();
        ctx.moveTo(mousedown.x, mousedown.y);
        ctx.lineTo(loc.x, loc.y);
        ctx.stroke();
    }
    else if (Tool == "rectangle") {
        ctx.strokeRect(shapeBoundingBox.left, shapeBoundingBox.top, shapeBoundingBox.width, shapeBoundingBox.height);
    }
    else if (Tool == "circle") {
        let radius;
        if (shapeBoundingBox.width > radius) {
            radius = shapeBoundingBox.width;
        }
        else {
            radius = shapeBoundingBox.height;
        }
        ctx.beginPath();
        ctx.arc((mousedown.x + loc.x) / 2, (mousedown.y + loc.y) / 2, radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    else if (Tool == "triangle") {
        getTriangle();
        ctx.stroke();
    }
    else if (Tool == "text"){
        fontStyleSize = "";
        fontStyleSize = fontSize + "px " + fontStyle;
        ctx.font = fontStyleSize;
        ctx.fillText(texting, loc.x, loc.y);
    }
}

function startTexting(e){
    if(hasInput){
        return;
    }
    if (Tool == 'text')
        addInput(e.clientX, e.clientY);
}

       
function addInput(x, y){
    var input = document.createElement('input');
    input.type = 'text';
    input.style.position = 'fixed';
    input.style.left = (x-4)+'px';
    input.style.top = (y-4) + 'px';

    input.onkeydown = enterIsPressed;
    document.body.appendChild(input);
    input.focus();
    hasInput = true;
}

function enterIsPressed(e){
    var keyCode = e.keyCode;
    if (keyCode == 13){
        drawText(this.value, parseInt(this.style.left, 10), parseInt(this.style.top, 10));
        document.body.removeChild(this);
        hasInput = false;
        allImages[imageIndex + 1] = (ctx.getImageData(0, 0, canvas.width, canvas.height));
        imageIndex++;
    }
}

function drawText(text, x, y){
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    fontStyleSize = "";
    fontStyleSize = fontSize + "px " + fontStyle;
    ctx.font = fontStyleSize;
    ctx.fillText(text, mousedown.x, mousedown.y);
}



function UpdatePreviewOnMove(loc) {
    UpdatePreviewSizeData(loc);
    DrawPreviewShape(loc);
}

function AddBrushPoint(x, y, mouseDown) {
    brushXPoints.push(x);
    brushYPoints.push(y);
    brushDownPos.push(mouseDown);
}

function DrawBrush() {
    for (let i = 1; i < brushXPoints.length; i++) {
        ctx.beginPath();

        // Check if the mouse button was down at this point
        // and if so continue drawing
        if (brushDownPos[i]) {
            ctx.moveTo(brushXPoints[i - 1], brushYPoints[i - 1]);
        } else {
            ctx.moveTo(brushXPoints[i] - 1, brushYPoints[i]);
        }
        ctx.lineTo(brushXPoints[i], brushYPoints[i]);
        ctx.closePath();
        ctx.stroke();
    }
}

function ReactToMouseDown(e) {

    loc = GetMousePosition(e.clientX, e.clientY);

    SaveCanvasImage();

    mousedown.x = loc.x;
    mousedown.y = loc.y;

    drawing = true;
    ctx.globalCompositeOperation="source-over";

    if (Tool == 'eraser'){
        erasing = true;
        tempx = mousedown.x;
        tempy = mousedown.y;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation="destination-out";
    }

    if (Tool == 'brush') {

        usingBrush = true;
        //AddBrushPoint(loc.x, loc.y);
         tempx = mousedown.x;
        tempy = mousedown.y;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }
    
}

let tempx;
let tempy;

function ReactToMouseMove(e) {
    loc = GetMousePosition(e.clientX, e.clientY);

    if (Tool == 'eraser' && drawing && erasing){
        ctx.beginPath();
        ctx.moveTo(tempx, tempy);
        ctx.lineTo(loc.x, loc.y);
        ctx.closePath();
        ctx.stroke();
        tempx = loc.x;
        tempy = loc.y;
    }

    else if (Tool == 'brush' && drawing && usingBrush) {
        ctx.beginPath();
        ctx.moveTo(tempx, tempy);
        ctx.lineTo(loc.x, loc.y);
        ctx.closePath();
        ctx.stroke();
        tempx = loc.x;
        tempy = loc.y;
    }
    else {
        if (drawing) {
            RedrawCanvasImage();
            UpdatePreviewOnMove(loc);
        }
    }
}

function ReactToMouseUp(e) {
    if (Tool == 'eraser' && drawing && erasing){
        erasing = false;
        drawing = false;
    }
    else if (Tool == 'brush' && drawing && usingBrush) {
        drawing = false;
    }
    else {
        canvas.style.cursor = "pencil (1).png";
        loc = GetMousePosition(e.clientX, e.clientY);
        RedrawCanvasImage();
        UpdatePreviewOnMove(loc);
        drawing = false;
    }
    if (Tool != 'text'){
        allImages[imageIndex + 1] = (ctx.getImageData(0, 0, canvas.width, canvas.height));
        imageIndex++;
    }
    
}



function clr() {
    canvas.width = 1000;
    canvas.height = 600;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = palette.value;
    ctx.fillStyle = palette.value;
    ctx.lineWidth = lWidth.value;
}

function Undo() {
    if (imageIndex - 1 < 0) {
        imageIndex = 0;
    }
    else {
        imageIndex--;
    }
    ctx.putImageData(allImages[imageIndex], 0, 0);
}

function Redo() {
    if (imageIndex == allImages.length - 1) {
        imageIndex = imageIndex;
    }

    else {
        imageIndex++;
    }
    ctx.putImageData(allImages[imageIndex], 0, 0);
}

function downloadImage(){
    var dataURL = canvas.toDataURL('image/png');
    download_btn.href = dataURL;
}

function uploadImage(e){
    var reader = new FileReader();
    reader.onload = function(event){
        var img = new Image();
        img.onload = function(){
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img,0,0);
            ctx.strokeStyle = palette.value;
            ctx.fillStyle = palette.value;
            ctx.lineWidth = lWidth.value;
            allImages[imageIndex + 1] = (ctx.getImageData(0, 0, canvas.width, canvas.height));
            imageIndex++;
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);     
}

