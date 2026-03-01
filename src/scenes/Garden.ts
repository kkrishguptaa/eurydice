import { type GameObjects, type Physics, Scene } from 'phaser';
import { DialogueManager } from '../components/Dialogue';
import { Player } from '../components/Player';
import { CHARACTERS } from '../data/characters';
import { HEIGHT, WIDTH } from '../util/constants';
import type { GameState } from '../util/types';

export class Garden extends Scene {
  spriteScale = 3;
  dialogueManager: DialogueManager;
  gameState: GameState;
  player: Player;

  background: GameObjects.Image;
  locationText: GameObjects.Text;
  persephoneSprite: Physics.Arcade.Sprite;
  eurydiceSprite: Physics.Arcade.Sprite;
  interactPrompt: GameObjects.Text;
  progressPrompt: GameObjects.Text;
  inventoryText: GameObjects.Text;
  canProgress = false;
  isNearPersephone = false;
  isNearEurydice = false;

  constructor() {
    super('Garden');
  }

  init(data: { gameState: GameState }) {
    this.gameState = data.gameState;
    this.gameState.currentLocation = 'garden';
  }

  create() {
    this.background = this.add
      .image(0, 0, 'garden')
      .setOrigin(0)
      .setDisplaySize(WIDTH, HEIGHT)
      .setDepth(0);

    this.locationText = this.add
      .text(WIDTH / 2, 40, "Persephone's Garden", {
        fontFamily: 'UnifrakturCook',
        fontSize: '56px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(15)
      .setScrollFactor(0);

    // Persephone on the left
    this.persephoneSprite = this.physics.add
      .sprite(WIDTH / 3, HEIGHT / 2, 'persephone')
      .setDepth(10)
      .setImmovable(true);
    this.persephoneSprite.setDisplaySize(80 * this.spriteScale, 100 * this.spriteScale);
    this.persephoneSprite.body?.setSize(80 * this.spriteScale, 100 * this.spriteScale);
    this.persephoneSprite.setTint(0xfff3d9);

    const persephoneAura = this.add
      .ellipse(
        this.persephoneSprite.x,
        this.persephoneSprite.y + 150,
        280,
        90,
        0xffe8a3,
        0.25,
      )
      .setDepth(9);

    this.tweens.add({
      targets: this.persephoneSprite,
      y: this.persephoneSprite.y - 10,
      duration: 1800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    this.tweens.add({
      targets: persephoneAura,
      alpha: { from: 0.2, to: 0.35 },
      scaleX: { from: 0.95, to: 1.05 },
      duration: 1300,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Eurydice on the right (initially hidden/faded)
    this.eurydiceSprite = this.physics.add
      .sprite(WIDTH * 0.7, HEIGHT / 2, 'eurydice')
      .setDepth(10)
      .setImmovable(true)
      .setAlpha(0.5);
    this.eurydiceSprite.setDisplaySize(80 * this.spriteScale, 100 * this.spriteScale);
    this.eurydiceSprite.body?.setSize(80 * this.spriteScale, 100 * this.spriteScale);
    this.eurydiceSprite.setTint(0xfff8e8);

    const eurydiceAura = this.add
      .ellipse(
        this.eurydiceSprite.x,
        this.eurydiceSprite.y + 150,
        280,
        90,
        0xfff2c7,
        0.18,
      )
      .setDepth(9);

    this.tweens.add({
      targets: this.eurydiceSprite,
      y: this.eurydiceSprite.y - 8,
      duration: 1800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    this.tweens.add({
      targets: eurydiceAura,
      alpha: { from: 0.14, to: 0.28 },
      scaleX: { from: 0.95, to: 1.05 },
      duration: 1300,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Player starts at bottom center
    this.player = new Player(this, WIDTH / 2, HEIGHT - 150);

    this.interactPrompt = this.add
      .text(0, 0, 'Press SPACE to talk', {
        fontFamily: 'UnifrakturCook',
        fontSize: '28px',
        color: '#ffff88',
        stroke: '#000000',
        strokeThickness: 3,
      })
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
    this.progressPrompt.setText('Approach Persephone and press SPACE to talk');

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

    this.physics.add.overlap(this.player.sprite, this.persephoneSprite, () => {
      this.isNearPersephone = true;
    });

    this.physics.add.overlap(this.player.sprite, this.eurydiceSprite, () => {
      this.isNearEurydice = true;
    });

    this.dialogueManager = new DialogueManager(this, this.gameState);
    const character = CHARACTERS.persephone;
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
      if (
        this.isNearPersephone &&
        !this.dialogueManager.isActive &&
        !this.canProgress
      ) {
        if (!this.gameState.inventory.includes('blessing')) {
          this.showMissingItemMessage();
        } else {
          this.startDialogue();
        }
      } else if (
        this.isNearEurydice &&
        this.canProgress &&
        !this.dialogueManager.isActive
      ) {
        this.meetEurydice();
      }
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('Menu');
    });
  }

  update() {
    this.player.update();

    const distancePersephone = Phaser.Math.Distance.Between(
      this.player.sprite.x,
      this.player.sprite.y,
      this.persephoneSprite.x,
      this.persephoneSprite.y,
    );

    const distanceEurydice = Phaser.Math.Distance.Between(
      this.player.sprite.x,
      this.player.sprite.y,
      this.eurydiceSprite.x,
      this.eurydiceSprite.y,
    );

    this.isNearPersephone = distancePersephone < 120;
    this.isNearEurydice = distanceEurydice < 120;

    if (
      this.isNearPersephone &&
      !this.dialogueManager.isActive &&
      !this.canProgress
    ) {
      this.interactPrompt.setPosition(
        this.persephoneSprite.x,
        this.persephoneSprite.y - 80,
      );
      this.interactPrompt.setVisible(true);
    } else if (
      this.isNearEurydice &&
      this.canProgress &&
      !this.dialogueManager.isActive
    ) {
      this.interactPrompt.setPosition(
        this.eurydiceSprite.x,
        this.eurydiceSprite.y - 80,
      );
      this.interactPrompt.setVisible(true);
    } else {
      this.interactPrompt.setVisible(false);
    }
  }

  showMissingItemMessage() {
    const message = this.add
      .text(WIDTH / 2, HEIGHT / 2 - 100, "You need Hades' blessing first!", {
        fontFamily: 'UnifrakturCook',
        fontSize: '42px',
        color: '#ff8888',
        stroke: '#000000',
        strokeThickness: 4,
      })
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
    this.gameState.charactersBefriended.push('persephone');

    // Reveal Eurydice
    this.tweens.add({
      targets: this.eurydiceSprite,
      alpha: 1,
      duration: 2000,
      ease: 'Power2',
    });

    this.progressPrompt.setText('Approach Eurydice to complete your quest!');
    this.progressPrompt.setStyle({ color: '#88ff88' });

    this.dialogueManager.addMessage({
      speaker: 'System',
      text: 'Persephone reveals Eurydice. Walk to her and press SPACE.',
      isPlayer: false,
    });
  }

  meetEurydice() {
    this.player.freeze();
    this.dialogueManager.hide();
    this.progressPrompt.setVisible(false);
    this.inventoryText.setVisible(false);
    this.locationText.setVisible(false);

    this.add
      .text(WIDTH / 2, HEIGHT / 2 - 100, 'You have found Eurydice...', {
        fontFamily: 'UnifrakturCook',
        fontSize: '64px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.add
      .text(
        WIDTH / 2,
        HEIGHT / 2 + 50,
        'But remember: Do not look back until you reach the surface.',
        {
          fontFamily: 'UnifrakturCook',
          fontSize: '42px',
          color: '#ffcccc',
          stroke: '#000000',
          strokeThickness: 4,
          wordWrap: { width: WIDTH - 200 },
          align: 'center',
        },
      )
      .setOrigin(0.5)
      .setDepth(20);

    this.add
      .text(WIDTH / 2, HEIGHT / 2 + 180, 'TO BE CONTINUED...', {
        fontFamily: 'UnifrakturCook',
        fontSize: '72px',
        color: '#ffff88',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.time.delayedCall(3000, () => {
      this.add
        .text(WIDTH / 2, HEIGHT - 80, 'Press ESC to return to menu', {
          fontFamily: 'UnifrakturCook',
          fontSize: '36px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setDepth(20);
    });
  }
}
