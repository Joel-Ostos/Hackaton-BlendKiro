# Requirements Document

## Introduction

Flappy Kiro is a retro-styled endless side-scrolling browser game inspired by Flappy Bird. The player controls a ghost character ("Ghosty") that navigates through gaps between vertical pipes using physics-based flight mechanics. The game features a hand-drawn aesthetic with provided visual assets, progressive difficulty, a lives system, collectible coins, and comprehensive audio/visual feedback. The game is implemented as an HTML5 Canvas application using vanilla JavaScript with no external dependencies.

## Glossary

- **Game_Engine**: The core game loop and rendering system
- **Physics_System**: The subsystem that calculates gravity, velocity, and momentum
- **Ghosty**: The player-controlled ghost character sprite
- **Pipe_Pair**: Two vertical pipes (top and bottom) with a gap between them
- **Collision_Detector**: The subsystem that detects intersections between Ghosty and obstacles
- **Config_Manager**: The system that loads and provides access to game configuration parameters
- **Score_Manager**: The subsystem that tracks current score, high score, and lives
- **Audio_Manager**: The subsystem that plays sound effects and background music
- **Particle_System**: The subsystem that generates and animates visual particle effects
- **Game_State**: The current mode of the game (main menu, playing, paused, game over)
- **Canvas**: The HTML5 Canvas element where the game is rendered
- **Asset_Loader**: The subsystem that loads images and audio files
- **Coin**: A collectible item that appears in pipe gaps and awards points
- **Invincibility_Frame**: A brief period after collision during which Ghosty cannot take damage
- **Terminal_Velocity**: The maximum falling speed Ghosty can reach
- **Flap**: The upward impulse applied when the player presses the control key
- **Screen_Shake**: A visual effect that briefly offsets the camera on collision
- **High_Score**: The highest score achieved, persisted in browser localStorage

## Requirements

### Requirement 1: Asset Loading and Usage

**User Story:** As a player, I want the game to use the provided hand-drawn visual assets, so that the game has a consistent retro aesthetic.

#### Acceptance Criteria

1. WHEN the game initializes, THE Asset_Loader SHALL load the background image from `assets/background.png`
2. WHEN the game initializes, THE Asset_Loader SHALL load the Ghosty sprite from `assets/ghosty.png`
3. WHEN the game initializes, THE Asset_Loader SHALL load the asset palette from `assets/assets_palette.png`
4. WHEN the game initializes, THE Asset_Loader SHALL load the jump sound from `assets/jump.wav`
5. WHEN the game initializes, THE Asset_Loader SHALL load the game over sound from `assets/game_over.wav`
6. THE Game_Engine SHALL render all visual elements using the loaded asset images without modification
7. WHEN all required assets are loaded, THE Game_Engine SHALL transition to the main menu state

### Requirement 2: Configuration Management

**User Story:** As a developer, I want all game parameters defined in a single configuration file, so that I can tune gameplay without modifying game logic.

#### Acceptance Criteria

1. THE Config_Manager SHALL load all game parameters from a single `config.js` file
2. THE Config_Manager SHALL provide access to gravity constant, flap velocity, and terminal velocity parameters
3. THE Config_Manager SHALL provide access to pipe speed, pipe gap size, and pipe spawn interval parameters
4. THE Config_Manager SHALL provide access to initial lives count and coin point value parameters
5. THE Config_Manager SHALL provide access to particle system parameters including count, lifetime, and colors
6. THE Config_Manager SHALL provide access to screen shake intensity and duration parameters
7. THE Game_Engine SHALL use configuration values for all gameplay calculations without hardcoded constants

### Requirement 3: Physics System

**User Story:** As a player, I want Ghosty to have realistic physics-based movement, so that the game feels responsive and predictable.

#### Acceptance Criteria

1. WHILE the Game_State is playing, THE Physics_System SHALL apply downward acceleration to Ghosty equal to the configured gravity value
2. WHEN the player presses the flap control, THE Physics_System SHALL apply upward velocity to Ghosty equal to the configured flap velocity
3. WHEN Ghosty velocity exceeds the configured terminal velocity, THE Physics_System SHALL clamp velocity to terminal velocity
4. THE Physics_System SHALL update Ghosty vertical position based on current velocity each frame
5. THE Physics_System SHALL use smooth interpolation for position updates to ensure fluid motion
6. WHEN Ghosty position is updated, THE Physics_System SHALL preserve momentum from previous frames

