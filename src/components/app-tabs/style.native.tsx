import type { TextStyle } from 'react-native';

export function getNativeTabsLabelStyle(textColor: string): { selected: TextStyle } {
  return {
    selected: { color: textColor },
  };
}
