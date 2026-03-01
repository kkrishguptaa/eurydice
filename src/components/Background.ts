import type { GameObjects, Scene } from 'phaser';
import { HEIGHT, WIDTH } from '../util/constants';

export class BackgroundManager {
  scene: Scene;
  clouds: GameObjects.Image[] = [];

  constructor(scene: Scene) {
    this.scene = scene;

    this.createBackground();
    this.createClouds();
  }

  createBackground() {
    this.scene.add
      .image(0, 0, 'background')
      .setOrigin(0)
      .setDisplaySize(WIDTH, HEIGHT);
  }

  createClouds() {
    const cloudCount = 6;
    const cloudMinScale = 0.2;
    const cloudMaxScale = 0.65;
    const edgeMargin = Math.max(16, Math.floor(Math.min(WIDTH, HEIGHT) * 0.02));

    for (let i = 0; i < cloudCount; i++) {
      const cy = Phaser.Math.Between(20, Math.max(20, Math.floor(HEIGHT - 20)));
      const scale = Phaser.Math.FloatBetween(cloudMinScale, cloudMaxScale);
      const startX = Phaser.Math.Between(
        -Math.floor(WIDTH - edgeMargin),
        Math.floor(WIDTH - edgeMargin),
      );
      const cloud = this.scene.add
        .image(startX, cy, 'cloud')
        .setAlpha(0.9)
        .setScale(scale)
        .setDepth(0);

      const duration = Phaser.Math.Between(25000, 55000);

      cloud.x = Phaser.Math.Between(
        edgeMargin,
        Math.max(edgeMargin, WIDTH * 2 - edgeMargin),
      );

      this.scene.tweens.add({
        targets: cloud,
        x: -cloud.displayWidth,
        duration,
        ease: 'Linear',
        repeat: -1,
        onRepeat: () => {
          cloud.x = WIDTH + cloud.displayWidth + edgeMargin;
          cloud.y = Phaser.Math.Between(
            edgeMargin,
            Math.max(edgeMargin, Math.floor(HEIGHT - edgeMargin)),
          );
          cloud.setScale(
            Phaser.Math.FloatBetween(cloudMinScale, cloudMaxScale),
          );
        },
      });

      this.clouds.push(cloud);
    }
  }
}
