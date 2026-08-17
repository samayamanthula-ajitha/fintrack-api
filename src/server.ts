import { AppDataSource } from './database';

async function start() {
  try {
    await AppDataSource.initialize();
    const app = createApp();
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
  } catch (err) {
    console.error('Failed to initialize DataSource', err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}
