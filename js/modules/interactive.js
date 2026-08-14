// What counts as "interactive" for the custom cursor's hover state. Previously
// set on window from an inline <script> in index.html, which put a selector
// listing component class names outside the module graph that owns them.
export const INTERACTIVE_ELEMENTS = [
    'a',
    'button',
    'input',
    'textarea',
    'select',
    '.link-card',
    '.project-card',
    '.theme-toggle',
    '.slide-button-handle',
    '.playlist-card'
].join(', ');
