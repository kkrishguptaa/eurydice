export interface Character {
    id: string;
    name: string;
    role: string;
    sprite?: string;
    description: string;
}

export interface GameState {
    currentLocation: string;
    charactersMetNames: string[];
    charactersBefriended: string[];
    inventory: string[];
    conversationHistory: Array<{
        character: string;
        playerMessage: string;
        characterResponse: string;
        timestamp: number;
    }>;
}

export interface ItemRequirement {
    item: string;
    characterNeeded?: string;
}

export interface DialogueMessage {
    speaker: string;
    text: string;
    isPlayer: boolean;
}
