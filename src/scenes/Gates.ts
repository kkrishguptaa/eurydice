import { type GameObjects, type Physics, Scene } from 'phaser';
import { DialogueManager } from '../components/Dialogue';
import { Player } from '../components/Player';
import { CHARACTERS } from '../data/characters';
import { HEIGHT, WIDTH } from '../util/constants';
import type { GameState } from '../util/types';

export class Gates extends Scene {
  spriteScale = 3;
  dialogueManager: DialogueManager;
  gameState: GameState;
  player: Player;

  background: GameObjects.Image;
  locationText: GameObjects.Text;
  cerberusSprite: Physics.Arcade.Sprite;
  interactPrompt: GameObjects.Text;
  progressPrompt: GameObjects.Text;
  inventoryText: GameObjects.Text;
  canProgress = false;
  isNearCerberus = false;

  constructor() {
    super('Gates');
  }

  init(data: { gameState: GameState }) {
    this.gameState = data.gameState;
    this.gameState.currentLocation = 'gates';
  }

  create() {
    this.background = this.add
      .image(0, 0, 'gates')
      .setOrigin(0)
      .setDisplaySize(WIDTH, HEIGHT)
      .setDepth(0);

    this.locationText = this.add
      .text(WIDTH / 2, 40, 'The Gates of Hades', {
        fontFamily: 'UnifrakturCook',
        fontSize: '56px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(15)
      .setScrollFactor(0);

    // Cerberus sprite positioned center-left, blocking the path
    this.cerberusSprite = this.physics.add
      .sprite(WIDTH / 3, HEIGHT / 2 + 50, 'cerberus')
      .setDepth(10)
      .setImmovable(true);
    this.cerberusSprite.setDisplaySize(
      120 * this.spriteScale,
      120 * this.spriteScale,
    );
    this.cerberusSprite.body?.setSize(120 * this.spriteScale, 120 * this.spriteScale);
    this.cerberusSprite.setTint(0xfff0d0);

    const cerberusAura = this.add
      .ellipse(
        this.cerberusSprite.x,
        this.cerberusSprite.y + 165,
        320,
        100,
        0xffe8a3,
        0.23,
      )
      .setDepth(9);

    this.tweens.add({
      targets: this.cerberusSprite,
      y: this.cerberusSprite.y - 10,
      duration: 1800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    this.tweens.add({
      targets: cerberusAura,
      alpha: { from: 0.2, to: 0.34 },
      scaleX: { from: 0.95, to: 1.05 },
      duration: 1300,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Player starts on the left
    this.player = new Player(this, 150, HEIGHT / 2);

    this.interactPrompt = this.add
      .text(
        this.cerberusSprite.x,
        this.cerberusSprite.y - 90,
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
    this.progressPrompt.setText('Approach Cerberus and press SPACE to talk');

    this.inventoryText = this.add
      .text(
        20,
        HEIGHT - 40,
        `Inventory: ${this.gameState.inventory.join(', ')}`,
        {
          fontFamily: 'UnifrakturCook',
          fontSize: '25px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 3,
        },
      )
      .setDepth(15)
      .setScrollFactor(0);

    this.physics.add.overlap(this.player.sprite, this.cerberusSprite, () => {
      this.isNearCerberus = true;
      this.interactPrompt.setVisible(true);
    });

    this.dialogueManager = new DialogueManager(this, this.gameState);
    const character = CHARACTERS.cerberus;
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
      if (this.canProgress && !this.dialogueManager.isActive) {
        this.nextScene();
      } else if (this.isNearCerberus && !this.dialogueManager.isActive) {
        if (!this.gameState.inventory.includes('coin')) {
          this.showMissingItemMessage();
        } else {
          this.startDialogue();
        }
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
      this.cerberusSprite.x,
      this.cerberusSprite.y,
    );

    this.isNearCerberus = distance < 150;
    this.interactPrompt.setVisible(
      this.isNearCerberus && !this.dialogueManager.isActive,
    );
  }

  showMissingItemMessage() {
    const message = this.add
      .text(
        WIDTH / 2,
        HEIGHT / 2 - 100,
        'You need proof of passage from Charon!',
        {
          fontFamily: 'UnifrakturCook',
          fontSize: '42px',
          color: '#ff8888',
          stroke: '#000000',
          strokeThickness: 4,
        },
      )
      .setOrigin(0.5)
      .setDepth(20);

    this.time.delayedCall(2000, () => message.destroy());
  }

  startDialogue() {
    this.player.freeze();
    this.dialogueManager.show();
  }

  allowProgression() {
    if (this.canProgress) return;

    this.canProgress = true;
    this.gameState.charactersBefriended.push('cerberus');
    this.gameState.inventory.push('bone');
    this.inventoryText.setText(
      `Inventory: ${this.gameState.inventory.join(', ')}`,
    );

    this.progressPrompt.setText(
      'Cerberus lets you pass! Press SPACE to enter the Hall →',
    );
    this.progressPrompt.setStyle({ color: '#88ff88' });

    this.dialogueManager.addMessage({
      speaker: 'System',
      text: 'Cerberus gives you a bone as a token. The gates stand open.',
      isPlayer: false,
    });
  }

  nextScene() {
    this.scene.start('Hall', { gameState: this.gameState });
  }
}
