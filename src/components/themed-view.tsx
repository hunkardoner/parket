import { View, type ViewProps } from 'react-native';
import { getThemedViewStyle } from './themed-view/style';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  return <View style={[getThemedViewStyle(theme[type ?? 'background']), style]} {...otherProps} />;
}
