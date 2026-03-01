import type { GameObjects, Scene } from 'phaser';
import { HEIGHT, WIDTH } from '../util/constants';
import type { Character, DialogueMessage, GameState } from '../util/types';

const HARD_CODED_DIALOGUE: Record<string, string[]> = {
  charon: [
    'The Styx remembers every oath. Why should I trust yours?',
    'Gold does not move me tonight, musician. Truth might.',
    'Your song carries grief. Speak of Eurydice once more.',
    'Very well, Orpheus. I will ferry you onward.',
  ],
  cerberus: [
    'Three throats guard one gate. Convince all of us.',
    'One head growls, one doubts, one listens. Continue.',
    'Your voice does not tremble. That is rare among the living.',
    'The gate opens. Pass, lyre-bearer.',
  ],
  hades: [
    'You walk where living feet do not belong.',
    'Love is not a law, Orpheus. Give me a reason beyond sorrow.',
    'Your words carry weight, and your music carries memory.',
    'I grant passage. Do not squander this mercy.',
  ],
  persephone: [
    'I know the ache of divided worlds. Speak freely.',
    'Your devotion is fierce. Few would descend this far.',
    'There is still a path for you, though it is perilous.',
    'Go to Eurydice. Your plea has reached even this garden.',
  ],
};

const CHARACTER_THRESHOLDS: Record<string, number> = {
  charon: 3,
  cerberus: 3,
  hades: 3,
  persephone: 3,
};

const PERSUASION_KEYWORDS = [
  'please',
  'love',
  'eurydice',
  'song',
  'music',
  'promise',
  'truth',
  'mercy',
];

export class DialogueManager {
  scene: Scene;
  gameState: GameState;
  currentCharacter: Character | null = null;
  isActive = false;

  dialogueBox: GameObjects.Graphics;
  dialogueText: GameObjects.Text;
  messageHistory: DialogueMessage[] = [];
  historyContainer: GameObjects.Container;
  historyTexts: GameObjects.Text[] = [];
  promptText: GameObjects.Text;
  options: string[] = [];
  optionTexts: GameObjects.Text[] = [];
  selectedOptionIndex = 0;
  optionHintText: GameObjects.Text;
  isWaitingForResponse = false;

  onProgressionAllowed?: () => void;
  onDialogueClose?: () => void;

