import type { Physics, Scene } from 'phaser';

export class Player {
    scene: Scene;
    sprite: Physics.Arcade.Sprite;
    speed = 300;
    isMoving = false;
    canMove = true;
    spriteScale = 3;

    constructor(scene: Scene, x: number, y: number, texture = 'orpheus') {
        this.scene = scene;

        this.sprite = scene.physics.add
            .sprite(x, y, texture)
            .setDepth(10)
            .setCollideWorldBounds(true);

        this.sprite.body?.setSize(48 * this.spriteScale, 64 * this.spriteScale);
        this.sprite.setDisplaySize(64 * this.spriteScale, 80 * this.spriteScale);

        this.setupControls();
    }

    setupControls() {
        // Arrow keys and WASD movement
        const cursors = this.scene.input.keyboard?.createCursorKeys();

        this.scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
            if (!this.canMove) return;

            const velocity = { x: 0, y: 0 };

            if (cursors?.left?.isDown || event.key === 'a' || event.key === 'A') {
                velocity.x = -this.speed;
            } else if (
                cursors?.right?.isDown ||
                event.key === 'd' ||
                event.key === 'D'
            ) {
                velocity.x = this.speed;
            }

            if (cursors?.up?.isDown || event.key === 'w' || event.key === 'W') {
                velocity.y = -this.speed;
            } else if (
                cursors?.down?.isDown ||
                event.key === 's' ||
                event.key === 'S'
            ) {
                velocity.y = this.speed;
            }

            if (velocity.x !== 0 || velocity.y !== 0) {
                this.sprite.setVelocity(velocity.x, velocity.y);
                this.isMoving = true;
            }
        });

        this.scene.input.keyboard?.on('keyup', () => {
            if (!this.canMove) return;

            const cursors = this.scene.input.keyboard?.createCursorKeys();
            if (
                !cursors?.left?.isDown &&
                !cursors?.right?.isDown &&
                !cursors?.up?.isDown &&
                !cursors?.down?.isDown
            ) {
                this.sprite.setVelocity(0, 0);
                this.isMoving = false;
            }
        });
    }

    update() {
        // Normalize diagonal movement
        if (this.sprite.body) {
            const body = this.sprite.body as Physics.Arcade.Body;
            if (body.velocity.x !== 0 && body.velocity.y !== 0) {
                body.velocity.normalize().scale(this.speed);
            }
        }
    }

    setPosition(x: number, y: number) {
        this.sprite.setPosition(x, y);
    }

    freeze() {
        this.canMove = false;
        this.sprite.setVelocity(0, 0);
        this.isMoving = false;
    }

    unfreeze() {
        this.canMove = true;
    }

    destroy() {
        this.sprite.destroy();
    }
}
