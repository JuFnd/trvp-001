const API_BASE = '/api/v1';

let technicians = [];
let complexityLevels = [];

document.addEventListener('DOMContentLoaded', async () => {
  await refreshApp();
  setupEventListeners();
});

async function refreshApp() {
  try {
    const resLevels = await fetch(`${API_BASE}/complexity-levels`);
    if (!resLevels.ok) throw new Error('Не удалось загрузить уровни сложности');
    const responseLevels = await resLevels.json();
    complexityLevels = responseLevels.data;

    const resTechs = await fetch(`${API_BASE}/technicians`);
    if (!resTechs.ok) throw new Error('Не удалось загрузить мастеров');
    const responseTechs = await resTechs.json();
    technicians = responseTechs.data;

    renderTechnicians();
    for (const tech of technicians) {
      await loadTicketsForTechnician(tech.id);
    }

    populateComplexitySelects();
  } catch (err) {
    showNotification('❌ Ошибка', err.message, 'danger');
  }
}

function populateComplexitySelects() {
  const selects = document.querySelectorAll('#complexityLevelId, #moveComplexityLevelId');
  selects.forEach(select => {
    select.innerHTML = '';
    complexityLevels.forEach(level => {
      const option = document.createElement('option');
      option.value = level.id;
      option.textContent = `${level.name} (${level.value} ед.)`;
      select.appendChild(option);
    });
  });

  const targetSelect = document.getElementById('targetTechnicianId');
  if (targetSelect) {
    targetSelect.innerHTML = '';
    technicians.forEach(tech => {
      const option = document.createElement('option');
      option.value = tech.id;
      option.textContent = tech.full_name;
      targetSelect.appendChild(option);
    });
  }
}

function renderTechnicians() {
  const container = document.getElementById('techniciansContainer');
  if (technicians.length === 0) {
    container.innerHTML = '<div class="col-12"><p class="text-muted text-center">Нет мастеров.</p></div>';
    return;
  }

  container.innerHTML = '';
  technicians.forEach(tech => {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';

    col.innerHTML = `
      <div class="technician-card p-3" data-tech-id="${tech.id}">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h5 class="mb-1">${tech.full_name}</h5>
            <small class="text-muted">ID: ${tech.id.substring(0, 8)}...</small>
          </div>
          <div>
            <button class="btn btn-sm btn-outline-primary edit-technician" data-id="${tech.id}">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger delete-technician" data-id="${tech.id}">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>

        <div class="mt-3">
          <div class="progress mb-2">
            <div class="progress-bar" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="10"></div>
          </div>
        </div>

        <hr class="my-3">

        <div class="tickets-list" id="tickets-${tech.id}">
          <em>Загрузка заявок...</em>
        </div>

        <button class="btn btn-sm btn-success w-100 mt-2 add-ticket" data-id="${tech.id}">
          <i class="bi bi-plus"></i> Новая заявка
        </button>
      </div>
    `;
    container.appendChild(col);

    fetchTechnicianLoad(tech.id).then(currentLoad => {
      updateProgressBar(tech.id, currentLoad);
    });
  });
}

async function fetchTechnicianLoad(technicianId) {
  try {
    const res = await fetch(`${API_BASE}/technicians/${technicianId}/load`);
    if (!res.ok) throw new Error('Не удалось загрузить нагрузку');
    const response = await res.json();
    return response.data.currentLoad;
  } catch (err) {
    console.error(`Ошибка загрузки нагрузки для ${technicianId}:`, err.message);
    return 0;
  }
}

function updateProgressBar(technicianId, currentLoad) {
  const card = document.querySelector(`.technician-card[data-tech-id="${technicianId}"]`);
  if (!card) return;

  const progressBar = card.querySelector('.progress-bar');
  if (progressBar) {
    const percent = Math.min(100, Math.round((currentLoad / 10) * 100));
    progressBar.style.width = `${percent}%`;
    progressBar.className = `progress-bar ${percent > 90 ? 'bg-danger' : percent > 70 ? 'bg-warning' : 'bg-success'}`;
    progressBar.setAttribute('aria-valuenow', currentLoad);
  }
}

async function loadTicketsForTechnician(technicianId) {
  try {
    const res = await fetch(`${API_BASE}/technicians/${technicianId}/tickets`);
    if (!res.ok) throw new Error('Не удалось загрузить заявки');
    const response = await res.json();
    const tickets = response.data;
    renderTickets(technicianId, tickets);

    const currentLoad = await fetchTechnicianLoad(technicianId);
    updateProgressBar(technicianId, currentLoad);
  } catch (err) {
    document.getElementById(`tickets-${technicianId}`).innerHTML =
      `<span class="text-danger">Ошибка: ${err.message}</span>`;
  }
}

