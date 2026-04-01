// ========================================
// COMPONENT PATTERN LIBRARY
// ========================================

export function getComponentPatterns(): object {
  return {
    patterns: [
      {
        name: "Button",
        description: "Interactive element triggering an action",
        variants: ["primary", "secondary", "ghost", "danger", "link"],
        accessibility: ["Visible focus ring", "aria-label for icon-only", "disabled state with aria-disabled"],
        commonProps: ["variant", "size", "disabled", "loading", "icon", "onClick"],
        structure: "button > [icon?] + text + [loading-spinner?]",
      },
      {
        name: "Card",
        description: "Contained content block with optional media, header, body, and actions",
        variants: ["default", "outlined", "elevated", "interactive"],
        accessibility: ["Semantic heading in header", "alt text on media", "keyboard-accessible actions"],
        commonProps: ["variant", "padding", "media", "title", "actions"],
        structure: "article > [media?] + header + body + [footer/actions?]",
      },
      {
        name: "Modal",
        description: "Overlay dialog requiring user attention",
        variants: ["default", "fullscreen", "drawer", "alert"],
        accessibility: ["role=\"dialog\"", "aria-modal=\"true\"", "Focus trap", "Escape to close", "Return focus on close"],
        commonProps: ["open", "title", "onClose", "size", "closeOnOverlay"],
        structure: "div[role=dialog] > header + content + [footer/actions?]",
      },
      {
        name: "Form",
        description: "Data collection with validation and submission",
        variants: ["single-column", "two-column", "inline", "multi-step"],
        accessibility: ["Label every input", "Error messages with aria-describedby", "Required field indication"],
        commonProps: ["onSubmit", "validation", "layout", "disabled"],
        structure: "form > fieldset* > [label + input + error-message]*  + submit-button",
      },
      {
        name: "Navigation",
        description: "Primary or secondary navigation bar",
        variants: ["horizontal", "vertical", "sidebar", "bottom-tab", "breadcrumb"],
        accessibility: ["nav landmark", "aria-current for active item", "Skip navigation link", "Mobile menu toggle"],
        commonProps: ["items", "activeItem", "orientation", "collapsed"],
        structure: "nav > ul > li* > a",
      },
      {
        name: "DataTable",
        description: "Tabular data display with sorting, filtering, and pagination",
        variants: ["simple", "striped", "bordered", "compact"],
        accessibility: ["caption or aria-label", "scope on th", "Keyboard-navigable sorting", "Responsive wrapper"],
        commonProps: ["columns", "data", "sortable", "pagination", "selectable"],
        structure: "div.table-wrapper > table > thead + tbody + [tfoot?]",
      },
      {
        name: "Tabs",
        description: "Content organization into switchable panels",
        variants: ["horizontal", "vertical", "pill", "underlined"],
        accessibility: ["role=\"tablist\"", "role=\"tab\" + role=\"tabpanel\"", "Arrow key navigation", "aria-selected"],
        commonProps: ["tabs", "activeTab", "onChange", "orientation"],
        structure: "div > div[role=tablist] > button[role=tab]* + div[role=tabpanel]*",
      },
      {
        name: "Alert",
        description: "Status message for user feedback",
        variants: ["info", "success", "warning", "error"],
        accessibility: ["role=\"alert\" for urgent messages", "aria-live for non-urgent", "Dismissible with keyboard"],
        commonProps: ["variant", "title", "message", "dismissible", "icon"],
        structure: "div[role=alert] > [icon?] + content + [dismiss-button?]",
      },
      {
        name: "Input",
        description: "Text input field with label and validation",
        variants: ["text", "email", "password", "search", "textarea", "number"],
        accessibility: ["Associated label", "aria-describedby for help text", "aria-invalid on error", "Error message linked"],
        commonProps: ["label", "placeholder", "value", "onChange", "error", "required", "disabled"],
        structure: "div > label + input + [help-text?] + [error-message?]",
      },
      {
        name: "Hero",
        description: "Large banner section typically at the top of a page",
        variants: ["centered", "split", "with-image", "video-background"],
        accessibility: ["Semantic heading", "alt text on background images", "Sufficient contrast on overlay text"],
        commonProps: ["title", "subtitle", "cta", "media", "alignment"],
        structure: "section > [media?] + div > h1 + p + [cta-button?]",
      },
      {
        name: "Accordion",
        description: "Expandable/collapsible content sections",
        variants: ["single-open", "multi-open", "bordered", "flush"],
        accessibility: ["button trigger", "aria-expanded", "aria-controls", "Unique panel IDs"],
        commonProps: ["items", "allowMultiple", "defaultOpen", "onChange"],
        structure: "div > div* > button[aria-expanded] + div[role=region]",
      },
      {
        name: "Dropdown",
        description: "Popup menu triggered by a button",
        variants: ["select", "menu", "context-menu", "multi-select"],
        accessibility: ["role=\"menu\" or role=\"listbox\"", "Arrow key navigation", "Escape to close", "aria-haspopup"],
        commonProps: ["trigger", "items", "value", "onChange", "placement"],
        structure: "div > button[aria-haspopup] + ul[role=menu] > li[role=menuitem]*",
      },
    ],
  };
}
