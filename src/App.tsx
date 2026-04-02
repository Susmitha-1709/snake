/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 65;

const TRACKS = [
  { id: 1, title: "DATA_NODE_0x01", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "DATA_NODE_0x02", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "DATA_NODE_0x03", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];

export default function App() {
  // Game State
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 15, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('synthSnakeHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });

  const directionRef = useRef(INITIAL_DIRECTION);
  const nextDirectionRef = useRef(INITIAL_DIRECTION);

  // Music Player State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Game Logic ---
  const spawnFood = useCallback((currentSnake: {x: number, y: number}[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // eslint-disable-next-line no-loop-func
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    setFood(newFood);
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    directionRef.current = INITIAL_DIRECTION;
    nextDirectionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    spawnFood(INITIAL_SNAKE);
  };

  useEffect(() => {
    localStorage.setItem('synthSnakeHighScore', highScore.toString());
  }, [highScore]);

  useEffect(() => {
    if (gameOver || isPaused) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        directionRef.current = nextDirectionRef.current;
        const head = prevSnake[0];
        const newHead = {
          x: head.x + directionRef.current.x,
          y: head.y + directionRef.current.y
        };

        // Collision with walls
        if (
          newHead.x < 0 || 
          newHead.x >= GRID_SIZE || 
          newHead.y < 0 || 
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          return prevSnake;
        }

        // Collision with self
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Collision with food
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => {
            const newScore = s + 10;
            if (newScore > highScore) setHighScore(newScore);
            return newScore;
          });
          spawnFood(newSnake);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const intervalId = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(intervalId);
  }, [gameOver, isPaused, food, highScore, spawnFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ') {
        if (gameOver) {
          resetGame();
        } else {
          setIsPaused(p => !p);
        }
        return;
      }

      if (gameOver || isPaused) return;

      const { x, y } = directionRef.current;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (y !== 1) nextDirectionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (y !== -1) nextDirectionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (x !== 1) nextDirectionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (x !== -1) nextDirectionRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, isPaused]);

  // --- Music Player Logic ---
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Play failed", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipForward = useCallback(() => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  }, []);

  const skipBackward = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  };

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio play failed", e));
    }
  }, [currentTrackIndex, isPlaying]);

  return (
    <div className="min-h-screen bg-black text-white font-terminal uppercase flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-[#ff00ff] selection:text-black animate-flicker">
      
      {/* CRT Scanlines & Noise */}
      <div className="fixed inset-0 bg-noise z-50 pointer-events-none mix-blend-screen opacity-20"></div>
      <div className="fixed inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] z-40 pointer-events-none"></div>
      
      {/* Header */}
      <div className="relative mb-8 z-10 text-center">
        <h1 className="text-3xl md:text-5xl font-pixel text-white relative inline-block">
          <span className="relative z-10">SNAKE.EXE</span>
          <span className="absolute top-0 left-[3px] w-full h-full text-[#00ffff] mix-blend-screen animate-tear-1 z-0" aria-hidden="true">SNAKE.EXE</span>
          <span className="absolute top-0 left-[-3px] w-full h-full text-[#ff00ff] mix-blend-screen animate-tear-2 z-0" aria-hidden="true">SNAKE.EXE</span>
        </h1>
        <p className="text-[#00ffff] mt-4 text-xl tracking-[0.3em] animate-pulse">STATUS: GLITCH_VARIANT_ACTIVE</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 z-10 w-full max-w-5xl justify-center items-start">
        
        {/* Game Container */}
        <div className="flex flex-col items-center bg-black p-6 border-4 border-[#00ffff] shadow-[8px_8px_0px_#ff00ff] w-full max-w-[480px] relative">
          
          {/* Decorative Corners */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#ff00ff] -translate-x-1 -translate-y-1"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#ff00ff] translate-x-1 -translate-y-1"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#ff00ff] -translate-x-1 translate-y-1"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#ff00ff] translate-x-1 translate-y-1"></div>

          <div className="flex justify-between w-full mb-4 px-2 text-xl">
            <div className="flex flex-col">
              <span className="text-[#ff00ff]">DATA_COLLECTED</span>
              <span className="text-[#00ffff] font-pixel text-lg mt-1">{score.toString().padStart(4, '0')}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[#ff00ff]">MAX_OVERFLOW</span>
              <span className="text-[#00ffff] font-pixel text-lg mt-1">{highScore.toString().padStart(4, '0')}</span>
            </div>
          </div>
          
          <div 
            className="relative bg-[#050505] border-2 border-[#ff00ff] overflow-hidden"
            style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}
          >
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ffff1a_1px,transparent_1px),linear-gradient(to_bottom,#00ffff1a_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

            {/* Snake */}
            {snake.map((segment, index) => {
              const isHead = index === 0;
              return (
                <div
                  key={`${segment.x}-${segment.y}-${index}`}
                  className={`absolute ${isHead ? 'bg-[#ffffff]' : 'bg-[#00ffff]'}`}
                  style={{
                    left: segment.x * CELL_SIZE,
                    top: segment.y * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    boxShadow: isHead ? '0 0 10px #00ffff' : 'none'
                  }}
                />
              );
            })}
            
            {/* Food */}
            <div
              className="absolute bg-[#ff00ff] animate-pulse"
              style={{
                left: food.x * CELL_SIZE,
                top: food.y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
                boxShadow: '0 0 10px #ff00ff'
              }}
            />

            {/* Overlays */}
            {gameOver && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20">
                <div className="text-[#ff00ff] text-2xl font-pixel mb-4 text-center leading-relaxed">
                  SYSTEM<br/>FAILURE
                </div>
                <div className="text-[#00ffff] text-xl mb-8">ERR_CODE: {score}</div>
                <button 
                  onClick={resetGame}
                  className="px-6 py-2 bg-transparent border-2 border-[#00ffff] text-[#00ffff] font-pixel text-xs hover:bg-[#00ffff] hover:text-black transition-colors"
                >
                  [ REBOOT_SYSTEM ]
                </button>
              </div>
            )}
            {isPaused && !gameOver && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
                <div className="text-[#00ffff] text-2xl font-pixel animate-pulse">AWAITING_INPUT</div>
              </div>
            )}
          </div>

          <div className="mt-6 text-[#ff00ff] text-lg flex flex-col items-center gap-1">
            <span>INPUT: [W][A][S][D] // ARROWS</span>
            <span>INTERRUPT: [SPACE]</span>
          </div>
        </div>

        {/* Music Player Container */}
        <div className="flex flex-col bg-black p-6 border-4 border-[#ff00ff] shadow-[8px_8px_0px_#00ffff] w-full max-w-[360px] relative">
          
          {/* Decorative Corners */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#00ffff] -translate-x-1 -translate-y-1"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#00ffff] translate-x-1 -translate-y-1"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#00ffff] -translate-x-1 translate-y-1"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#00ffff] translate-x-1 translate-y-1"></div>

          <h2 className="text-2xl mb-6 text-[#00ffff] border-b-2 border-[#00ffff] pb-2 inline-block">
            &gt; AUDIO_SUBSYSTEM
          </h2>

          <div className="bg-[#050505] border-2 border-[#00ffff] p-4 mb-8 relative">
            
            <div className="flex justify-between items-start mb-4">
              <div className="text-sm text-[#ff00ff]">STREAM_ID: 0x{currentTrackIndex + 1}</div>
              {isPlaying ? (
                <div className="text-[#00ffff] animate-pulse">[ ACTIVE ]</div>
              ) : (
                <div className="text-gray-600">[ IDLE ]</div>
              )}
            </div>
            
            <div className="text-xl text-white mb-6 font-pixel text-sm leading-relaxed">
              {TRACKS[currentTrackIndex].title}
            </div>
            
            {/* Raw Audio Visualizer */}
            <div className="flex items-end gap-1 h-16 border-b-2 border-[#ff00ff]">
              {[...Array(12)].map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 bg-[#00ffff] ${isPlaying ? 'animate-eq-raw' : 'h-1 opacity-30'}`}
                  style={{ 
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${0.2 + Math.random() * 0.3}s`
                  }}
                ></div>
              ))}
            </div>
          </div>

          <div className="flex justify-center items-center gap-4 text-xl">
            <button 
              onClick={skipBackward} 
              className="px-3 py-2 border-2 border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black transition-colors"
            >
              [ &lt;&lt; ]
            </button>
            
            <button 
              onClick={togglePlay} 
              className="px-6 py-2 border-2 border-[#00ffff] text-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-colors font-pixel text-xs"
            >
              {isPlaying ? '[ HALT ]' : '[ EXECUTE ]'}
            </button>
            
            <button 
              onClick={skipForward} 
              className="px-3 py-2 border-2 border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-black transition-colors"
            >
              [ &gt;&gt; ]
            </button>
          </div>
          
          <audio 
            ref={audioRef} 
            src={TRACKS[currentTrackIndex].url} 
            onEnded={skipForward}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </div>

      </div>
    </div>
  );
}
