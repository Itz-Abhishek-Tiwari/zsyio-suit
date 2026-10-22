# Suite design polish

The five apps share the generated tokens and UI components in `packages/ui`.

## Foundations

Edit `tokens/primitives.json` for colors, radii, typography and shadows. Semantic light/dark mappings live in `scripts/build-tokens.mjs`. Run `node scripts/build-tokens.mjs` to synchronize all apps; never edit generated CSS. The radius scale is 2, 3, 4, 6, 8 and 12 pixels. Use 3–4 pixel corners on controls and 6–8 pixel corners on cards. Avoid pill shapes except status dots and genuinely circular elements. Dense dashboards retain their compact layout.

Buttons, inputs and textareas share visible focus states. Default buttons use a 40-pixel height and 14-pixel label. Cards use consistent 20-pixel internal spacing. Tables use spacious rows without vertical grid lines. Input errors use `aria-invalid`; associate the error message through `aria-describedby` at the call site. All interactive controls retain their native keyboard behavior.

## Landing page

`apps/landing/src/app/landing.css` scopes marketing treatments to the landing page. The editorial hero has oversized sans-serif/italic-serif typography, an ivory and ink palette, a peach character frame and lime accents. It uses a split desktop layout and stacked mobile layout. The marketing palette is intentionally fixed; operational apps retain their theme control. Numbered sections, sharper cards, contrasting dark sections and an oversized closing wordmark carry the direction through the page. The companion is a transparent 3D CGI character render inspired by the supplied reference, saved locally in `apps/landing/public/illustrations/landing-companion-3d.png`. An SVG wrapper clips and moves the rendered iris textures so the eyes track the pointer while the character retains its 3D appearance.

The companion follows desktop pointer movement through bounded pupil translation, scheduled with requestAnimationFrame. Touch devices and reduced-motion settings keep it static. Listener cleanup runs on unmount, and pointer departure or window blur returns the eyes to center. The normal cursor remains visible.

Showcase tabs support Arrow Left, Arrow Right, Home and End. Reduced-motion users switch panels directly. Shared base styles provide visible focus, anchor scroll offsets and reduced-motion CSS.

## Validation

PMS TypeScript check and the raw-color guard pass. ESLint is blocked by the existing missing `eslint-plugin-react-hooks` dependency. Runtime preview requires the local app server and its existing environment configuration.

Shared profile menus use tighter corners. Menu items use their highlighted background for keyboard focus rather than stacking a large global outline on top.

The landing identity now uses a folded M vector mark and lowercase wordmark, shared by the suite logo and local branding SVGs. The companion uses the refined v2 transparent CGI asset, with eased pointer tracking, a quieter circular stage and unobstructed face. Marketing changes remain scoped to the landing page.

Shared charts use flat cards, readable scales, consistent small corners and keyboard-accessible inspection. Pipeline stage bars reflect current stage counts rather than inferred conversion rates. Trend charts support comparison series and an optional average. Attendance charts use solid semantic colors, and the weekly view plots daily hours against an 8-hour reference. Isolated development previews can set NEXT_DIST_DIR to avoid mixing production and development React bundles.
