const mockTriage = ({ animalType, description }) => {
  const text = (description || '').toLowerCase();

  let urgency = 'MEDIUM';

  const highUrgencyWords = [
    'bleeding',
    'blood',
    'unconscious',
    'severe',
    'badly injured',
    'not breathing',
    'accident',
    'hit by car',
    'fracture',
    'broken',
  ];

  const lowUrgencyWords = [
    'small wound',
    'minor',
    'slight',
    'walking',
    'normal',
  ];

  if (highUrgencyWords.some((word) => text.includes(word))) {
    urgency = 'HIGH';
  } else if (lowUrgencyWords.some((word) => text.includes(word))) {
    urgency = 'LOW';
  }

  return {
    urgency,
    guidance:
      urgency === 'HIGH'
        ? 'Keep a safe distance and avoid moving the animal unless necessary. Rescue support should be contacted quickly.'
        : urgency === 'LOW'
        ? 'Keep the animal in a safe area if possible and wait for rescue support.'
        : 'Keep the animal safe and avoid unnecessary handling while waiting for rescue support.',
    animalType,
  };
};

export default mockTriage;