### Requirement 4: Player Input Handling

**User Story:** As a player, I want to control Ghosty with simple keyboard or mouse input, so that I can focus on timing and navigation.

#### Acceptance Criteria

1. WHEN the player presses the spacebar key, THE Game_Engine SHALL trigger a flap action
2. WHEN the player clicks the Canvas, THE Game_Engine SHALL trigger a flap action
3. WHEN a flap action is triggered AND the Game_State is playing, THE Physics_System SHALL apply flap velocity to Ghosty
4. WHEN a flap action is triggered, THE Audio_Manager SHALL play the jump sound effect
5. WHEN the player presses the pause key AND the Game_State is playing, THE Game_Engine SHALL transition to paused state
6. WHEN the player presses the pause key AND the Game_State is paused, THE Game_Engine SHALL transition to playing state

### Requirement 5: Obstacle Generation

**User Story:** As a player, I want pipes to appear at regular intervals with varying gap positions, so that the game remains challenging and unpredictable.

#### Acceptance Criteria

1. WHEN the configured spawn interval elapses, THE Game_Engine SHALL generate a new Pipe_Pair at the right edge of the Canvas
2. WHEN a Pipe_Pair is generated, THE Game_Engine SHALL randomize the vertical position of the gap within configured bounds
3. THE Game_Engine SHALL set the gap size of each Pipe_Pair to the configured gap size value
4. WHEN a Pipe_Pair moves completely off the left edge of the Canvas, THE Game_Engine SHALL remove it from the game
5. WHILE the Game_State is playing, THE Game_Engine SHALL move all Pipe_Pairs leftward at the current pipe speed
6. WHEN the score increases, THE Game_Engine SHALL increase pipe speed according to the configured difficulty progression

### Requirement 6: Collision Detection

**User Story:** As a player, I want accurate collision detection, so that the game feels fair and responsive.

#### Acceptance Criteria

1. WHEN Ghosty intersects with a Pipe_Pair, THE Collision_Detector SHALL detect a collision
2. WHEN Ghosty vertical position exceeds the Canvas bottom boundary, THE Collision_Detector SHALL detect a collision
3. WHEN Ghosty vertical position is less than the Canvas top boundary, THE Collision_Detector SHALL detect a collision
4. THE Collision_Detector SHALL use precise hitbox calculations based on sprite dimensions
5. WHILE Ghosty is in an Invincibility_Frame period, THE Collision_Detector SHALL not detect collisions with Pipe_Pairs
6. WHEN a collision is detected AND Ghosty is not in an Invincibility_Frame, THE Game_Engine SHALL trigger a collision response

### Requirement 7: Lives System

**User Story:** As a player, I want multiple lives, so that I have opportunities to recover from mistakes.

#### Acceptance Criteria

1. WHEN the game starts, THE Score_Manager SHALL set Ghosty lives to the configured initial lives count
2. WHEN a collision is detected, THE Score_Manager SHALL decrement Ghosty lives by one
3. WHEN a collision is detected, THE Game_Engine SHALL activate an Invincibility_Frame period for the configured duration
4. WHEN lives reach zero, THE Game_Engine SHALL transition to game over state
5. WHILE lives are greater than zero, THE Game_Engine SHALL continue gameplay after collision
6. THE Game_Engine SHALL display the current lives count in the score bar

### Requirement 8: Scoring System

**User Story:** As a player, I want to earn points for passing pipes and collecting coins, so that I can track my progress and compete for high scores.

#### Acceptance Criteria

1. WHEN Ghosty passes the center point of a Pipe_Pair, THE Score_Manager SHALL increment the score by the configured pipe pass point value
2. WHEN Ghosty collects a Coin, THE Score_Manager SHALL increment the score by the configured coin point value
3. WHEN the score increases, THE Game_Engine SHALL display a score popup animation at the event location
4. THE Score_Manager SHALL track the highest score achieved across all game sessions
5. WHEN the game ends, THE Score_Manager SHALL compare the current score to the high score
6. WHEN the current score exceeds the high score, THE Score_Manager SHALL update the high score
7. THE Score_Manager SHALL persist the high score in browser localStorage
8. THE Game_Engine SHALL display current score and high score in the score bar

### Requirement 9: Coin Collection

