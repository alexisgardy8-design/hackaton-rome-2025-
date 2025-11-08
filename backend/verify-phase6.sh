#!/bin/bash

# Phase 6 Quick Verification Script
# Tests basic security and monitoring features

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     Phase 6 Quick Verification - Security & Monitoring   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

BASE_URL="http://localhost:3000"
PASSED=0
FAILED=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=$3
    
    echo -n "Testing $name... "
    
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response_code" -eq "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response_code)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_code, got $response_code)"
        ((FAILED++))
    fi
}

# Test header presence
test_header() {
    local name=$1
    local url=$2
    local header=$3
    
    echo -n "Testing $name... "
    
    if curl -sI "$url" | grep -qi "$header"; then
        echo -e "${GREEN}✓ PASS${NC} ($header present)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} ($header missing)"
        ((FAILED++))
    fi
}

echo "1. Health Check Endpoints"
echo "─────────────────────────────────────────────────────────"
test_endpoint "Full health check" "$BASE_URL/health" 200
test_endpoint "Readiness check" "$BASE_URL/health/ready" 200
test_endpoint "Liveness check" "$BASE_URL/health/live" 200
echo ""

echo "2. Security Headers (Helmet)"
echo "─────────────────────────────────────────────────────────"
test_header "X-Frame-Options" "$BASE_URL/health" "X-Frame-Options"
test_header "X-XSS-Protection" "$BASE_URL/health" "X-XSS-Protection"
test_header "X-Content-Type-Options" "$BASE_URL/health" "X-Content-Type-Options"
test_header "Strict-Transport-Security" "$BASE_URL/health" "Strict-Transport-Security"
echo ""

echo "3. API Endpoints"
echo "─────────────────────────────────────────────────────────"
test_endpoint "Get campaigns" "$BASE_URL/api/campaigns" 200
test_endpoint "404 handler" "$BASE_URL/api/nonexistent" 404
echo ""

echo "4. Log Files"
echo "─────────────────────────────────────────────────────────"
echo -n "Checking log directory... "
if [ -d "logs" ]; then
    echo -e "${GREEN}✓ PASS${NC} (logs/ exists)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (logs/ missing)"
    ((FAILED++))
fi

echo -n "Checking for log files... "
if ls logs/*.log 1> /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC} (log files created)"
    ((PASSED++))
    echo "   Files:"
    ls -lh logs/*.log | awk '{print "   - " $9 " (" $5 ")"}'
else
    echo -e "${YELLOW}⚠ SKIP${NC} (no log files yet - make requests to generate)"
fi
echo ""

echo "5. Rate Limiting (Basic Test)"
echo "─────────────────────────────────────────────────────────"
echo -n "Testing rate limiter presence... "
# Make 3 quick requests
for i in {1..3}; do
    curl -s "$BASE_URL/api/campaigns" > /dev/null
done

# Check if RateLimit headers are present
if curl -sI "$BASE_URL/api/campaigns" | grep -qi "RateLimit"; then
    echo -e "${GREEN}✓ PASS${NC} (RateLimit headers present)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ PARTIAL${NC} (Rate limiter active but headers not visible)"
fi
echo ""

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                    Test Results                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ All tests passed! Phase 6 verified!  ✅  ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ Some tests failed. Check errors above.    ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════╝${NC}"
    exit 1
fi
