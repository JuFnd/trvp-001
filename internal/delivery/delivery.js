import express from 'express';
import cookieParser from 'cookie-parser';
import utils from '../pkg/utils/utils.js';
import errors from '../pkg/errors/errors.js';

const { sendResponse } = utils;
const { ErrInvalidInput, ErrNotFound, ErrConflict } = errors;

class App {
  constructor(technicianService, logger) {
    this.app = express();
    this.logger = logger;
    this.technicianService = technicianService;

    this.app.use(cookieParser());
    this.app.use(express.json());
  }

  ping = (req, res) => {
    this.logger.info('Ping endpoint was called');
    sendResponse(res, req, 200, 'Pong!', null, null, this.logger);
  };

  getTechnicians = async (req, res) => {
    this.logger.info('Get technicians endpoint was called');
    try {
      const technicians = await this.technicianService.listTechnicians();
      sendResponse(res, req, 200, technicians, 'Technicians retrieved successfully', null, this.logger);
    } catch (err) {
      this.handleError(res, req, err, 'Failed to fetch technicians');
      return;
    }
  };

  createTechnician = async (req, res) => {
    this.logger.info('Create technician endpoint was called');
    const { fullName } = req.body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
      sendResponse(res, req, 400, null, 'Valid full name is required', null, this.logger);
      return;
    }

