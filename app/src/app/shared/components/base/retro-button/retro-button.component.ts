import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type RetroButtonVariant = 'primary' | 'secondary' | 'outlined' | 'danger' | 'ghost';
export type RetroButtonSize = 'sm' | 'md' | 'lg';

/**
 * RetroButtonComponent
 *
 * Reusable button with retro/tactical styling for the laser tag gear catalog.
 * Supports multiple variants matching the ops-* color palette and various sizes.
 *
 * Examples:
 * ```html
 * <!-- Primary action button -->
 * <app-retro-button variant="primary" (clicked)="save()">
 *   Save Changes
 * </app-retro-button>
 *
 * <!-- Secondary with icon -->
 * <app-retro-button variant="secondary" icon="filter_list" size="sm">
 *   Filter
 * </app-retro-button>
 *
 * <!-- Loading state -->
 * <app-retro-button variant="primary" [loading]="isSaving">
 *   Submit
 * </app-retro-button>
 *
 * <!-- Full width -->
 * <app-retro-button variant="outlined" [fullWidth]="true">
 *   View Details
 * </app-retro-button>
 * ```
 */
@Component({
  selector: 'app-retro-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './retro-button.component.html',
  styleUrl: './retro-button.component.scss'
})

export class RetroButtonComponent {
  /** Button variant style - primary (ops-ember), secondary (ops-moss), outlined, danger, ghost */
  @Input() variant: RetroButtonVariant = 'primary';

  /** Button size */
  @Input() size: RetroButtonSize = 'md';

  /** Icon name (Google Material Symbols) */
  @Input() icon?: string;

  /** Icon position (left/right) */
  @Input() iconPosition: 'left' | 'right' = 'left';

  /** Disabled state */
  @Input() disabled = false;

  /** Loading state - shows spinner and disables button */
  @Input() loading = false;

  /** Native button type */
  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  /** Full width button */
  @Input() fullWidth = false;

  /** Click event emitter */
  @Output() clicked = new EventEmitter<void>();

  onButtonClick(): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit();
    }
  }

  get buttonClasses(): string {
    const classes = ['retro-button'];

    // Variant classes
    classes.push(`retro-button--${this.variant}`);

    // Size classes
    classes.push(`retro-button--${this.size}`);

    // State classes
    if (this.disabled) classes.push('retro-button--disabled');
    if (this.loading) classes.push('retro-button--loading');
    if (this.fullWidth) classes.push('retro-button--full-width');

    return classes.join(' ');
  }
}
