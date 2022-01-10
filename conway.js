// jshint esversion: 6
class Pixel {
    constructor(i) {
        this.i = i;
        this.state = 0;
        this.prev_state = 0;
        this.x = getCoordinateX(this.i);
        this.y = getCoordinateY(this.i);
        this.rightWrap = (i + 1) % boardX ? 1 : -boardX + 1;
        this.leftWrap = (i % boardX) ? -1 : boardX - 1;
        this.up = (i > boardX) ? i - boardX : i + (L - boardX);
        this.right = i + this.rightWrap;
        this.down = (i + boardX) < L ? i + boardX : i % boardX;
        this.left = i + this.leftWrap;
        this.upRight = this.up + this.rightWrap;
        this.upLeft = this.up + this.leftWrap;
        this.downRight = this.down + this.rightWrap;
        this.downLeft = this.down + this.leftWrap;
    }
}
var canvas = document.getElementById("conway");
var btn = document.getElementById("reset-btn-hot");
btn.addEventListener('click', function (event) {
    console.log("Debug");
    color = [Math.random() * 255 << 0, Math.random() * 255 << 0, Math.random() * 255 << 0];
    restart();
});
var lastX = 0;
var lastY = 0;
canvas.addEventListener('wheel', function zoom(event) {
    event.preventDefault();
    ctx.translate(lastX, lastY);
    factor = Math.pow(scaleFactor, event.deltaY * 0.003);
    ctx.scale(factor, factor);
    ctx.translate(-lastX, -lastY);
    redraw = true;
});
canvas.addEventListener('mousemove', function (event) {
    lastX = event.offsetX || (event.pageX - canvas.offsetLeft);
    lastY = event.offsetY || (event.pageY - canvas.offsetTop);
});
canvas.click(function (e) {
    var BB = canvas.getBoundingClientRect();
    var mouseX = parseInt(e.clientX - BB.left);
    var mouseY = parseInt(e.clientY - BB.top);
});
window.addEventListener('keyup', function (event) {
    if (event.defaultPrevented) { return; }
    switch (event.code) {
        case "Space":
            if (paused) {
                this.window.requestAnimationFrame(update);
                paused = false;
            } else {
                window.cancelAnimationFrame(frame);
                paused = true;
            }
            break;
        default:
            break;
    }
});
var ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.msImageSmoothingEnabled = false;
const width = window.innerWidth;
const height = window.innerHeight;
canvas.width = width;
canvas.height = height;
const cellSize = 1;
const boardX = parseInt(width / cellSize);
const boardY = parseInt(height / cellSize);
const L = boardX * boardY;
var board = new Float32Array(L);
var prevBoard;
var factor = 1.0;
const scaleFactor = 1.2;
var zoomCounter = 0;
var paused = false;
const matrices = [[
    1.0, 1.0, 1.0,
    1.0, 9.0, 1.0,
    1.0, 1.0, 1.0
], [
    0.0, 0.0, 0.0,
    0.0, 0.0, 0.0,
    1.0, 2.0, 4.0
], [
    0.8, -0.85, 0.8,
    -0.85, -0.2, -0.85,
    0.8, -0.85, 0.8
], [
    0.68, -0.9, 0.68,
    -0.9, -0.66, -0.9,
    0.68, -0.9, 0.68
]];
var liveCells = new Set();
var prevLiveCells = new Set(liveCells);
var dead_cells = new Set();
var revive_cells = new Set(liveCells);
var pixels = [];
var activeArea = new Set();
var redraw = false;
var app = {};
var image = ctx.createImageData(width, height);
var imageData = image.data;
var color = [135, 33, 166];

start();
var frame = requestAnimationFrame(update);
var fpsCounter = 0;
var skipFrames = true;

function start() {
    app.activation = activationInvGaussian;
    app.matrix = matrices[2];
    board = initializeBoard(board);
    prevBoard = board.slice();
    liveCells = findLiveCells();
    revive_cells = new Set(liveCells);
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.fillRect(0, 0, width, height);
    createPixelData();
}

