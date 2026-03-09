import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * RetroCardComponent
 *
 * Lightweight card container with retro/tactical styling for consistent surfaces.
 * Wraps the "retro-panel" aesthetic used throughout the laser tag gear catalog.
 *
 * Inputs:
 * - `title`, `subtitle`, `titleIcon` : header content
 * - `variant` : visual style ('default' | 'elevated' | 'outlined')
 * - `padding` : controls internal padding ('sm' | 'md' | 'lg')
 *
 * Examples:
 * ```html
 * <app-retro-card title="Classification" [titleIcon]="'category'" variant="default" padding="md">
 *   <!-- Card content -->
 * </app-retro-card>
 *
 * <app-retro-card variant="elevated" padding="lg">
 *   <!-- No header, just content -->
 * </app-retro-card>
 * ```
 */
@Component({
  selector: 'app-retro-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './retro-card.component.html',
  styleUrl: './retro-card.component.scss'
})
export class RetroCardComponent {
  /** Card title */
  @Input() title?: string;

  /** Icon to display in title (Material Symbols) */
  @Input() titleIcon?: string;

  /** Subtitle text */
  @Input() subtitle?: string;

  /** Variant: default (retro-panel), elevated (with shadow), outlined */
  @Input() variant: 'default' | 'elevated' | 'outlined' = 'default';

  /** Padding size: sm, md, lg */
  @Input() padding: 'sm' | 'md' | 'lg' = 'md';

  get cardClasses(): string {
    const classes = ['retro-card'];
    
    classes.push(`retro-card--${this.variant}`);
    classes.push(`retro-card--padding-${this.padding}`);
    
    return classes.join(' ');
  }
}
