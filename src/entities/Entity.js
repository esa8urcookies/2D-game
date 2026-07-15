// Base class for everything that lives in the world.
//
// Every entity shares the same shape:
//   x, y                 world position (center)
//   velocityX, velocityY movement in pixels per second
//   collisionRadius      circle used for collisions (never the sprite box)
//   dead                 marked true -> removed at the end of the frame
//   update(deltaTime, game)  move / think
//   render(ctx, camera)      draw itself
//
// Subclasses set their velocity in update() and let super.update()
// apply it, so movement math lives in exactly one place.

export class Entity {
  constructor(x, y, collisionRadius) {
    this.x = x;
    this.y = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.collisionRadius = collisionRadius;
    this.dead = false;
  }

  update(deltaTime, game) {
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;
  }

  render(ctx, camera) {
    // Subclasses draw themselves.
  }
}
