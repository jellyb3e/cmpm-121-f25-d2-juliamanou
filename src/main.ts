import "./style.css";
type Point = { x: number; y: number };
interface Command {
  execute(): void;
}

class LineCommand implements Command {
  line: Point[];
  width: number;

  constructor(first: Point, width: number) {
    this.line = [first];
    this.width = width;
  }

  drag(point: Point) {
    this.line.push(point);
  }

  execute() {
    if (!ctx) return;
    if (this.line.length > 0) {
      const [first, ...rest] = this.line;
      ctx.beginPath();
      if (first) ctx.moveTo(first.x, first.y);
      for (const point of rest) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.lineWidth = this.width;
      ctx.stroke();
    }
  }
}

class CursorCommand implements Command {
  cursor: Point;

  constructor(point: Point) {
    this.cursor = point;
  }
  execute() {
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(this.cursor.x, this.cursor.y, lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  }
}

const commands: LineCommand[] = [];
const redoCommands: LineCommand[] = [];
let currentCommand: LineCommand | null = null;
let cursorCommand: CursorCommand | null = null;

const thin: number = 1;
const thick: number = 3;
let lineWidth = thin;

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;

document.body.innerHTML = `
  <h1>doodlin' pad</h1>
`;
document.body.append(canvas);

const ctx = canvas.getContext("2d");

const bus = new EventTarget();
bus.addEventListener("drawing-changed", redraw);
bus.addEventListener("tool-changed", redraw);

canvas.addEventListener("mouseout", () => {
  cursorCommand = null;
  notify("tool-changed");
});

canvas.addEventListener("mouseenter", (e) => {
  cursorCommand = new CursorCommand({ x: e.offsetX, y: e.offsetY });
  notify("tool-changed");
});

canvas.addEventListener("mousedown", (e) => {
  currentCommand = new LineCommand({ x: e.offsetX, y: e.offsetY }, lineWidth);
  commands.push(currentCommand);
  redoCommands.splice(0, redoCommands.length);
  notify("drawing-changed");
});

canvas.addEventListener("mousemove", (e) => {
  cursorCommand = new CursorCommand({ x: e.offsetX, y: e.offsetY });
  notify("tool-changed");

  if (e.buttons == 1) {
    if (currentCommand) currentCommand.drag({ x: e.offsetX, y: e.offsetY });
    notify("drawing-changed");
  }
});

canvas.addEventListener("mouseup", () => {
  currentCommand = null;
  notify("drawing-changed");
});

document.body.append(document.createElement("br"));
const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
document.body.append(clearButton);

clearButton.addEventListener("click", () => {
  commands.splice(0, commands.length);
  notify("drawing-changed");
});

function redraw() {
  console.log("redrawing");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  commands.forEach((cmd) => cmd.execute());
  if (cursorCommand) cursorCommand.execute();
}

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
document.body.append(undoButton);

undoButton.addEventListener("click", () => {
  if (commands.length > 0) {
    const line = commands.pop();
    if (line) redoCommands.push(line);
    notify("drawing-changed");
  }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
document.body.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoCommands.length > 0) {
    const line = redoCommands.pop();
    if (line) commands.push(line);
    notify("drawing-changed");
  }
});

document.body.append(document.createElement("br"));
const thickButton = document.createElement("button");
const thinButton = document.createElement("button");
thinButton.setAttribute("disabled", "true");

thickButton.innerHTML = "THICK";
thinButton.innerHTML = "thin";

document.body.append(thinButton);
document.body.append(thickButton);

thickButton.addEventListener("click", () => {
  lineWidth = thick;
  thinButton.removeAttribute("disabled");
  thickButton.setAttribute("disabled", "true");
});

thinButton.addEventListener("click", () => {
  lineWidth = thin;
  thickButton.removeAttribute("disabled");
  thinButton.setAttribute("disabled", "true");
});
