import { DEFAULT_SETTINGS } from '../../../src/settings/defaults';

describe('Settings defaults', () => {
  test('viewsButtonAlignment defaults to right', () => {
    expect(DEFAULT_SETTINGS.viewsButtonAlignment).toBe('right');
  });

  test('Google Calendar event creation defaults to automatic', () => {
    expect(DEFAULT_SETTINGS.googleCalendarExport.eventCreationMode).toBe('automatic');
  });
});
