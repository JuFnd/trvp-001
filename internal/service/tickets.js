import { randomUUID } from 'crypto';
import errors from '../pkg/errors/errors.js';

const { ErrNotFound, ErrInvalidInput, ErrConflict } = errors;

const WORKLOAD_LIMIT = 10;

class TechnicianService {
  constructor(technicianStore) {
    this.store = technicianStore;
  }

  async getComplexityLevels() {
      const levels = await this.store.getComplexityLevels()
      return levels;
  }

  async listTechnicians() {
    const technicians = await this.store.getTechnicians();
    return technicians;
  }

  async createTechnician(technicianData) {
    const { fullName } = technicianData;

    if (!fullName) {
      throw ErrInvalidInput;
    }

    const id = randomUUID();
    const existing = await this.store.getTechnicianById(id);
    if (existing) {
      throw ErrConflict;
    }

    const technician = await this.store.createTechnician({
      id,
      fullName
    });

    return technician;
  }

  async updateTechnician(technicianId, updateData) {
    if (!technicianId) throw ErrInvalidInput;

    const { fullName } = updateData;
    if (!fullName) throw ErrInvalidInput;

    const technician = await this.store.updateTechnician(technicianId, {
      fullName
    });

    if (!technician) {
      throw ErrNotFound;
    }

    return technician;
  }

  async deleteTechnician(technicianId) {
    if (!technicianId) throw ErrInvalidInput;

    const exists = await this.store.getTechnicianById(technicianId);
    if (!exists) {
      throw ErrNotFound;
    }

    await this.store.deleteTicketsByTechnicianId(technicianId);

    await this.store.deleteTechnician(technicianId);
  }

  async listTicketsByTechnicianId(technicianId) {
    if (!technicianId) {
      throw ErrInvalidInput;
    }

    const tickets = await this.store.getTicketsByTechnicianId(technicianId);
    return tickets;
  }

  async addTicketToTechnician(ticketData) {
    const { technicianId, address, complexityLevelId } = ticketData;

    if (!technicianId || !address || !complexityLevelId) {
      throw ErrInvalidInput;
    }

    const technician = await this.store.getTechnicianById(technicianId);
    if (!technician) throw ErrNotFound;

    const complexityLevel = await this.store.getComplexityLevelById(complexityLevelId);
    if (!complexityLevel) throw ErrInvalidInput;

    const currentLoad = await this.calculateCurrentLoad(technicianId);
    const newLoad = currentLoad + complexityLevel.value;

    if (newLoad > WORKLOAD_LIMIT) {
      throw new Error(
        `Превышен лимит сложности для мастера. Текущая нагрузка: ${currentLoad}, ` +
        `добавляемая сложность: ${complexityLevel.value}, лимит: ${WORKLOAD_LIMIT}`
      );
    }

    const id = randomUUID();
    const existingTicket = await this.store.getTicketById(id);
    if (existingTicket) throw ErrConflict;

    const ticket = await this.store.createTicket({
      id,
      address,
      complexityLevelId,
      technicianId
    });

    return ticket;
  }

  async removeTicket(ticketId) {
    if (!ticketId) throw ErrInvalidInput;

    const ticket = await this.store.getTicketById(ticketId);
    if (!ticket) throw ErrNotFound;

    await this.store.deleteTicket(ticketId);
  }

  async moveTicket(ticketId, targetTechnicianId) {
    if (!ticketId || !targetTechnicianId) throw ErrInvalidInput;

    const ticket = await this.store.getTicketById(ticketId);
    if (!ticket) throw ErrNotFound;

    const targetTechnician = await this.store.getTechnicianById(targetTechnicianId);
    if (!targetTechnician) throw ErrNotFound;

    if (ticket.technician_id === targetTechnicianId) {
      throw new Error('Ticket is already assigned to the target technician');
    }

    const complexityLevel = await this.store.getComplexityLevelById(ticket.complexity_level_id);
    const currentLoad = await this.calculateCurrentLoad(targetTechnicianId);
    const newLoad = currentLoad + complexityLevel.value;

    if (newLoad > WORKLOAD_LIMIT) {
      throw new Error(
        `Невозможно переместить заявку: превышен лимит сложности у целевого мастера. ` +
        `Текущая нагрузка: ${currentLoad}, сложность заявки: ${complexityLevel.value}, лимит: ${WORKLOAD_LIMIT}`
      );
    }

    await this.store.moveTicket(ticketId, targetTechnicianId);
  }

  async calculateCurrentLoad(technicianId) {
    const tickets = await this.store.getTicketsByTechnicianId(technicianId);
    let total = 0;
    for (const ticket of tickets) {
      const level = await this.store.getComplexityLevelById(ticket.complexity_level_id);
      if (level) {
        total += level.value;
      }
    }
    return total;
  }
}

export default TechnicianService;