  constructor(scene: Scene, gameState: GameState) {
    this.scene = scene;
    this.gameState = gameState;

    const boxHeight = 380;
    const boxY = HEIGHT - boxHeight - 20;

    this.dialogueBox = scene.add.graphics();
    this.dialogueBox.fillStyle(0x000000, 0.9);
    this.dialogueBox.fillRoundedRect(40, boxY, WIDTH - 80, boxHeight, 16);
    this.dialogueBox.lineStyle(4, 0xffffff, 1);
    this.dialogueBox.strokeRoundedRect(40, boxY, WIDTH - 80, boxHeight, 16);
    this.dialogueBox.setDepth(10);

    this.dialogueText = scene.add
      .text(80, boxY + 26, '', {
        fontFamily: 'UnifrakturCook',
        fontSize: '42px',
        color: '#ffffff',
        wordWrap: { width: WIDTH - 160 },
      })
      .setDepth(11);

    this.historyContainer = scene.add.container(80, 70);
    this.historyContainer.setDepth(9);

    const optionStartY = boxY + 170;
    for (let i = 0; i < 3; i++) {
      const optionText = scene.add
        .text(100, optionStartY + i * 56, '', {
          fontFamily: 'UnifrakturCook',
          fontSize: '34px',
          color: '#dddddd',
          wordWrap: { width: WIDTH - 200 },
        })
        .setDepth(12)
        .setInteractive({ useHandCursor: true });

      optionText.on('pointerdown', () => {
        if (!this.isActive || this.isWaitingForResponse) return;
        this.selectedOptionIndex = i;
        this.renderOptions();
        this.selectCurrentOption();
      });

      optionText.on('pointerover', () => {
        if (!this.isActive || this.isWaitingForResponse) return;
        this.selectedOptionIndex = i;
        this.renderOptions();
      });

      this.optionTexts.push(optionText);
    }

    this.optionHintText = scene.add
      .text(WIDTH / 2, HEIGHT - 24, 'Use W/S or ↑/↓ then ENTER or SPACE (or click)', {
        fontFamily: 'UnifrakturCook',
        fontSize: '24px',
        color: '#bbbbbb',
      })
      .setOrigin(0.5)
      .setDepth(12);

    this.promptText = scene.add
      .text(WIDTH / 2, HEIGHT - 50, 'Press E to close dialogue', {
        fontFamily: 'UnifrakturCook',
        fontSize: '28px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5)
      .setDepth(12);

    this.hide();

    // Close dialogue with E key
    scene.input.keyboard?.on('keydown-E', () => {
      if (this.isActive) {
        this.closeDialogue();
      }
    });

    scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (!this.isActive || this.isWaitingForResponse) return;

      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.moveSelection(-1);
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.moveSelection(1);
          break;
        case 'Enter':
        case 'Space':
          this.selectCurrentOption();
          break;
        case 'Digit1':
          this.selectOptionByIndex(0);
          break;
        case 'Digit2':
          this.selectOptionByIndex(1);
          break;
        case 'Digit3':
          this.selectOptionByIndex(2);
          break;
      }
    });
  }

  buildOptions() {
    if (!this.currentCharacter) {
      this.options = [];
      return;
    }

    const characterName = this.currentCharacter.name;
    const turnCount = this.gameState.conversationHistory.filter(
      (msg) => msg.character === this.currentCharacter?.id,
    ).length;

    const stage = Math.min(2, turnCount);
    const optionSets: Array<[string, string, string]> = [
      [
        `“${characterName}, hear my plea for Eurydice.”`,
        '“I came with music, not steel.”',
        '“Tell me what you require of me.”',
      ],
      [
        '“My love is true. Test me if you must.”',
        '“I will pay any fair price for passage.”',
        '“Listen once more to my vow.”',
      ],
      [
        '“Grant me passage, and my song will honor your name.”',
        '“I accept your terms. I will not fail them.”',
        '“For Eurydice, I ask your final mercy.”',
      ],
    ];

    this.options = [...optionSets[stage]];
    this.selectedOptionIndex = Phaser.Math.Clamp(
      this.selectedOptionIndex,
      0,
      this.options.length - 1,
    );
  }

  renderOptions() {
    this.optionTexts.forEach((text, index) => {
      const option = this.options[index] ?? '';
      const selected = index === this.selectedOptionIndex;

      text.setText(option ? `${index + 1}. ${option}` : '');
      text.setStyle({
        color: selected ? '#ffff88' : '#dddddd',
        stroke: selected ? '#ffffff' : '#000000',
        strokeThickness: selected ? 2 : 0,
      });
      text.setVisible(this.isActive && Boolean(option));
    });
  }

  moveSelection(delta: number) {
    if (this.options.length === 0) return;

    this.selectedOptionIndex =
      (this.selectedOptionIndex + delta + this.options.length) %
      this.options.length;
    this.renderOptions();
  }

  selectOptionByIndex(index: number) {
    if (index < 0 || index >= this.options.length) return;
    this.selectedOptionIndex = index;
    this.renderOptions();
    this.selectCurrentOption();
  }

  async selectCurrentOption() {
    if (
      !this.currentCharacter ||
      this.isWaitingForResponse ||
      this.options.length === 0
    ) {
      return;
    }

    const playerMessage = this.options[this.selectedOptionIndex];

    this.isWaitingForResponse = true;
    this.optionHintText.setText('...');

    this.addMessage({
      speaker: 'Orpheus',
      text: playerMessage,
      isPlayer: true,
    });

    const response = await this.characterResponse(
      this.currentCharacter,
      playerMessage,
    );

    this.addMessage({
      speaker: this.currentCharacter.name,
      text: response,
      isPlayer: false,
    });

    this.gameState.conversationHistory.push({
      character: this.currentCharacter.id,
      playerMessage,
      characterResponse: response,
      timestamp: Date.now(),
    });

    // Check if player can progress after each response
    const canProgress = await this.checkProgressionAllowed(
      this.currentCharacter,
      playerMessage,
      response,
    );

    if (canProgress && this.onProgressionAllowed) {
      this.onProgressionAllowed();
      this.closeDialogue();
    }

    this.isWaitingForResponse = false;
    this.optionHintText.setText('Use W/S or ↑/↓ then ENTER or SPACE (or click)');

    this.buildOptions();
    this.renderOptions();
  }

  async characterResponse(
    character: Character,
    playerMessage: string,
  ): Promise<string> {
    const lines = HARD_CODED_DIALOGUE[character.id] ?? [
      `${character.name} watches in silence, waiting for your next words.`,
    ];

    const turnCount = this.gameState.conversationHistory.filter(
      (msg) => msg.character === character.id,
    ).length;

    const normalized = playerMessage.toLowerCase();
    const hasPersuasionKeyword = PERSUASION_KEYWORDS.some((keyword) =>
      normalized.includes(keyword),
    );

    if (hasPersuasionKeyword && turnCount >= 1) {
      return lines[Math.min(lines.length - 1, turnCount + 1)];
    }

    return lines[Math.min(lines.length - 1, turnCount)];
  }

  async checkProgressionAllowed(
    character: Character,
    playerMessage: string,
    characterResponse: string,
  ): Promise<boolean> {
    const messagesWithCharacter = this.gameState.conversationHistory.filter(
      (msg) => msg.character === character.id,
    ).length;

    const threshold = CHARACTER_THRESHOLDS[character.id] ?? 3;
    const normalizedPlayer = playerMessage.toLowerCase();
    const normalizedReply = characterResponse.toLowerCase();
    const usedPersuasion = PERSUASION_KEYWORDS.some((keyword) =>
      normalizedPlayer.includes(keyword),
    );
    const positiveReply = /well|pass|grant|open|go to eurydice|ferry/i.test(
      normalizedReply,
    );

    if (positiveReply) {
      return true;
    }

    if (usedPersuasion && messagesWithCharacter >= threshold - 1) {
      return true;
    }

    return messagesWithCharacter >= threshold;
  }

  addMessage(message: DialogueMessage) {
    this.messageHistory.push(message);
    this.updateHistoryDisplay();
  }

  updateHistoryDisplay() {
    this.historyTexts.forEach((text) => {
      text.destroy();
    });
    this.historyTexts = [];

    const maxVisibleMessages = 3;
    const visibleMessages = this.messageHistory.slice(-maxVisibleMessages);

    visibleMessages.forEach((msg, index) => {
      const color = msg.isPlayer ? '#88ccff' : '#ffcc88';
      const text = this.scene.add
        .text(0, index * 62, `${msg.speaker}: ${msg.text}`, {
          fontFamily: 'UnifrakturCook',
          fontSize: '30px',
          color,
          wordWrap: { width: WIDTH - 220 },
        })
        .setDepth(9);

      this.historyContainer.add(text);
      this.historyTexts.push(text);
    });
  }

  clearHistory() {
    this.messageHistory = [];
    this.updateHistoryDisplay();
  }

  setCharacter(character: Character) {
    this.currentCharacter = character;
    this.clearHistory();
    this.buildOptions();
    this.renderOptions();

    this.dialogueText.setText(
      `You are now speaking with ${character.name}\n${character.description}`,
    );
  }

  show() {
    this.isActive = true;
    this.dialogueBox.setVisible(true);
    this.dialogueText.setVisible(true);
    this.historyContainer.setVisible(true);
    this.promptText.setVisible(true);
    this.optionHintText.setVisible(true);
    this.buildOptions();
    this.renderOptions();
  }

  hide() {
    this.isActive = false;
    this.dialogueBox.setVisible(false);
    this.dialogueText.setVisible(false);
    this.historyContainer.setVisible(false);
    this.promptText.setVisible(false);
    this.optionHintText.setVisible(false);
    this.optionTexts.forEach((text) => text.setVisible(false));
  }

  closeDialogue() {
    this.hide();
    if (this.onDialogueClose) {
      this.onDialogueClose();
    }
  }

  destroy() {
    this.dialogueBox.destroy();
    this.dialogueText.destroy();
    this.historyContainer.destroy();
    this.optionHintText.destroy();
    this.optionTexts.forEach((text) => text.destroy());
  }
}