**User Story:** As a player, I want to collect coins for bonus points, so that I have additional scoring opportunities.

#### Acceptance Criteria

1. WHEN a Pipe_Pair is generated, THE Game_Engine SHALL spawn a Coin in the gap with configured probability
2. THE Game_Engine SHALL position each Coin at the vertical center of the pipe gap
3. WHEN Ghosty intersects with a Coin, THE Collision_Detector SHALL detect a coin collection
4. WHEN a coin collection is detected, THE Game_Engine SHALL remove the Coin from the game
5. WHEN a coin collection is detected, THE Score_Manager SHALL award the configured coin point value
6. WHEN a coin collection is detected, THE Audio_Manager SHALL play a coin collection sound effect
7. WHILE the Game_State is playing, THE Game_Engine SHALL move all Coins leftward at the current pipe speed

### Requirement 10: Visual Effects - Particle System

**User Story:** As a player, I want visual particle effects, so that the game feels dynamic and polished.

#### Acceptance Criteria

1. WHILE the Game_State is playing, THE Particle_System SHALL generate particles behind Ghosty at the configured emission rate
2. THE Particle_System SHALL assign each particle a random color from the configured particle color palette
3. THE Particle_System SHALL assign each particle a lifetime equal to the configured particle lifetime
4. WHILE a particle lifetime is greater than zero, THE Particle_System SHALL update particle position and reduce opacity
5. WHEN a particle lifetime reaches zero, THE Particle_System SHALL remove the particle
6. THE Particle_System SHALL render all active particles on the Canvas each frame

### Requirement 11: Visual Effects - Screen Shake

**User Story:** As a player, I want screen shake on collision, so that I receive immediate visual feedback for mistakes.

#### Acceptance Criteria

1. WHEN a collision is detected, THE Game_Engine SHALL activate screen shake for the configured duration
2. WHILE screen shake is active, THE Game_Engine SHALL apply random offset to the Canvas rendering position
3. THE Game_Engine SHALL set the screen shake offset magnitude to the configured intensity value
4. WHEN the screen shake duration expires, THE Game_Engine SHALL reset the Canvas rendering position to zero offset
5. THE Game_Engine SHALL smoothly interpolate screen shake intensity from maximum to zero over the duration

### Requirement 12: Visual Effects - Parallax Clouds

**User Story:** As a player, I want scrolling clouds in the background, so that the game world feels alive and immersive.

#### Acceptance Criteria

1. WHEN the game initializes, THE Game_Engine SHALL generate cloud sprites at random positions
2. WHILE the Game_State is playing, THE Game_Engine SHALL move clouds leftward at a speed slower than pipe speed
3. WHEN a cloud moves completely off the left edge of the Canvas, THE Game_Engine SHALL reposition it at the right edge
4. THE Game_Engine SHALL render clouds behind all other game elements to create depth
5. THE Game_Engine SHALL use the cloud sprites from the loaded asset palette

### Requirement 13: Audio System

**User Story:** As a player, I want sound effects and background music, so that the game is more engaging and provides audio feedback.

#### Acceptance Criteria

1. WHEN the player triggers a flap action, THE Audio_Manager SHALL play the jump sound effect
2. WHEN a collision is detected, THE Audio_Manager SHALL play a collision sound effect
3. WHEN a coin is collected, THE Audio_Manager SHALL play a coin collection sound effect
4. WHEN the score increases from passing a pipe, THE Audio_Manager SHALL play a score sound effect
5. WHEN the game transitions to game over state, THE Audio_Manager SHALL play the game over sound effect
6. WHILE the Game_State is playing, THE Audio_Manager SHALL play looping background music
7. WHEN the Game_State transitions away from playing, THE Audio_Manager SHALL pause background music

### Requirement 14: Game State Management - Main Menu

**User Story:** As a player, I want a main menu screen, so that I can start the game when ready.

#### Acceptance Criteria

1. WHEN the game initializes AND all assets are loaded, THE Game_Engine SHALL display the main menu screen
2. THE Game_Engine SHALL render the game title on the main menu screen
3. THE Game_Engine SHALL render a start instruction message on the main menu screen
4. THE Game_Engine SHALL render the high score on the main menu screen
5. WHEN the player presses the flap control AND the Game_State is main menu, THE Game_Engine SHALL transition to playing state
6. WHEN transitioning to playing state, THE Game_Engine SHALL initialize Ghosty position, score, and lives

