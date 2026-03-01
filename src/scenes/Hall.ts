import { type GameObjects, type Physics, Scene } from 'phaser';
import { DialogueManager } from '../components/Dialogue';
import { Player } from '../components/Player';
import { CHARACTERS } from '../data/characters';
import { HEIGHT, WIDTH } from '../util/constants';
import type { GameState } from '../util/types';

export class Hall extends Scene {
  spriteScale = 3;
  dialogueManager: DialogueManager;
  gameState: GameState;
  player: Player;

  background: GameObjects.Image;
  locationText: GameObjects.Text;
  hadesSprite: Physics.Arcade.Sprite;
  interactPrompt: GameObjects.Text;
  progressPrompt: GameObjects.Text;
  inventoryText: GameObjects.Text;
  canProgress = false;
  isNearHades = false;

  constructor() {
    super('Hall');
  }

  init(data: { gameState: GameState }) {
    this.gameState = data.gameState;
    this.gameState.currentLocation = 'hall';
  }

  create() {
    this.background = this.add
      .image(0, 0, 'hall')
      .setOrigin(0)
      .setDisplaySize(WIDTH, HEIGHT)
      .setDepth(0);

    this.locationText = this.add
      .text(WIDTH / 2, 40, 'The Hall of Hades', {
        fontFamily: 'UnifrakturCook',
        fontSize: '56px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(15)
      .setScrollFactor(0);

    // Hades sprite positioned on throne (center)
    this.hadesSprite = this.physics.add
      .sprite(WIDTH / 2, HEIGHT / 2 - 50, 'hades')
      .setDepth(10)
      .setImmovable(true);
    this.hadesSprite.setDisplaySize(100 * this.spriteScale, 120 * this.spriteScale);
    this.hadesSprite.body?.setSize(100 * this.spriteScale, 120 * this.spriteScale);
    this.hadesSprite.setTint(0xfff0d0);

    const hadesAura = this.add
      .ellipse(
        this.hadesSprite.x,
        this.hadesSprite.y + 175,
        340,
        105,
        0xffe8a3,
        0.22,
      )
      .setDepth(9);

    this.tweens.add({
      targets: this.hadesSprite,
      y: this.hadesSprite.y - 10,
      duration: 1800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    this.tweens.add({
      targets: hadesAura,
      alpha: { from: 0.18, to: 0.32 },
      scaleX: { from: 0.95, to: 1.05 },
      duration: 1300,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Player starts at bottom
    this.player = new Player(this, WIDTH / 2, HEIGHT - 150);

    this.interactPrompt = this.add
      .text(
        this.hadesSprite.x,
        this.hadesSprite.y - 90,
        'Press SPACE to talk',
        {
          fontFamily: 'UnifrakturCook',
          fontSize: '28px',
          color: '#ffff88',
          stroke: '#000000',
          strokeThickness: 3,
        },
      )
      .setOrigin(0.5)
      .setDepth(11)
      .setVisible(false);

    this.tweens.add({
      targets: this.interactPrompt,
      alpha: { from: 0.6, to: 1 },
      duration: 700,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    this.progressPrompt = this.add
      .text(WIDTH / 2, HEIGHT - 40, '', {
        fontFamily: 'UnifrakturCook',
        fontSize: '32px',
        color: '#88ff88',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(15)
      .setScrollFactor(0);
    this.progressPrompt.setStyle({ color: '#ffff88' });
    this.progressPrompt.setText('Approach Hades and press SPACE to talk');

    this.inventoryText = this.add
      .text(
        20,
        HEIGHT - 40,
        `Inventory: ${this.gameState.inventory.join(', ')}`,
        {
          fontFamily: 'UnifrakturCook',
          fontSize: '24px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
        },
      )
      .setDepth(15)
      .setScrollFactor(0);

    this.physics.add.overlap(this.player.sprite, this.hadesSprite, () => {
      this.isNearHades = true;
      this.interactPrompt.setVisible(true);
    });

    this.dialogueManager = new DialogueManager(this, this.gameState);
    const character = CHARACTERS.hades;
    this.dialogueManager.setCharacter(character);

    if (!this.gameState.charactersMetNames.includes(character.id)) {
      this.gameState.charactersMetNames.push(character.id);
    }

    this.dialogueManager.onProgressionAllowed = () => {
      this.allowProgression();
    };

    this.dialogueManager.onDialogueClose = () => {
      this.player.unfreeze();
    };

    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.isNearHades && !this.dialogueManager.isActive) {
        if (
          !this.gameState.inventory.includes('lyre') ||
          !this.gameState.inventory.includes('bone')
        ) {
          this.showMissingItemMessage();
        } else {
          this.startDialogue();
        }
      } else if (this.canProgress && !this.dialogueManager.isActive) {
        this.nextScene();
      }
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('Menu');
    });
  }

  update() {
    this.player.update();

    const distance = Phaser.Math.Distance.Between(
      this.player.sprite.x,
      this.player.sprite.y,
      this.hadesSprite.x,
      this.hadesSprite.y,
    );

    this.isNearHades = distance < 150;
    this.interactPrompt.setVisible(
      this.isNearHades && !this.dialogueManager.isActive,
    );
  }

  showMissingItemMessage() {
    let msg = 'You need your lyre to move Hades with music!';
    if (!this.gameState.inventory.includes('bone')) {
      msg = 'You need proof you passed Cerberus!';
    }

    const message = this.add
      .text(WIDTH / 2, HEIGHT / 2 - 100, msg, {
        fontFamily: 'UnifrakturCook',
        fontSize: '42px',
        color: '#ff8888',
        stroke: '#000000',
        strokeThickness: 4,
        wordWrap: { width: WIDTH - 200 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.time.delayedCall(2500, () => message.destroy());
  }

  startDialogue() {
    this.player.freeze();
    this.dialogueManager.show();
  }

  allowProgression() {
    if (this.canProgress) return;

    this.canProgress = true;
    this.gameState.charactersBefriended.push('hades');
    this.gameState.inventory.push('blessing');
    this.inventoryText.setText(
      `Inventory: ${this.gameState.inventory.join(', ')}`,
    );

    this.progressPrompt.setText(
      'Hades grants you passage! Press SPACE to visit the Garden →',
    );
    this.progressPrompt.setStyle({ color: '#88ff88' });

    this.dialogueManager.addMessage({
      speaker: 'System',
      text: 'Hades grants his blessing. Seek Persephone in her garden.',
      isPlayer: false,
    });
  }

  nextScene() {
    this.scene.start('Garden', { gameState: this.gameState });
  }
}
