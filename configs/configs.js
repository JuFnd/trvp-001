import { promises as fsPromises } from 'fs';
import { load } from 'js-yaml';

/**
 * Конфигурация подключения к PostgreSQL
 */
class DbPostgresConfig {
  constructor(user, password, dbname, host, port, sslmode = 'disable', maxOpenConns = 10) {
    this.user = user;
    this.password = password;
    this.dbname = dbname;
    this.host = host;
    this.port = port;
    this.sslmode = sslmode;
    this.maxOpenConns = maxOpenConns;
  }
}

/**
 * Конфигурация HTTP-сервиса
 */
class ServiceConfig {
  constructor(address, appPort, connectionType = 'http') {
    this.address = address;
    this.appPort = appPort;
    this.connectionType = connectionType;
  }
}

/**
 * Загрузка конфигурации PostgreSQL из YAML-файла
 * @param {string} path - путь к файлу конфигурации
 * @returns {Promise<DbPostgresConfig>}
 */
async function parsePostgresConfig(path) {
  try {
    const fileContent = await fsPromises.readFile(path, 'utf8');
    const config = load(fileContent);

    return new DbPostgresConfig(
      config.postgres.user,
      config.postgres.password,
      config.postgres.dbname,
      config.postgres.host,
      config.postgres.port,
      config.postgres.sslmode,
      config.postgres.max_open_conns
    );
  } catch (err) {
    throw new Error(`Error reading Postgres config file: ${err.message}`);
  }
}

/**
 * Загрузка конфигурации сервиса из YAML-файла
 * @param {string} path - путь к файлу конфигурации
 * @returns {Promise<ServiceConfig>}
 */
async function parseServiceConfig(path) {
  try {
    const fileContent = await fsPromises.readFile(path, 'utf8');
    const config = load(fileContent);

    return new ServiceConfig(
      config.service.address,
      config.service.app_port,
      config.service.connection_type
    );
  } catch (err) {
    throw new Error(`Error reading Service config file: ${err.message}`);
  }
}

export {
  DbPostgresConfig,
  ServiceConfig,
  parsePostgresConfig,
  parseServiceConfig,
};