import { Browser, Page } from 'puppeteer-core';

export type ToolContext = {
  page: Page;
  browser: Browser;
};
