<!--
  SYNC IMPACT REPORT
  ==================
  Version Change: 1.2.0 → 1.2.1 (clarification)
  
  Modified Principles:
    - I. Network-Resilient Architecture: Clarified no backend server—static SPA with
      P2P (WebRTC) or third-party real-time service for multiplayer sync
  
  Added Sections: None
  
  Removed Sections: None
  
  Templates Status:
    - plan-template.md: ✅ Compatible
    - spec-template.md: ✅ Compatible
    - tasks-template.md: ✅ Compatible
  
  Follow-up TODOs: None
-->

# GameTime Bingo Constitution

## Core Principles

### I. Network-Resilient Architecture (NON-NEGOTIABLE)

The application is a static SPA with no custom backend server. Multiplayer requires network connectivity via P2P (WebRTC) or a third-party real-time service, and MUST gracefully handle network flakiness.

- **No backend server**—static SPA hosted on Cloudflare Pages
- Each player connects from their own device—network is essential for multiplayer
- Game state synchronization via WebRTC (P2P) or third-party real-time service (e.g., PartyKit, Liveblocks, Firebase)
- Local state caching MUST allow gameplay to continue during brief disconnections (< 30s)
- Automatic reconnection MUST restore game state without player intervention
- Optimistic UI updates for local actions with eventual consistency across peers
- Clear visual feedback MUST indicate connection status (connected/reconnecting/disconnected)
- Game session MUST survive temporary network interruptions without data loss
- localStorage MUST persist player preferences and session recovery data

**Rationale**: Static hosting keeps infrastructure simple; P2P/third-party services enable multiplayer without custom backend overhead.

### II. Bundle Size Budget (NON-NEGOTIABLE)

The total application bundle MUST remain under strict size limits to optimize for slow networks.

- Initial JavaScript bundle: MUST be < 100KB gzipped
- Total application size (all assets): MUST be < 500KB gzipped
- No external CDN dependencies at runtime—all assets MUST be self-contained
- Tree-shaking and code-splitting MUST be enforced
- Images MUST use modern formats (WebP/AVIF) with appropriate compression

**Rationale**: Small bundle ensures < 3 second load on slow 3G connections.

### III. Performance-First UX

All user interactions MUST feel instantaneous and the application MUST load quickly.

- Time to Interactive (TTI): MUST be < 3 seconds on slow 3G
- Input latency: MUST be < 100ms for all user actions
- Animations MUST run at 60fps without jank
- No blocking operations on the main thread—use Web Workers for heavy computation
- Optimistic UI updates for all local actions

**Rationale**: Real-time feel is essential for engaging game experience.

### IV. Responsive & Accessible Design

The UI MUST be clean, modern, and work flawlessly across all device sizes.

- Mobile-first responsive design (320px to 4K displays)
- Touch-friendly targets: minimum 44x44px tap areas
- WCAG 2.1 AA compliance for accessibility
- Support for reduced-motion preferences
- High contrast mode support for visibility

**Rationale**: Game must be playable by anyone, anywhere, on any device.

### V. Simplicity & Maintainability

Code MUST remain simple, well-structured, and easy to maintain.

- Single-page application with minimal framework overhead
- Component-based architecture with clear separation of concerns
- No premature optimization—measure before optimizing
- YAGNI: Do not implement features until they are needed
- All code MUST be self-documenting with clear naming conventions

**Rationale**: Sustainable development velocity requires manageable complexity.

## Performance Standards

Quantified targets that MUST be met before any release:

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | < 1.5s | Lighthouse (slow 3G) |
| Time to Interactive | < 3.0s | Lighthouse (slow 3G) |
| Largest Contentful Paint | < 2.5s | Lighthouse (slow 3G) |
| Cumulative Layout Shift | < 0.1 | Lighthouse |
| Total Bundle Size | < 500KB | gzipped build output |
| JS Bundle (initial) | < 100KB | gzipped, code-split entry |
| Input Latency | < 100ms | Manual testing |
| Animation FPS | 60fps | Chrome DevTools |

**Compliance**: Performance budget violations MUST block deployment.

## Development Workflow

### Technology Constraints

- **Framework**: Lightweight SPA framework (vanilla JS, Preact, or Svelte preferred)
- **Build Tool**: Vite or similar for fast builds and optimal bundling
- **Styling**: CSS Modules or utility-first CSS (Tailwind) with purging
- **State**: Local state management—no heavy state libraries
- **Testing**: Vitest for unit tests, Playwright for E2E

### Deployment

- **Hosting**: Cloudflare Pages (static SPA deployment)
- **Build Output**: Static files only—no server-side rendering or edge functions required
- **CDN**: Cloudflare's global CDN provides edge caching automatically
- **Custom Domain**: Configure via Cloudflare Pages dashboard
- **Preview Deployments**: Automatic preview URLs for pull requests

### Quality Gates

1. **Pre-commit**: Lint and format checks MUST pass
2. **CI Pipeline**: All tests MUST pass; bundle size MUST be within budget
3. **Performance Audit**: Lighthouse score MUST meet targets before merge
4. **Accessibility Audit**: axe-core checks MUST pass

### Code Review Requirements

- All changes MUST be reviewed before merge
- Performance impact MUST be documented for any new dependencies
- Bundle size delta MUST be reported in PR description

## Governance

This constitution supersedes all other development practices for GameTime Bingo.

- **Amendments**: Require documented justification, impact analysis, and explicit approval
- **Violations**: Any principle violation MUST be documented with rationale and approved exception
- **Versioning**: Constitution follows semantic versioning (MAJOR.MINOR.PATCH)
  - MAJOR: Principle removal or fundamental redefinition
  - MINOR: New principle or significant section expansion
  - PATCH: Clarifications, wording improvements, non-semantic changes
- **Review Cadence**: Constitution reviewed quarterly or when major features are planned

**Version**: 1.2.1 | **Ratified**: 2026-01-13 | **Last Amended**: 2026-01-13
