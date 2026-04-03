import { useState, useEffect, useRef } from "react";

const BACKEND = "http://localhost:8080";

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit"
  });
}

export default function App() {
  const [info, setInfo] = useState(null);
  const [returning, setReturning] = useState(null);
  const [events, setEvents] = useState([]);
  const logRef = useRef(null);
  const didFetch = useRef(false);

  const addEvent = (message) => {
    const time = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
    setEvents((prev) => [...prev, { time, message }]);
  };

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [events]);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    fetch(`${BACKEND}/BackendInfo`)
      .then((r) => r.json())
      .then((data) => {
        const mem = navigator.deviceMemory;
        setInfo({
          "IP Address": data.ip,
          "Browser": data.userAgent,
          "Language": data.language,
          "Screen": `${window.screen.width} x ${window.screen.height}`,
          "Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
          "CPU Cores": navigator.hardwareConcurrency,
          ...(mem ? { "Memory": `${mem}GB` } : {}),
        });
        addEvent("Session started");
      });

    const fingerprint = {
      screen: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      cores: navigator.hardwareConcurrency,
    };

    fetch(`${BACKEND}/Fingerprint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fingerprint),
    })
      .then((r) => r.json())
      .then((data) => setReturning(data));
  }, []);

  useEffect(() => {
    let lastMove = 0;
    const onMove = (e) => {
      const now = Date.now();
      if (now - lastMove > 500) {
        addEvent(`Mouse moved to (${e.clientX}, ${e.clientY})`);
        lastMove = now;
      }
    };
    const onVisibility = () =>
      addEvent(document.visibilityState === "hidden" ? "Left tab" : "Returned to tab");
    const onCopy = () => addEvent("Copied text");
    const onPaste = () => addEvent("Pasted text");
    const onFocus = () => addEvent("Window focused");
    const onBlur = () => addEvent("Window lost focus");

    document.addEventListener("mousemove", onMove);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return (
    <div style={styles.page}>

      {/* Top bar */}
      <div style={styles.topBar}>
        <span style={styles.title}>Activity Log</span>
        {returning && (
          <span style={returning.returning ? styles.returningBadge : styles.newBadge}>
            {returning.returning
              ? `Returning visitor · first seen ${formatDate(returning.firstSeen)}`
              : "New visitor"}
          </span>
        )}
      </div>

      {/* Main content */}
      <div style={styles.container}>
        <div style={styles.grid}>

          {/* Left: fingerprint info */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>Browser Information</div>
            {info ? (
              <table style={styles.table}>
                <tbody>
                  {Object.entries(info).map(([key, val]) => (
                    <tr key={key} style={styles.row}>
                      <td style={styles.tdKey}>{key}</td>
                      <td style={styles.tdVal}>{String(val)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={styles.loading}>Loading...</div>
            )}
          </div>

          {/* Right: live event log */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              Live Activity
              <span style={styles.dot} />
            </div>
            <div ref={logRef} style={styles.log}>
              {events.map((e, i) => (
                <div key={i} style={styles.logEntry}>
                  <span style={styles.time}>{e.time}</span>
                  <span style={styles.message}>{e.message}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    margin: 0,
    padding: 0,
    background: "#f5f5f5",
    minHeight: "100vh",
    boxSizing: "border-box",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },
  topBar: {
    background: "#c0392b",
    padding: "14px 32px",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: "#fff",
    letterSpacing: "0.03em",
  },
  returningBadge: {
    fontSize: 12,
    background: "rgba(255,255,255,0.2)",
    color: "#fff",
    padding: "4px 12px",
    borderRadius: 20,
  },
  newBadge: {
    fontSize: 12,
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    padding: "4px 12px",
    borderRadius: 20,
  },
  container: {
    padding: "24px 32px",
    boxSizing: "border-box",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    height: "calc(100vh - 110px)",
  },
  card: {
    background: "#fff",
    borderRadius: 8,
    border: "1px solid #e0e0e0",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  cardHeader: {
    fontSize: 12,
    fontWeight: 600,
    color: "#888",
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
    gap: 8,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#22c55e",
    display: "inline-block",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  row: {
    borderBottom: "1px solid #f5f5f5",
  },
  tdKey: {
    color: "#999",
    fontSize: 13,
    padding: "9px 16px 9px 0",
    whiteSpace: "nowrap",
    verticalAlign: "top",
    width: 120,
  },
  tdVal: {
    color: "#1a1a1a",
    fontSize: 13,
    padding: "9px 0",
    wordBreak: "break-all",
  },
  log: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  logEntry: {
    display: "flex",
    gap: 12,
    padding: "7px 0",
    borderBottom: "1px solid #fafafa",
  },
  time: {
    color: "#bbb",
    fontSize: 12,
    minWidth: 95,
    whiteSpace: "nowrap",
  },
  message: {
    color: "#333",
    fontSize: 13,
  },
  loading: {
    color: "#bbb",
    fontSize: 13,
  },
};