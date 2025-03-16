// Application entry point
import { VelesPortals } from "./main";

// Initialize application when the page loads
window.addEventListener("load", async () => {
  try {
    // Get the canvas element
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    if (!canvas) {
      throw new Error("Canvas element not found!");
    }

    // Set canvas size to fill the window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create and initialize the application
    const app = new VelesPortals(canvas);
    await app.initialize();

    // Handle cleanup when the page is unloaded
    window.addEventListener("unload", () => {
      app.cleanup();
    });
  } catch (error) {
    // Display error message if initialization fails
    console.error("Initialization failed:", error);
    document.body.innerHTML = `
      <div style="color: red; text-align: center; margin-top: 2rem;">
        <h1>WebGPU not supported</h1>
        <p>Your browser doesn't support WebGPU, which is required for this demo.</p>
        <p>Please try a browser with WebGPU support, such as Chrome 113+ or Edge 113+.</p>
      </div>
    `;
  }
});

// Export the main class
export { VelesPortals };
