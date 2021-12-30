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
var lastX = 0;
var lastY = 0;
canvas.addEventListener('wheel', (e) => zoom(e));
canvas.addEventListener('mousemove', function (event) {
    lastX = event.offsetX || (event.pageX - canvas.offsetLeft);
    lastY = event.offsetY || (event.pageY - canvas.offsetTop);
});
var ctx = canvas.getContext("2d");
const width = window.innerWidth;
const height = window.innerHeight;
canvas.width = width;
canvas.height = height;
const cellSize = 2;
const boardX = parseInt(width / cellSize);
const boardY = parseInt(height / cellSize);
const L = boardX * boardY;
var board = [];
var prevBoard = [];
var factor = 1.0;
const scaleFactor = 1.1;
var zoomCounter = 0;
const matrix = [
    1, 1, 1,
    1, 9, 1,
    1, 1, 1
];
var liveCells = new Set();
var prevLiveCells = new Set(liveCells);
var dead_cells = new Set();
var revive_cells = new Set(liveCells);
var pixels = [];
var activeArea = new Set();
var redraw = false;

start();
var frame = requestAnimationFrame(update);

function start() {
    board = initialize_board(board);
    liveCells = findLiveCells();
    revive_cells = new Set(liveCells);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    createPixelData();
}

function update() {
    draw_board();
    evaluate_board();
    frame = requestAnimationFrame(update);
}

function createPixelData() {
    for (let i = 0; i < L; i++) {
        const pixel = new Pixel(i);
        pixels.push(pixel);
    }
}

function zoom(event) {
    event.preventDefault();
    ctx.translate(lastX, lastY);
    factor = Math.pow(scaleFactor, event.deltaY * 0.003);
    ctx.scale(factor, factor);
    ctx.translate(-lastX, -lastY);
    redraw = true;
}

function activationConway(x) {
    if (x == 3.0 || x == 11.0 || x == 12.0) {
        return 1.0;
    }
    return 0.0;
}

function restart() {
    board = initialize_board();
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

function initialize_board(board) {
    for (let i = 0; i < L; i++) {
        board.push(getRandomInt(0, 2));
    }
    return board;
}

function evaluate_cell(i) {
    const e = board[i];
    const pixel = pixels[i];
    var liveNeighbors = prevBoard[pixel.up];
    liveNeighbors += prevBoard[pixel.right];
    liveNeighbors += prevBoard[pixel.down];
    liveNeighbors += prevBoard[pixel.left];
    liveNeighbors += prevBoard[pixel.upRight];
    liveNeighbors += prevBoard[pixel.upLeft];
    liveNeighbors += prevBoard[pixel.downRight];
    liveNeighbors += prevBoard[pixel.downLeft];
    liveNeighbors += prevBoard[i] * 9;
    return activationConway(liveNeighbors);
}

function copy_board() {
    prevBoard = board.slice();
}

function diff_board() {
    for (let item of dead_cells) {
        board[item] = 0;
    }
    for (let item of revive_cells) {
        board[item] = 1;
    }
}

function evaluate_board() {
    copy_board();
    for (let i = 0; i < L; i++) {
        const n = evaluate_cell(i);
        const o = prevBoard[i];
        if (o == 1 && n == 0) {
            board[i] = 0;
            dead_cells.add(i);
        } else if (o == 0 && n == 1) {
            board[i] = 1;
            revive_cells.add(i);
        }
    }
}

function draw_board() {
    const a = 1;
    if (redraw) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        redraw = false;
    }
    ctx.fillStyle = `rgba(0, 0, 0, ${a})`;
    for (let i of dead_cells) {
        const x = getCoordinateX(i);
        const y = getCoordinateY(i);
        ctx.fillRect(x, y, cellSize, cellSize);
    }
    ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
    for (let i of revive_cells) {
        const x = getCoordinateX(i);
        const y = getCoordinateY(i);
        ctx.fillRect(x, y, cellSize, cellSize);
    }
    dead_cells.clear();
    revive_cells.clear();
}

function difference(setA, setB) {
    let _difference = new Set(setA);
    for (let elem of setB) {
        _difference.delete(elem);
    }
    return _difference;
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
