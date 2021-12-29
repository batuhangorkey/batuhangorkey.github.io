// jshint esversion: 6
var canvas = document.getElementById("conway");
var lastX = 0;
var lastY = 0;
canvas.addEventListener('wheel', (e) => zoom(e));
canvas.addEventListener('mousemove', function (event) {
    lastX = event.offsetX || (event.pageX - canvas.offsetLeft);
    lastY = event.offsetY || (event.pageY - canvas.offsetTop);
});
var ctx = canvas.getContext("2d");
var width = window.innerWidth;
var height = window.innerHeight;
canvas.width = width;
canvas.height = height;
var cellSize = 2;
var boardX = parseInt(width / cellSize);
var boardY = parseInt(height / cellSize);
var board = initialize_board();
var prevBoard;
var factor = 1.0;
var scaleFactor = 1.1;
var zoomCounter = 0;
ctx.fillStyle = "#000000";
ctx.fillRect(0, 0, width, height);
var matrix = [
    1, 1, 1,
    1, 9, 1,
    1, 1, 1
];
var liveCells = find_live_cells();
var prevLiveCells = new Set(liveCells);
var dead_cells = new Set();
var revive_cells = new Set(liveCells);
draw_board();
update();

function update() {
    evaluate_board();
    draw_board();
    requestAnimationFrame(update);
}

function zoom(event) {
    event.preventDefault();
    ctx.translate(lastX, lastY);
    factor = Math.pow(scaleFactor, event.deltaY * 0.003);
    ctx.scale(factor, factor);
    ctx.translate(-lastX, -lastY);
    // ctx.save();
    // ctx.setTransform(1, 0, 0, 1, 0, 0);
    // ctx.fillStyle = "rgba(0, 0, 0, 1)";
    // ctx.fillRect(0, 0, width, height);
    // ctx.restore();
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

function find_live_cells() {
    var cells = new Set();
    for (var i = 0; i < board.length; i++) {
        if (board[i] == 1) {
            cells.add(i);
        }
    }
    return cells;
}

function initialize_board() {
    var board = new Array(boardX * boardY);
    for (var i = 0; i < board.length; i++) {
        board[i] = getRandomInt(0, 2);
    }
    return board;
}

function evaluate_cell(i) {

}

function evaluate_board() {
    prevBoard = board.slice();
    const L = board.length;
    for (var i = 0; i < L; i++) {
        const e = board[i];
        const rightWrap = (i + 1) % boardX != 0 ? 1 : 1 - boardX;
        const leftWrap = (i % boardX) != 0 ? -1 : boardX - 1;
        const up = (i > boardX) ? i - boardX : i + (board.length - boardX);
        const right = i + rightWrap;
        const down = (i + boardX) < (board.length) ? i + boardX : i % boardX;
        const left = i + leftWrap;
        const upRight = up + rightWrap;
        const upLeft = up + leftWrap;
        const downRight = down + rightWrap;
        const downLeft = down + leftWrap;
        const liveNeighbors = prevBoard[up] + prevBoard[right] + prevBoard[down] + prevBoard[left] +
            prevBoard[upRight] + prevBoard[upLeft] + prevBoard[downRight] + prevBoard[downLeft];
        if (liveNeighbors > 3 && e == 1) {
            board[i] = 0;
            dead_cells.add(i);
        } else if (liveNeighbors < 2 && e == 1) {
            board[i] = 0;
            dead_cells.add(i);
        } else if (liveNeighbors == 3 && e == 0) {
            board[i] = 1;
            revive_cells.add(i);
        }
    }
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

function draw_board() {
    const a = 1;
    var item;
    ctx.fillStyle = `rgba(0, 0, 0, ${a})`;
    for (item of dead_cells) {
        const x = getCoordinateX(item);
        const y = getCoordinateY(item);
        ctx.fillRect(x, y, cellSize, cellSize);
    }
    ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
    for (item of revive_cells) {
        const e = item;
        const x = e % boardX * cellSize;
        const y = Math.floor(e / boardX) * cellSize;
        ctx.fillRect(x, y, cellSize, cellSize);
    }
    dead_cells.clear();
    revive_cells.clear();
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
