// A projectile fired by the player's weapon. It flies in a straight
// line; the CollisionSystem handles hits, and the Game removes it
// when it leaves the screen or hits something.

export class Projectile {
  constructor(x, y, directionX, directionY, { speed = 900, damage = 10, radius = 12 } = {}) {
    this.x = x;
    this.y = y;
    this.velocityX = directionX * speed;
    this.velocityY = directionY * speed;
    this.damage = damage;
    this.collisionRadius = radius;
    this.dead = false;
  }

  update(deltaTime) {
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;
  }
}
