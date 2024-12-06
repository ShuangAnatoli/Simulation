export function setupMouseInteraction(canvas, vertices) {
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Apply forces to vertices near the mouse
        applyMouseForces(mouseX, mouseY, vertices);
    });
}
