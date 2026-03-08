# Laser Tag Gear Catalog Project Plan

## Project Overview
Build a modern Angular-based catalog for mostly commercial laser tag gear, optimized for discovery and search for home users.

## Goals
- Launch a fast, searchable catalog MVP.
- Preserve and modernize legacy content from khanjal.com.
- Support manuals/images as downloadable assets.
- Provide a path for long-term curation and admin updates.

## Scope
### In Scope (MVP)
- Angular web app with responsive UI.
- Search/filter by manufacturer, era, compatibility, category.
- Gear detail pages with specs, compatibility notes, and media links.
- Static/manual upload-ready content model.
- Initial deployment pipeline and hosting.

### Out of Scope (MVP)
- Public user submissions.
- Complex social features.
- Marketplace or transactions.

## Architecture Decisions (Initial)
- Frontend: Angular in `app/` (SSR enabled scaffold).
- Styling: Tailwind CSS v3 with custom theme.
- Hosting: AWS Amplify Hosting.
- API: AWS AppSync (GraphQL).
- Data: DynamoDB.
- Files: S3 (+ CloudFront distribution).
- Auth: Cognito (admin-only in phase 2).

## Domains
- `lasertaggear.com`
- `lasertagwiki.com`

## Open Questions
- Confirm AWS region and account strategy.
- Decide public/private status for manual files.
- Define copyright/attribution policy for manuals and images.
- Define canonical taxonomy for gear families and compatibility protocols.

## Milestones
## M1 - Foundation
- [x] Create Angular scaffold.
- [x] Create GitHub repository and push initial code.
- [x] Rename app folder to `app/`.
- [x] Configure Tailwind styling.
- [ ] Add baseline UI shell (home, catalog, gear detail routes).
- [ ] Define environment configuration strategy.

## M2 - Data Model and Content Import
- [ ] Define GraphQL schema.
- [ ] Create seed dataset from legacy gear list.
- [ ] Add media metadata model and S3 key structure.
- [ ] Implement local mock API mode for frontend development.

## M3 - Search and Browse MVP
- [ ] Implement full catalog listing page.
- [ ] Implement filtering and sorting.
- [ ] Implement gear detail pages.
- [ ] Add SEO metadata and SSR route handling.

## M4 - Deploy MVP
- [ ] Configure Amplify hosting connected to GitHub.
- [ ] Configure backend environments (dev/prod).
- [ ] Add CI checks (lint/test/build).
- [ ] Deploy first public preview.

## M5 - Admin and Maintenance
- [ ] Add admin authentication (Cognito).
- [ ] Add CRUD flows for gear entries.
- [ ] Add manual/image upload workflow.
- [ ] Add data review status flags.

## Backlog Ideas
- OpenSearch-powered full-text search and facets.
- Compatibility graph visualization.
- "Unknown details" tracking dashboard.
- Legacy page import script and diff tooling.
- Analytics for top searches and empty results.

## Risks
- Incomplete/uncertain legacy data quality.
- Copyright constraints for hosted manuals.
- Taxonomy drift without clear normalization rules.

## Immediate Next Actions
1. Build first UI slice: catalog list + detail route.
2. Draft initial schema and sample seed data.
3. Decide primary production domain and redirects.
4. Define environment configuration strategy.
