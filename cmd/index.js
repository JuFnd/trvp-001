import App from '../internal/delivery/delivery.js';
import TechnicianService from '../internal/service/tickets.js';
import createTechnicianStore from '../internal/store/store.js';
import {
  parsePostgresConfig,
  parseServiceConfig,
} from '../configs/configs.js';
import logger from '../internal/pkg/logger/logger.js';

async function main() {
  try {
    const postgresConfig = await parsePostgresConfig('configs/yamls/postgres.yaml');
    const serviceConfig = await parseServiceConfig('configs/yamls/service.yaml');

    const technicianStore = createTechnicianStore(postgresConfig);
    const technicianService = new TechnicianService(technicianStore);

    const app = new App(technicianService, logger);
    app.run(serviceConfig);
  } catch (err) {
    console.error('Error starting app:', err.message);
    logger?.error('Fatal error during startup', { error: err });
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unhandled error during startup:', err);
  process.exit(1);
});