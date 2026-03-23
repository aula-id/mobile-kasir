import { getReceiptConfig } from '@/lib/receiptConfig';

interface ReceiptTextViewProps {
  receiptText: string;
  paperWidth?: number;
}

export function ReceiptTextView({ receiptText, paperWidth = 58 }: ReceiptTextViewProps) {
  const config = getReceiptConfig(paperWidth);

  return (
    <div className="flex justify-center">
      <div
        className="bg-white rounded-lg border border-slate-200 max-h-[60vh] overflow-y-auto"
        style={{
          width: `${config.containerWidth}px`,
          padding: `${config.paddingY}px ${config.paddingX}px`,
        }}
      >
        <pre
          className="whitespace-pre text-[#3D405B]"
          style={{
            fontFamily: config.fontFamily,
            fontSize: `${config.fontSize}px`,
            lineHeight: `${config.lineHeight}px`,
            letterSpacing: `${config.letterSpacing}px`,
          }}
        >
          {receiptText}
        </pre>
      </div>
    </div>
  );
}