### Requirement 15: Game State Management - Active Gameplay

**User Story:** As a player, I want smooth continuous gameplay, so that I can focus on navigation and scoring.

#### Acceptance Criteria

1. WHILE the Game_State is playing, THE Game_Engine SHALL update physics, obstacles, and collisions each frame
2. WHILE the Game_State is playing, THE Game_Engine SHALL render the background, clouds, pipes, coins, Ghosty, particles, and UI each frame
3. WHILE the Game_State is playing, THE Game_Engine SHALL maintain a consistent frame rate using requestAnimationFrame
4. THE Game_Engine SHALL render the score bar at the bottom of the Canvas showing current score, lives, and high score
5. THE Game_Engine SHALL render Ghosty with smooth animation based on velocity direction

### Requirement 16: Game State Management - Pause

**User Story:** As a player, I want to pause the game, so that I can take breaks without losing progress.

#### Acceptance Criteria

1. WHEN the Game_State transitions to paused, THE Game_Engine SHALL stop updating physics and obstacle movement
2. WHILE the Game_State is paused, THE Game_Engine SHALL continue rendering the current game frame
3. WHILE the Game_State is paused, THE Game_Engine SHALL display a pause indicator overlay
4. WHEN the player presses the pause key AND the Game_State is paused, THE Game_Engine SHALL resume gameplay
5. WHILE the Game_State is paused, THE Audio_Manager SHALL pause all audio playback

### Requirement 17: Game State Management - Game Over

**User Story:** As a player, I want a game over screen with my final score, so that I can see my performance and restart.

#### Acceptance Criteria

1. WHEN lives reach zero, THE Game_Engine SHALL transition to game over state
2. WHEN the Game_State transitions to game over, THE Audio_Manager SHALL play the game over sound effect
3. THE Game_Engine SHALL render a game over message on the screen
4. THE Game_Engine SHALL render the final score on the game over screen
5. THE Game_Engine SHALL render the high score on the game over screen
6. THE Game_Engine SHALL render a restart instruction message on the game over screen
7. WHEN the player presses the flap control AND the Game_State is game over, THE Game_Engine SHALL transition to main menu state

### Requirement 18: Rendering System

**User Story:** As a player, I want crisp, clear graphics that match the retro aesthetic, so that the game is visually appealing.

#### Acceptance Criteria

1. THE Game_Engine SHALL render all graphics on an HTML5 Canvas element
2. THE Game_Engine SHALL render the background image to fill the Canvas
3. THE Game_Engine SHALL render Pipe_Pairs using the pipe sprites from the asset palette
4. THE Game_Engine SHALL render pipe caps using darker green sprites at the top and bottom of each pipe
5. THE Game_Engine SHALL render Ghosty using the loaded Ghosty sprite
6. THE Game_Engine SHALL render Coins using the coin sprite from the asset palette
7. THE Game_Engine SHALL render all UI text using a retro-styled font
8. THE Game_Engine SHALL maintain the pixel-art aesthetic without anti-aliasing on sprites

### Requirement 19: Browser Compatibility

**User Story:** As a player, I want the game to work in modern web browsers, so that I can play without installing software.

#### Acceptance Criteria

1. THE Game_Engine SHALL use only vanilla JavaScript without external dependencies
2. THE Game_Engine SHALL use HTML5 Canvas API for all rendering operations
3. THE Game_Engine SHALL use Web Audio API for all audio playback
4. THE Game_Engine SHALL use localStorage API for high score persistence
5. THE Game_Engine SHALL function correctly in Chrome, Firefox, Safari, and Edge browsers
6. THE Game_Engine SHALL handle browser window resize events gracefully

### Requirement 20: Performance

**User Story:** As a player, I want smooth gameplay without lag, so that I can react precisely to obstacles.

#### Acceptance Criteria

1. THE Game_Engine SHALL maintain a frame rate of at least 60 frames per second during normal gameplay
2. THE Game_Engine SHALL limit the number of active particles to the configured maximum particle count
3. THE Game_Engine SHALL remove off-screen obstacles from memory to prevent memory leaks
4. THE Game_Engine SHALL use efficient collision detection algorithms to minimize computation time
5. WHEN the frame rate drops below 60 frames per second, THE Game_Engine SHALL continue gameplay without crashing

