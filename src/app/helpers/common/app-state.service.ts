import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AppStateService {
  private readonly appOpenKey = 'app-open';

  constructor() {
    window.addEventListener('load', this.checkAppState.bind(this));
    window.addEventListener('beforeunload', this.clearAppState.bind(this));
  }

  private checkAppState(): void {
    if (localStorage.getItem(this.appOpenKey)) {
      this.disableInteractions();
    } else {
      localStorage.setItem(this.appOpenKey, 'true');
    }
  }

  private clearAppState(): void {
    localStorage.removeItem(this.appOpenKey);
  }

  private disableInteractions(): void {
    const body = document.querySelector('body');
    if (body) {
      const overlay = document.createElement('div');
      overlay.className = 'disabled-overlay';
      overlay.innerText = 'Η εφαρμογή αυτή είναι ήδη ανοιχτή σε άλλη καρτέλα.';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
      overlay.style.display = 'flex';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'center';
      overlay.style.fontSize = '20px';
      overlay.style.color = 'red';
      body.appendChild(overlay);

      const inputs = document.querySelectorAll('input, button, select, textarea');
      inputs.forEach(input => (input as HTMLInputElement).disabled = true);
    }
  }
}
