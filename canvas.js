import { checkParticleType } from "./particles.js";
import { getRandomInt } from "./util.js";

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext("2d");

// Setup sliders
const speedSlider = document.getElementById("speedRange");
const speedOutput = document.getElementById("speed");
const brushSlider = document.getElementById("brushRange");
const brushOutput = document.getElementById("brushSize");

// When you change a slider value it updates its corresponding label
speedOutput.innerHTML = speedSlider.value;
speedSlider.oninput = function() {
    speedOutput.innerHTML = this.value;
}
brushOutput.innerHTML = brushSlider.value;
brushSlider.oninput = function() {
    brushOutput.innerHTML = this.value;
}

// Setup clear button
const clearScreen = document.getElementById("clear-button");
clearScreen.addEventListener("click", () => {
    clearGrid();
});


// Canvas constants
const canvasHeight = canvas.height;
const canvasWidth = canvas.width;

const eachSize = 10;

const numberOfRows = Math.floor(canvasHeight/eachSize);
const numberOfColumns = Math.floor(canvasWidth/eachSize);

// Create particle grid
let grid = new Array(numberOfRows);
for(let i = 0; i < grid.length; i++){
    grid[i] = new Array(numberOfColumns);
}

/**
 * Gets a random location within the grid
 * 
 * @returns {{row: number, col: number}} coordinates
 */
export function getRandomLocation() {
    const row = getRandomInt(0, grid.length-1);
    const col = getRandomInt(0, grid[0].length-1);
    return {row, col};
}

/**
 * Gets the particle at (row, col)
 * 
 * @param {number} row 
 * @param {number} col 
 * @returns {Particle}
 */
export function getParticle(row, col) {
    // Check to make sure coordinates are valid
    if (!checkBounds(row, col)) {
        return null;
    }
    return grid[row][col];
}

/**
 * Sets the particle at (row, col)
 * 
 * @param {number} row 
 * @param {number} col 
 * @param {Particle} particle 
 * @returns 
 */
export function setParticle(row, col, particle) {
    // Check to make sure coordinates are valid
    if (!checkBounds(row, col)) {
        return;
    }
    grid[row][col] = particle;
}

/**
 * Creates a particle at the mouse position
 * 
 * @param {{clientX: number, clientY: number}} mousePosition 
 */
export function createParticle(mousePosition) {
    // Get the bounds of the canvas
    const rect = canvas.getBoundingClientRect();
    
    // Shift the mouse coordinates to be based on the canvas coordinates
    const y = mousePosition.clientY - rect.top;
    const x = mousePosition.clientX - rect.left;
    
    // Scale the coordinates to align with the grid
    const row = Math.floor(y / eachSize);
    const col = Math.floor(x / eachSize);
    
    // Get the particle type
    const particleType = document.getElementById("particle");
    const value = particleType.value;
    const brushSize = parseInt(brushSlider.value);
    
    const brushSpread = (row, col, size) => {
        if (!checkBounds(row, col)) {
            return;
        }
        // Create a new particle and assign it to (row, col)
        grid[row][col] = checkParticleType(value);

        // Recursion to make brush a circle (size is radius)
        if (size > 1) {
            size -= 1;
            brushSpread(row+1, col, size);
            brushSpread(row-1, col, size);
            brushSpread(row, col+1, size);
            brushSpread(row, col-1, size);
        }
    }

    // Recursive function that spreads out in a circle
    brushSpread(row, col, brushSize);
}

let isDragging = false;
let mousePosition = null;
/**
 * Get mouse position and if it is dragging
 * 
 * @returns {isDragging: boolean, mousePosition: {clientX: number, clientY: number}}
 */
export function getMouse() {
    return {isDragging, mousePosition};
}

/**
 * Register mouse listeners
 */
export function setUpMouseListeners() {
    canvas.addEventListener("mousedown", (event) => {
        isDragging = true;
        mousePosition = {clientX: event.clientX, clientY: event.clientY};
    });
    canvas.addEventListener("mousemove", (event) => {
        mousePosition = event;
    });
    canvas.addEventListener("mouseup", (event) => {
        isDragging = false;
    });
}

/**
 * Clears grid of all particles
 */
export function clearGrid() {
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[0].length; col++) {
            grid[row][col] = null;
        }
    }
}

/**
 * Make sure the (row, col) index exists within {@link grid}
 * 
 * @param {number} row 
 * @param {number} col 
 * @returns {boolean}
 */
export function checkBounds(row, col) {
    return row < grid.length && row >= 0 && col < grid[0].length && col >= 0;
}


/**
 * Tries to move a particle from (row, col) to (newRow, newCol)
 * Checks to make sure both coordinates are valid and that their
 * is no other particle in the way or the moving particle can
 * swap with it
 * 
 * @param {number} row 
 * @param {number} col 
 * @param {number} newRow 
 * @param {number} newCol 
 * @param {(Particle) => boolean} swap 
 * @returns {boolean} If the particle was moved or not
 */
export function moveParticle(row, col, newRow, newCol, swap) {
    if (!checkBounds(row, col) || !checkBounds(newRow, newCol)) {
        return false;
    }
   if (getParticle(newRow, newCol)) {
        // 👇 Add this check and swap logic 👇
        if (swap && swap(getParticle(newRow, newCol))) {
            const temp = grid[newRow][newCol];
            grid[newRow][newCol] = grid[row][col];
            grid[row][col] = temp;
            return true;
        }
        else {
            return false;
        }
        // 👆 Add this check and swap logic 👆
    }
    grid[newRow][newCol] = grid[row][col];
    grid[row][col] = null;
    return true;
}

/**
 * Draws all particles
 */
export function redraw() {
    // Clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Loop through all elements in the grid
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[0].length; col++) {
            // TODO draw particles to screen
            const particle = grid[row][col];

            if (particle) {
                // Get particle color
                ctx.fillStyle = particle.color;
                // Draw particle (multiple by eachSize to scale it from grid coordinates to pixels)
                ctx.fillRect(col * eachSize, row * eachSize, eachSize, eachSize);
            }
        }
    }
}