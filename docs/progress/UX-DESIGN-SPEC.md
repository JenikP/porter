# Porter UX design specification

Direction: Crisp Productivity × Premium Logistics. Reference concepts: customer.png, driver.png, admin.png in ux-concepts. Full functional architecture stays React/Vite with existing shared provider and routes.

Color lock: warm ivory #F8F7F2 canvas, white surfaces; forest #173B32 navigation and strong regions; lime #C7F464 primary accents with forest text; mint #DFF2E8 selected and supportive surfaces; charcoal #202823 text. Neutral #6B756F muted, #DFE4DB border. No decorative gradients. Semantic amber, red, muted blue only where meaningful. Optional dark theme uses a deep charcoal canvas, lighter surfaces and high-contrast text.

Typography: locally bundled Inter variable font with system sans fallback and OFL licence; 16px base, 14px chrome, 12px captions, 32–48px desktop headings, 26–30px mobile, 20px sections. Deliberate line heights 1.2 headings/1.5 content. Spacing multiples of4/8, radius12px panels/8px controls, small shadow only on meaningful panels.

Architecture: existing same-origin role bar, Customer top icon navigation desktop and bottom navigation mobile; Driver bottom icon navigation on mobile; Admin grouped collapsible left sidebar with responsive strip. Customer home forest welcome area, paired booking/tracking, divided recent list and saved address shortcuts. Driver forest availability/earnings band and dominant white active delivery. Admin four live KPI cards, date-based delivery chart, operational/financial summary, attention strip and searchable recentjobs table.

Components: one currentColor 1.8px outline icon family, primary lime button, forest button variant, outline secondary, controlled modern fields, mint/amber/red textual status badges, step selection cards, progress rails, table filters/sticky headers, structured detail workspaces, divided document review rows, receipt and proof frames. All labels/actions remain code-native. No central raster production asset required; no invented profile photos or location times.

Interaction lock: preserve native action labels, state methods, all bookings/quote versions/payment, matching and status/proof rules, ratings/dispute submissions, driver documents/earnings, assignment/refund/pricing. Derived charts use real records, never invented trends. 180–220ms motion, reduced-motion disables it.

Allowed copy: existing role names, page titles, booking step headings, button labels, validation and status messages. Requested Admin overview uses Operations overview / Melbourne marketplace at a glance. Additional fieldgroup labels describe existing inputs. Concept-only sampled dates/vehicle/photos/metrics are replaced by real records. No notification/account menu is added solely because ImageGen drew one.
