"""
URL threat intelligence & phishing forensics engine.
Pure Python — no external API calls, no heavy dependencies.
Uses urllib, re, ipaddress, socket from stdlib + tldextract.

Checks:
  1.  HTTPS / SSL validation
  2.  IP-based URL detection
  3.  Suspicious TLD
  4.  Phishing keyword patterns
  5.  Brand impersonation (typosquatting)
  6.  Excessive subdomains
  7.  Domain length & entropy anomaly
  8.  Suspicious path patterns
  9.  URL shortener detection
  10. Homoglyph / punycode attack
  11. Excessive redirects (heuristic from URL structure)
  12. Suspicious query parameters
  13. Known malicious pattern signatures
"""

from __future__ import annotations

import re
import math
import socket
import ipaddress
import logging
from urllib.parse import urlparse, parse_qs
from typing import Any

logger = logging.getLogger(__name__)

# ── word lists ────────────────────────────────────────────────────────────────

PHISHING_KEYWORDS = [
    "login", "signin", "sign-in", "verify", "verification", "secure",
    "account", "update", "confirm", "banking", "paypal", "amazon",
    "apple", "microsoft", "google", "facebook", "instagram", "netflix",
    "password", "credential", "wallet", "crypto", "bitcoin", "urgent",
    "suspended", "limited", "unusual", "activity", "alert", "notice",
    "click", "free", "prize", "winner", "congratulations", "reward",
    "invoice", "payment", "refund", "tax", "irs", "gov-",
]

BRAND_TARGETS = [
    "paypal", "amazon", "apple", "microsoft", "google", "facebook",
    "instagram", "netflix", "twitter", "linkedin", "dropbox", "chase",
    "wellsfargo", "bankofamerica", "citibank", "hsbc", "barclays",
    "ebay", "alibaba", "shopify", "stripe", "coinbase", "binance",
]

SUSPICIOUS_TLDS = {
    ".tk", ".ml", ".ga", ".cf", ".gq",   # free TLDs heavily abused
    ".xyz", ".top", ".club", ".online", ".site", ".website",
    ".info", ".biz", ".click", ".link", ".download", ".zip",
    ".review", ".country", ".kim", ".science", ".work", ".party",
    ".gdn", ".stream", ".loan", ".win", ".bid", ".trade",
}

URL_SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "buff.ly",
    "short.link", "rb.gy", "cutt.ly", "is.gd", "v.gd", "tiny.cc",
    "shorte.st", "adf.ly", "bc.vc", "clk.sh", "linktr.ee",
}

SUSPICIOUS_PATH_PATTERNS = [
    r"wp-admin", r"wp-login", r"phpmyadmin", r"admin/login",
    r"\.php\?", r"cmd=", r"exec=", r"shell", r"passwd",
    r"etc/passwd", r"\.env", r"config\.php", r"setup\.php",
    r"install\.php", r"xmlrpc\.php", r"eval\(", r"base64",
]

SUSPICIOUS_PARAM_KEYS = [
    "redirect", "url", "next", "return", "goto", "target",
    "redir", "dest", "destination", "forward", "link", "ref",
    "callback", "continue", "returnurl", "returnto",
]

HOMOGLYPH_CHARS = re.compile(r"[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]|xn--")


# ── helpers ───────────────────────────────────────────────────────────────────

def _entropy(s: str) -> float:
    """Shannon entropy of a string."""
    if not s:
        return 0.0
    freq = {}
    for c in s:
        freq[c] = freq.get(c, 0) + 1
    n = len(s)
    return -sum((f / n) * math.log2(f / n) for f in freq.values())


def _is_ip(host: str) -> bool:
    try:
        ipaddress.ip_address(host)
        return True
    except ValueError:
        return False


def _resolve_host(host: str) -> dict[str, Any]:
    """Try to resolve hostname. Returns IP and basic info."""
    try:
        ip = socket.gethostbyname(host)
        return {"resolved": True, "ip": ip, "is_private": ipaddress.ip_address(ip).is_private}
    except Exception:
        return {"resolved": False, "ip": None, "is_private": False}


def _extract_domain_parts(parsed) -> dict[str, Any]:
    """Extract TLD, domain, subdomain from parsed URL."""
    host = parsed.hostname or ""
    parts = host.split(".")
    if len(parts) >= 2:
        tld = "." + parts[-1]
        domain = parts[-2]
        subdomains = parts[:-2]
    else:
        tld = ""
        domain = host
        subdomains = []
    return {
        "host": host,
        "tld": tld,
        "domain": domain,
        "subdomains": subdomains,
        "subdomain_count": len(subdomains),
    }


