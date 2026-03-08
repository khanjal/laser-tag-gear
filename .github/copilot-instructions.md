# Laser Tag Gear - AI Development Guide

## Project Overview
Laser Tag Gear is a modern Angular-based catalog for commercial and retail laser tag equipment. The project preserves and modernizes legacy content from khanjal.com while providing a fast, searchable catalog optimized for discovery.

## Architecture & Key Concepts

### Frontend Stack
- **Angular 18** with standalone components (no traditional modules except routing)
- **Tailwind CSS v3** for styling with custom theme configuration
- **Server-Side Rendering (SSR)** enabled for SEO optimization
- **Responsive design** - desktop-first catalog with mobile optimization

### Project Structure Conventions
```
app/src/app/
├── features/         # Feature pages (home, catalog, gear-detail)
├── data-access/      # Repository services and data fetching
├── data/             # Seed data (gear.seed.json)
├── models/           # TypeScript interfaces and types
└── app.routes.ts     # Route configuration
```

### Backend Integration (Planned)
- **AWS Amplify Hosting** for frontend deployment
- **AWS AppSync** GraphQL API
- **DynamoDB** for gear data storage
- **S3 + CloudFront** for media assets (manuals, images)
- **Cognito** for admin authentication (phase 2)

## Development Patterns

### Component Architecture
- All new components should be **standalone** (no NgModules)
- Use functional route guards when authentication is added
- File naming: `feature-name.component.ts`, `feature-name.component.html`, `feature-name.component.scss`
- Component structure: features organized by page (`home/`, `catalog/`, `gear-detail/`)

### Data Model Standards

#### GearItem Interface
Core model defined in `models/gear.model.ts`:
```typescript
export interface GearItem {
  id: string;
  slug: string;
  name: string;
  family: string;              // e.g., "Lazer Tag", "Phoenix LTX"
  manufacturer: string;         // e.g., "Worlds of Wonder", "Nerf"
  marketSegment: GearMarketSegment;  // 'retail' | 'commercial' | 'military' | 'prosumer'
  playContext: GearPlayContext;      // 'home' | 'arena' | 'hybrid'
  eraStart: number;            // Release year
  eraEnd?: number;             // Discontinuation year (optional)
  compatibility: string[];      // Compatible systems/protocols
  tags: string[];              // Searchable tags
  description: string;         // Rich text description
  manuals: GearManual[];       // Manual links
  source?: GearSource;         // Data provenance
  legacy?: GearLegacyData;     // Preserved legacy fields
}
```

#### Legacy Data Preservation
Legacy fields from khanjal.com are preserved in `legacy` object:
- `releasedRaw`, `modelNumberRaw`, `batteryRequirementRaw`, `rangeRaw`, `ammoRaw`
- `accessoryPortsRaw`, `setNamesRaw`, `contentsRaw`, `originalPriceRaw`, `notesRaw`
- `assetLinks[]` - paths to images, PDFs, WAV files

**Why preserve raw fields?**
- Legacy data quality varies; raw preservation prevents information loss
- Enables future data cleanup without losing original context
- Supports comparison between structured and raw data

### Service Patterns
- **Injectable repositories** with `providedIn: 'root'`
- Repository pattern: `GearRepository` for read operations from seed data
- Data access layer in `data-access/` folder
- Models/interfaces in `models/` folder

### Naming Conventions
- **Interfaces**: Use bare interface names (e.g., `GearItem`, not `IGearItem`)
- **Files**: Kebab-case (e.g., `gear-detail.component.ts`)
- **Types**: PascalCase type aliases (e.g., `GearMarketSegment`)
- **Services**: PascalCase with suffix (e.g., `GearRepository`)

### Styling Approach
- **Primary**: Tailwind CSS utility classes for all styling
- **Custom theme**: Configured in `tailwind.config.js`
- **Component SCSS**: Reserve for truly custom needs (animations, complex selectors)
- **Responsive**: Desktop-first breakpoints - use `lg:`, `md:`, `sm:` to adjust for smaller screens
- **Color system**: Use Tailwind's default color palette

### Code Documentation Standards

**Services & Repositories**:
- Document public methods with JSDoc comments
- Include `@param` for each parameter with description
- Include `@returns` describing the return value
- Explain business logic and data transformation decisions

**Interfaces & Types**:
- Add JSDoc comments for complex types
- Document enum/union type options and their meanings
- Explain relationships between interfaces

Example:
```typescript
/**
 * Repository for accessing gear catalog data.
 * Currently uses in-memory seed data from gear.seed.json.
 * Will be replaced with AppSync API calls in production.
 */
@Injectable({ providedIn: 'root' })
export class GearRepository {
  /**
   * Retrieves all gear items from the catalog.
   * @returns Array of all gear items sorted by name
   */
  getAll(): GearItem[] {
    return gearSeed.sort((a, b) => a.name.localeCompare(b.name));
  }
}
```

## Key Development Commands

### Frontend Development
```bash
cd app
npm start                    # Development server (http://localhost:4200)
ng serve                     # Alternative dev server command
npm run build                # Production build
ng test                      # Run unit tests
ng build --configuration development  # Development build
```

### Legacy Data Import
```bash
.\scripts\import_local_legacy_data.ps1  # Import from old_lasertag_html/ folder
```

This script:
- Mirrors legacy HTML to `app/public/legacy/site/`
- Copies linked assets to `app/public/legacy/site-linked/`
- Extracts structured data to `app/src/assets/data/legacy/`
- Regenerates `app/src/app/data/gear.seed.json`

