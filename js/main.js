import { initWebGL } from './webgl/webgl_utils.js';
import { updateSimulation } from './webgl/simulation.js';

let gl, canvas;

function main() {
    canvas = document.getElementById('webgl-canvas');
    gl = initWebGL(canvas)
    if (!gl) return;

    initializeScene(gl);

    function loop() {
        updateSimulation(gl);
        requestAnimationFrame(loop);
    }
    loop();
}

main();