# ── individual checks ─────────────────────────────────────────────────────────

def check_https(parsed) -> dict[str, Any]:
    is_https = parsed.scheme == "https"
    return {
        "indicator": "HTTPS / SSL",
        "passed": is_https,
        "detail": "Connection uses HTTPS (encrypted)" if is_https
                  else "URL uses plain HTTP — no transport encryption. Credentials transmitted in cleartext.",
        "severity": "low" if is_https else "high",
        "score": 0.0 if is_https else 0.7,
    }


def check_ip_url(host: str) -> dict[str, Any]:
    is_ip = _is_ip(host)
    return {
        "indicator": "IP-Based URL",
        "passed": not is_ip,
        "detail": "Domain uses a proper hostname" if not is_ip
                  else f"URL uses raw IP address ({host}) instead of a domain name — common in phishing infrastructure.",
        "severity": "low" if not is_ip else "critical",
        "score": 0.0 if not is_ip else 0.95,
    }


def check_suspicious_tld(tld: str) -> dict[str, Any]:
    suspicious = tld.lower() in SUSPICIOUS_TLDS
    return {
        "indicator": "Suspicious TLD",
        "passed": not suspicious,
        "detail": f"TLD '{tld}' is within normal range" if not suspicious
                  else f"TLD '{tld}' is heavily associated with free/abused domains and phishing campaigns.",
        "severity": "low" if not suspicious else "high",
        "score": 0.0 if not suspicious else 0.75,
    }


def check_phishing_keywords(url_lower: str, path: str, host: str) -> dict[str, Any]:
    found = [kw for kw in PHISHING_KEYWORDS if kw in url_lower]
    count = len(found)
    suspicious = count >= 2
    return {
        "indicator": "Phishing Keywords",
        "passed": not suspicious,
        "detail": f"No significant phishing keywords detected" if not suspicious
                  else f"URL contains {count} phishing-associated keywords: {', '.join(found[:5])}. "
                       "High keyword density is a strong phishing indicator.",
        "severity": "low" if not suspicious else ("critical" if count >= 4 else "high"),
        "score": min(count * 0.18, 0.95),
        "found_keywords": found[:8],
    }


def check_brand_impersonation(host: str, domain: str) -> dict[str, Any]:
    host_lower = host.lower()
    hits = []
    for brand in BRAND_TARGETS:
        # Brand in subdomain but not as the registered domain
        if brand in host_lower and brand != domain.lower():
            hits.append(brand)
        # Typosquatting: edit distance 1 from brand
        elif _levenshtein(domain.lower(), brand) == 1:
            hits.append(f"{brand} (typosquat)")
    suspicious = len(hits) > 0
    return {
        "indicator": "Brand Impersonation",
        "passed": not suspicious,
        "detail": "No brand impersonation patterns detected" if not suspicious
                  else f"Domain appears to impersonate: {', '.join(hits[:3])}. "
                       "Brand name in subdomain with different registered domain is a classic phishing technique.",
        "severity": "low" if not suspicious else "critical",
        "score": 0.0 if not suspicious else 0.92,
        "impersonated_brands": hits[:5],
    }


def _levenshtein(a: str, b: str) -> int:
    if len(a) < len(b):
        return _levenshtein(b, a)
    if not b:
        return len(a)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a):
        curr = [i + 1]
        for j, cb in enumerate(b):
            curr.append(min(prev[j + 1] + 1, curr[j] + 1, prev[j] + (ca != cb)))
        prev = curr
    return prev[-1]


def check_subdomain_depth(subdomains: list[str]) -> dict[str, Any]:
    count = len(subdomains)
    suspicious = count >= 3
    return {
        "indicator": "Excessive Subdomains",
        "passed": not suspicious,
        "detail": f"{count} subdomain level(s) — within normal range" if not suspicious
                  else f"{count} subdomain levels detected ({'.'.join(subdomains)}). "
                       "Deep subdomain nesting is used to disguise the true registered domain.",
        "severity": "low" if not suspicious else "medium",
        "score": 0.0 if count < 3 else min((count - 2) * 0.25, 0.8),
    }


def check_domain_entropy(domain: str, host: str) -> dict[str, Any]:
    ent = _entropy(domain)
    length = len(host)
    # High entropy + long domain = likely DGA (domain generation algorithm)
    suspicious = (ent > 3.8 and length > 20) or length > 50
    return {
        "indicator": "Domain Structure Anomaly",
        "passed": not suspicious,
        "detail": f"Domain entropy={ent:.2f}, length={length} — within normal range" if not suspicious
                  else f"Domain entropy={ent:.2f}, length={length}. "
                       "High-entropy long domains are characteristic of DGA-generated or obfuscated phishing domains.",
        "severity": "low" if not suspicious else "medium",
        "score": 0.0 if not suspicious else min((ent - 3.0) / 2.0, 0.85),
        "entropy": round(ent, 3),
        "host_length": length,
    }


