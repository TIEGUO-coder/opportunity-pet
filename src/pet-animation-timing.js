function frameIndexAtElapsed(elapsedMs, frameDurationMs, frameCount, loop = true) {
  if (!frameCount) return 0;
  const rawIndex = Math.floor(Math.max(0, elapsedMs) / Math.max(1, frameDurationMs));
  return loop ? rawIndex % frameCount : Math.min(rawIndex, frameCount - 1);
}

function actionDuration(frameDurationMs, frameCount) {
  return Math.max(1, frameDurationMs) * Math.max(0, frameCount);
}

const petAnimationTimingApi = { frameIndexAtElapsed, actionDuration };
if (typeof module !== 'undefined' && module.exports) module.exports = petAnimationTimingApi;
if (typeof window !== 'undefined') window.PET_ANIMATION_TIMING = petAnimationTimingApi;
