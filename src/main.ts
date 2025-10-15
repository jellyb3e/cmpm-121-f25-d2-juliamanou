import "./style.css";

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;

document.body.innerHTML = `
  <h1>doodlin' pad</h1>
`;
document.body.append(canvas);