    try {
      const technician = await this.technicianService.createTechnician({ fullName: fullName.trim() });
      sendResponse(res, req, 201, technician, 'Technician created successfully', null, this.logger);
    } catch (err) {
      this.handleError(res, req, err, 'Failed to create technician');
      return;
    }
  };

  updateTechnician = async (req, res) => {
    this.logger.info('Update technician endpoint was called');
    const { technicianId } = req.params;
    const { fullName } = req.body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
      sendResponse(res, req, 400, null, 'Valid full name is required', null, this.logger);
      return;
    }

    try {
      const technician = await this.technicianService.updateTechnician(technicianId, { fullName: fullName.trim() });
      sendResponse(res, req, 200, technician, 'Technician updated successfully', null, this.logger);
    } catch (err) {
      this.handleError(res, req, err, 'Failed to update technician');
      return;
    }
  };

  deleteTechnician = async (req, res) => {
    this.logger.info('Delete technician endpoint was called');
    const { technicianId } = req.params;
    try {
      await this.technicianService.deleteTechnician(technicianId);
      sendResponse(res, req, 200, null, 'Technician deleted successfully', null, this.logger);
    } catch (err) {
      this.handleError(res, req, err, 'Failed to delete technician');
      return;
    }
  };

  getTicketsByTechnicianId = async (req, res) => {
    this.logger.info('Get tickets by technician ID endpoint was called');
    const { technicianId } = req.params;

    if (!technicianId) {
      sendResponse(res, req, 400, null, 'Technician ID is required', null, this.logger);
      return;
    }

    try {
      const tickets = await this.technicianService.listTicketsByTechnicianId(technicianId);
      sendResponse(res, req, 200, tickets, 'Tickets retrieved successfully', null, this.logger);
    } catch (err) {
      this.handleError(res, req, err, 'Failed to fetch tickets');
      return;
    }
  };

  addTicketToTechnician = async (req, res) => {
    this.logger.info('Add ticket to technician endpoint was called');
    const { technicianId } = req.params;
    const { address, complexityLevelId } = req.body;

    if (!address || typeof address !== 'string' || address.trim() === '') {
      sendResponse(res, req, 400, null, 'Valid address is required', null, this.logger);
      return;
    }

    if (!complexityLevelId || typeof complexityLevelId !== 'string') {
      sendResponse(res, req, 400, null, 'Complexity level ID is required', null, this.logger);
      return;
    }

    try {
      const ticket = await this.technicianService.addTicketToTechnician({
        technicianId,
        address: address.trim(),
        complexityLevelId
      });
      sendResponse(res, req, 201, ticket, 'Ticket added successfully', null, this.logger);
    } catch (err) {
      this.handleError(res, req, err, 'Failed to add ticket');
      return;
    }
  };

  removeTicket = async (req, res) => {
    this.logger.info('Remove ticket endpoint was called');
    const { ticketId } = req.params;
    try {
      await this.technicianService.removeTicket(ticketId);
      sendResponse(res, req, 200, null, 'Ticket removed successfully', null, this.logger);
    } catch (err) {
      this.handleError(res, req, err, 'Failed to remove ticket');
      return;
    }
  };

  moveTicket = async (req, res) => {
    this.logger.info('Move ticket endpoint was called');
    const { ticketId } = req.params;
    const { targetTechnicianId } = req.body;

    if (!targetTechnicianId || typeof targetTechnicianId !== 'string') {
      sendResponse(res, req, 400, null, 'Target technician ID is required', null, this.logger);
      return;
    }

    try {
      await this.technicianService.moveTicket(ticketId, targetTechnicianId);
      sendResponse(res, req, 200, null, 'Ticket moved successfully', null, this.logger);
    } catch (err) {
      this.handleError(res, req, err, 'Failed to move ticket');
      return;
    }
  };

  getComplexityLevels = async (req, res) => {
    this.logger.info('Get complexity levels endpoint was called');
    try {
      const levels = await this.technicianService.getComplexityLevels();
      sendResponse(res, req, 200, levels, 'Complexity levels retrieved', null, this.logger);
    } catch (err) {
      this.handleError(res, req, err, 'Failed to fetch complexity levels');
      return;
    }
  };

  getTechnicianLoad = async (req, res) => {
    this.logger.info('Get technician load endpoint was called');
    const { technicianId } = req.params;

    if (!technicianId) {
      sendResponse(res, req, 400, null, 'Technician ID is required', null, this.logger);
      return;
    }

    try {
      const currentLoad = await this.technicianService.calculateCurrentLoad(technicianId);
      sendResponse(res, req, 200, { currentLoad }, 'Technician load retrieved', null, this.logger);
    } catch (err) {
      this.handleError(res, req, err, 'Failed to get technician load');
      return;
    }
  };

  handleError(res, req, err, defaultMessage) {
    this.logger.error(`Error in request: ${err.message}`, { stack: err.stack });

    if (err === ErrInvalidInput) {
      sendResponse(res, req, 400, null, 'Invalid input data', err, this.logger);
    } else if (err === ErrNotFound) {
      sendResponse(res, req, 404, null, 'Resource not found', err, this.logger);
    } else if (err === ErrConflict) {
      sendResponse(res, req, 409, null, 'Resource conflict', err, this.logger);
    } else if (err.message?.includes('Превышен лимит сложности')) {
      sendResponse(res, req, 400, null, err.message, err, this.logger);
    } else {
      const statusCode = err.message ? 400 : 500;
      const message = err.message || defaultMessage;
      sendResponse(res, req, statusCode, null, message, err, this.logger);
    }
  }

  run(appConf) {
    this.app.get('/api/v1/ping', this.ping);

    this.app.get('/api/v1/technicians', this.getTechnicians);
    this.app.post('/api/v1/technicians', this.createTechnician);
    this.app.put('/api/v1/technicians/:technicianId', this.updateTechnician);
    this.app.delete('/api/v1/technicians/:technicianId', this.deleteTechnician);

    this.app.post('/api/v1/technicians/:technicianId/tickets', this.addTicketToTechnician);
    this.app.get('/api/v1/technicians/:technicianId/tickets', this.getTicketsByTechnicianId);
    this.app.get('/api/v1/technicians/:technicianId/load', this.getTechnicianLoad);
    this.app.delete('/api/v1/tickets/:ticketId', this.removeTicket);
    this.app.post('/api/v1/tickets/:ticketId/move', this.moveTicket);

    this.app.get('/api/v1/complexity-levels', this.getComplexityLevels);

    this.app.listen(appConf.appPort, appConf.address, () => {
      console.log(`ISP Manager service running on http://${appConf.address}:${appConf.appPort}`);
    });
  }
}

export default App;