function renderTickets(technicianId, tickets) {
  const container = document.getElementById(`tickets-${technicianId}`);
  if (!container) return;

  if (tickets.length === 0) {
    container.innerHTML = '<em class="text-muted">Нет заявок.</em>';
  } else {
    let html = '';
    tickets.forEach(ticket => {
      const level = complexityLevels.find(l => l.id === ticket.complexity_level_id);
      const badgeClass = level ? `complexity-${level.id}` : 'complexity-simple';

      html += `
        <div class="ticket-item" data-complexity="${ticket.complexity_level_id}">
          <div class="d-flex justify-content-between">
            <strong>${ticket.address}</strong>
            <span class="complexity-badge ${badgeClass}">
              ${level?.name || 'Неизвестно'}
            </span>
          </div>
          <div class="mt-2">
            <button class="btn btn-sm btn-warning move-ticket"
                    data-id="${ticket.id}"
                    data-tech-id="${technicianId}">
              <i class="bi bi-arrow-left-right"></i> Переместить
            </button>
            <button class="btn btn-sm btn-danger remove-ticket" data-id="${ticket.id}">
              <i class="bi bi-trash"></i> Удалить
            </button>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  }
}

function setupEventListeners() {
  document.getElementById('createTechnicianBtn').addEventListener('click', () => {
    document.getElementById('technicianModalLabel').textContent = 'Новый мастер';
    document.getElementById('technicianId').value = '';
    document.getElementById('fullName').value = '';
    const modal = new bootstrap.Modal(document.getElementById('technicianModal'));
    modal.show();
  });

  document.getElementById('saveTechnicianBtn').addEventListener('click', saveTechnician);

  document.getElementById('techniciansContainer').addEventListener('click', (e) => {
    if (e.target.classList.contains('add-ticket') || e.target.closest('.add-ticket')) {
      const button = e.target.closest('.add-ticket') || e.target;
      const technicianId = button.dataset.id;
      document.getElementById('ticketTechnicianId').value = technicianId;
      const modal = new bootstrap.Modal(document.getElementById('ticketModal'));
      modal.show();
    }
  });

  document.getElementById('addTicketBtn').addEventListener('click', addTicket);

  document.getElementById('techniciansContainer').addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-technician') || e.target.closest('.delete-technician')) {
      const button = e.target.closest('.delete-technician') || e.target;
      const technicianId = button.dataset.id;

      const confirmed = await showConfirmation(
        'Удаление мастера',
        'Вы уверены? Все заявки мастера будут удалены безвозвратно.'
      );

      if (confirmed) {
        await deleteTechnician(technicianId);
      }
    }
  });

  document.getElementById('techniciansContainer').addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-technician') || e.target.closest('.edit-technician')) {
      const button = e.target.closest('.edit-technician') || e.target;
      const technicianId = button.dataset.id;
      const technician = technicians.find(t => t.id === technicianId);

      if (technician) {
        document.getElementById('technicianModalLabel').textContent = 'Редактировать мастера';
        document.getElementById('technicianId').value = technician.id;
        document.getElementById('fullName').value = technician.full_name;
        const modal = new bootstrap.Modal(document.getElementById('technicianModal'));
        modal.show();
      }
    }
  });

  document.getElementById('techniciansContainer').addEventListener('click', async (e) => {
    if (e.target.classList.contains('remove-ticket') || e.target.closest('.remove-ticket')) {
      const button = e.target.closest('.remove-ticket') || e.target;
      const ticketId = button.dataset.id;

      const confirmed = await showConfirmation('Удаление заявки', 'Удалить заявку?');
      if (confirmed) {
        await removeTicket(ticketId);
      }
    }
  });

  document.getElementById('techniciansContainer').addEventListener('click', (e) => {
    if (e.target.classList.contains('move-ticket') || e.target.closest('.move-ticket')) {
      const button = e.target.closest('.move-ticket') || e.target;
      const ticketId = button.dataset.id;
      const currentTechId = button.dataset.techId;

      document.getElementById('moveTicketId').value = ticketId;
      const targetSelect = document.getElementById('targetTechnicianId');
      targetSelect.innerHTML = '';

      technicians
        .filter(t => t.id !== currentTechId)
        .forEach(tech => {
          const option = document.createElement('option');
          option.value = tech.id;
          option.textContent = tech.full_name;
          targetSelect.appendChild(option);
        });

      if (targetSelect.options.length === 0) {
        showNotification('ℹ️ Информация', 'Нет других мастеров для перемещения', 'info');
        return;
      }

      const modal = new bootstrap.Modal(document.getElementById('moveTicketModal'));
      modal.show();
    }
  });

  document.getElementById('moveTicketBtn').addEventListener('click', moveTicket);
}

async function saveTechnician() {
  const technicianId = document.getElementById('technicianId').value;
  const fullName = document.getElementById('fullName').value.trim();

  if (!fullName) {
    showNotification('⚠️ Внимание', 'Введите ФИО мастера', 'warning');
    return;
  }

  try {
    let res;
    if (technicianId) {
      res = await fetch(`${API_BASE}/technicians/${technicianId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName })
      });
    } else {
      res = await fetch(`${API_BASE}/technicians`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName })
      });
    }

    if (!res.ok) {
      const errorMsg = await parseApiError(res);
      throw new Error(errorMsg);
    }

    bootstrap.Modal.getInstance(document.getElementById('technicianModal')).hide();
    await refreshApp();
    showNotification('✅ Успех', technicianId ? 'Мастер обновлён!' : 'Мастер создан!', 'success');
  } catch (err) {
    showNotification('❌ Ошибка', err.message, 'danger');
  }
}

