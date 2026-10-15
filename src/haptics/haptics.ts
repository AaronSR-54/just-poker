import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useSettingsStore } from '../store/settingsStore';
import { useCapabilityStore } from '../store/capabilityStore';

export type HapticName = 'tap' | 'turn' | 'tick' | 'expire' | 'win';

const fire = (name: HapticName): Promise<void> => {
  switch (name) {
    case 'tap':
      return Haptics.impact({ style: ImpactStyle.Light });
    case 'turn':
      return Haptics.impact({ style: ImpactStyle.Medium });
    case 'tick':
      return Haptics.impact({ style: ImpactStyle.Light });
    case 'expire':
      return Haptics.notification({ type: NotificationType.Warning });
    case 'win':
      return Haptics.notification({ type: NotificationType.Success });
  }
};

export function playHaptic(name: HapticName): void {
  if (!useCapabilityStore.getState().haptics) return;
  if (!useSettingsStore.getState().hapticsEnabled) return;
  void fire(name).catch(() => {});
}
