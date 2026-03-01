import type { Character } from '../util/types';

export const CHARACTERS: Record<string, Character> = {
    orpheus: {
        id: 'orpheus',
        name: 'Orpheus',
        role: 'protagonist',
        description: 'A legendary musician and poet, devastated by the loss of Eurydice',
    },
    eurydice: {
        id: 'eurydice',
        name: 'Eurydice',
        role: 'beloved',
        description: 'Orpheus\'s wife, trapped in the underworld',
    },
    charon: {
        id: 'charon',
        name: 'Charon',
        role: 'ferryman',
        description: 'The ferryman of the dead, guards the river Styx',
    },
    cerberus: {
        id: 'cerberus',
        name: 'Cerberus',
        role: 'guardian',
        description: 'The three-headed hound guarding the gates of the underworld',
    },
    hades: {
        id: 'hades',
        name: 'Hades',
        role: 'lord',
        description: 'Lord of the underworld, ruler of the dead',
    },
    persephone: {
        id: 'persephone',
        name: 'Persephone',
        role: 'queen',
        description: 'Queen of the underworld, wife of Hades, goddess of spring',
    },
    hermes: {
        id: 'hermes',
        name: 'Hermes',
        role: 'guide',
        description: 'Messenger god and psychopomp, guides souls to the underworld',
    },
};

export const LOCATIONS = [
    { id: 'riverStyx', name: 'River Styx', character: 'charon' },
    { id: 'gates', name: 'Gates of Hades', character: 'cerberus' },
    { id: 'hall', name: 'Hall of Hades', character: 'hades' },
    { id: 'garden', name: 'Persephone\'s Garden', character: 'persephone' },
];
