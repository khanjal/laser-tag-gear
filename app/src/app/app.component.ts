import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

type ThemeMode = 'system' | 'light' | 'dark';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'laser-tag-gear-app';

  themeMode: ThemeMode = 'system';

  ngOnInit(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const stored = window.localStorage.getItem('themeMode');
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      this.themeMode = stored;
    }

    this.applyTheme();
  }

  cycleTheme(): void {
    const order: ThemeMode[] = ['system', 'light', 'dark'];
    const currentIndex = order.indexOf(this.themeMode);
    this.themeMode = order[(currentIndex + 1) % order.length];

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('themeMode', this.themeMode);
    }

    this.applyTheme();
  }

  get themeLabel(): string {
    if (this.themeMode === 'dark') {
      return 'Dark';
    }
    if (this.themeMode === 'light') {
      return 'Light';
    }
    return 'System';
  }

  get themeIconName(): string {
    if (this.themeMode === 'dark') {
      return 'dark_mode';
    }
    if (this.themeMode === 'light') {
      return 'light_mode';
    }
    return 'settings_brightness';
  }

  private applyTheme(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const useDark = this.themeMode === 'dark' || (this.themeMode === 'system' && prefersDark);

    root.classList.toggle('theme-dark', useDark);
  }
}
