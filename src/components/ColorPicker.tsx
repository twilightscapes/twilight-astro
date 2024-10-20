import { useState, useEffect } from 'react';
import type { BasicFormField, FormFieldStoredValue } from "@keystatic/core";
import { TextField } from '@keystar/ui/text-field';
import { Flex } from '@keystar/ui/layout';
import { Text } from '@keystar/ui/typography';

function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function rgbaToHex(rgba: string): { hex: string, alpha: number } {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
  if (match) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const a = match[4] ? parseFloat(match[4]) : 1;
    const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    return { hex, alpha: a };
  }
  return { hex: '#000000', alpha: 1 };
}

export function colorPicker({
  label,
  defaultValue,
  description,
  showOpacity = true,
}: {
  label: string;
  defaultValue?: string;
  description?: string;
  showOpacity?: boolean;
}): BasicFormField<string> {
  return {
    kind: "form",
    formKind: undefined,
    label,
    Input(props) {
      const [color, setColor] = useState(rgbaToHex(props.value || defaultValue || 'rgba(0,0,0,1)'));

      useEffect(() => {
        props.onChange(hexToRgba(color.hex, color.alpha));
      }, [color]);

      const handleColorChange = (hex: string) => {
        setColor(prev => ({ ...prev, hex }));
      };

      const handleOpacityChange = (alpha: number) => {
        setColor(prev => ({ ...prev, alpha }));
      };

      return (
        <Flex direction="column" gap="medium">
          <Text>{label}</Text>
          {description && <Text size="small">{description}</Text>}
          <Flex gap="medium" alignItems="center">
            <input
              type="color"
              value={color.hex}
              onChange={(e) => handleColorChange(e.target.value)}
              style={{ width: '50px', height: '50px' }}
            />
            <TextField
              value={hexToRgba(color.hex, color.alpha)}
              onChange={(value: string) => setColor(rgbaToHex(value))}
            />
          </Flex>
          {showOpacity && (
  <Flex gap="small" alignItems="center">
    <Text size="small" style={{ flexShrink: 0, width: '60px' }}>Opacity:</Text>
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={color.alpha}
      onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
      style={{
        width: '150px',
        WebkitAppearance: 'none',
        background: 'linear-gradient(to right, rgba(249, 249, 249, 0.58), black) no-repeat',
        backgroundSize: 'calc((value - min) / (max - min) * 100%) 100%',
      }}
    />
    <Text size="small" style={{ flexShrink: 0, width: '40px', textAlign: 'right' }}>
      {Math.round(color.alpha * 100)}%
    </Text>
  </Flex>
)}
        </Flex>
      );
    },
    defaultValue() {
      return defaultValue || "";
    },
    parse(value: FormFieldStoredValue) {
      return typeof value === 'string' ? value : '';
    },
    serialize(value) {
      return { value };
    },
    validate(value) {
      return value;
    },
    reader: {
      parse(value: FormFieldStoredValue) {
        return typeof value === 'string' ? value : '';
      },
    },
  };
}