// js/main.js

const canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    console.error('WebGL not supported');
    alert('WebGL not supported');
}

gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

const vertexShaderSource = `
    attribute vec4 a_position;
    void main(void) {
        gl_Position = a_position;
    }
`;

const fragmentShaderSource = `
    void main(void) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); 
    }
`;

function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:',
        gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vertexShader = compileShader(gl, 
vertexShaderSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(gl,
fragmentShaderSource, gl.FRAGMENT_SHADER);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
}

gl.useProgram(program);

const vertices = new Float32Array([
    0.0, 1.0, 0.0,
    -1.0, -1.0, 0.0,
    1.0, -1.0, 0.0
]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 3);