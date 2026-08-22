# Core Vault UI V1 design system and spatial V2 layer

> The original V1 system remains documented because the 2-of-3 flow is still part of the application. The active spatial shell uses the V2 system in [docs/WORLD_ART_DIRECTION.md](docs/WORLD_ART_DIRECTION.md). V2 does not change security invariants, RPC boundaries, or control semantics.

This system turns the findings in `DESIGN_RESEARCH.md` into an original, auditable visual and interaction language. It does not copy Bitcoin Design layouts, illustrations, text, or components.

## Intended character

- quiet, trustworthy, and financially serious
- warm without decorative playfulness
- specific to Bitcoin through mental models, not a generic crypto aesthetic
- technically detailed only when requested
- private and local-only by default

The V1 flow has no trading widgets, market prices, or coin animations. Spatial V2 uses blue and gold energy only to represent local data, keys, channels, or an active artifact. Reference images are optimized local build assets and are never fetched at runtime.

## Centralized tokens

All values live in `:root` CSS custom properties. Components do not introduce arbitrary colors, spacing, or radii.

```css
:root {
  /* Color */
  --color-canvas: #f4f1eb;
  --color-surface: #fffefa;
  --color-surface-muted: #ece8df;
  --color-sidebar: #191816;
  --color-ink: #1d1b18;
  --color-ink-muted: #68635b;
  --color-ink-inverse: #faf8f2;
  --color-accent: #c65d19;
  --color-accent-hover: #a94c12;
  --color-success: #2f6b4f;
  --color-warning: #8a5a14;
  --color-danger: #a43a35;
  --color-info: #326a8c;
  --color-focus: #2f72b8;
  --color-divider: rgba(29, 27, 24, 0.12);

  /* Spacing: 4px base */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-pill: 999px;

  /* Type */
  --font-ui: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  --text-xs: 12px;
  --text-sm: 14px;
  --text-md: 16px;
  --text-lg: 18px;
  --text-xl: 22px;
  --text-2xl: 30px;
  --text-3xl: 42px;

  /* Shadow */
  --shadow-card: 0 0 0 1px rgba(0, 0, 0, 0.06),
    0 1px 2px -1px rgba(0, 0, 0, 0.06),
    0 12px 32px -18px rgba(27, 22, 17, 0.24);
  --shadow-card-hover: 0 0 0 1px rgba(0, 0, 0, 0.09),
    0 2px 4px -1px rgba(0, 0, 0, 0.08),
    0 16px 36px -18px rgba(27, 22, 17, 0.28);
}
```

## Typography

- A system sans font avoids a network font request and looks native on macOS, Windows, and Linux. The root uses antialiased smoothing.
- `h1` is 42/46, `h2` 30/36, `h3` 22/28, body 16/25, and supporting text 14/21.
- Headings use `text-wrap: balance`; short body copy uses `text-wrap: pretty`.
- Amounts, balances, and fees use tabular numerals. Addresses, fingerprints, descriptors, and RPC data use monospace. Plain-language explanations never do.
- Amounts have strong hierarchy, the unit sits beside the number, and screen readers receive the full expression.

## Layout and spacing

- The desktop shell has a 248 px sidebar and flexible content, with an 880 px maximum width for the active wizard.
- The screen has one semantic `main` region and 40 to 64 px of space around content.
- Forms use a 16 px vertical rhythm, related controls use 8 px, and sections use 32 px.
- In narrow windows, the sidebar becomes a horizontal progress strip. Content keeps its natural order without horizontal scrolling.
- Setup is linear. Each active screen has one visually dominant primary CTA.

## Surfaces and radii

- Cards use `--radius-lg` and `--shadow-card` without heavy borders.
- A nested panel with 8 px padding uses a radius 8 px smaller than its parent so the curves stay concentric.
- Inputs retain a 1 px outline because their border is functional for accessibility.
- Separators are thin lines. Shadows communicate surface depth only.

## Icons and semantic color

- Use Lucide line icons at 18 or 20 px with a 1.75 stroke.
- An icon is never the only status or control label. Decorative icons use `aria-hidden`; icon-only buttons have an `aria-label` and 44 px hit area.
- Wallet or circle represents funds, key represents a signer, shield or lock represents vault policy, and eye or file-search represents the keyless coordinator.
- Status combines icon, word, and color. Orange marks the primary action, not bitcoin value.
- Success, warning, danger, and information states always include an icon, title, and text.
- Signet has a persistent neutral blue `Test network · No real bitcoin` label. Mainnet uses a danger surface, a clear STOP title, and disabled mutations.
- Text and controls target WCAG AA. Muted text is never smaller than 14 px.

