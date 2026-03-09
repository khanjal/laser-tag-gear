import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * RetroLinkComponent
 *
 * Styled link component for consistent catalog filter links and navigation.
 * Supports both router links and external links with the retro theme styling.
 *
 * Examples:
 * ```html
 * <!-- Router link with query params -->
 * <app-retro-link
 *   [routerLink]="['/catalog']"
 *   [queryParams]="{ manufacturer: 'Worlds of Wonder' }">
 *   Worlds of Wonder
 * </app-retro-link>
 *
 * <!-- External link -->
 * <app-retro-link [href]="'/legacy/manuals/file.pdf'" [external]="true">
 *   Download Manual
 * </app-retro-link>
 *
 * <!-- Inline variant for text -->
 * <app-retro-link variant="inline" [routerLink]="['/catalog']">
 *   View catalog
 * </app-retro-link>
 * ```
 */
@Component({
  selector: 'app-retro-link',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './retro-link.component.html',
  styleUrl: './retro-link.component.scss'
})
export class RetroLinkComponent {
  /** Angular router link */
  @Input() routerLink?: string | any[];

  /** Query parameters for router link */
  @Input() queryParams?: { [key: string]: any };

  /** External URL (for non-router links) */
  @Input() href?: string;

  /** External link (opens in new tab) */
  @Input() external = false;

  /** Link variant - badge (default), inline, button */
  @Input() variant: 'badge' | 'inline' | 'button' = 'badge';

  /** Icon to show before text */
  @Input() icon?: string;

  get linkClasses(): string {
    const classes = ['retro-link'];
    classes.push(`retro-link--${this.variant}`);
    return classes.join(' ');
  }
}
