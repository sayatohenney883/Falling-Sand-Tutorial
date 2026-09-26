import { checkBounds, moveParticle, getParticle, setParticle } from "./canvas.js";
import { getRandomInt } from "./util.js";

/**
 * Base particle class
 */
class Particle {
    constructor() {
        this.color = "";
        this.type = "";
    }

    /**
     * Returns true if the particle should swap with other when trying
     * to move onto the same grid location as {@link other}.
     * 
     * EX: Let sand sink below water
     * 
     * @param {Particle} other 
     * @returns {boolean} Should the particle swap
     */
    swap(other) {
        return false;
    }

    /**
     * Update the particle at location (row, col)
     * 
     * @param {number} row 
     * @param {number} col 
     */
    update(row, col) {
    }
}

/**
 * Sand particle
 */
export class Sand extends Particle {
    constructor() {
        super();
        this.color = "orange";
        this.type = "sand";
    }

    swap(other) {
        // Make sand fall below water
        return other.type == "water";
    }

    update(row, col) {
    // Fall due to gravity
    let newRow = row + 1;

    // If nothing below move down
    if (!moveParticle(row, col, newRow, col)) {
        // Try to move left
        if (!moveParticle(row, col, newRow, col-1, this.swap)) {
            moveParticle(row, col, newRow, col+1, this.swap)
        }
    }
}
}
/**
 * Water particle
 */
export class Water extends Particle {
    constructor() {
        super();
        this.color = "blue";
        this.type = "water";
    }

    update(row, col) {
        // 👇 Put the following code here 👇
        // Make water turn dirt into grass when it touches it
        if (getParticle(row+1, col)?.type == "dirt") {
            // Remove water and change dirt to grass
            setParticle(row+1, col, new Grass());
            setParticle(row, col, null);
            return;
        }
        // Try to move down
        if (getRandomInt(0, 2) && !getParticle(row+1, col)) {
            moveParticle(row, col, row+1, col, super.swap);
        } 
        
        // Move left or right
        if (getRandomInt(0, 1) && !getParticle(row, col+1)) {
            moveParticle(row, col, row, col+1, super.swap);
        }
        else if (!getParticle(row, col-1)) {
            moveParticle(row, col, row, col-1, super.swap);
        }
        // Move diagonally down left or right
        if (getRandomInt(0, 2) && !getParticle(row+1, col+1)) {
            moveParticle(row, col, row+1, col+1, super.swap);
        }
        else if (getRandomInt(0, 2) && !getParticle(row+1, col-1)) {
            moveParticle(row, col, row+1, col-1, super.swap);
        }

        // Move upwards with a small chance
        if (getRandomInt(0,2) && !getParticle(row, col-1)) {
            moveParticle(row, col, row, col-1, super.swap);
        }
        // Teleport to a random location with a very small chance
        if (getRandomInt(0, 100) == 0) {
            let newRow = getRandomInt(0, grid.length-1);
            let newCol = getRandomInt(0, grid[0].length-1);
            if (!getParticle(newRow, newCol)) {
                moveParticle(row, col, newRow, newCol, super.swap);
            }
        }
    }
}

export class Stone extends Particle {
    constructor() {
        super();
        this.color = "gray";
        this.type = "stone";
    }
}
export class Dirt extends Sand{
    constructor() {
        super();
        this.color = "brown";
        this.type = "dirt";
    }
}
export class Grass extends Sand{
    constructor() {
        super();
        this.color = "green";
        this.type = "grass";
    }
}
/**
 * Fire particle
 *
 * Rises like water (mirrored gravity), burns out after maxDuration ticks,
 * spreads to adjacent flammable particles (currently Wood), and is
 * extinguished into Steam if it touches Water.
 */
export class Fire extends Particle {
    constructor() {
        super();
        this.color = "red";
        this.type = "fire";
        this.duration = 0;
        this.maxDuration = 60 + getRandomInt(0, 40);
    }
 