## Controls

| Type | Purpose | Rule |
| --- | --- | --- |
| Primary | the one main next action | 48 px high, accent fill, at least 44 px hit area |
| Secondary | useful but non-dominant action | surface fill and shadow ring |
| Quiet | advanced, cancel, reveal | transparent with visible hover and focus |
| Danger | irreversible or security-critical action | danger fill, never routine navigation |

Buttons use `scale(0.96)` on press. Transitions name only `scale`, `background-color`, `box-shadow`, or `color`; never use `transition: all`. Disabled buttons keep a readable label, with the reason shown outside the control.

Inputs keep a visible label above the field. They are 48 px high, use a 10 px radius and 3 px focus ring, and explain both what is wrong and how to fix it. Password inputs are uncontrolled, have a show or hide control, state that the value goes only to local Bitcoin Core, and clear after the call. Address and path values use monospace.

## Core components

**Signer card.** Shows `K1` and a friendly name such as `Signing wallet 1`, one current task, and a word-and-icon status list. Fingerprints and tpubs remain in Advanced.

**Transaction review card.** Separates amount, destination, network fee, remaining balance, and required approvals. The full address is selectable and copyable only in receive and review contexts. Editing after the first signature creates a new draft.

**Trust facts card.** Shows verifiable facts about the local connection, Signet, absence of remote servers, disabled telemetry, and Core-managed keys. Every item comes from a backend check or a static architectural invariant.

**Vault diagram.** Three signer nodes connect to a central `2 of 3` policy and then to the vault. Lines show relationships, not private-key movement. The watch-only coordinator is a separate node below the policy. Signed and pending states include text and icons. The DOM contains an equivalent screen-reader description.

## Advanced technical panel

- Prefer native `details` and `summary` for built-in keyboard and screen-reader behavior.
- The summary reads `Show what Bitcoin Core is doing`.
- The expanded panel shows a plain explanation, RPC method, wallet scope, redacted arguments and result, and duration.
- It never displays a passphrase, cookie, PSBT, or raw hex, and explicitly says when a payload is hidden.
- Descriptor, tpub, and fingerprint output is labeled `Sensitive wallet metadata`.

## Messages, privacy, and dialogs

Every warning states what happened or will happen, whether funds are safe or a transaction was sent, and what the user should do next. Information explains a concept, caution asks for attention, and blocking messages stop the flow without a bypass.

The balance is hidden after reload. Addresses appear only during receive and transaction review. Descriptors, tpubs, and fingerprints appear only in Advanced or an explicit export. Before saving a public configuration, Core Vault explains that it cannot spend but can track the wallet. The application makes no automatic explorer, exchange-rate, or other external request.

Prefer inline confirmation when the entire context need not be blocked. A modal is reserved for critical review or help and has a title, description, one primary action, one cancel action, correct dialog semantics, initial focus, and focus restoration. Tauri supplies OS file dialogs. Cancellation is neutral, not an error.

## Loading, errors, and motion

- A loading control keeps its label, such as `Creating K1…`, and reports status through `aria-live="polite"`. A spinner is never the only information, and Core Vault does not invent progress percentages.
- Empty states say what the user will get and offer one action.
- Recoverable errors preserve state and offer a retry or settings route. Validation errors reject before mutation and focus the relevant field. Security errors block without override. Transaction errors confirm that nothing was broadcast and name the next step.
- Raw RPC errors appear only in Advanced and never repeat a secret.
- Interactive transitions last 120 to 180 ms and can be interrupted. New wizard content may use a small opacity and 8 px vertical entrance. Motion never communicates a critical state.
- Reduced-motion mode removes decorative transitions and press scaling. Never use `transition: all` or speculative `will-change`.

## Accessibility definition of done

- Every function works with a keyboard and follows logical DOM and tab order.
- Focus has a visible 3 px ring, and a skip link is present.
- Interactive surfaces are at least 44 by 44 px.
- Status always combines an icon, text, and color.
- Inputs connect labels, descriptions, and errors through `aria-describedby`.
- Dynamic status uses `aria-live` without noisy repetition.
- Layout works at 200% zoom and with a larger system font.
- A screen reader can understand the vault diagram and signer progress without the visual.
- `prefers-reduced-motion` is respected.
- Every semantic surface passes contrast checks.
