// Enemy spawner.
// Placeholder for the next step: will spawn enemies on a ring just
// outside the visible screen and ramp up difficulty over time.

export class Spawner {
  constructor() {
    this.elapsedTime = 0;
  }

  update(deltaTime, game) {
    this.elapsedTime += deltaTime;
    // Implemented in the next step.
  }
}
