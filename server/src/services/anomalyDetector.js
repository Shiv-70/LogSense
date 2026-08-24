const normalize = (value) => String(value || "").toLowerCase();

function detectAnomaly(log) {
    const reasons = [];
    let score = 0;
    const message = normalize(log.message);
    const endpoint = normalize(log.endpoint);
    const method = normalize(log.http_method || log.method);

    const status = Number(log.status_code);

    if (status >= 500) {
        score += 40;
        reasons.push(`Server error status ${status}`);
    } else if (status >= 400) {
        score += 20;
        reasons.push(`Client error status ${status}`);
    }

    const sqlPatterns = [
        /union\s+(all\s+)?select/,
        /\bselect\b.+\bfrom\b/,
        /\bdrop\s+table\b/,
        /\binsert\s+into\b/,
        /or\s+1\s*=\s*1/,
        /--\s*$/
    ];
    if (sqlPatterns.some((pattern) => pattern.test(message) || pattern.test(endpoint))) {
        score += 55;
        reasons.push("SQL injection pattern detected");
    }

    const xssPatterns = [
        /<script\b/,
        /javascript:/,
        /onerror\s*=/,
        /onload\s*=/
    ];
    if (xssPatterns.some((pattern) => pattern.test(message) || pattern.test(endpoint))) {
        score += 55;
        reasons.push("Cross-site scripting pattern detected");
    }

    const suspiciousEndpointPatterns = [
        /\/wp-admin/,
        /\/phpmyadmin/,
        /\/admin/,
        /\/\.env/,
        /\/config/,
        /\/login/
    ];
    if (suspiciousEndpointPatterns.some((pattern) => pattern.test(endpoint))) {
        score += 20;
        reasons.push("Sensitive or administrative endpoint accessed");
    }

    if (log.severity === "CRITICAL") {
        score += 35;
        reasons.push("Log severity is CRITICAL");
    } else if (log.severity === "ERROR") {
        score += 25;
        reasons.push("Log severity is ERROR");
    } else if (log.severity === "WARNING") {
        score += 10;
        reasons.push("Log severity is WARNING");
    }

    if (method === "delete" && endpoint.includes("admin")) {
        score += 20;
        reasons.push("DELETE request targets an administrative endpoint");
    }

    score = Math.min(score, 100);

    if (score < 30) return null;

    let severity = "LOW";
    if (score >= 80) severity = "CRITICAL";
    else if (score >= 60) severity = "HIGH";
    else if (score >= 40) severity = "MEDIUM";

    return {
        score,
        severity,
        reason: reasons.join("; ")
    };
}

module.exports = { detectAnomaly };
