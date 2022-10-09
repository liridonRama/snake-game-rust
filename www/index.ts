import init, { World, Direction, GameStatus } from 'snake_game';
import { rnd } from './utils/rnd';

const CELL_SIZE = 25;
const WORLD_WIDTH = 4;
const SNAKE_SPAWN_IDX = rnd(Math.pow(WORLD_WIDTH, 2));
const FPS = 5;
const CANVAS_NAME = 'snake-canvas';

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

const gameControlBtn = document.getElementById("game-control-btn") as HTMLButtonElement;
const gameControlStatus = document.getElementById("game-status") as HTMLButtonElement;
const gamePoints = document.getElementById("game-points") as HTMLDivElement;
gameControlBtn.addEventListener("click", () => {
  const gameStatus = world.game_status();

  if (gameStatus === undefined) {
    world.start_game();
    play();
    gameControlBtn.innerText = "Playing..."
  } else {
    location.reload();
  }

});

let world: World | undefined;
let wasmMemory: WebAssembly.Memory | undefined;

document.getElementById(CANVAS_NAME).appendChild(canvas);

document.addEventListener("keydown", (e) => {
  if (!world) {
    return;
  }

  switch (e.code) {
    case "ArrowUp":
      return world.change_snake_dir(Direction.Up);
    case "ArrowRight":
      return world.change_snake_dir(Direction.Right);
    case "ArrowDown":
      return world.change_snake_dir(Direction.Down);
    case "ArrowLeft":
      return world.change_snake_dir(Direction.Left);
  }
});

init().then(wasm => {
  world = World.new(WORLD_WIDTH, SNAKE_SPAWN_IDX);
  wasmMemory = wasm.memory;

  canvas.height = world.width() * CELL_SIZE;
  canvas.width = world.width() * CELL_SIZE;

  paint();
});

function drawGameStatus() {
  gameControlStatus.textContent = world.game_status_text();
  gamePoints.textContent = world.points() + '';
}

function play() {
  const status = world.game_status();
  if (status == GameStatus.Won || status == GameStatus.Lost) {
    gameControlBtn.textContent = "Replay";
    return;
  }

  setTimeout(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    world.step();
    paint();

    requestAnimationFrame(play);
  }, 1000 / FPS);
}

function paint() {
  drawWorld();
  drawSnake();
  drawReward();
  drawGameStatus();
}

function drawWorld() {
  ctx.beginPath();

  for (let x = 0; x <= world.width(); x++) {
    ctx.moveTo(CELL_SIZE * x, 0);
    ctx.lineTo(CELL_SIZE * x, world.width() * CELL_SIZE);
  }

  for (let y = 0; y <= world.width(); y++) {
    ctx.moveTo(0, CELL_SIZE * y);
    ctx.lineTo(world.width() * CELL_SIZE, CELL_SIZE * y);
  }

  ctx.stroke();
}


function drawReward() {
  const idx = world.reward_cell();

  const col = idx % world.width();
  const row = Math.floor(idx / world.width());

  ctx.beginPath();
  ctx.fillStyle = "#FF0000";
  ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  ctx.stroke();

  if (idx == Math.pow(world.width(), 2) + 1) {
    alert("You Won!")
  }
}

function drawSnake() {
  if (!wasmMemory) {
    return;
  }

  const snakeCells = new Uint32Array(
    wasmMemory.buffer,
    world.snake_cells(),
    world.snake_length()
  );

  snakeCells.slice().reverse().forEach((cellIdx, i) => {
    const col = cellIdx % world.width();
    const row = Math.floor(cellIdx / world.width());



    if (i === 0) {
      ctx.fillStyle = "#7878db";
    }

    ctx.fillStyle = i === snakeCells.length - 1 ? '#7878db' : '#000000';

    ctx.beginPath();

    ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  })

  ctx.stroke();
}
