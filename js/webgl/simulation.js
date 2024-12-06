import { initWebGL } from './webgl_utils.js';

let cloth;
let vertexBuffer, indexBuffer;
let indexCount;

export function initializeSimulation(gl, clothWidth, clothHeight, spacing) {
    // Initialize cloth object
    cloth = new Cloth(clothWidth, clothHeight, spacing);

    // Prepare vertex and index buffers for rendering
    setupBuffers(gl);
}

function setupBuffers(gl) {
    const vertices = [];
    const indices = [];
    const width = cloth.points[cloth.points.length - 1].position[0]; // Approx width
    const height = cloth.points[cloth.points.length - 1].position[1]; // Approx height

    // Populate vertex positions (initial positions of the cloth points)
    cloth.points.forEach((point) => {
        vertices.push(...point.position);
    });

    // Populate indices for cloth triangles
    const gridWidth = Math.sqrt(cloth.points.length) - 1; // Number of points per row
    for (let y = 0; y < clothHeight; y++) {
        for (let x = 0; x < clothWidth; x++) {
            const topLeft = y * (clothWidth + 1) + x;
            const topRight = topLeft + 1;
            const bottomLeft = topLeft + (clothWidth + 1);
            const bottomRight = bottomLeft + 1;

            // Two triangles per grid square
            indices.push(topLeft, bottomLeft, topRight);
            indices.push(topRight, bottomLeft, bottomRight);
        }
    }
    indexCount = indices.length;

    // Create and bind vertex buffer
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    // Create and bind index buffer
    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
}

export function updateSimulation(gl) {
    // Step 1: Update Physics
    updatePhysics();

    // Step 2: Upload updated positions to GPU
    uploadVerticesToGPU(gl);

    // Step 3: Render the scene
    renderScene(gl);
}

function updatePhysics() {
    // Apply gravity
    const GRAVITY = [0, -9.8, 0];
    cloth.points.forEach((point) => {
        if (!point.pinned) {
            point.applyForce(GRAVITY);
        }
    });

    // Update and resolve constraints
    const deltaTime = 1 / 60; // Assume 60 FPS
    cloth.update(deltaTime);
}

function uploadVerticesToGPU(gl) {
    const vertices = [];
    cloth.points.forEach((point) => {
        vertices.push(...point.position);
    });

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(vertices));
}

function renderScene(gl) {
    // Clear the screen
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Bind buffers and draw
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // Assume a simple shader with position as an attribute
    const positionLocation = gl.getAttribLocation(gl.program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    // Draw cloth using element indices
    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
}
