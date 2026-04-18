const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = process.env.PORT || 8080;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");
const PUBLIC_DIR = path.join(__dirname, "public");

const WORKFLOW_STATES = ["Draft", "In Review", "Approved", "Superseded"];
const ROLES = ["viewer", "editor", "approver", "admin"];

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedStore(), null, 2), "utf8");
  }
}

function seedStore() {
  const now = new Date().toISOString();
  const facilityId = id("facility");
  const sessionId = id("session");
  const itemId = id("item");
  return {
    users: [
      { id: "user-demo-admin", name: "Demo Admin", role: "admin" },
      { id: "user-demo-editor", name: "Demo Editor", role: "editor" }
    ],
    facilities: [
      {
        id: facilityId,
        name: "TSF Alpha",
        lifecycleStage: "Operation/Maintenance",
        damSystems: ["Embankment", "Pond", "Spillway"],
        createdAt: now
      }
    ],
    scoringModels: [
      {
        id: "score-default",
        name: "Default TSF RPN Model",
        method: "RPN",
        severityScale: "1-10; 10 = catastrophic system consequence",
        occurrenceScale: "1-10; 10 = frequent/likely under operating conditions",
        detectionScale: "1-10; 10 = difficult to detect before failure",
        locked: true,
        approvedAt: now
      }
    ],
    sessions: [
      {
        id: sessionId,
        facilityId,
        title: "Annual Surveillance Baseline 2026",
        version: 1,
        state: "Draft",
        scoringModelId: "score-default",
        createdBy: "user-demo-admin",
        createdAt: now,
        updatedAt: now
      }
    ],
    items: [
      {
        id: itemId,
        sessionId,
        assetHierarchy: "TSF Alpha > Embankment > Toe Drain > Collection Pipe",
        functionIntent: "Convey seepage safely to prevent pore pressure build-up",
        loadingConditions: "High pond level during wet season",
        failureMechanism: "Clogging of toe drain",
        initiatingEvent: "Fine migration and poor maintenance access",
        localEffect: "Reduced seepage discharge at toe",
        systemEffect: "Increased pore pressure, reduced stability margin",
        consequenceCategory: "Potential downstream release pathway",
        severity: 8,
        occurrence: 5,
        detection: 4,
        rpn: 160,
        currentControls: "Weekly visual checks, monthly seepage flow readings",
        detectionMethod: "Weir flow trend + piezometer threshold review",
        instrumentTags: ["PZ-04", "FLOW-WEIR-2"],
        recommendedActions: [
          {
            id: id("action"),
            title: "Jet-clean toe drain segment and verify flow recovery",
            owner: "Operations Supervisor",
            dueDate: now.slice(0, 10),
            status: "Open",
            evidenceLinks: []
          }
        ],
        residualSeverity: 8,
        residualOccurrence: 3,
        residualDetection: 3,
        residualRpn: 72,
        references: ["OMS-SEC-4.3", "DWG-TSF-2102"],
        createdAt: now,
        updatedAt: now
      }
    ],
    auditEvents: [
      {
        id: id("audit"),
        actor: "system",
        action: "seed.initialize",
        entity: "database",
        entityId: "store",
        at: now,
        details: "Initialized demo TSF project, session, and FMEA row."
      }
    ]
  };
}

function id(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadStore() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveStore(store) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

function sendJson(res, code, data) {
  const body = JSON.stringify(data);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function sendText(res, code, data) {
  res.writeHead(code, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(data);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error("Invalid JSON payload"));
      }
    });
    req.on("error", reject);
  });
}

function normalizeScores(item) {
  const s = Number(item.severity || 0);
  const o = Number(item.occurrence || 0);
  const d = Number(item.detection || 0);
  item.rpn = s * o * d;

  const rs = Number(item.residualSeverity || item.severity || 0);
  const ro = Number(item.residualOccurrence || item.occurrence || 0);
  const rd = Number(item.residualDetection || item.detection || 0);
  item.residualRpn = rs * ro * rd;
}

function writeAudit(store, { actor, action, entity, entityId, details }) {
  store.auditEvents.unshift({
    id: id("audit"),
    actor: actor || "unknown",
    action,
    entity,
    entityId,
    details: details || "",
    at: new Date().toISOString()
  });
}

