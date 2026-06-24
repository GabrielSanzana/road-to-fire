import { Injectable } from '@angular/core';
import { AppStorage, AppConfig } from '../models/app-storage';
import { APP_THEMES } from '../services/config.service';

class MockAppStorage implements AppStorage {
  readConfig(): Promise<AppConfig> {
    return Promise.resolve({
      dateAndCurrencyFormat: 'en-US',
      saveOnCloud: false,
      version: 1,
      wizardDone: true
    });
  }

  saveConfig(cfg: AppConfig): Promise<void> {
    return Promise.resolve();
  }
  setChangeListener(listener: (event: any) => void): void {
  }
  wipeStorage(): Promise<void> {
    return Promise.resolve();
  }
  getId(): string {
    return 'roadtofire';
  }
  export(): Promise<any> {
    return Promise.resolve({});
  }
  import(exportedData: any): Promise<void> {
    return Promise.resolve();
  }
}

@Injectable()
export class MockConfigService {

  readonly storage: AppStorage;
  private configLoaded = false;

  constructor() {
    this.storage = new MockAppStorage();
  }

  isConfigLoaded() {
    return this.configLoaded;
  }

  async readConfig(): Promise<AppConfig> {
    this.configLoaded = true;
    return await this.storage.readConfig();
  }

  async saveConfig(config: AppConfig): Promise<void> {
    await this.storage.saveConfig(config);
  }

  getStoredTheme() {
    return APP_THEMES.LIGHT;
  }

  setCurrentTheme(newValue: string) {
  }
}
