import "./style.css";
type Point = { x: number; y: number };
interface Command {
  display(ctx: CanvasRenderingContext2D): void;
}

class LineCommand implements Command {
  line: Point[];
  width: number;

  constructor(first: Point, width: number) {
    this.line = [first];
    this.width = width;
  }

  drag(point: Point) {
    console.log("adding point to line");
    this.line.push(point);
  }

  display(ctx: CanvasRenderingContext2D) {
    console.log("Drawing line with points:", this.line);
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

const commands: LineCommand[] = [];
const redoCommands: LineCommand[] = [];
let currentCommand: LineCommand | null = null;

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
const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("drawing-changed", redraw);

canvas.addEventListener("mousedown", (e) => {
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  currentCommand = new LineCommand({ x: cursor.x, y: cursor.y }, lineWidth);
  commands.push(currentCommand);
  notify("drawing-changed");
});

canvas.addEventListener("mousemove", (e) => {
  if (ctx && cursor.active && currentCommand) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    currentCommand.drag({ x: cursor.x, y: cursor.y });

    notify("drawing-changed");
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
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
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const command of commands) {
      command.display(ctx);
    }
  }
}

function notify(name: string) {
  canvas.dispatchEvent(new Event(name));
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
