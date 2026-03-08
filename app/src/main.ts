import { mergeApplicationConfig } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

const browserConfig = mergeApplicationConfig(appConfig, {
  providers: [provideClientHydration()]
});

bootstrapApplication(AppComponent, browserConfig)
  .catch((err) => console.error(err));
