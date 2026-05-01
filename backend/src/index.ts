import { createApp } from './app.js';
import { config } from './config.js';
import { logger } from './logger.js';
import { employeeStore } from './services/employeeStore.js';

async function main() {
  try {
    employeeStore.load();
  } catch (err) {
    logger.error({ err }, 'Failed to load employee data — starting anyway. Run "npm run seed".');
  }

  const app = createApp();
  app.listen(config.port, () => {
    logger.info(`🚀 Backend listening on http://localhost:${config.port}`);
    logger.info(`   CORS origin: ${config.corsOrigin}`);
    logger.info(`   Mail preview-only: ${config.mailPreviewOnly}`);
  });
}

main();
