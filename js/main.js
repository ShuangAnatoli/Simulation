// Set up WebGL and shaders to draw a grid of vertices connected by lines
function initializeWebGL(canvas) {
    const gl = canvas.getContext('webgl');
    if (!gl) {
        alert('WebGL not supported');
        return null;
    }
    return gl;
}

// Vertex Shader
const vertexShaderSource = `
    attribute vec4 a_position;
    void main() {
        gl_Position = a_position;
    }
`;

// Fragment Shader (simple, no color changes needed)
const fragmentShaderSource = `
    precision mediump float;
    void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);  // White color for lines
    }
`;

// Function to compile a shader
function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("ERROR compiling shader:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// Function to create and link a shader program
function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("ERROR linking program:", gl.getProgramInfoLog(program));
        return null;
    }

    gl.useProgram(program);
    return program;
}

// Cloth simulation constants
const clothWidth = 10;
const clothHeight = 10;
const spacing = 0.1;  // Space between vertices (also the spring length)
const gravity = 0.0001;  // Gravity force applied to the masses
const springConstant = 0.1;  // Spring constant (tension)
const damping = 0.99;  // Damping factor (to reduce oscillations)

// Physics objects
let vertices = [];
let springs = [];
let velocities = [];
let forces = [];
let positions = [];
let vertexBuffer;  // Define vertexBuffer here

// Function to initialize cloth simulation (mass-spring system)
function initializeClothSimulation() {
    // Initialize vertices, springs, and other parameters
    for (let y = 0; y < clothHeight; y++) {
        for (let x = 0; x < clothWidth; x++) {
            // Each vertex is represented by a position and velocity
            let px = x * spacing - (clothWidth * spacing) / 2;
            let py = y * spacing - (clothHeight * spacing) / 2;
            vertices.push([px, py]);

            // Initially, no velocity
            velocities.push([0, 0]);

            // Initially, no forces
            forces.push([0, 0]);

            // The position array stores the position of each vertex
            positions.push([px, py]);

            // Connect adjacent vertices with springs (horizontal and vertical connections)
            if (x < clothWidth - 1) {
                springs.push({ from: y * clothWidth + x, to: y * clothWidth + x + 1, length: spacing });
            }
            if (y < clothHeight - 1) {
                springs.push({ from: y * clothWidth + x, to: (y + 1) * clothWidth + x, length: spacing });
            }
        }
    }
}

// Function to apply forces like gravity to the vertices
function applyForces() {
    for (let i = 0; i < vertices.length; i++) {
        // Skip pinned vertices (top-left and top-right)
        if (i === 0 || i === clothWidth - 1) {
            continue;  // Skip force application for pinned vertices
        }
        forces[i][1] -= gravity;  // Apply gravity force in the Y direction
}}

// Function to update physics (update positions, velocities, etc.)
function updatePhysics() {
    // Apply forces
    applyForces();

    // Update velocities based on forces and damping
    for (let i = 0; i < velocities.length; i++) {

        if (i === 0 || i === clothWidth - 1) {
            velocities[i][0] = 0;  // No X velocity for pinned vertices
            velocities[i][1] = 0;  // No Y velocity for pinned vertices
            continue;  // Skip velocity update for pinned vertices
        }

        velocities[i][0] += forces[i][0];  // Update X velocity
        velocities[i][1] += forces[i][1];  // Update Y velocity

        velocities[i][0] *= damping;  // Apply damping
        velocities[i][1] *= damping;  // Apply damping
    }

    // Update positions based on velocities
    for (let i = 0; i < positions.length; i++) {
        if (i === 0 || i === clothWidth - 1) {
            continue;  // Skip position update for pinned vertices
        }

        positions[i][0] += velocities[i][0];  // Update X position
        positions[i][1] += velocities[i][1];  // Update Y position
    }

    // Resolve spring forces (apply spring physics)
    resolveSprings();

    // Reset forces for the next simulation step
    for (let i = 0; i < forces.length; i++) {
        forces[i][0] = 0;
        forces[i][1] = 0;
    }
}

// Function to resolve spring forces (Hooke's Law)
function resolveSprings() {
    for (let i = 0; i < springs.length; i++) {
        const spring = springs[i];
        const p1 = positions[spring.from];
        const p2 = positions[spring.to];

        // Calculate the distance between the two vertices connected by this spring
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const distance = Math.sqrt(dx * dx + dy * dy);
        const forceMagnitude = (distance - spring.length) * springConstant;  // Hooke's law

        // Normalize the direction of the spring force
        const fx = (dx / distance) * forceMagnitude;
        const fy = (dy / distance) * forceMagnitude;

        // Apply the forces to the vertices
        forces[spring.from][0] += fx;
        forces[spring.from][1] += fy;

        forces[spring.to][0] -= fx;
        forces[spring.to][1] -= fy;
    }
}

// Function to set up the vertices for drawing in WebGL
function setupVertices() {
    const vertexArray = [];
    for (let i = 0; i < positions.length; i++) {
        vertexArray.push(positions[i][0], positions[i][1]);
    }

    return new Float32Array(vertexArray);
}

// Function to draw the scene
function drawScene(gl, positions, indexBuffer, indexCount) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black
    gl.clear(gl.COLOR_BUFFER_BIT);

    const vertexArray = setupVertices();  // Get updated vertex positions

    // If the vertex buffer hasn't been created yet, create it
    if (!vertexBuffer) {
        vertexBuffer = gl.createBuffer();
    }

    // Update the vertex buffer with new positions
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);

    // Get the attribute location for a_position
    const positionLocation = gl.getAttribLocation(gl.program, "a_position");

    // Enable the attribute
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    // Draw the lines connecting the grid vertices (cloth simulation)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.LINES, indexCount, gl.UNSIGNED_SHORT, 0);
}

// Main function to initialize everything
function main() {
    const canvas = document.getElementById('webgl-canvas');
    const gl = initializeWebGL(canvas);
    if (!gl) return;

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program) return;

    gl.program = program;  // Attach program to WebGL context

    initializeClothSimulation();  // Initialize the cloth simulation

    const indexBuffer = setupIndexBuffer(gl);
    const indexCount = springs.length * 2;

    function updateAndDraw() {
        updatePhysics();  // Update the physics (apply forces, resolve springs, update positions)
        drawScene(gl, positions, indexBuffer, indexCount);  // Draw the updated scene

        requestAnimationFrame(updateAndDraw);  // Call the function repeatedly
    }

    updateAndDraw();  // Start the animation loop
}

// Function to set up the index buffer (line connections between vertices)
function setupIndexBuffer(gl) {
    const indices = [];
    for (let i = 0; i < springs.length; i++) {
        indices.push(springs[i].from);
        indices.push(springs[i].to);
    }

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    return indexBuffer;
}

// Start the simulation
window.onload = main;