def check_path_patterns(path: str) -> dict[str, Any]:
    path_lower = path.lower()
    hits = [p for p in SUSPICIOUS_PATH_PATTERNS if re.search(p, path_lower)]
    suspicious = len(hits) > 0
    return {
        "indicator": "Suspicious Path Patterns",
        "passed": not suspicious,
        "detail": "URL path contains no suspicious patterns" if not suspicious
                  else f"Suspicious path patterns detected: {', '.join(hits[:3])}. "
                       "These patterns are associated with web shell access, credential harvesting, or exploit delivery.",
        "severity": "low" if not suspicious else "high",
        "score": 0.0 if not suspicious else min(len(hits) * 0.3, 0.9),
    }


def check_url_shortener(host: str) -> dict[str, Any]:
    is_short = host.lower() in URL_SHORTENERS
    return {
        "indicator": "URL Shortener",
        "passed": not is_short,
        "detail": "URL is not a known shortener service" if not is_short
                  else f"URL uses shortener service '{host}' which obscures the true destination. "
                       "Shorteners are frequently used to hide phishing and malware URLs.",
        "severity": "low" if not is_short else "medium",
        "score": 0.0 if not is_short else 0.55,
    }


def check_homoglyph(host: str) -> dict[str, Any]:
    has_homoglyph = bool(HOMOGLYPH_CHARS.search(host))
    return {
        "indicator": "Homoglyph / Punycode Attack",
        "passed": not has_homoglyph,
        "detail": "No homoglyph or punycode substitution detected" if not has_homoglyph
                  else f"Homoglyph characters or punycode encoding detected in '{host}'. "
                       "Attackers use visually similar Unicode characters to impersonate legitimate domains.",
        "severity": "low" if not has_homoglyph else "critical",
        "score": 0.0 if not has_homoglyph else 0.93,
    }


def check_query_params(query_string: str) -> dict[str, Any]:
    if not query_string:
        return {"indicator": "Query Parameters", "passed": True,
                "detail": "No suspicious query parameters", "severity": "low", "score": 0.0}
    params = parse_qs(query_string)
    hits = [k for k in params if k.lower() in SUSPICIOUS_PARAM_KEYS]
    # Check for encoded URLs in values
    encoded_urls = any(
        ("http" in str(v).lower() or "%2f" in str(v).lower())
        for vals in params.values() for v in vals
    )
    suspicious = len(hits) > 0 or encoded_urls
    return {
        "indicator": "Open Redirect Parameters",
        "passed": not suspicious,
        "detail": "No open redirect parameters detected" if not suspicious
                  else f"Suspicious redirect parameters found: {', '.join(hits[:4])}. "
                       "Open redirect parameters can be exploited to forward victims to malicious sites.",
        "severity": "low" if not suspicious else "high",
        "score": 0.0 if not suspicious else 0.72,
        "suspicious_params": hits[:6],
    }


def check_malicious_patterns(url: str) -> dict[str, Any]:
    """Check for known malicious URL signatures."""
    patterns = [
        (r"[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/[a-z0-9]{8,}", "IP with random path"),
        (r"\.php\?[a-z]=[a-z0-9+/=]{20,}", "PHP with base64-like parameter"),
        (r"(free|win|prize|claim|reward).{0,20}(click|now|here)", "Social engineering pattern"),
        (r"[a-z0-9]{20,}\.(tk|ml|ga|cf|gq)", "Random string on free TLD"),
        (r"https?://[^/]+@", "Credentials in URL"),
        (r"data:", "Data URI scheme"),
    ]
    hits = []
    url_lower = url.lower()
    for pattern, label in patterns:
        if re.search(pattern, url_lower):
            hits.append(label)
    suspicious = len(hits) > 0
    return {
        "indicator": "Malicious Pattern Signatures",
        "passed": not suspicious,
        "detail": "No known malicious URL signatures detected" if not suspicious
                  else f"Matched {len(hits)} malicious pattern(s): {'; '.join(hits)}. "
                       "These patterns are directly associated with phishing kits and malware delivery.",
        "severity": "low" if not suspicious else "critical",
        "score": 0.0 if not suspicious else min(len(hits) * 0.4, 0.97),
    }


