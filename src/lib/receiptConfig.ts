export interface ReceiptConfig {
  fontSize: number;
  charsPerLine: number;
  letterSpacing: number;
  lineHeight: number;
  containerWidth: number;
  fontFamily: string;
  paddingX: number;
  paddingY: number;
}

const DEFAULT_RECEIPT_CONFIGS: Record<number, ReceiptConfig> = {
  58: {
    fontSize: 19,
    charsPerLine: 32,
    letterSpacing: 0.5,
    lineHeight: 20,
    containerWidth: 403,
    fontFamily: "'IBM Plex Mono', monospace",
    paddingX: 8,
    paddingY: 10,
  },
  42: {
    fontSize: 14,
    charsPerLine: 24,
    letterSpacing: 0.3,
    lineHeight: 15,
    containerWidth: 292,
    fontFamily: "'IBM Plex Mono', monospace",
    paddingX: 6,
    paddingY: 8,
  },
  48: {
    fontSize: 16,
    charsPerLine: 28,
    letterSpacing: 0.4,
    lineHeight: 17,
    containerWidth: 334,
    fontFamily: "'IBM Plex Mono', monospace",
    paddingX: 7,
    paddingY: 9,
  },
  60: {
    fontSize: 19,
    charsPerLine: 33,
    letterSpacing: 0.5,
    lineHeight: 20,
    containerWidth: 417,
    fontFamily: "'IBM Plex Mono', monospace",
    paddingX: 8,
    paddingY: 10,
  },
  80: {
    fontSize: 19,
    charsPerLine: 48,
    letterSpacing: 0.5,
    lineHeight: 20,
    containerWidth: 604,
    fontFamily: "'IBM Plex Mono', monospace",
    paddingX: 10,
    paddingY: 12,
  },
};

export function getReceiptConfig(
  paperWidth: number = 58,
  overrides?: Partial<ReceiptConfig>
): ReceiptConfig {
  const base = DEFAULT_RECEIPT_CONFIGS[paperWidth] || DEFAULT_RECEIPT_CONFIGS[58];
  if (!overrides) return base;
  return { ...base, ...overrides };
}
