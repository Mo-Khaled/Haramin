import * as Haptics from 'expo-haptics';

/** Haptics are feedback only; a device without a taptic engine must never surface an error. */
function fire(effect: () => Promise<void>): void {
  effect().catch(() => undefined);
}

export const haptics = {
  tap: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  select: () => fire(() => Haptics.selectionAsync()),
  success: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
