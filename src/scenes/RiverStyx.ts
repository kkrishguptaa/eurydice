import { type GameObjects, type Physics, Scene } from 'phaser';
import { DialogueManager } from '../components/Dialogue';
import { Player } from '../components/Player';
import { CHARACTERS } from '../data/characters';
import { HEIGHT, WIDTH } from '../util/constants';
import type { GameState } from '../util/types';

export class RiverStyx extends Scene {
  spriteScale = 3;
  dialogueManager: DialogueManager;
  gameState: GameState;
  player: Player;

  background: GameObjects.Image;
  locationText: GameObjects.Text;
  charonSprite: Physics.Arcade.Sprite;
  interactPrompt: GameObjects.Text;
  progressPrompt: GameObjects.Text;
  inventoryText: GameObjects.Text;
  canProgress = false;
  isNearCharon = false;

  constructor() {
    super('RiverStyx');
  }

  init(data?: { gameState?: GameState }) {
    if (data?.gameState) {
      this.gameState = data.gameState;
    } else {
      this.gameState = {
        currentLocation: 'riverStyx',
        charactersMetNames: [],
        charactersBefriended: [],
        inventory: ['lyre'],
        conversationHistory: [],
      };
    }
  }

  create() {
    this.sound.stopAll();

    this.background = this.add
      .image(0, 0, 'styx')
      .setOrigin(0)
      .setDisplaySize(WIDTH, HEIGHT)
      .setDepth(0);

    this.locationText = this.add
      .text(WIDTH / 2, 40, 'The River Styx', {
        fontFamily: 'UnifrakturCook',
        fontSize: '56px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(15)
      .setScrollFactor(0);

    // Charon sprite positioned on the left side (at the ferry)
    this.charonSprite = this.physics.add
      .sprite(300, HEIGHT / 2, 'charon')
      .setDepth(10)
      .setImmovable(true);
    this.charonSprite.setDisplaySize(80 * this.spriteScale, 100 * this.spriteScale);
    this.charonSprite.body?.setSize(80 * this.spriteScale, 100 * this.spriteScale);
    this.charonSprite.setTint(0xfff6d5);

    const charonAura = this.add
      .ellipse(
        this.charonSprite.x,
        this.charonSprite.y + 150,
        280,
        90,
        0xffe8a3,
        0.25,
      )
      .setDepth(9);

    this.tweens.add({
      targets: this.charonSprite,
      y: this.charonSprite.y - 10,
      duration: 1800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    this.tweens.add({
      targets: charonAura,
      alpha: { from: 0.2, to: 0.35 },
      scaleX: { from: 0.95, to: 1.05 },
      duration: 1300,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Player starts on the right
    this.player = new Player(this, WIDTH - 200, HEIGHT / 2);

    // Interaction prompt
    this.interactPrompt = this.add
      .text(
        this.charonSprite.x,
        this.charonSprite.y - 80,
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

    // Progress prompt
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
    this.progressPrompt.setText('Approach Charon and press SPACE to talk');

    // Inventory display
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

    // Collision detection
    this.physics.add.overlap(this.player.sprite, this.charonSprite, () => {
      this.isNearCharon = true;
      this.interactPrompt.setVisible(true);
    });

    // Dialogue manager
    this.dialogueManager = new DialogueManager(this, this.gameState);
    const character = CHARACTERS.charon;
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

    // Interaction key
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.canProgress && !this.dialogueManager.isActive) {
        this.nextScene();
      } else if (this.isNearCharon && !this.dialogueManager.isActive) {
        this.startDialogue();
      }
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('Menu');
    });
  }

  update() {
    this.player.update();

    // Check distance to Charon
    const distance = Phaser.Math.Distance.Between(
      this.player.sprite.x,
      this.player.sprite.y,
      this.charonSprite.x,
      this.charonSprite.y,
    );

    this.isNearCharon = distance < 120;
    this.interactPrompt.setVisible(
      this.isNearCharon && !this.dialogueManager.isActive,
    );
  }

  startDialogue() {
    this.player.freeze();
    this.dialogueManager.show();
  }

  allowProgression() {
    if (this.canProgress) return;

    this.canProgress = true;
    this.gameState.charactersBefriended.push('charon');
    this.gameState.inventory.push('coin');
    this.inventoryText.setText(
      `Inventory: ${this.gameState.inventory.join(', ')}`,
    );

    this.progressPrompt.setText(
      'Charon grants you passage! Press SPACE to cross the river →',
    );
    this.progressPrompt.setStyle({ color: '#88ff88' });

    this.dialogueManager.addMessage({
      speaker: 'System',
      text: 'Charon hands you a coin for your journey. You may now cross the River Styx.',
      isPlayer: false,
    });
  }

  nextScene() {
    this.scene.start('Gates', { gameState: this.gameState });
  }
}
