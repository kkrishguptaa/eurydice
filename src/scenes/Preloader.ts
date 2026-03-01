import { Scene } from 'phaser';
import { HEIGHT, WIDTH } from '../util/constants';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  preload() {
    const barWidth = 600;
    const barHeight = 40;
    const barX = WIDTH / 2 - barWidth / 2;
    const barY = HEIGHT / 2;

    this.cameras.main.setBackgroundColor('#1b1b1c');

    const loadingText = this.add
      .text(WIDTH / 2, barY - 80, 'LOADING...', {
        fontFamily: 'UnifrakturCook',
        fontSize: '48px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x000000, 0.8);
    progressBox.fillRect(barX, barY, barWidth, barHeight);

    const progressBar = this.add.graphics();

    const percentText = this.add
      .text(WIDTH / 2, barY + barHeight / 2, '0%', {
        fontFamily: 'UnifrakturCook',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const assetText = this.add
      .text(WIDTH / 2, barY + 80, '', {
        fontFamily: 'UnifrakturCook',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(
        barX + 4,
        barY + 4,
        (barWidth - 8) * value,
        barHeight - 8,
      );
      percentText.setText(`${Math.floor(value * 100)}%`);
    });

    this.load.on('fileprogress', (file: { key: string }) => {
      assetText.setText(`Loading: ${file.key}`);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      assetText.destroy();
    });

    this.load.image('background', 'assets/title.webp');
    this.load.image('cloud', 'assets/cloud.webp');
    this.load.image('wordmark', 'assets/wordmark.webp');
    this.load.image('sword', 'assets/cloud.webp');

    // Location backgrounds
    this.load.image('styx', 'assets/styx.webp');
    this.load.image('gates', 'assets/gates.webp');
    this.load.image('hall', 'assets/hall.webp');
    this.load.image('garden', 'assets/garden.webp');

    // Character sprites
    this.load.image('orpheus', 'assets/orpheus.webp');
    this.load.image('charon', 'assets/charan.webp');
    this.load.image('cerberus', 'assets/cereberus.webp');
    this.load.image('hades', 'assets/hades.webp');
    this.load.image('persephone', 'assets/persephone.webp');
    this.load.image('eurydice', 'assets/persephone.webp');
  }

  create() {
    this.scene.start('Home');
  }
}
