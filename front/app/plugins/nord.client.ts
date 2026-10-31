// Registers only the Nord <nord-*> custom elements this app actually uses,
// instead of the full `@nordhealth/components` barrel - a bare side-effect
// import of that package has no specifiers for the bundler to tree-shake
// against, so it pulls in every component (~100) on every route. Add an
// import here whenever a new nord-* tag is introduced.
import "@nordhealth/components/lib/Banner.js";
import "@nordhealth/components/lib/Button.js";
import "@nordhealth/components/lib/Card.js";
import "@nordhealth/components/lib/Checkbox.js";
import "@nordhealth/components/lib/Field.js";
import "@nordhealth/components/lib/FieldError.js";
import "@nordhealth/components/lib/FieldLabel.js";
import "@nordhealth/components/lib/Footer.js";
import "@nordhealth/components/lib/Header.js";
import "@nordhealth/components/lib/Icon.js";
import "@nordhealth/components/lib/Input.js";
import "@nordhealth/components/lib/SegmentedControl.js";
import "@nordhealth/components/lib/SegmentedControlItem.js";
import "@nordhealth/components/lib/Spinner.js";
import "@nordhealth/components/lib/Stack.js";
import "@nordhealth/components/lib/Tooltip.js";
import "@nordhealth/components/lib/VisuallyHidden.js";

// Client-only: the task requires CSR, and these are native Web Components
// with no server-renderable representation anyway.
export default defineNuxtPlugin(() => {});
