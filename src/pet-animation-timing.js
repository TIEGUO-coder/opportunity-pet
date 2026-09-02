function frameIndexAtElapsed(elapsedMs, frameDurationMs, frameCount, loop = true) {
  if (!frameCount) return 0;
  const rawIndex = Math.floor(Math.max(0, elapsedMs) / Math.max(1, frameDurationMs));
  return loop ? rawIndex % frameCount : Math.min(rawIndex, frameCount - 1);
}

function actionDuration(frameDurationMs, frameCount) {
  return Math.max(1, frameDurationMs) * Math.max(0, frameCount);
}

function scoutStepOffsetAtElapsed(elapsedMs, frameDurationMs, totalFrames = 16, startX = 24, endX = -24) {
  const safeFrameCount = Math.max(1, totalFrames);
  const stepIndex = Math.min(
    Math.floor(Math.max(0, elapsedMs) / Math.max(1, frameDurationMs)),
    safeFrameCount - 1
  );
  if (safeFrameCount === 1) return endX;
  return startX + ((endX - startX) * stepIndex) / (safeFrameCount - 1);
}

const petAnimationTimingApi = { frameIndexAtElapsed, actionDuration, scoutStepOffsetAtElapsed };
if (typeof module !== 'undefined' && module.exports) module.exports = petAnimationTimingApi;
if (typeof window !== 'undefined') window.PET_ANIMATION_TIMING = petAnimationTimingApi;
