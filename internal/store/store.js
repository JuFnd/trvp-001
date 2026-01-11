import Pg from 'pg';
const { Pool } = Pg;

const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry(operation, operationName) {
  let lastError;
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      
      const isDbConnectionError = 
        err.code === 'ECONNREFUSED' || 
        err.code === 'ETIMEDOUT' ||
        err.message?.includes('Connection terminated') ||
        err.message?.includes('Client has encountered a connection error');

      if (!isDbConnectionError) {
        throw err;
      }

      if (attempt < RETRY_CONFIG.maxRetries) {
        const delay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.warn(
          `DB connection error in "${operationName}" (attempt ${attempt}/${RETRY_CONFIG.maxRetries}), retrying in ${Math.round(delay)}ms...`,
          err.message
        );
        await sleep(delay);
      }
    }
  }

  throw new Error(`Failed to execute "${operationName}" after ${RETRY_CONFIG.maxRetries} retries: ${lastError.message}`);
}

class TechnicianRelationalStore {
  constructor(pool) {
    this.pool = pool;
  }

  async getComplexityLevels() {
    return withRetry(async () => {
      const client = await this.pool.connect();
      try {
        const res = await client.query('SELECT id, name, value FROM complexity_level ORDER BY value');
        return res.rows;
      } finally {
        client.release();
      }
    }, 'getComplexityLevels');
  }

  async getComplexityLevelById(id) {
    return withRetry(async () => {
      const client = await this.pool.connect();
      try {
        const res = await client.query(
          'SELECT id, name, value FROM complexity_level WHERE id = $1',
          [id]
        );
        return res.rows[0] || null;
      } finally {
        client.release();
      }
    }, 'getComplexityLevelById');
  }
  
  async getTechnicians() {
    return withRetry(async () => {
      const client = await this.pool.connect();
      try {
        const res = await client.query('SELECT id, full_name FROM technician');
        return res.rows;
      } finally {
        client.release();
      }
    }, 'getTechnicians');
  }

  async getTechnicianById(id) {
    return withRetry(async () => {
      const client = await this.pool.connect();
      try {
        const res = await client.query(
          'SELECT id, full_name FROM technician WHERE id = $1',
          [id]
        );
        return res.rows[0] || null;
      } finally {
        client.release();
      }
    }, 'getTechnicianById');
  }

  async createTechnician({ id, fullName }) {
    return withRetry(async () => {
      const client = await this.pool.connect();
      try {
        const res = await client.query(
          `INSERT INTO technician (id, full_name)
           VALUES ($1, $2)
           RETURNING id, full_name`,
          [id, fullName]
        );
        return res.rows[0];
      } finally {
        client.release();
      }
    }, 'createTechnician');
  }

  async updateTechnician(technicianId, { fullName }) {
    return withRetry(async () => {
      const client = await this.pool.connect();
      try {
        const res = await client.query(
          `UPDATE technician
           SET full_name = $1
           WHERE id = $2
           RETURNING id, full_name`,
          [fullName, technicianId]
        );
        return res.rows[0] || null;
      } finally {
        client.release();
      }
    }, 'updateTechnician');
  }

  async deleteTechnician(technicianId) {
    return withRetry(async () => {
      const client = await this.pool.connect();
      try {
        await client.query('DELETE FROM technician WHERE id = $1', [technicianId]);
      } finally {
        client.release();
      }
    }, 'deleteTechnician');
  }

  async getTicketsByTechnicianId(technicianId) {
    return withRetry(async () => {
      const client = await this.pool.connect();
      try {
        const res = await client.query(
          `SELECT id, address, complexity_level_id, technician_id
           FROM ticket
           WHERE technician_id = $1`,
          [technicianId]
        );
        return res.rows;
      } finally {
        client.release();
      }
    }, 'getTicketsByTechnicianId');
  }

  async getTicketById(id) {
    return withRetry(async () => {
      const client = await this.pool.connect();
      try {
        const res = await client.query(
          `SELECT id, address, complexity_level_id, technician_id
           FROM ticket
           WHERE id = $1`,
          [id]
        );
        return res.rows[0] || null;
      } finally {
        client.release();
      }
    }, 'getTicketById');
  }

  async createTicket({ id, address, complexityLevelId, technicianId }) {
    return withRetry(async () => {
      const client = await this.pool.connect();
      try {
        const res = await client.query(
          `INSERT INTO ticket (id, address, complexity_level_id, technician_id)
           VALUES ($1, $2, $3, $4)
           RETURNING id, address, complexity_level_id, technician_id`,
          [id, address, complexityLevelId, technicianId]
        );
        return res.rows[0];
      } finally {
        client.release();
      }
    }, 'createTicket');
  }

  async deleteTicket(ticketId) {
    return withRetry(async () => {
      const client = await this.pool.connect();
      try {
        await client.query('DELETE FROM ticket WHERE id = $1', [ticketId]);
      } finally {
        client.release();
      }
    }, 'deleteTicket');
  }

  async deleteTicketsByTechnicianId(technicianId) {
    return withRetry(async () => {
      const client = await this.pool.connect();
      try {
        await client.query('DELETE FROM ticket WHERE technician_id = $1', [technicianId]);
      } finally {
        client.release();
      }
    }, 'deleteTicketsByTechnicianId');
  }

  async moveTicket(ticketId, targetTechnicianId) {
    return withRetry(async () => {
      const client = await this.pool.connect();
      try {
        const res = await client.query(
          'UPDATE ticket SET technician_id = $1 WHERE id = $2 RETURNING id',
          [targetTechnicianId, ticketId]
        );
        if (res.rowCount === 0) {
          throw new Error('Ticket not found');
        }
      } finally {
        client.release();
      }
    }, 'moveTicket');
  }
}

const createTechnicianStore = (config) => {
  const pool = new Pool({
    user: config.user,
    host: config.host,
    database: config.dbname,
    password: config.password,
    port: config.port,
    max: config.maxOpenConns || 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    maxLifetimeSeconds: 60 * 30,
  });

  return new TechnicianRelationalStore(pool);
};

export default createTechnicianStore;