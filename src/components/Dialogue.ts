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
  inputField: Phaser.GameObjects.DOMElement | null = null;
  messageHistory: DialogueMessage[] = [];
  historyContainer: GameObjects.Container;
  historyTexts: GameObjects.Text[] = [];
  promptText: GameObjects.Text;
  isWaitingForResponse = false;

  onProgressionAllowed?: () => void;
  onDialogueClose?: () => void;

  constructor(scene: Scene, gameState: GameState) {
    this.scene = scene;
    this.gameState = gameState;

    const boxHeight = 250;
    const boxY = HEIGHT - boxHeight - 20;

    this.dialogueBox = scene.add.graphics();
    this.dialogueBox.fillStyle(0x000000, 0.9);
    this.dialogueBox.fillRoundedRect(40, boxY, WIDTH - 80, boxHeight, 16);
    this.dialogueBox.lineStyle(4, 0xffffff, 1);
    this.dialogueBox.strokeRoundedRect(40, boxY, WIDTH - 80, boxHeight, 16);
    this.dialogueBox.setDepth(10);

    this.dialogueText = scene.add
      .text(80, boxY + 30, '', {
        fontFamily: 'UnifrakturCook',
        fontSize: '32px',
        color: '#ffffff',
        wordWrap: { width: WIDTH - 160 },
      })
      .setDepth(11);

    this.historyContainer = scene.add.container(80, 80);
    this.historyContainer.setDepth(9);

    this.promptText = scene.add
      .text(WIDTH / 2, HEIGHT - 50, 'Press E to close dialogue', {
        fontFamily: 'UnifrakturCook',
        fontSize: '28px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5)
      .setDepth(12);

    this.createInputField(boxY + boxHeight - 70);
    this.hide();

    // Close dialogue with E key
    scene.input.keyboard?.on('keydown-E', () => {
      if (this.isActive) {
        this.closeDialogue();
      }
    });
  }

  createInputField(y: number) {
    const inputHTML = `
			<div style="display: flex; align-items: center; width: ${WIDTH - 200}px;">
				<input
					type="text"
					id="dialogue-input"
					placeholder="Type your response..."
					style="
						flex: 1;
						padding: 12px 16px;
						font-family: 'UnifrakturCook', serif;
						font-size: 24px;
						background: #1b1b1c;
						color: #ffffff;
						border: 2px solid #ffffff;
						border-radius: 8px;
						outline: none;
					"
				/>
				<button
					id="dialogue-submit"
					style="
						margin-left: 12px;
						padding: 12px 24px;
						font-family: 'UnifrakturCook', serif;
						font-size: 24px;
						background: #ffffff;
						color: #1b1b1c;
						border: none;
						border-radius: 8px;
						cursor: pointer;
					"
				>Send</button>
			</div>
		`;

    this.inputField = this.scene.add
      .dom(WIDTH / 2, y, 'div')
      .createFromHTML(inputHTML)
      .setDepth(12);

    const input = document.getElementById('dialogue-input') as HTMLInputElement;
    const button = document.getElementById('dialogue-submit');

    if (input && button) {
      const submitHandler = () => this.handlePlayerInput();

      button.addEventListener('click', submitHandler);
      input.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          submitHandler();
        }
      });
    }
  }

  async handlePlayerInput() {
    const input = document.getElementById('dialogue-input') as HTMLInputElement;
    const button = document.getElementById(
      'dialogue-submit',
    ) as HTMLButtonElement | null;

    if (
      !input ||
      !input.value.trim() ||
      !this.currentCharacter ||
      this.isWaitingForResponse
    ) {
      return;
    }

    const playerMessage = input.value.trim();
    input.value = '';
    this.isWaitingForResponse = true;
    input.disabled = true;
    if (button) {
      button.disabled = true;
      button.style.opacity = '0.7';
      button.style.cursor = 'not-allowed';
    }

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
    }

    this.isWaitingForResponse = false;
    input.disabled = false;
    input.focus();
    if (button) {
      button.disabled = false;
      button.style.opacity = '1';
      button.style.cursor = 'pointer';
    }
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

    const maxVisibleMessages = 4;
    const visibleMessages = this.messageHistory.slice(-maxVisibleMessages);

    visibleMessages.forEach((msg, index) => {
      const color = msg.isPlayer ? '#88ccff' : '#ffcc88';
      const text = this.scene.add
        .text(0, index * 50, `${msg.speaker}: ${msg.text}`, {
          fontFamily: 'UnifrakturCook',
          fontSize: '24px',
          color,
          wordWrap: { width: WIDTH - 200 },
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

    this.dialogueText.setText(
      `You are now speaking with ${character.name}\n${character.description}`,
    );
  }

  show() {
    this.isActive = true;
    this.dialogueBox.setVisible(true);
    this.dialogueText.setVisible(true);
    if (this.inputField) this.inputField.setVisible(true);
    this.historyContainer.setVisible(true);
    this.promptText.setVisible(true);
  }

  hide() {
    this.isActive = false;
    this.dialogueBox.setVisible(false);
    this.dialogueText.setVisible(false);
    if (this.inputField) this.inputField.setVisible(false);
    this.historyContainer.setVisible(false);
    this.promptText.setVisible(false);
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
    if (this.inputField) this.inputField.destroy();
    this.historyContainer.destroy();
  }
}