function requireRole(req, minRole) {
  const order = { viewer: 0, editor: 1, approver: 2, admin: 3 };
  const requested = req.headers["x-role"] || "admin";
  if (!ROLES.includes(requested)) {
    return { ok: false, status: 403, message: "Unknown role" };
  }
  if (order[requested] < order[minRole]) {
    return { ok: false, status: 403, message: `Role ${requested} cannot perform this action` };
  }
  return { ok: true, role: requested };
}

function serveStatic(req, res, pathname) {
  let targetPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.join(PUBLIC_DIR, targetPath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendText(res, 403, "Forbidden");
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendText(res, 404, "Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      ext === ".html"
        ? "text/html; charset=utf-8"
        : ext === ".css"
          ? "text/css; charset=utf-8"
          : ext === ".js"
            ? "application/javascript; charset=utf-8"
            : "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

async function handleApi(req, res, urlObj) {
  const store = loadStore();
  const pathname = urlObj.pathname;

  if (req.method === "GET" && pathname === "/api/bootstrap") {
    return sendJson(res, 200, store);
  }

  if (req.method === "POST" && pathname === "/api/facilities") {
    const auth = requireRole(req, "editor");
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.message });

    const body = await parseBody(req);
    const now = new Date().toISOString();
    const facility = {
      id: id("facility"),
      name: body.name || "Untitled Facility",
      lifecycleStage: body.lifecycleStage || "Operation/Maintenance",
      damSystems: Array.isArray(body.damSystems) ? body.damSystems : [],
      createdAt: now
    };
    store.facilities.push(facility);
    writeAudit(store, {
      actor: auth.role,
      action: "facility.create",
      entity: "facility",
      entityId: facility.id,
      details: `Created facility ${facility.name}`
    });
    saveStore(store);
    return sendJson(res, 201, facility);
  }

  if (req.method === "POST" && pathname === "/api/sessions") {
    const auth = requireRole(req, "editor");
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.message });

    const body = await parseBody(req);
    if (!body.facilityId) return sendJson(res, 400, { error: "facilityId is required" });

    const now = new Date().toISOString();
    const sameFacility = store.sessions.filter((s) => s.facilityId === body.facilityId);
    const session = {
      id: id("session"),
      facilityId: body.facilityId,
      title: body.title || "New FMEA Session",
      version: Math.max(0, ...sameFacility.map((s) => s.version || 0)) + 1,
      state: "Draft",
      scoringModelId: body.scoringModelId || "score-default",
      createdBy: "user-demo-editor",
      createdAt: now,
      updatedAt: now
    };
    store.sessions.push(session);
    writeAudit(store, {
      actor: auth.role,
      action: "session.create",
      entity: "session",
      entityId: session.id,
      details: `Created session ${session.title}`
    });
    saveStore(store);
    return sendJson(res, 201, session);
  }

  if (req.method === "PATCH" && pathname.startsWith("/api/sessions/") && pathname.endsWith("/state")) {
    const auth = requireRole(req, "approver");
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.message });

    const sessionId = pathname.split("/")[3];
    const body = await parseBody(req);
    if (!WORKFLOW_STATES.includes(body.state)) {
      return sendJson(res, 400, { error: "Invalid state" });
    }
    const session = store.sessions.find((s) => s.id === sessionId);
    if (!session) return sendJson(res, 404, { error: "Session not found" });
    const old = session.state;
    session.state = body.state;
    session.updatedAt = new Date().toISOString();
    writeAudit(store, {
      actor: auth.role,
      action: "session.state.change",
      entity: "session",
      entityId: session.id,
      details: `State changed from ${old} to ${session.state}`
    });
    saveStore(store);
    return sendJson(res, 200, session);
  }

  if (req.method === "POST" && pathname === "/api/items") {
    const auth = requireRole(req, "editor");
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.message });

    const body = await parseBody(req);
    if (!body.sessionId) return sendJson(res, 400, { error: "sessionId is required" });

    const now = new Date().toISOString();
    const item = {
      id: id("item"),
      sessionId: body.sessionId,
      assetHierarchy: body.assetHierarchy || "",
      functionIntent: body.functionIntent || "",
      loadingConditions: body.loadingConditions || "",
      failureMechanism: body.failureMechanism || "",
      initiatingEvent: body.initiatingEvent || "",
      localEffect: body.localEffect || "",
      systemEffect: body.systemEffect || "",
      consequenceCategory: body.consequenceCategory || "",
      severity: Number(body.severity || 1),
      occurrence: Number(body.occurrence || 1),
      detection: Number(body.detection || 1),
      currentControls: body.currentControls || "",
      detectionMethod: body.detectionMethod || "",
      instrumentTags: Array.isArray(body.instrumentTags) ? body.instrumentTags : [],
      recommendedActions: Array.isArray(body.recommendedActions) ? body.recommendedActions : [],
      residualSeverity: Number(body.residualSeverity || body.severity || 1),
      residualOccurrence: Number(body.residualOccurrence || body.occurrence || 1),
      residualDetection: Number(body.residualDetection || body.detection || 1),
      references: Array.isArray(body.references) ? body.references : [],
      createdAt: now,
      updatedAt: now
    };
    normalizeScores(item);
    store.items.unshift(item);
    writeAudit(store, {
      actor: auth.role,
      action: "item.create",
      entity: "fmeaItem",
      entityId: item.id,
      details: `Added failure mechanism: ${item.failureMechanism}`
    });
    saveStore(store);
    return sendJson(res, 201, item);
  }

  if (req.method === "PATCH" && pathname.startsWith("/api/items/")) {
    const auth = requireRole(req, "editor");
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.message });

    const itemId = pathname.split("/")[3];
    const body = await parseBody(req);
    const item = store.items.find((x) => x.id === itemId);
    if (!item) return sendJson(res, 404, { error: "Item not found" });

    const previous = { ...item };
    Object.assign(item, body, { updatedAt: new Date().toISOString() });
    normalizeScores(item);
    writeAudit(store, {
      actor: auth.role,
      action: "item.update",
      entity: "fmeaItem",
      entityId: item.id,
      details: `Updated RPN ${previous.rpn || "n/a"} -> ${item.rpn}`
    });
    saveStore(store);
    return sendJson(res, 200, item);
  }

  if (req.method === "DELETE" && pathname.startsWith("/api/items/")) {
    const auth = requireRole(req, "editor");
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.message });

    const itemId = pathname.split("/")[3];
    const index = store.items.findIndex((x) => x.id === itemId);
    if (index < 0) return sendJson(res, 404, { error: "Item not found" });
    const [deleted] = store.items.splice(index, 1);
    writeAudit(store, {
      actor: auth.role,
      action: "item.delete",
      entity: "fmeaItem",
      entityId: deleted.id,
      details: `Deleted failure mechanism: ${deleted.failureMechanism}`
    });
    saveStore(store);
    return sendJson(res, 200, { success: true });
  }

  if (req.method === "POST" && pathname.startsWith("/api/items/") && pathname.endsWith("/actions")) {
    const auth = requireRole(req, "editor");
    if (!auth.ok) return sendJson(res, auth.status, { error: auth.message });

    const itemId = pathname.split("/")[3];
    const body = await parseBody(req);
    const item = store.items.find((x) => x.id === itemId);
    if (!item) return sendJson(res, 404, { error: "Item not found" });

    const action = {
      id: id("action"),
      title: body.title || "Untitled action",
      owner: body.owner || "Unassigned",
      dueDate: body.dueDate || "",
      status: body.status || "Open",
      evidenceLinks: Array.isArray(body.evidenceLinks) ? body.evidenceLinks : []
    };
    item.recommendedActions.push(action);
    item.updatedAt = new Date().toISOString();
    writeAudit(store, {
      actor: auth.role,
      action: "action.create",
      entity: "riskAction",
      entityId: action.id,
      details: `Added action to item ${item.id}`
    });
    saveStore(store);
    return sendJson(res, 201, action);
  }

  if (req.method === "GET" && pathname === "/api/traceability") {
    const rows = loadStore().items.map((item) => ({
      itemId: item.id,
      failureMechanism: item.failureMechanism,
      currentControls: item.currentControls,
      detectionMethod: item.detectionMethod,
      instrumentTags: item.instrumentTags,
      actionCount: item.recommendedActions.length
    }));
    return sendJson(res, 200, rows);
  }

  if (req.method === "GET" && pathname === "/api/health") {
    return sendJson(res, 200, { status: "ok", time: new Date().toISOString() });
  }

  return sendJson(res, 404, { error: "API route not found" });
}

const server = http.createServer(async (req, res) => {
  try {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    if (urlObj.pathname.startsWith("/api/")) {
      await handleApi(req, res, urlObj);
      return;
    }
    serveStatic(req, res, urlObj.pathname);
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
});

ensureDataFile();
server.listen(PORT, () => {
  console.log(`TSF FMEA app running on http://localhost:${PORT}`);
});
