/* Handles transient flash messages and the new-meeting AI analysis UI. */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => document.querySelectorAll('.flash-container .alert').forEach((alert) => bootstrap.Alert.getOrCreateInstance(alert).close()), 3000);
  const button = document.querySelector('#analyse-button');
  if (!button) return;
  const notes = document.querySelector('#rawNotes'); const loading = document.querySelector('#analyse-loading');
  const results = document.querySelector('#analysis-results'); const hidden = document.querySelector('#analysis');
  const escapeHTML = (value) => String(value || '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const syncAnalysis = () => {
    const current = JSON.parse(hidden.value || '{}');
    current.actionItems = [...document.querySelectorAll('#action-items-table tr')].map((row) => ({ task: row.querySelector('[data-field=task]').value, owner: row.querySelector('[data-field=owner]').value || 'Unassigned', ownerEmail: row.querySelector('[data-field=email]').value || null, deadline: row.querySelector('[data-field=deadline]').value || null }));
    hidden.value = JSON.stringify(current);
  };
  button.addEventListener('click', async () => {
    if (!notes.value.trim()) { alert('Please add meeting notes first.'); return; }
    button.disabled = true; loading.classList.remove('d-none');
    try {
      const response = await fetch('/meetings/analyse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rawNotes: notes.value }) });
      const payload = await response.json(); if (!payload.success) throw new Error(payload.message || 'Analysis failed');
      const data = payload.data; hidden.value = JSON.stringify(data);
      document.querySelector('#decisions-list').innerHTML = data.decisions.length ? data.decisions.map((item) => `<li>${escapeHTML(item)}</li>`).join('') : '<li class="text-muted">None found</li>';
      document.querySelector('#unresolved-list').innerHTML = data.unresolved.length ? data.unresolved.map((item) => `<li>${escapeHTML(item)}</li>`).join('') : '<li class="text-muted">None found</li>';
      document.querySelector('#action-items-table').innerHTML = data.actionItems.length ? data.actionItems.map((item) => `<tr><td><input data-field="task" class="form-control" value="${escapeHTML(item.task)}"></td><td><input data-field="owner" class="form-control" value="${escapeHTML(item.owner || 'Unassigned')}"></td><td><input data-field="email" type="email" class="form-control" value="${escapeHTML(item.ownerEmail || '')}"></td><td><input data-field="deadline" type="date" class="form-control" value="${escapeHTML(item.deadline || '')}"></td></tr>`).join('') : '<tr><td colspan="4" class="text-muted">No action items found.</td></tr>';
      document.querySelectorAll('#action-items-table input').forEach((input) => input.addEventListener('input', syncAnalysis)); results.classList.remove('d-none');
    } catch (error) { alert(error.message || 'Unable to analyse notes. Please try again.'); }
    finally { button.disabled = false; loading.classList.add('d-none'); }
  });
});
