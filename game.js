const fs = require('fs');;

let text = '';
let current_character = '';

const genders = {
  MALE: 'male',
  FEMALE: 'female'
}

const animations = {
  IDLE: 'idle',
  SIT: 'sit',
  FALL: 'fall',
  WALK: 'walk',
  HEAR: 'hear',
  LAND: 'land'
}

const characters = {
  AYATO: 'ayato',
  LUMINE: 'lumine'
}

const globalConfig = {
    push2talk: 'A',
    default_character: characters.AYATO,
    initial_x_coordinate: 300,
    initial_y_coordinate: 350,
    task_bar_height: 50,
    boundary_padding: 180,
    world_left_boundary: 0,
    world_right_boundary: window.screen.width
}

const chongyunMetadata = {
  name: characters.AYATO,
  gender: genders.MALE,
  sprite_sheet: "assets/Chongyun.png",
  height: 128,
  width: 124,
  animations: [
      {
          key: animations.IDLE,
          frames: [0]
      },
      {
          key: animations.HEAR,
          frames: [1]        
      },
      {
          key: animations.WALK,
          frames: [8,9,10,11]
      },
      {
          key: animations.SIT,
          frames: [16]
      },
      {
          key: animations.FALL,
          frames: [40]
      },
      {
          key: animations.LAND,
          frames: [41,42],
          repeat: 0
      }
  ]
}

const lumineMetadata = {
  name: characters.LUMINE,
  gender: genders.FEMALE,
  sprite_sheet: "assets/Lumine-xll.png",
  height: 128,
  width: 128,
  animations: [
      {
          key: animations.IDLE,
          frames: [0]
      },
      {
          key: animations.HEAR,
          frames: [1]        
      },
      {
          key: animations.WALK,
          frames: [12,13,14,15]
      },
      {
          key: animations.SIT,
          frames: [24]
      },
      {
          key: animations.FALL,
          frames: [60]
      },
      {
          key: animations.LAND,
          frames: [61,62],
          repeat: 0
      }
  ]
}

const charactersConfig = {
  ayato: {
      metadata: chongyunMetadata,
  },
  lumine: {
      metadata: lumineMetadata
  }
}

const charactersConfigArr = Object.values(charactersConfig);

const safeParseStr = (str) => {
    if(str !== undefined && str !== null) {
        if (typeof str === 'string' && str.trim().length > 0) {
            return str.trim().toLowerCase();
        }
    }
    return str;
}

class mainScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'mainScene'
        })
        this.isPaused = false;
        this.isWalkingRight = true;
        this.isHearing = false;
        this.textJustAppeared = false;
    }

    preload() {
        charactersConfigArr.map(config => {
            this.load.spritesheet(config.metadata.name, './' + config.metadata.sprite_sheet, {
                frameWidth: config.metadata.width,
                frameHeight: config.metadata.height
            })
        })
        
        current_character = safeParseStr(fs.readFileSync('/Users/eran.mando/Downloads/PAI-main2/character_name.txt', 'utf-8'))
        if (current_character.length === 0 || !Object.values(characters).find(char => char === current_character)) {
            current_character = globalConfig.default_character;
        }
    }

    create() {
        this.physics.world.setBounds(0, 0, window.screen.width*2, window.screen.height);
        this.taskbar = this.add.rectangle(0, window.screen.height - 65, window.screen.width*2, 68, 0xff0000, 0);
        this.physics.add.existing(this.taskbar, true);

        const currCharConfig = charactersConfig[current_character]
        currCharConfig.metadata.animations.map(animation => {
            this.anims.create({
                key: animation.key,
                frames: this.anims.generateFrameNumbers(currCharConfig.metadata.name, {
                    frames: animation.frames
                }),
                frameRate: 9,
                repeat: animation.repeat ? animation.repeat : -1
            })
        })

        this.player = this.physics.add.sprite(globalConfig.initial_x_coordinate, globalConfig.initial_y_coordinate, currCharConfig.metadata.name)
        this.player.setInteractive();
        this.player.play(currCharConfig.metadata.animations.find(animation => animation.key === animations.FALL).key);
        this.player.name = currCharConfig.metadata.name;

        this.physics.add.collider(this.player, this.taskbar);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.push2talk = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes[globalConfig.push2talk]);
        console.log(this.push2talk)
        this.player.on('pointerdown', this.handleCharacterClick, this);
    }

   async update() {
        current_character = safeParseStr(fs.readFileSync('/Users/eran.mando/Downloads/PAI-main2/character_name.txt', 'utf-8'))
        if (current_character.length === 0 || !Object.values(characters).find(char => char === current_character)) {
            current_character = globalConfig.default_character;
        }
        if(current_character !== this.player.name) {
            this.isPaused = false;
            this.isWalkingRight = true;
            this.removeAllAnimations();
            this.scene.restart();
        }
        if (this.isPaused)
            return;
        if (!this.player.body.touching.down)
            return;
        if (this.player.anims.currentAnim.key === animations.FALL) {
            this.player.play(animations.LAND)
            this.pauseUpdate(225)
            return;
        }
       text = fs.readFileSync("/Users/eran.mando/Downloads/PAI-main2/response.txt", 'utf-8')
        if (this.player.anims.currentAnim.key === animations.LAND) {
            this.player.play(animations.WALK);
        }
        else if(text) {
            this.textJustAppeared = true;
            this.player.play(animations.IDLE);
            if (!this.bubble || !this.bubbleText){
                this.createSpeechBubble();
                return;
            }   
            return;
        }
        else if (this.push2talk.isDown) {
            this.player.play(animations.HEAR)
        }
        else if (this.player.anims.currentAnim.key === animations.HEAR) {
            this.player.play(animations.WALK)
        }
        else if (this.player.anims.currentAnim.key === animations.WALK) {
            if (this.player.x === 0 + globalConfig.boundary_padding) {
                this.isWalkingRight = true;
                this.player.x += 1;
                this.player.flipX = false;
            } else if (this.player.x === window.innerWidth - globalConfig.boundary_padding) {
                this.isWalkingRight = false;
                this.player.x -= 1;
                this.player.flipX = true;
            } else {
                this.player.x += (this.isWalkingRight ? 1 : -1)
            }
        } else if (this.player.anims.currentAnim.key === animations.IDLE && this.textJustAppeared) {
            this.textJustAppeared = false;
            if (this.bubble)
                this.bubble.destroy();
            if (this.bubbleText)
                this.bubbleText.destroy();
            this.player.play(animations.WALK);
            this.bubble = null
            this.bubbleText = null
        }
    }

    pauseUpdate(duration) {
        this.isPaused = true;
        this.time.delayedCall(duration, () => {
            this.isPaused = false;
        }, [], this);
    }

    handleCharacterClick() {
        if (this.player.anims.currentAnim.key === animations.WALK)
            this.player.play(animations.IDLE)
        else if (this.player.anims.currentAnim.key === animations.IDLE)
            this.player.play(animations.SIT, true)
        else if (this.player.anims.currentAnim.key === animations.SIT)
            this.player.play(animations.WALK)
    }

    createSpeechBubble() {
        const words = text.split(' ');
        const wordsPerLine = 7;
        const numLines = Math.ceil((words.length > 30 ? 30 : words.length)  / wordsPerLine);
        const padding = 10;
        const lineHeight = 18;
        const bubbleWidth = 150*2; // Fixed width for wrapping text
        const bubbleHeight = lineHeight * numLines + padding + 15; // Adjusted for pointer height
        
        // Create a graphics object for the speech bubble background
        const bubbleX = this.player.x - bubbleWidth / 2;
        const bubbleY = this.player.y - this.player.height / 2 - bubbleHeight - 5;
        
        this.bubble = this.add.graphics({ x: bubbleX, y: bubbleY });
        
        // bubble background
        this.bubble.fillStyle(0xffffff, 1);
        this.bubble.fillRoundedRect(0, 0, bubbleWidth, bubbleHeight - 10, 10);
        this.bubble.lineStyle(4, current_character === 'lumine' ? 0xB8860B : 0x5A9BCD, 1);
        this.bubble.strokeRoundedRect(0, 0, bubbleWidth, bubbleHeight - 10, 10);
        
        // Create the speech bubble pointer
        this.bubble.fillStyle(0xffffff, 1);
        this.bubble.beginPath();
        this.bubble.moveTo(bubbleWidth / 2 - 10, bubbleHeight);
        this.bubble.lineTo(bubbleWidth / 2 + 10, bubbleHeight);
        this.bubble.lineTo(bubbleWidth / 2, bubbleHeight+10);
        this.bubble.closePath();
        this.bubble.fillPath();
        this.bubble.lineStyle(4, current_character === 'lumine' ? 0xB8860B : 0x5A9BCD, 1);
        this.bubble.strokePath();
        
        // Add text to the bubble
        let bubbleText = '';
        if (words.length > 30) {
            const first30Words = words.slice(0, 30);
            bubbleText = first30Words.join(' ') + ' ...';
        } else {
            bubbleText = words.join(' ');
        }
        const textStyle = {
            font: '14px Arial',
            fill: current_character === 'lumine' ? '#B8860B' : '#5A9BCD',
            wordWrap: { width: bubbleWidth - padding * 2 }
        };
        this.bubbleText = this.add.text(bubbleX + padding, bubbleY + padding, bubbleText, textStyle);
    }

    removeAllAnimations() {
        Object.keys(this.anims.anims.entries).map((key) => {
          this.anims.remove(key);
        });
      }
}

const gameConfig = {
    type: Phaser.AUTO,
    transparent: true,
    roundPixels: true,
    antialias: true,
    scale: {
        mode: Phaser.Scale.ScaleModes.RESIZE,
        width: window.screen.width,
        height: window.screen.height,
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 200, x: 0},
        },
    },
    fps: {
        target: 15,
        min: 15,
        smoothStep: true,
    },
    scene: mainScene,
};



const game = new Phaser.Game(gameConfig);
