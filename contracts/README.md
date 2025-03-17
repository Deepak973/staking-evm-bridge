## Project Setup

### Install Dependencies

Ensure you have Foundry installed. If not, install it using:

```sh
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

This will install Foundry and update it to the latest version.

### Environment Variables

1. Copy the `.env.example` file to create a new `.env` file:

```sh
cp .env.example .env
```

2. Fill in the required environment variables in `.env`:

```
RPC_URL=                  # Your RPC endpoint
PRIVATE_KEY=             # Deployer wallet private key
ETHERSCAN_API_KEY=       # For contract verification
CCIP_ROUTER=             # Chainlink CCIP Router address
LINK_TOKEN=              # LINK token address
```

3. Load the environment variables:

```sh
source .env
```

### Compilation

Compile the smart contracts:

```sh
forge build
```

Remappings are already added, so no need to configure them manually.

### Running Tests

Run all tests using:

```sh
forge test
```

### Deployment

Deploy the contracts using the deployment script:

```sh
forge script script/DeployStakingBridge.s.sol \
 --rpc-url ${RPC_URL} \
 --verify \
 --etherscan-api-key ${ETHERSCAN_API_KEY} \
 -vv \
 --broadcast
```

### Deployed Contract Addresses (Base Sepolia)

```json
{
  "Implementation": "0x763157627b04E4E40C6048e66fD94fFf5081DACD",
  "ProxyAdmin": "0x0b52a8Ed3501Ec4443e923206D26DaBb303d7e69",
  "Proxy": "0xf278B688d49a86b89A56957e11521f70E4e98B31"
}
```

### Verified Source code

Implementation: https://sepolia.basescan.org/address/0x763157627b04E4E40C6048e66fD94fFf5081DACD#writeProxyContract

ProxyAdmin: https://sepolia.basescan.org/address/0x0b52a8Ed3501Ec4443e923206D26DaBb303d7e69#code

Proxy: https://sepolia.basescan.org/address/0xf278B688d49a86b89A56957e11521f70E4e98B31#code

### Key Features

- ERC20 and Native token staking
- Cross-chain transfers using Chainlink CCIP
- Upgradeable contracts using OpenZeppelin Proxy pattern
- Flexible staking periods with rewards
- Early withdrawal penalties

### Contract Verification command

```sh
forge verify-contract 0x7f6AaECB036346B65d52e0e40448b7197416E151 ./src/StakingBridge.sol:StakingBridge --compiler-version 0.8.26 --chain 84532 --etherscan-api-key ${ETHERSCAN_API_KEY} --rpc-url ${RPC_URL}
```
