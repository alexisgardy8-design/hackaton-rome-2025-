#!/bin/bash

# XRPL Platform - Smoke Tests
# Run these tests after deployment to verify critical functionality

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
TIMEOUT=5
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo "╔════════════════════════════════════════╗"
echo "║     XRPL Platform - Smoke Tests        ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Target: $API_URL"
echo "Timeout: ${TIMEOUT}s"
echo ""

# Helper functions
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    local method=${4:-GET}
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing $name... "
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" --max-time "$TIMEOUT" "$url" 2>&1)
    
    if [ "$RESPONSE" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $RESPONSE)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected HTTP $expected_status, got $RESPONSE)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

test_json_response() {
    local name=$1
    local url=$2
    local expected_key=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing $name... "
    
    RESPONSE=$(curl -s --max-time "$TIMEOUT" "$url" 2>&1)
    
    if echo "$RESPONSE" | jq -e ".$expected_key" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC} (Found key: $expected_key)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Key not found: $expected_key)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

test_header() {
    local name=$1
    local url=$2
    local header=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing $name... "
    
    if curl -I -s --max-time "$TIMEOUT" "$url" | grep -qi "$header"; then
        echo -e "${GREEN}✓ PASS${NC} (Header found: $header)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Header not found: $header)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# ═══════════════════════════════════════════
# 1. Basic Health Checks
# ═══════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Health Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "Liveness probe" "$API_URL/health/live" 200
test_endpoint "Readiness probe" "$API_URL/health/ready" 200
test_json_response "Full health check" "$API_URL/health" "status"

echo ""

# ═══════════════════════════════════════════
# 2. Security Headers
# ═══════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Security Headers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_header "HSTS header" "$API_URL/health" "Strict-Transport-Security"
test_header "X-Frame-Options" "$API_URL/health" "X-Frame-Options"
test_header "X-Content-Type-Options" "$API_URL/health" "X-Content-Type-Options"
test_header "X-XSS-Protection" "$API_URL/health" "X-XSS-Protection"

echo ""

# ═══════════════════════════════════════════
# 3. API Endpoints (Unauthenticated)
# ═══════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Public API Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "Campaigns list" "$API_URL/api/campaigns" 200
test_endpoint "Campaign details (404)" "$API_URL/api/campaigns/999999" 404
test_endpoint "Nonexistent route (404)" "$API_URL/api/nonexistent" 404

echo ""

# ═══════════════════════════════════════════
# 4. Rate Limiting
# ═══════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Rate Limiting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_header "Rate limit headers" "$API_URL/api/campaigns" "RateLimit"

echo ""

# ═══════════════════════════════════════════
# 5. Database Connectivity
# ═══════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Database Connectivity"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_json_response "Database status" "$API_URL/health" "database"

echo ""

# ═══════════════════════════════════════════
# 6. XRPL Connectivity
# ═══════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. XRPL Connectivity"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_json_response "XRPL status" "$API_URL/health" "xrpl"
test_endpoint "XRPL balance" "$API_URL/api/xrpl/balance" 200

echo ""

# ═══════════════════════════════════════════
# 7. Authentication Flow
# ═══════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. Authentication"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test user registration
TIMESTAMP=$(date +%s)
TEST_EMAIL="smoketest-${TIMESTAMP}@example.com"

echo -n "Testing user registration... "
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"SmokeTest123456\",
        \"name\": \"Smoke Test User\",
        \"role\": \"INVESTOR\"
    }" 2>&1)

TOTAL_TESTS=$((TOTAL_TESTS + 1))

if echo "$REGISTER_RESPONSE" | jq -e '.token' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    
    # Extract token for authenticated tests
    TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')
    
    # Test profile endpoint with token
    echo -n "Testing authenticated profile... "
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PROFILE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        "$API_URL/api/auth/profile" 2>&1)
    
    if [ "$PROFILE_STATUS" = "200" ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $PROFILE_STATUS)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
else
    echo -e "${RED}✗ FAIL${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo "Response: $REGISTER_RESPONSE"
fi

echo ""

# ═══════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════
echo "╔════════════════════════════════════════╗"
echo "║          Test Summary                  ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Total tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
echo -e "${RED}Failed:       $FAILED_TESTS${NC}"
echo ""

PERCENTAGE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! (100%)${NC}"
    echo ""
    echo "🎉 Deployment is healthy and ready for production!"
    exit 0
elif [ $PERCENTAGE -ge 80 ]; then
    echo -e "${YELLOW}⚠️  Most tests passed ($PERCENTAGE%)${NC}"
    echo ""
    echo "Some non-critical tests failed. Review logs."
    exit 0
else
    echo -e "${RED}❌ Too many tests failed ($PERCENTAGE%)${NC}"
    echo ""
    echo "Deployment may have issues. Please investigate!"
    exit 1
fi