async function addTicket() {
  const technicianId = document.getElementById('ticketTechnicianId').value;
  const address = document.getElementById('address').value.trim();
  const complexityLevelId = document.getElementById('complexityLevelId').value;

  if (!address) {
    showNotification('⚠️ Внимание', 'Введите адрес', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/technicians/${technicianId}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, complexityLevelId })
    });

    if (!res.ok) {
      const errorMsg = await parseApiError(res);
      throw new Error(errorMsg);
    }

    bootstrap.Modal.getInstance(document.getElementById('ticketModal')).hide();

    await loadTicketsForTechnician(technicianId);

    showNotification('✅ Успех', 'Заявка добавлена!', 'success');
  } catch (err) {
    showNotification('❌ Ошибка', err.message, 'danger');
  }
}

async function deleteTechnician(technicianId) {
  try {
    const res = await fetch(`${API_BASE}/technicians/${technicianId}`, { method: 'DELETE' });
    if (!res.ok) {
      const errorMsg = await parseApiError(res);
      throw new Error(errorMsg);
    }
    await refreshApp();
    showNotification('✅ Успех', 'Мастер удалён.', 'success');
  } catch (err) {
    showNotification('❌ Ошибка', err.message, 'danger');
  }
}

async function removeTicket(ticketId) {
  try {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}`, { method: 'DELETE' });
    if (!res.ok) {
      const errorMsg = await parseApiError(res);
      throw new Error(errorMsg);
    }

    const ticketElement = document.querySelector(`.remove-ticket[data-id="${ticketId}"]`);
    if (ticketElement) {
      const technicianCard = ticketElement.closest('.technician-card');
      const technicianId = technicianCard?.dataset.techId;

      if (technicianId) {
        await loadTicketsForTechnician(technicianId);
      }
    }

    showNotification('✅ Успех', 'Заявка удалена.', 'success');
  } catch (err) {
    showNotification('❌ Ошибка', err.message, 'danger');
  }
}

async function moveTicket() {
  const ticketId = document.getElementById('moveTicketId').value;
  const targetTechnicianId = document.getElementById('targetTechnicianId').value;

  if (!targetTechnicianId) {
    showNotification('⚠️ Внимание', 'Выберите целевого мастера', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetTechnicianId })
    });

    if (!res.ok) {
      const errorMsg = await parseApiError(res);
      throw new Error(errorMsg);
    }

    bootstrap.Modal.getInstance(document.getElementById('moveTicketModal')).hide();

    const ticketElement = document.querySelector(`.move-ticket[data-id="${ticketId}"]`);
    if (ticketElement) {
      const currentTechId = ticketElement.dataset.techId;
      await loadTicketsForTechnician(currentTechId);
      await loadTicketsForTechnician(targetTechnicianId);
    }

    showNotification('✅ Успех', 'Заявка перемещена.', 'success');
  } catch (err) {
    showNotification('❌ Ошибка', err.message, 'danger');
  }
}

async function parseApiError(response) {
  try {
    const data = await response.json();
    return data.error || data.message || `Ошибка ${response.status}`;
  } catch (e) {
    return `Ошибка сервера: ${response.status}`;
  }
}

function showNotification(title, message, type = 'info') {
  const toastContainer = document.getElementById('notifications');

  const typeConfig = {
    success: { bg: 'bg-success', icon: '✅' },
    danger: { bg: 'bg-danger', icon: '❌' },
    warning: { bg: 'bg-warning', text: 'text-dark', icon: '⚠️' },
    info: { bg: 'bg-info', text: 'text-white', icon: 'ℹ️' }
  };

  const config = typeConfig[type] || typeConfig.info;

  const toastEl = document.createElement('div');
  toastEl.className = `toast ${config.bg} ${config.text || ''} show`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');

  toastEl.innerHTML = `
    <div class="toast-header ${config.bg} ${config.text || ''}">
      <strong class="me-auto">${config.icon} ${title}</strong>
      <button type="button" class="btn-close ${config.text ? 'btn-close-white' : ''}"
              data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;

  toastContainer.appendChild(toastEl);

  setTimeout(() => {
    const bsToast = bootstrap.Toast.getInstance(toastEl);
    if (bsToast) {
      bsToast.hide();
    } else {
      toastEl.classList.remove('show');
    }
    setTimeout(() => toastEl.remove(), 500);
  }, 5000);
}

function showConfirmation(title, message) {
  return new Promise((resolve) => {
    document.getElementById('confirmationModalLabel').textContent = title;
    document.getElementById('confirmationModalMessage').textContent = message;

    const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    modal.show();

    const confirmBtn = document.getElementById('confirmationConfirmBtn');
    const handleConfirm = () => {
      modal.hide();
      resolve(true);
    };
    const handleCancel = () => {
      modal.hide();
      resolve(false);
    };

    confirmBtn.onclick = handleConfirm;

    document.getElementById('confirmationModal').addEventListener('hidden.bs.modal', () => {
      confirmBtn.onclick = null;
    });
  });
}
