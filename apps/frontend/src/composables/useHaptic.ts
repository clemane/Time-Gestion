const canVibrate = 'vibrate' in navigator;

function light() {
  if (canVibrate) navigator.vibrate(10);
}

function medium() {
  if (canVibrate) navigator.vibrate(20);
}

function success() {
  if (canVibrate) navigator.vibrate([10, 50, 10]);
}

export function useHaptic() {
  return { light, medium, success };
}
