const state = {
  data: null,
  selectedFacilityId: null,
  selectedSessionId: null
};

const roleSelect = document.querySelector("#roleSelect");
const refreshBtn = document.querySelector("#refreshBtn");
const contextSummary = document.querySelector("#contextSummary");
const facilitySelect = document.querySelector("#facilitySelect");
const sessionSelect = document.querySelector("#sessionSelect");
const newSessionBtn = document.querySelector("#newSessionBtn");
const stateSelect = document.querySelector("#stateSelect");
const stateBtn = document.querySelector("#stateBtn");
const sessionMeta = document.querySelector("#sessionMeta");
const itemForm = document.querySelector("#itemForm");
const itemRows = document.querySelector("#itemRows");
const traceabilityRows = document.querySelector("#traceabilityRows");
const auditRows = document.querySelector("#auditRows");

function authHeaders() {
  return { "Content-Type": "application/json", "x-role": roleSelect.value };
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

async function refresh() {
  state.data = await api("/api/bootstrap", { method: "GET" });
  if (!state.selectedFacilityId && state.data.facilities[0]) {
    state.selectedFacilityId = state.data.facilities[0].id;
  }
  const sessions = getSessionsForFacility();
  if (!state.selectedSessionId && sessions[0]) {
    state.selectedSessionId = sessions[0].id;
  }
  render();
  await renderTraceability();
}

function getSessionsForFacility() {
  return (state.data?.sessions || []).filter((s) => s.facilityId === state.selectedFacilityId);
}

function getSelectedSession() {
  return (state.data?.sessions || []).find((s) => s.id === state.selectedSessionId);
}

function render() {
  renderContext();
  renderFacilitySelect();
  renderSessionSelect();
  renderItems();
  renderAudit();
}

function renderContext() {
  const facilityCount = state.data?.facilities.length || 0;
  const sessionCount = state.data?.sessions.length || 0;
  const itemCount = state.data?.items.length || 0;
  contextSummary.textContent = `Facilities: ${facilityCount} | Sessions: ${sessionCount} | FMEA Items: ${itemCount} | Role: ${roleSelect.value}`;
}

function renderFacilitySelect() {
  const facilities = state.data?.facilities || [];
  facilitySelect.innerHTML = facilities
    .map(
      (f) =>
        `<option value="${f.id}" ${f.id === state.selectedFacilityId ? "selected" : ""}>${f.name}</option>`
    )
    .join("");
}

function renderSessionSelect() {
  const sessions = getSessionsForFacility();
  sessionSelect.innerHTML = sessions
    .map(
      (s) =>
        `<option value="${s.id}" ${s.id === state.selectedSessionId ? "selected" : ""}>v${s.version} - ${s.title}</option>`
    )
    .join("");

  const selected = getSelectedSession();
  if (!selected) {
    sessionMeta.textContent = "No session selected.";
    return;
  }
  stateSelect.value = selected.state;
  sessionMeta.textContent = `Status: ${selected.state} | Created: ${new Date(selected.createdAt).toLocaleString()} | Updated: ${new Date(selected.updatedAt).toLocaleString()}`;
}

function renderItems() {
  const selected = getSelectedSession();
  if (!selected) {
    itemRows.innerHTML = `<tr><td colspan="8">No session selected.</td></tr>`;
    return;
  }

  const rows = (state.data?.items || []).filter((i) => i.sessionId === selected.id);
  if (rows.length === 0) {
    itemRows.innerHTML = `<tr><td colspan="8">No items yet.</td></tr>`;
    return;
  }

  itemRows.innerHTML = rows
    .map((item) => {
      const actions = (item.recommendedActions || [])
        .map((a) => `<span class="chip">${a.title} (${a.status})</span>`)
        .join("");
      return `<tr>
        <td>${escapeHtml(item.assetHierarchy)}</td>
        <td>${escapeHtml(item.failureMechanism)}</td>
        <td>${item.severity}</td>
        <td>${item.occurrence}</td>
        <td>${item.detection}</td>
        <td><strong>${item.rpn}</strong><div class="small muted">Residual: ${item.residualRpn}</div></td>
        <td>${selected.state}</td>
        <td>${actions || "-"}</td>
      </tr>`;
    })
    .join("");
}

async function renderTraceability() {
  const rows = await api("/api/traceability", { method: "GET" });
  if (rows.length === 0) {
    traceabilityRows.innerHTML = `<p class="muted">No traceability rows.</p>`;
    return;
  }
  traceabilityRows.innerHTML = rows
    .map(
      (r) => `<div class="small">
      <strong>${escapeHtml(r.failureMechanism || "Unspecified")}</strong> -> Controls: ${escapeHtml(r.currentControls || "-")} -> Detection: ${escapeHtml(r.detectionMethod || "-")} -> Instruments: ${(r.instrumentTags || []).map((t) => `<span class="chip">${escapeHtml(t)}</span>`).join("") || "-"} -> Actions: ${r.actionCount}
    </div>`
    )
    .join("<hr/>");
}

function renderAudit() {
  const events = (state.data?.auditEvents || []).slice(0, 15);
  if (events.length === 0) {
    auditRows.innerHTML = `<p class="muted">No audit events.</p>`;
    return;
  }
  auditRows.innerHTML = events
    .map(
      (e) => `<div class="small"><strong>${escapeHtml(e.action)}</strong> on ${escapeHtml(
        e.entity
      )} (${escapeHtml(e.entityId)}) by ${escapeHtml(e.actor)} at ${new Date(e.at).toLocaleString()}<br/><span class="muted">${escapeHtml(e.details || "")}</span></div>`
    )
    .join("<hr/>");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

refreshBtn.addEventListener("click", async () => {
  try {
    await refresh();
  } catch (err) {
    alert(err.message);
  }
});

roleSelect.addEventListener("change", async () => {
  try {
    await refresh();
  } catch (err) {
    alert(err.message);
  }
});

facilitySelect.addEventListener("change", async () => {
  state.selectedFacilityId = facilitySelect.value;
  const sessions = getSessionsForFacility();
  state.selectedSessionId = sessions[0]?.id || null;
  render();
});

sessionSelect.addEventListener("change", () => {
  state.selectedSessionId = sessionSelect.value;
  render();
});

newSessionBtn.addEventListener("click", async () => {
  try {
    const selectedFacility = facilitySelect.value;
    if (!selectedFacility) throw new Error("Select a facility first");
    await api("/api/sessions", {
      method: "POST",
      body: JSON.stringify({
        facilityId: selectedFacility,
        title: `Revision ${new Date().toLocaleDateString()}`
      })
    });
    await refresh();
  } catch (err) {
    alert(err.message);
  }
});

stateBtn.addEventListener("click", async () => {
  try {
    const selected = getSelectedSession();
    if (!selected) throw new Error("Select a session first");
    await api(`/api/sessions/${selected.id}/state`, {
      method: "PATCH",
      body: JSON.stringify({ state: stateSelect.value })
    });
    await refresh();
  } catch (err) {
    alert(err.message);
  }
});

itemForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const selected = getSelectedSession();
    if (!selected) throw new Error("Select a session first");

    const payload = {
      sessionId: selected.id,
      assetHierarchy: document.querySelector("#assetHierarchy").value,
      failureMechanism: document.querySelector("#failureMechanism").value,
      initiatingEvent: document.querySelector("#initiatingEvent").value,
      loadingConditions: document.querySelector("#loadingConditions").value,
      functionIntent: document.querySelector("#functionIntent").value,
      consequenceCategory: document.querySelector("#consequenceCategory").value,
      currentControls: document.querySelector("#currentControls").value,
      detectionMethod: document.querySelector("#detectionMethod").value,
      instrumentTags: document
        .querySelector("#instrumentTags")
        .value.split(",")
        .map((v) => v.trim())
        .filter(Boolean),
      severity: Number(document.querySelector("#severity").value),
      occurrence: Number(document.querySelector("#occurrence").value),
      detection: Number(document.querySelector("#detection").value)
    };
    await api("/api/items", { method: "POST", body: JSON.stringify(payload) });
    itemForm.reset();
    document.querySelector("#severity").value = "5";
    document.querySelector("#occurrence").value = "5";
    document.querySelector("#detection").value = "5";
    await refresh();
  } catch (err) {
    alert(err.message);
  }
});

refresh().catch((err) => alert(err.message));
