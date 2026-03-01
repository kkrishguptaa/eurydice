import { type GameObjects, Scene } from 'phaser';
import { BackgroundManager } from '../components/Background.ts';
import { HEIGHT, WIDTH } from '../util/constants';

export class Home extends Scene {
  backgroundManager: BackgroundManager;
  wordmark: GameObjects.Image;
  instruction: GameObjects.Text;

  constructor() {
    super('Home');
  }

  create() {
    // Stop all music
    this.sound.stopAll();

    this.backgroundManager = new BackgroundManager(this);

    this.wordmark = this.add
      .image(WIDTH / 2, HEIGHT / 2, 'wordmark')
      .setDepth(5);

    this.instruction = this.add
      .text(WIDTH / 2, HEIGHT - 150, 'CLICK OR PRESS ANY KEY TO START', {
        font: '48px UnifrakturCook',
        fontStyle: '700',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.input.once('pointerdown', () => {
      this.startGame();
    });

    this.input.keyboard?.once('keydown', () => {
      this.startGame();
    });
  }

  startGame() {
    this.scene.start('Menu');
  }
}
