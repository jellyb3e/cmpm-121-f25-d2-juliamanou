import "./style.css";
const thin: number = 1;
const thick: number = 3;

type Point = { x: number; y: number };
type Tool = { kind: "marker"; width: number } | {
  kind: "sticker";
  emoji: string;
};
let tool: Tool = { kind: "marker", width: thin };

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

class EmojiCommand implements Command {
  point: Point;
  text: string;
  rotation: number = 0;

  constructor(point: Point, text: string) {
    this.point = point;
    this.text = text;
  }

  drag(point: Point) {
    const dx = point.x - this.point.x;
    const dy = point.y - this.point.y;
    this.rotation = Math.atan2(dy, dx);
  }

  execute() {
    if (!ctx) return;
    ctx.save();
    ctx.translate(this.point.x, this.point.y);
    ctx.rotate(this.rotation);
    ctx.font = "32px monospace";
    ctx.fillText(this.text, -20, 0);
    ctx.restore();
  }
}

class CursorCommand implements Command {
  cursor: Point;

  constructor(point: Point) {
    this.cursor = point;
  }
  execute() {
    if (!ctx) return;
    if (tool.kind == "marker") {
      ctx.beginPath();
      ctx.arc(this.cursor.x, this.cursor.y, tool.width / 2, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    } else if (tool.kind == "sticker") {
      ctx.font = "32px monospace";
      ctx.fillText(tool.emoji, this.cursor.x - 20, this.cursor.y);
    }
  }
}

const commands: (LineCommand | EmojiCommand)[] = [];
const redoCommands: (LineCommand | EmojiCommand)[] = [];
let currentCommand: LineCommand | EmojiCommand | null = null;
let cursorCommand: CursorCommand | null = null;

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
  if (tool.kind == "marker") {
    currentCommand = new LineCommand(
      { x: e.offsetX, y: e.offsetY },
      tool.width,
    );
  } else if (tool.kind == "sticker") {
    currentCommand = new EmojiCommand(
      { x: e.offsetX, y: e.offsetY },
      tool.emoji,
    );
  }
  if (currentCommand) commands.push(currentCommand);
  redoCommands.splice(0, redoCommands.length);
  notify("drawing-changed");
});

canvas.addEventListener("mousemove", (e) => {
  if (e.buttons == 1) {
    if (currentCommand) currentCommand.drag({ x: e.offsetX, y: e.offsetY });
    notify("drawing-changed");
    cursorCommand = null;
  } else {
    cursorCommand = new CursorCommand({ x: e.offsetX, y: e.offsetY });
  }
  notify("tool-changed");
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
  tool = { kind: "marker", width: thick };
  thinButton.removeAttribute("disabled");
  thickButton.setAttribute("disabled", "true");
});

thinButton.addEventListener("click", () => {
  tool = { kind: "marker", width: thin };
  thickButton.removeAttribute("disabled");
  thinButton.setAttribute("disabled", "true");
});

document.body.append(document.createElement("br"));
const mooseEmojiButton = document.createElement("button");
const cheeseEmojiButton = document.createElement("button");
const chitmuntEmojiButton = document.createElement("button");
thinButton.setAttribute("disabled", "true");

mooseEmojiButton.innerHTML = "🫎";
cheeseEmojiButton.innerHTML = "🧀";
chitmuntEmojiButton.innerHTML = "🐿️";

document.body.append(mooseEmojiButton);
document.body.append(cheeseEmojiButton);
document.body.append(chitmuntEmojiButton);

mooseEmojiButton.addEventListener("click", () => {
  tool = { kind: "sticker", emoji: "🫎" };
  notify("tool-changed");
});

cheeseEmojiButton.addEventListener("click", () => {
  tool = { kind: "sticker", emoji: "🧀" };
  notify("tool-changed");
});

chitmuntEmojiButton.addEventListener("click", () => {
  tool = { kind: "sticker", emoji: "🐿️" };
  notify("tool-changed");
});
