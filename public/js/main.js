(function () {
  const calendarGrid = document.getElementById('calendarGrid');
  const calendarTitle = document.getElementById('calendarTitle');
  const prevMonth = document.getElementById('prevMonth');
  const nextMonth = document.getElementById('nextMonth');
  const selectedDateText = document.getElementById('selectedDateText');
  const slotsContainer = document.getElementById('slotsContainer');
  const appointmentForm = document.getElementById('appointmentForm');
  const appointmentDate = document.getElementById('appointmentDate');
  const appointmentTime = document.getElementById('appointmentTime');

  if (!calendarGrid || !calendarTitle) return;

  const now = new Date();
  let currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  let selectedDate = null;

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  function formatDate(date) {
    return date.toISOString().slice(0, 10);
  }

  function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    calendarTitle.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();

    calendarGrid.innerHTML = '';

    for (let i = 0; i < startOffset; i += 1) {
      const empty = document.createElement('div');
      empty.className = 'calendar-cell empty';
      calendarGrid.appendChild(empty);
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(year, month, day);
      const dateStr = formatDate(date);
      const isPast = new Date(dateStr) < new Date(new Date().toISOString().slice(0, 10));
      const button = document.createElement('button');
      button.className = 'calendar-cell';
      button.textContent = day;
      if (selectedDate === dateStr) button.classList.add('selected');
      if (isPast) {
        button.classList.add('disabled');
        button.disabled = true;
      } else {
        button.addEventListener('click', () => selectDate(dateStr, button));
      }
      calendarGrid.appendChild(button);
    }
  }

  async function selectDate(dateStr, button) {
    selectedDate = dateStr;
    document.querySelectorAll('.calendar-cell.selected').forEach((el) => el.classList.remove('selected'));
    button.classList.add('selected');
    appointmentDate.value = dateStr;
    selectedDateText.textContent = dateStr;
    appointmentTime.value = '';
    slotsContainer.innerHTML = '<p class="muted">Cargando horarios...</p>';

    try {
      const response = await fetch(`/api/availability?date=${dateStr}`);
      const data = await response.json();
      if (!response.ok || data.blocked) {
        slotsContainer.innerHTML = `<p class="muted">${data.reason || data.message || 'No disponible.'}</p>`;
        return;
      }
      renderSlots(data.slots || []);
    } catch (error) {
      slotsContainer.innerHTML = '<p class="muted">No se pudieron cargar los horarios.</p>';
      window.showToast('No se pudieron cargar los horarios.', 'error');
    }
  }

  function renderSlots(slots) {
    slotsContainer.innerHTML = '';
    if (!slots.length) {
      slotsContainer.innerHTML = '<p class="muted">No quedan horarios disponibles para esta fecha.</p>';
      return;
    }
    slots.forEach((slot) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot-pill';
      btn.textContent = slot;
      btn.addEventListener('click', () => {
        document.querySelectorAll('.slot-pill.active').forEach((item) => item.classList.remove('active'));
        btn.classList.add('active');
        appointmentTime.value = slot;
      });
      slotsContainer.appendChild(btn);
    });
  }

  prevMonth.addEventListener('click', () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    renderCalendar();
  });

  nextMonth.addEventListener('click', () => {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  appointmentForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(appointmentForm);
    const payload = Object.fromEntries(formData.entries());

    if (!payload.date || !payload.time) {
      window.showToast('Primero seleccioná fecha y horario.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        window.showToast(data.message || 'No se pudo registrar el turno.', 'error');
        return;
      }

      window.showToast('Turno registrado. Te redirigimos a WhatsApp.', 'success');
      appointmentForm.reset();
      appointmentTime.value = '';
      setTimeout(() => {
        window.open(data.whatsappUrl, '_blank');
        window.location.reload();
      }, 1000);
    } catch (error) {
      window.showToast('Ocurrió un error al registrar el turno.', 'error');
    }
  });

  renderCalendar();
})();
