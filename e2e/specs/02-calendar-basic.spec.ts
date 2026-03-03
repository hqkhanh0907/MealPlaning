import { CalendarPage } from '../pages/CalendarPage';

describe('Calendar — date navigation', () => {
  const page = new CalendarPage();

  before(async () => {
    await page.switchToWebview();
    await page.navigateTo('calendar');
  });

  it('should tap today button', async () => {
    await page.tapToday();
    await expect(page.el('btn-today')).toBeDisplayed();
  });

  it('should navigate to previous date', async () => {
    await page.tapPrevDate();
    await expect(page.el('btn-prev-date')).toBeDisplayed();
  });

  it('should navigate to next date', async () => {
    await page.tapNextDate();
    await expect(page.el('btn-next-date')).toBeDisplayed();
  });

  it('should display breakfast meal card', async () => {
    await expect(page.getMealCard('breakfast')).toBeDisplayed();
  });

  it('should display lunch meal card', async () => {
    await expect(page.getMealCard('lunch')).toBeDisplayed();
  });

  it('should display dinner meal card', async () => {
    await expect(page.getMealCard('dinner')).toBeDisplayed();
  });
});
