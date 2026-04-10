import { getApps } from 'firebase/app';
import app from './firebase';

describe('Firebase Initialization', () => {
  it('initializes firebase with config', () => {
    const apps = getApps();
    expect(apps.length).toBeGreaterThan(0);
    expect(apps[0]).toBe(app);
  });

  it('initializes firebase apps', () => {
    const apps = getApps();
    expect(apps.length).toBeGreaterThan(0);
  });
});

