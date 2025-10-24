#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   JuryDAO Automated Deployment${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    exit 1
fi

# Load environment variables
source .env

# Validate required variables
if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ Error: PRIVATE_KEY not set in .env${NC}"
    exit 1
fi

if [ -z "$BASE_SEPOLIA_RPC" ]; then
    echo -e "${RED}❌ Error: BASE_SEPOLIA_RPC not set in .env${NC}"
    exit 1
fi

echo -e "${YELLOW}🧹 Step 1: Cleaning old builds...${NC}"
forge clean
echo -e "${GREEN}✅ Clean complete${NC}\n"

echo -e "${YELLOW}🔨 Step 2: Compiling contracts...${NC}"
forge build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Compilation failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Compilation successful${NC}\n"

echo -e "${YELLOW}🚀 Step 3: Deploying to Base Sepolia...${NC}"
echo -e "${BLUE}   This may take 1-2 minutes...${NC}\n"

# Run deployment and capture output
DEPLOY_OUTPUT=$(forge script script/Deploy.s.sol \
    --rpc-url base_sepolia \
    --broadcast \
    --verify \
    -vv 2>&1)

# Check if deployment succeeded
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

echo "$DEPLOY_OUTPUT"

echo -e "\n${YELLOW}📝 Step 4: Extracting contract addresses...${NC}"

# Extract addresses using different patterns
TOKEN_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oP '(?<=GovernanceToken deployed at: )[0-9a-fA-Fx]+' | head -1)
REGISTRY_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oP '(?<=JurorRegistry deployed at: )[0-9a-fA-Fx]+' | head -1)
GOVERNOR_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oP '(?<=GovernorSortition deployed at: )[0-9a-fA-Fx]+' | head -1)

# Alternative extraction if first method fails
if [ -z "$TOKEN_ADDRESS" ]; then
    TOKEN_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "GovernanceToken" -A 2 | grep -oP '0x[a-fA-F0-9]{40}' | head -1)
fi

if [ -z "$REGISTRY_ADDRESS" ]; then
    REGISTRY_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "JurorRegistry" -A 2 | grep -oP '0x[a-fA-F0-9]{40}' | head -1)
fi

if [ -z "$GOVERNOR_ADDRESS" ]; then
    GOVERNOR_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "GovernorSortition" -A 2 | grep -oP '0x[a-fA-F0-9]{40}' | head -1)
fi

# Display extracted addresses
echo -e "\n${GREEN}📍 Deployed Addresses:${NC}"
echo -e "${BLUE}Token:    ${NC}$TOKEN_ADDRESS"
echo -e "${BLUE}Registry: ${NC}$REGISTRY_ADDRESS"
echo -e "${BLUE}Governor: ${NC}$GOVERNOR_ADDRESS\n"

# Validate addresses
if [ -z "$TOKEN_ADDRESS" ] || [ -z "$REGISTRY_ADDRESS" ] || [ -z "$GOVERNOR_ADDRESS" ]; then
    echo -e "${RED}❌ Failed to extract all addresses!${NC}"
    echo -e "${YELLOW}Please check the deployment output above.${NC}"
    exit 1
fi

echo -e "${YELLOW}💾 Step 5: Updating .env file...${NC}"

# Backup existing .env
cp .env .env.backup
echo -e "${GREEN}✅ Backup created: .env.backup${NC}"

# Update or add addresses in .env
sed -i.tmp "s|^VITE_GOVERNANCE_TOKEN=.*|VITE_GOVERNANCE_TOKEN=$TOKEN_ADDRESS|" .env
sed -i.tmp "s|^VITE_JUROR_REGISTRY=.*|VITE_JUROR_REGISTRY=$REGISTRY_ADDRESS|" .env
sed -i.tmp "s|^VITE_GOVERNOR_SORTITION=.*|VITE_GOVERNOR_SORTITION=$GOVERNOR_ADDRESS|" .env

# If variables don't exist, append them
grep -q "VITE_GOVERNANCE_TOKEN=" .env || echo "VITE_GOVERNANCE_TOKEN=$TOKEN_ADDRESS" >> .env
grep -q "VITE_JUROR_REGISTRY=" .env || echo "VITE_JUROR_REGISTRY=$REGISTRY_ADDRESS" >> .env
grep -q "VITE_GOVERNOR_SORTITION=" .env || echo "VITE_GOVERNOR_SORTITION=$GOVERNOR_ADDRESS" >> .env

# Clean up temp file
rm -f .env.tmp

echo -e "${GREEN}✅ .env updated successfully${NC}\n"

echo -e "${YELLOW}🔗 Step 6: Verification links...${NC}"
echo -e "${BLUE}Token:${NC}     https://sepolia.basescan.org/address/$TOKEN_ADDRESS"
echo -e "${BLUE}Registry:${NC}  https://sepolia.basescan.org/address/$REGISTRY_ADDRESS"
echo -e "${BLUE}Governor:${NC}  https://sepolia.basescan.org/address/$GOVERNOR_ADDRESS\n"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   ✅ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${YELLOW}📋 Next Steps:${NC}"
echo -e "1. Restart your dev server: ${BLUE}npm run dev${NC}"
echo -e "2. Hard refresh browser: ${BLUE}Ctrl+Shift+R${NC}"
echo -e "3. Check addresses in browser console"
echo -e "4. Register as juror and test!\n"

echo -e "${BLUE}💡 Tip: Check .env.backup if you need to restore old addresses${NC}\n"