### Testing
```bash
npm test                                      # Run unit tests in watch mode
npm test -- --watch=false --browsers=ChromeHeadless  # Single run with headless Chrome
npm test -- --watch=false --code-coverage --browsers=ChromeHeadless  # With coverage report
```

**Testing Standards**:
- All new components/services must include `.spec.ts` files
- Target 60%+ test coverage for new code
- Use `NO_ERRORS_SCHEMA` for shallow component testing
- Mock all injected services with jasmine spy objects

## Data Flow & Architecture

### Current: Seed Data Mode
1. **Data Source**: `app/src/app/data/gear.seed.json` (63 items from legacy import)
2. **Repository**: `GearRepository` loads JSON via import statement
3. **Components**: Subscribe to repository methods for data access
4. **Assets**: Legacy media served from `app/public/legacy/` directory

### Future: API-Connected Mode
1. **GraphQL API**: AppSync endpoints for gear queries/mutations
2. **DynamoDB**: Persistent storage with indexes for search/filter
3. **S3**: Media storage with CloudFront CDN
4. **Admin Auth**: Cognito-protected CRUD operations

## Legacy Data Integration

### Legacy Site Structure
The original khanjal.com site used a simple structure:
```
index.html
gear/
  equipment_name.html      # Individual gear pages
images/
  equipment_image.jpg
files/
  manual.pdf
  sound.wav
```

### Import Workflow
1. Place legacy HTML mirror in `old_lasertag_html/` at repo root
2. Run `.\scripts\import_local_legacy_data.ps1`
3. Script extracts structured data from HTML anchor blocks
4. Generated seed file includes all legacy metadata in `legacy` object
5. Assets copied to `app/public/legacy/` for serving

### Legacy Data Display
- **Specs Section**: Displays up to 9 legacy fields (released, model, battery, range, ammo, ports, sets, contents, price)
- **Image Gallery**: Shows all linked JPG/PNG/GIF files
- **File Links**: Lists PDFs, ZIPs, WAVs, DOCs for download
- **Inline Links**: Filename mentions in descriptions are automatically made clickable

## Common Development Workflows

### Adding New Features
1. Create feature folder in `app/src/app/features/[feature-name]/`
2. Generate standalone component: `ng generate component features/[feature-name] --standalone`
3. Add route to `app.routes.ts`
4. Create models/interfaces in `models/` if needed
5. Implement data access in `data-access/` if needed
6. Write tests alongside implementation

### Adding New Gear Data
Until backend is wired:
1. Edit `app/src/app/data/gear.seed.json` directly
2. Follow `GearItem` interface structure
3. Generate unique `id` and `slug` values
4. Include all required fields (see model)
5. Add optional `legacy` data if from historical source

### Styling New Components
1. **Start with Tailwind utilities** in template
2. Use semantic class names sparingly
3. Refer to existing components for patterns
4. Avoid creating new SCSS files unless absolutely necessary
5. Use Tailwind's responsive prefixes for breakpoints

## Critical Dependencies
- **@angular/core**: ^18.2.0 - Core framework
- **@angular/ssr**: ^18.2.14 - Server-side rendering
- **tailwindcss**: ^3.4.17 - Utility-first CSS framework
- **typescript**: ~5.5.2 - Type safety

## File Organization Best Practices

### Asset Paths
- **Legacy assets**: `/legacy/site/[original-path]` for full mirror
- **Legacy linked**: `/legacy/site-linked/[original-path]` for referenced-only files
- **App assets**: `/assets/` for application-specific media
- **Generated data**: `/assets/data/legacy/` for JSON exports from import script

### Import Paths
Use relative imports until path aliases are configured:
```typescript
import { GearItem } from '../../models/gear.model';
import { GearRepository } from '../../data-access/gear.repository';
```

## Git Workflow

### Commit Message Guidelines
- Use imperative mood: "Add feature" not "Added feature"
- First line: brief summary (50 chars or less)
- Body: explain what and why, not how
- Reference issues: "Fixes #123" or "Relates to #456"

### Branch Strategy
- `main`: Production-ready code
- Feature branches: `feature/description` or `fix/description`
- Keep commits focused and atomic

### What to Ignore
The following should NOT be committed (per .gitignore):
- `old_lasertag_html/` - Legacy HTML mirror (imported via script)
- `node_modules/` - Dependencies (per app/.gitignore)
- `/dist` - Build outputs (per app/.gitignore)
- IDE files (.vscode/, .idea/)
- System files (.DS_Store, Thumbs.db)

## Project Maturity & Next Steps

### Current State
- ✅ Angular scaffold with SSR
- ✅ Tailwind CSS integration
- ✅ Basic routing (home, catalog, gear-detail)
- ✅ Seed data with 63 legacy items
- ✅ Legacy asset import pipeline
- ✅ Legacy data display on detail pages

### Immediate Next Steps (See docs/PROJECT_PLAN.md)
- [ ] Define GraphQL schema
- [ ] Implement catalog filtering and search
- [ ] Add SEO metadata and SSR optimizations
- [ ] Configure AWS Amplify hosting
- [ ] Set up CI/CD pipeline

### Phase 2 Goals
- [ ] Admin authentication with Cognito
- [ ] CRUD interface for gear management
- [ ] Manual/image upload workflow
- [ ] Backend API integration (AppSync + DynamoDB)

## Domain & Hosting
- **Primary domain**: `lasertaggear.com`
- **Alternative**: `lasertagwiki.com`
- **Hosting**: AWS Amplify Hosting (planned)
- **Current**: Local development only

Remember: This is a catalog/reference site focused on preserving laser tag equipment history while building a modern, searchable interface. Always consider data provenance and preserve legacy information even when restructuring for better usability.
