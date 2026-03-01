import { AUTO, Game, Scale } from 'phaser';
import packageData from '../package.json';
import { Boot } from './scenes/Boot';
import { Garden } from './scenes/Garden';
import { Gates } from './scenes/Gates';
import { Hall } from './scenes/Hall';
import { Home } from './scenes/Home';
import { Menu } from './scenes/Menu';
import { Preloader } from './scenes/Preloader';
import { RiverStyx } from './scenes/RiverStyx';
import { HEIGHT, WIDTH } from './util/constants';

const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: WIDTH,
  height: HEIGHT,
  title: 'Eurydice',
  url: 'https://eurydice.krishg.com',
  version: packageData.version,
  pixelArt: true,
  backgroundColor: '#1b1b1c',
  scene: [Boot, Preloader, Home, Menu, RiverStyx, Gates, Hall, Garden],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
    },
  },
  scale: {
    mode: Scale.ScaleModes.FIT,
    autoCenter: Scale.Center.NO_CENTER,
    fullscreenTarget: 'eurydice-window',
    max: { width: WIDTH, height: HEIGHT },
  },
  dom: {
    createContainer: true,
  },
};

const StartGame = (parent: string) => {
  return new Game({ ...config, parent });
};

export default StartGame;