# ── master analysis ───────────────────────────────────────────────────────────

def run_url_analysis(url: str) -> dict[str, Any]:
    """
    Full URL forensic pipeline. Returns structured result dict.
    """
    # Normalise — add scheme if missing
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    try:
        parsed = urlparse(url)
    except Exception as e:
        raise ValueError(f"Invalid URL: {e}")

    host = parsed.hostname or ""
    path = parsed.path or ""
    query = parsed.query or ""
    url_lower = url.lower()

    dp = _extract_domain_parts(parsed)
    domain = dp["domain"]
    tld = dp["tld"]
    subdomains = dp["subdomains"]

    # DNS resolution (best-effort, non-blocking)
    dns_info = _resolve_host(host)

    # Run all checks
    checks = [
        check_https(parsed),
        check_ip_url(host),
        check_suspicious_tld(tld),
        check_phishing_keywords(url_lower, path, host),
        check_brand_impersonation(host, domain),
        check_subdomain_depth(subdomains),
        check_domain_entropy(domain, host),
        check_path_patterns(path),
        check_url_shortener(host),
        check_homoglyph(host),
        check_query_params(query),
        check_malicious_patterns(url),
    ]

    # ── Scoring ───────────────────────────────────────────────────────────────
    weights = {
        "HTTPS / SSL": 0.08,
        "IP-Based URL": 0.14,
        "Suspicious TLD": 0.08,
        "Phishing Keywords": 0.12,
        "Brand Impersonation": 0.16,
        "Excessive Subdomains": 0.06,
        "Domain Structure Anomaly": 0.06,
        "Suspicious Path Patterns": 0.08,
        "URL Shortener": 0.04,
        "Homoglyph / Punycode Attack": 0.10,
        "Open Redirect Parameters": 0.04,
        "Malicious Pattern Signatures": 0.14,
    }

    raw_risk = sum(
        c["score"] * weights.get(c["indicator"], 0.05)
        for c in checks
    )
    flag_count = sum(1 for c in checks if not c["passed"])
    risk_score = round(min(raw_risk + 0.03 * flag_count, 0.99), 4)
    trust_score = round((1.0 - risk_score) * 100, 1)
    confidence = round(min(0.55 + risk_score * 0.44, 0.99), 4)

    if risk_score >= 0.55:
        verdict = "fake"
        risk_level = "HIGH" if risk_score >= 0.75 else "MEDIUM-HIGH"
    elif risk_score >= 0.25:
        verdict = "uncertain"
        risk_level = "MEDIUM"
    else:
        verdict = "real"
        risk_level = "LOW"

    # ── Build forensic findings (only flagged checks) ─────────────────────────
    sev_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    findings = [
        {
            "indicator": c["indicator"],
            "severity": c["severity"],
            "detail": c["detail"],
            "score": round(c["score"], 3),
        }
        for c in checks
        if not c["passed"]
    ]
    findings.sort(key=lambda x: sev_order.get(x["severity"], 9))

    # ── Domain info card ──────────────────────────────────────────────────────
    domain_info = {
        "host": host,
        "domain": domain,
        "tld": tld,
        "subdomain_count": dp["subdomain_count"],
        "subdomains": subdomains,
        "scheme": parsed.scheme,
        "path": path[:120] if path else "/",
        "has_query": bool(query),
        "resolved_ip": dns_info.get("ip"),
        "dns_resolved": dns_info.get("resolved", False),
        "is_private_ip": dns_info.get("is_private", False),
        "entropy": round(_entropy(domain), 3),
        "host_length": len(host),
    }

    # ── SSL card ──────────────────────────────────────────────────────────────
    ssl_info = {
        "uses_https": parsed.scheme == "https",
        "scheme": parsed.scheme,
        "status": "Valid HTTPS" if parsed.scheme == "https" else "No SSL/TLS",
        "risk": "low" if parsed.scheme == "https" else "high",
    }

    # ── All checks summary (for UI) ───────────────────────────────────────────
    checks_summary = [
        {
            "indicator": c["indicator"],
            "passed": c["passed"],
            "severity": c["severity"],
            "score": round(c["score"], 3),
        }
        for c in checks
    ]

    return {
        "url": url,
        "verdict": verdict,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "trust_score": trust_score,
        "confidence": confidence,
        "flag_count": flag_count,
        "phishing_probability": round(risk_score, 4),
        "malware_probability": round(risk_score * 0.6, 4),
        "forensic_findings": findings,
        "checks_summary": checks_summary,
        "domain_info": domain_info,
        "ssl_info": ssl_info,
    }