    update(row, col) {
        this.duration++;
 
        const neighbors = [
            [row - 1, col], [row + 1, col],
            [row, col - 1], [row, col + 1]
        ];
 
        for (const [nRow, nCol] of neighbors) {
            const neighbor = getParticle(nRow, nCol);
            if (!neighbor) continue;
 
            // Spread fire to flammable neighbors
            if (neighbor.type == "wood" && typeof neighbor.ignite == "function") {
                neighbor.ignite(nRow, nCol);
            }
 
            // Water extinguishes fire, producing steam
            if (neighbor.type == "water" && getRandomInt(0, 3) == 0) {
                setParticle(row, col, new Steam());
                setParticle(nRow, nCol, null);
                return;
            }
        }
 
        // Burn out over time
        if (this.duration >= this.maxDuration) {
            if (getRandomInt(0, 1)) {
                setParticle(row, col, null);
            }
            return;
        }
 
        // Rise upward, mirroring water's downward gravity
        if (getRandomInt(0, 2) && !getParticle(row - 1, col)) {
            moveParticle(row, col, row - 1, col, this.swap);
        }
 
        // Move left or right
        if (getRandomInt(0, 1) && !getParticle(row, col + 1)) {
            moveParticle(row, col, row, col + 1, this.swap);
        }
        else if (!getParticle(row, col - 1)) {
            moveParticle(row, col, row, col - 1, this.swap);
        }
 
        // Move diagonally up-left or up-right
        if (getRandomInt(0, 2) && !getParticle(row - 1, col + 1)) {
            moveParticle(row, col, row - 1, col + 1, this.swap);
        }
        else if (getRandomInt(0, 2) && !getParticle(row - 1, col - 1)) {
            moveParticle(row, col, row - 1, col - 1, this.swap);
        }
    }
}

/**
 * Wood particle
 *
 * Static like Stone. Absorbs adjacent water into a wetness counter,
 * which makes it harder (and slower) for fire to ignite it.
 */
export class Wood extends Particle {
    constructor() {
        super();
        this.color = "saddlebrown";
        this.type = "wood";
        this.wetness = 0;
        this.maxWetness = 5;
        this.burnChance = 8; // 1-in-N chance to ignite per fire-neighbor tick
    }
 
    update(row, col) {
        const neighbors = [
            [row - 1, col], [row + 1, col],
            [row, col - 1], [row, col + 1]
        ];
 
        // Absorb adjacent water, becoming more fire-resistant
        for (const [nRow, nCol] of neighbors) {
            const neighbor = getParticle(nRow, nCol);
            if (neighbor?.type == "water" && this.wetness < this.maxWetness && getRandomInt(0, 2) == 0) {
                this.wetness++;
                setParticle(nRow, nCol, null);
                break;
            }
        }
    }
 
    /**
     * Called by an adjacent Fire particle each tick it's touching this wood.
     */
    ignite(row, col) {
        if (this.wetness > 0) {
            // Wet wood resists burning; the fire dries it out instead
            if (getRandomInt(0, 3) == 0) {
                this.wetness--;
            }
            return;
        }
 
        if (getRandomInt(0, this.burnChance) == 0) {
            setParticle(row, col, new Fire());
        }
    }
}

/**
 * Steam particle
 *
 * Rises like water (mirrored gravity), has a small chance to dissipate
 * each tick, and condenses back into Water once it reaches the top row.
 */
export class Steam extends Particle {
    constructor() {
        super();
        this.color = "lightgray";
        this.type = "steam";
    }
 
    update(row, col) {
        // Small chance to dissipate entirely
        if (getRandomInt(0, 200) == 0) {
            setParticle(row, col, null);
            return;
        }
 
        // Condense back into water once it reaches the top
        if (row == 0 && getRandomInt(0, 10) == 0) {
            setParticle(row, col, new Water());
            return;
        }
 
        // Rise upward, mirroring water's downward gravity
        if (getRandomInt(0, 2) && !getParticle(row - 1, col)) {
            moveParticle(row, col, row - 1, col, this.swap);
        }
 
        // Move left or right
        if (getRandomInt(0, 1) && !getParticle(row, col + 1)) {
            moveParticle(row, col, row, col + 1, this.swap);
        }
        else if (!getParticle(row, col - 1)) {
            moveParticle(row, col, row, col - 1, this.swap);
        }
 
        // Move diagonally up-left or up-right
        if (getRandomInt(0, 2) && !getParticle(row - 1, col + 1)) {
            moveParticle(row, col, row - 1, col + 1, this.swap);
        }
        else if (getRandomInt(0, 2) && !getParticle(row - 1, col - 1)) {
            moveParticle(row, col, row - 1, col - 1, this.swap);
        }
    }
}
/**
 * Create particle based on dropdown name
 * 
 * @param {string} value 
 * @returns 
 */
export function checkParticleType(value) {
    if (value == "Sand") {
        return new Sand();
    } 
    // TODO create new particles
    if (value == "Water") {
        return new Water();
    }
    if (value == "Stone") {
        return new Stone();
    }
    if (value == "Dirt") {
        return new Dirt();
    }
    if (value == "Fire") {
        return new Fire();
    }
    if (value == "Wood") {
        return new Wood();
    }
    if (value == "Steam") {
        return new Steam();
    }
}
