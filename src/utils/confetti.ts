import confetti from 'canvas-confetti';

/**
 * TIKTOK SIGNATURE COLOR PALETTE:
 * Neon Pink: #FE2C55, #FF0050, #E00040
 * Cyber Turquoise: #25F4EE, #00F2FE, #00D5D0
 * Accents: Pure White #FFFFFF & Trophy Gold #FFD700
 */
export const TIKTOK_CONFETTI_COLORS = [
  '#FE2C55', // TikTok Neon Pink/Red
  '#25F4EE', // TikTok Cyber Cyan/Turquoise
  '#FF0050', // TikTok Vibrant Pink
  '#00F2FE', // Electric Cyan
  '#FFFFFF', // Bright White Highlight
  '#FFD700', // Trophy Gold
];

/**
 * Quick single-shot confetti burst in TikTok colors
 */
export function fireConfetti(customOptions?: confetti.Options) {
  try {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6, x: 0.5 },
      colors: TIKTOK_CONFETTI_COLORS,
      ticks: 250,
      gravity: 1,
      scalar: 1.1,
      zIndex: 99999,
      disableForReducedMotion: true,
      ...customOptions,
    });
  } catch (err) {
    console.warn('Canvas confetti error:', err);
  }
}

/**
 * Quick burst when an individual winner is locked in
 */
export function fireWinnerLockConfetti(originX = 0.5) {
  try {
    // Left & right simultaneous pop
    confetti({
      particleCount: 45,
      angle: 60,
      spread: 45,
      origin: { x: Math.max(0, originX - 0.15), y: 0.65 },
      colors: ['#FE2C55', '#25F4EE', '#FFFFFF'],
      ticks: 180,
      scalar: 0.95,
      zIndex: 99999,
    });

    confetti({
      particleCount: 45,
      angle: 120,
      spread: 45,
      origin: { x: Math.min(1, originX + 0.15), y: 0.65 },
      colors: ['#25F4EE', '#FE2C55', '#FFFFFF'],
      ticks: 180,
      scalar: 0.95,
      zIndex: 99999,
    });
  } catch (err) {
    console.warn('Winner lock confetti error:', err);
  }
}

/**
 * FULL-SCREEN TIKTOK GRAND CELEBRATION (Tüm Ekranda Patlayan Kutlama):
 * High-voltage multi-wave celebration featuring:
 * 1. Center explosive sonic burst
 * 2. Cross-screen dual cannons from bottom-left and bottom-right corners
 * 3. Cascade shower wave of neon pink and turquoise confetti
 */
export function fireTikTokGrandCelebration() {
  try {
    const end = Date.now() + 3.2 * 1000;

    // 1. Immediate Center Massive Burst
    confetti({
      particleCount: 120,
      spread: 100,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.45 },
      colors: TIKTOK_CONFETTI_COLORS,
      ticks: 350,
      gravity: 0.9,
      scalar: 1.25,
      zIndex: 99999,
    });

    // 2. High-speed continuous corner cannons (Left & Right)
    const interval: NodeJS.Timeout = setInterval(() => {
      const timeLeft = end - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / (3.2 * 1000));

      // Left corner cannon blasting diagonally across
      confetti({
        particleCount: Math.floor(particleCount * 0.9),
        angle: 60,
        spread: 65,
        startVelocity: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#FE2C55', '#FF0050', '#FFFFFF', '#FFD700'],
        ticks: 250,
        scalar: 1.1,
        zIndex: 99999,
      });

      // Right corner cannon blasting diagonally across
      confetti({
        particleCount: Math.floor(particleCount * 0.9),
        angle: 120,
        spread: 65,
        startVelocity: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#25F4EE', '#00F2FE', '#FFFFFF', '#FFD700'],
        ticks: 250,
        scalar: 1.1,
        zIndex: 99999,
      });
    }, 280);

    // 3. Delayed skyburst finale in the middle
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 120,
        startVelocity: 35,
        origin: { x: 0.5, y: 0.3 },
        colors: ['#FE2C55', '#25F4EE', '#FFFFFF'],
        ticks: 300,
        scalar: 1.3,
        zIndex: 99999,
      });
    }, 1200);
  } catch (err) {
    console.warn('Grand celebration confetti error:', err);
  }
}
