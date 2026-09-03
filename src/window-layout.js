const centeredPetModes = new Set(['setup', 'preferences', 'scout', 'lead']);

function nextWindowOrigin({ x, y, oldWidth, oldHeight, newWidth, newHeight, fromMode, toMode }) {
  const preservePetCenter = centeredPetModes.has(fromMode) && centeredPetModes.has(toMode);
  return {
    x: preservePetCenter
      ? Math.round(x + oldWidth / 2 - newWidth / 2)
      : x + oldWidth - newWidth,
    y: y + oldHeight - newHeight
  };
}

module.exports = { centeredPetModes, nextWindowOrigin };
