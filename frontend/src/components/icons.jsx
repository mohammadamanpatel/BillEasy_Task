// Shared helper filling in the boring SVG attributes for every icon:
// the square size and the stroke style.
function base(props, size) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
    ...props,
  };
}

export const Icon = {
  // The sparkle that stands for the AI assistant.
  Sparkles: ({ size = 20, ...props }) => (
    <svg {...base(props, size)}>
      <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z" />
      <path d="M19 14l.9 2.2L22 17l-2.1.8L19 20l-.9-2.2L16 17l2.1-.8L19 14z" />
      <path d="M5 15l.7 1.7L7.5 17l-1.8.8L5 19.5l-.7-1.7L2.5 17l1.8-.3L5 15z" />
    </svg>
  ),

  // A cardboard box, used for "Products".
  Box: ({ size = 20, ...props }) => (
    <svg {...base(props, size)}>
      <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
      <path d="M3 8l9 5 9-5" />
      <path d="M12 13v8" />
    </svg>
  ),

  // A price tag, used for "Saved offers".
  Tag: ({ size = 20, ...props }) => (
    <svg {...base(props, size)}>
      <path d="M20.6 13.4L11.2 22.8a2 2 0 01-2.8 0L2 16.6V2h14.6l4 4a2 2 0 010 2.8l-4 4z" />
      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),

  // A paper plane, used by the send button.
  Send: ({ size = 20, ...props }) => (
    <svg {...base(props, size)}>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  ),

  // The "close" X.
  X: ({ size = 20, ...props }) => (
    <svg {...base(props, size)}>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  ),

  // The garbage bin, used for delete actions.
  Trash: ({ size = 20, ...props }) => (
    <svg {...base(props, size)}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  ),

  // A plus sign, used on the add-product button.
  Plus: ({ size = 20, ...props }) => (
    <svg {...base(props, size)}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  ),

  // A warning triangle, used for the danger icon in popups.
  Alert: ({ size = 20, ...props }) => (
    <svg {...base(props, size)}>
      <path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  ),

  // A check mark shown in toasts and saved states.
  Check: ({ size = 20, ...props }) => (
    <svg {...base(props, size)}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),

  // A rising trend line, used for the margin stat.
  Trend: ({ size = 20, ...props }) => (
    <svg {...base(props, size)}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M21 7v5h-5" />
    </svg>
  ),
};