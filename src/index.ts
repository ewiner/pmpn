#!/usr/bin/env node

import {execSync} from "child_process";
import {stdout} from "process";

// Constants
const PNPM_NAME = "pnpm";
const FRAME_TIME = 100; // milliseconds between frames

// Get terminal width
function getTermWidth(): number {
  try {
    return stdout.columns || 80;
  } catch {
    return 80; // Default if can't detect
  }
}

// Animation frames for the car (using multiline template literals)
const carFrames = [
  // Frame 0 (Normal position)
  `

         ______________
        /|            |\\
       / |____________| \\
      /__|____________|__\\
     |  __            __  |
     | |__|          |__| |
     |   ____P_M_P_N____  |
     \\_/   \\       /   \\_/
        \\__/       \\__/`,
  // Frame 1 (Rising)
  `
         ______________
        /|            |\\
       / |____________| \\
      /__|____________|__\\
     |  __            __  |
     | |__|          |__| |
     |   ____P_M_P_N____  |
     \\_/_||_____x___||_\\_/
        /  \\       /  \\
        \\__/       \\__/`,
  // Frame 2 (Highest position)
  `         ______________
        /|            |\\
       / |____________| \\
      /__|____________|__\\
     |  __            __  |
     | |__|          |__| |
     |   ____P_M_P_N____  |
     \\_/ ||         || \\_/
       \\_||_____x___||_/
        /  \\       /  \\
        \\__/       \\__/`,
  // Frame 3 (Tilted Left - mild)
  `
                 ______
         _______/     |\\
        /|      ______| \\
       / |_____/ _____|__\\
      /__|______/     __  |
     |  __           |__| |
     | |__|      P_N____  |
     |   ____P_M/____||_\\_/
     \\_/   \\        /  \\
        \\__/        \\__/`,
  // Frame 4 (Tilted Left - max)
  `                   ___
              ____/   |\\
         ____/     ___| \\
        /|    ____/ __|__\\
       / |___/ ____/  __  |
      /__|____/      |__| |
     |  __         N____  |
     | |__|    M_P/  || \\_/
     |   ____P/_x____||_/
     \\_/   \\        /  \\
        \\__/        \\__/`,
  // Frame 5 (Tilted Right - mild)
  `
         ______
        /|     \\_______
       / |______      |\\
      /__|_____ \\_____| \\
     |  __     \\______|__\\
     | |__|           __  |
     |   ____P_M     |__| |
    \\_/__||_____\\P_N____  |
        /  \\        /   \\_/
        \\__/        \\__/`,
  // Frame 6 (Tilted Right - max)
  `         ____
        /|   \\_____   
       / |____     \\___
      /__|___ \\____   |\\
     |  __   \\____ \\__| \\
     | |__|       \\___|__\\
     |   ____P        __  |
     \\_/ ||   \\M_P   |__| |
       \\_||_____x_\\N____  |
        /  \\        /   \\_/
        \\__/        \\__/`,
];

/**
 * Gets the number of lines in the first animation frame.
 */
function getFrameLines(): string[] {
  return carFrames[0].split("\n");
}

/**
 * Gets the width of the widest line in the first animation frame.
 */
function getCarWidth(): number {
  const lines = getFrameLines();
  return Math.max(...lines.map((line) => line.length));
}

/**
 * Clear the console and move cursor to top
 */
function clearAndMoveCursorToTop(): void {
  // Move cursor up by the number of lines in our animation
  const numLines = getFrameLines().length;
  process.stdout.write(`\x1B[${numLines}A`);
}

/**
 * Clear the animation area
 */
function clearAnimationArea(): void {
  clearAndMoveCursorToTop();
  const numLines = getFrameLines().length;
  const termWidth = getTermWidth();
  for (let i = 0; i < numLines; i++) {
    console.log(" ".repeat(termWidth));
  }
  clearAndMoveCursorToTop(); // Move cursor back to top after clearing
}

/**
 * Draws a single frame of the animation
 */
function drawFrame(frameIndex: number, xPosition: number): void {
  const frame = carFrames[frameIndex];
  const termWidth = getTermWidth();
  const frameLines = frame.split("\n");

  // Clear the entire animation area first
  clearAnimationArea();

  // Draw current frame
  frameLines.forEach((line) => {
    if (xPosition < 0) {
      // Calculate how much of the line to show when partially off-screen
      const visiblePart = line.substring(
        Math.min(Math.abs(xPosition), line.length)
      );
      const padding = ""; // No padding needed as we're off-screen to the left
      console.log(padding + (visiblePart || ""));
    } else {
      // Line with padding when car is on-screen
      const padding = " ".repeat(Math.min(xPosition, termWidth));
      console.log(padding + line);
    }
  });
}

/**
 * Run the bouncing car animation
 */
async function animateCar(): Promise<void> {
  const termWidth = getTermWidth();
  const frameLines = getFrameLines(); // Get lines of the first frame
  const carWidth = getCarWidth(); // Get the actual width of the car art

  // Add initial empty lines for animation space
  console.log("\n".repeat(frameLines.length));

  // Animation sequence
  // First move from left to center
  const centerPosition = Math.floor(termWidth / 2) - Math.floor(carWidth / 2);

  // Start at position 0 (left edge of screen)
  const startPosition = 0;

  // Calculate endpoint - either travel 24 spaces or go to center if center is closer
  const maxAnimationDistance = 24;
  const endPosition = Math.min(
    startPosition + maxAnimationDistance,
    centerPosition
  );

  // 1. Slide in from the left (exactly like it does now)
  for (let x = startPosition; x <= endPosition; x += 3) {
    drawFrame(0, x);
    await new Promise((resolve) => setTimeout(resolve, FRAME_TIME));
  }

  // At this point, we're at the end position with frame 0 (normal position)

  // Frames for the bounce animation sequences
  const bounceSequence = [
    {frame: 1},
    {frame: 2},
    {frame: 1},
    {frame: 0},
  ];

  const bounceLeftSequence = [
    {frame: 3},
    {frame: 4},
    {frame: 3},
    {frame: 0},
  ];

  const bounceRightSequence = [
    {frame: 5},
    {frame: 6},
    {frame: 5},
    {frame: 0},
    {frame: 0},
  ];

  for (const {frame} of [...bounceSequence, ...bounceLeftSequence, ...bounceRightSequence]) {
    drawFrame(frame, endPosition);
    await new Promise((resolve) => setTimeout(resolve, FRAME_TIME));
  }

  // Clear the animation
  clearAnimationArea();
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    // Run the car animation
    await animateCar();

    // Get the arguments to pass to pnpm
    const args = process.argv.slice(2);

    // Execute pnpm with arguments
    try {
      execSync(`${PNPM_NAME} ${args.join(" ")}`, {stdio: "inherit"});
    } catch (error) {
      // If pnpm fails, pass its error code
      if (
        error instanceof Error &&
        "status" in error &&
        typeof error.status === "number"
      ) {
        process.exit(error.status);
      } else {
        process.exit(1);
      }
    }
  } catch (error) {
    console.error("Animation error:", error);
    // Try to run pnpm anyway
    try {
      execSync(`${PNPM_NAME} ${process.argv.slice(2).join(" ")}`, {
        stdio: "inherit",
      });
    } catch (cmdError) {
      process.exit(1);
    }
  }
}

// Start the program
main();
