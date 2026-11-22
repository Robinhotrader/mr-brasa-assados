import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  backgroundColor?: string;
  textColor?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  backgroundColor = '#FF6B35',
  textColor = '#fff',
  disabled = false,
  accessibilityLabel,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.86}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
    >
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 7,
    backgroundColor: colors.brand,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
