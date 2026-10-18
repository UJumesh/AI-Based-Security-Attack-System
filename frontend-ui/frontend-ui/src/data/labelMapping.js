/**
 * Label mapping, severity definitions, and attack metadata
 * Synchronized with ml/data/processed/label_mapping.json
 */

export const LABEL_MAPPING = {
  "BENIGN": 0,
  "Bot": 1,
  "DDoS": 2,
  "DoS GoldenEye": 3,
  "DoS Hulk": 4,
  "DoS Slowhttptest": 5,
  "DoS slowloris": 6,
  "FTP-Patator": 7,
  "Heartbleed": 8,
  "Infiltration": 9,
  "PortScan": 10,
  "SSH-Patator": 11,
  "Web Attack \u2013 Brute Force": 12,
  "Web Attack \u2013 Sql Injection": 13,
  "Web Attack \u2013 XSS": 14
};

export const ID_TO_LABEL = Object.entries(LABEL_MAPPING).reduce((acc, [label, id]) => {
  acc[id] = label;
  return acc;
}, {});

export const CLASS_METADATA = {
  "BENIGN": {
    severity: "safe",
    color: "#10B981",
    bg: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.3)",
    description: "Standard legitimate network packet exchange adhering to standard RFC flow protocols.",
    category: "Legitimate Traffic",
    mitigation: "No action required. Traffic is normal.",
  },
  "Bot": {
    severity: "high",
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.3)",
    description: "Automated botnet agent command-and-control beaconing or orchestrated propagation activity.",
    category: "Malware / Botnet",
    mitigation: "Isolate client workstation, check persistence mechanisms, and block C2 outbound IP addresses.",
  },
  "DDoS": {
    severity: "critical",
    color: "#EF4444",
    bg: "rgba(239, 68, 68, 0.15)",
    border: "rgba(239, 68, 68, 0.4)",
    description: "Distributed Denial of Service traffic flood overwhelming server bandwidth and socket tables.",
    category: "Denial of Service",
    mitigation: "Activate upstream scrubbing center, rate-limit SYN requests, and enable Cloudflare/Akamai shield.",
  },
  "DoS GoldenEye": {
    severity: "critical",
    color: "#EF4444",
    bg: "rgba(239, 68, 68, 0.15)",
    border: "rgba(239, 68, 68, 0.4)",
    description: "Layer 7 DoS attack utilizing keep-alive headers and persistent HTTP connection pools.",
    category: "Denial of Service",
    mitigation: "Enforce web server connection timeouts (mod_reqtimeout) and limit concurrent open keep-alive sockets.",
  },
  "DoS Hulk": {
    severity: "critical",
    color: "#EF4444",
    bg: "rgba(239, 68, 68, 0.15)",
    border: "rgba(239, 68, 68, 0.4)",
    description: "HTTP Unbearable Load King: High-volume flood generating dynamic randomized URL queries to bypass caches.",
    category: "Denial of Service",
    mitigation: "Enable dynamic challenge response (CAPTCHA), inspect request entropy, and deploy WAF rate-limiting.",
  },
  "DoS Slowhttptest": {
    severity: "high",
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.3)",
    description: "Slow-read or Slowloris attack that transmits fragments slowly to exhaust socket connection pools.",
    category: "Denial of Service",
    mitigation: "Configure minimum data transfer rate thresholds on reverse proxies (Nginx/HAProxy).",
  },
  "DoS slowloris": {
    severity: "high",
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.3)",
    description: "Partial HTTP header starvation attack keeping target sockets open indefinitely.",
    category: "Denial of Service",
    mitigation: "Deploy event-driven frontends (e.g. Nginx reverse proxy) and enforce client header timeout limits.",
  },
  "FTP-Patator": {
    severity: "high",
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.3)",
    description: "Iterative brute-force dictionary authentication attempts against FTP service (Port 21).",
    category: "Credential Access",
    mitigation: "Deploy Fail2ban, disable cleartext FTP in favor of SFTP/FTPS, and enforce account lockouts.",
  },
  "Heartbleed": {
    severity: "critical",
    color: "#EF4444",
    bg: "rgba(239, 68, 68, 0.15)",
    border: "rgba(239, 68, 68, 0.4)",
    description: "Exploitation of OpenSSL TLS heartbeat extension memory leak (CVE-2014-0160).",
    category: "Memory Disclosure",
    mitigation: "Upgrade OpenSSL to patched versions, revoke compromised certificates, and regenerate private keys.",
  },
  "Infiltration": {
    severity: "critical",
    color: "#EF4444",
    bg: "rgba(239, 68, 68, 0.15)",
    border: "rgba(239, 68, 68, 0.4)",
    description: "Lateral network traversal following a client-side exploit (Dropbox/waterhole payload execution).",
    category: "Lateral Movement",
    mitigation: "Enforce zero-trust microsegmentation, monitor internal RPC/SMB flows, and audit endpoint activity.",
  },
  "PortScan": {
    severity: "medium",
    color: "#2878FF",
    bg: "rgba(40, 120, 255, 0.12)",
    border: "rgba(40, 120, 255, 0.3)",
    description: "Active probe scanning across consecutive ports (TCP SYN/ACK/FIN sweep) mapping open services.",
    category: "Reconnaissance",
    mitigation: "Block scanning source IP at edge firewall, deploy port-knocking or honeypots to detect reconnaissance.",
  },
  "SSH-Patator": {
    severity: "high",
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.3)",
    description: "High-frequency multi-threaded password brute-force against SSH daemon (Port 22).",
    category: "Credential Access",
    mitigation: "Enforce SSH public-key-only authentication, move SSH to non-standard port, and activate Fail2ban.",
  },
  "Web Attack \u2013 Brute Force": {
    severity: "high",
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.3)",
    description: "Automated credential stuffing or form brute-forcing against web authentication endpoints.",
    category: "Web Application",
    mitigation: "Enforce Multi-Factor Authentication (MFA), CAPTCHA challenges, and IP-based rate limiting.",
  },
  "Web Attack \u2013 Sql Injection": {
    severity: "critical",
    color: "#EF4444",
    bg: "rgba(239, 68, 68, 0.15)",
    border: "rgba(239, 68, 68, 0.4)",
    description: "Malicious SQL fragments injected into HTTP parameters to extract or alter backend database tables.",
    category: "Web Application",
    mitigation: "Enforce parameterized queries (prepared statements), use ORM, and activate SQLi inspection in WAF.",
  },
  "Web Attack \u2013 XSS": {
    severity: "high",
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.3)",
    description: "Cross-Site Scripting attempt injecting browser-executable payload scripts into web inputs.",
    category: "Web Application",
    mitigation: "Sanitize and HTML-encode all dynamic user inputs, set strict Content-Security-Policy (CSP) headers.",
  }
};

export function getThreatDetails(label) {
  if (!label) {
    return {
      severity: "unknown",
      color: "#94A3B8",
      bg: "rgba(148, 163, 184, 0.1)",
      border: "rgba(148, 163, 184, 0.3)",
      description: "Unclassified traffic record.",
      category: "Unknown",
      mitigation: "Review traffic parameters manually.",
    };
  }

  // Exact match or fallback
  return CLASS_METADATA[label] || {
    severity: label.toUpperCase().includes("BENIGN") ? "safe" : "high",
    color: label.toUpperCase().includes("BENIGN") ? "#10B981" : "#EF4444",
    bg: label.toUpperCase().includes("BENIGN") ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.15)",
    border: label.toUpperCase().includes("BENIGN") ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.4)",
    description: `${label} attack pattern identified by Random Forest model.`,
    category: "Network Attack",
    mitigation: "Inspect flow metadata and verify host isolation status.",
  };
}
