/** Custom paper-plane transfer glyphs: outgoing points up-right, incoming down-left. */
export function TransferIcon({ direction }: { direction: 'send' | 'receive' }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g transform={direction === 'receive' ? 'rotate(180 12 12)' : undefined}>
        <path
          d="M20.3 3.7 3.9 9.9c-.8.3-.8 1.4.1 1.7l6.5 1.9 1.9 6.5c.3.9 1.4.9 1.7.1l6.2-16.4Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="m10.5 13.5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </g>
    </svg>
  );
}