function update() {
    if (skipFrames) {
        if (fpsCounter % 2) {
            drawBoardImage();
        }
    } else {
        drawBoardImage();
    }
    fpsCounter++;
    fpsCounter = fpsCounter % 10;
    evaluateBoard();
    frame = requestAnimationFrame(update);
}

function createPixelData() {
    for (let i = 0; i < L; i++) {
        const pixel = new Pixel(i);
        pixels.push(pixel);
    }
}

function activation(x) {
    return x;
}

function activationInvGaussian(x) {
    return -1.0 / (0.89 * Math.pow(x, 2.0) + 1.0) + 1.0;
}

function activationInvGaussian2(x) {
    return -1.0 / Math.pow(2.0, (0.6 * Math.pow(x, 2.0))) + 1.0;
}

function activationWolfram(x) {
    if (x == 1.0 || x == 2.0 || x == 3.0 || x == 4.0) {
        return 1.0;
    }
    return 0.0;
}

function activationConway(x) {
    if (x == 3.0 || x == 11.0 || x == 12.0) {
        return 1.0;
    }
    return 0.0;
}

function restart() {
    board = initializeBoard(board);
}

function findLiveCells() {
    var cells = new Set();
    for (var i = 0; i < L; i++) {
        if (board[i] == 1) {
            cells.add(i);
        }
    }
    return cells;
}

function initializeBoard(board) {
    for (let i = 0; i < L; i++) {
        board[i] = (Math.random() * 10 << 0) / 10;
    }
    return board;
}

function sumOfNeighbors(i) {
    let pixel = pixels[i];
    let matrix = app.matrix;
    let sum = prevBoard[pixel.upLeft] * matrix[0];
    sum += prevBoard[pixel.up] * matrix[1];
    sum += prevBoard[pixel.upRight] * matrix[2];
    sum += prevBoard[pixel.left] * matrix[3];
    sum += prevBoard[i] * matrix[4];
    sum += prevBoard[pixel.downLeft] * matrix[6];
    sum += prevBoard[pixel.right] * matrix[5];
    sum += prevBoard[pixel.down] * matrix[7];
    sum += prevBoard[pixel.downRight] * matrix[8];
    return sum;
}

function evaluate_cell(i) {
    let liveNeighbors = sumOfNeighbors(i);
    let a = app.activation(liveNeighbors);
    if (isNaN(a)) {
        return 0;
    }
    if (a > 1.0) {
        return 1;
    } else if (a < 0.0) {
        return 0;
    } else {
        return a;
    }
}

function copyBoard() {
    prevBoard = board.slice();
}

function evaluateBoard() {
    copyBoard();
    for (let i = 0; i < L; i++) {
        let n = evaluate_cell(i);
        board[i] = n;
    }
}

function drawBoardImage() {
    for (let i = 0; i < imageData.length; i += 4) {
        let _i = parseInt(i / 4);
        let a = board[_i] * 255 << 0;
        imageData[i + 0] = color[0];
        imageData[i + 1] = color[1];
        imageData[i + 2] = color[2];
        imageData[i + 3] = a;
    }
    ctx.putImageData(image, 0, 0);
}

function getCoordinateX(index) {
    return index % boardX * cellSize;
}

function getCoordinateY(index) {
    return Math.floor(index / boardX) * cellSize;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getRandomFloat() {
    return Math.random();
}

function canvasToGrid(x, y) {
    const [w, h] = demo.gridSize;
    const gridX = Math.floor(x / canvas.clientWidth * w);
    const gridY = Math.floor(y / canvas.clientHeight * h);
    return [gridX, gridY];
}

function getMousePos(e) {
    return canvasToGrid(e.offsetX, e.offsetY);
}

function getLocalBoardState() {
    var local = localStorage.getItem('boardState');
    if (local == null) {
        var randomNumbers = [];
        for (let i = 0; i < L; i++) {
            randomNumbers.push(getRandomInt(0, 2));
        }
        localStorage.setItem('boardState', randomNumbers);
        return randomNumbers;
    } else {
        local = local.split(',');
        const size = local.length;
        var arr = [];
        for (let i = 0; i < size; i++) {
            arr.push(parseInt(local[i]));
        }
        return arr;
    }
}
