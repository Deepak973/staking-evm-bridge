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
  "Implementation": "0xcc763626A1F0daf181A8470D8cD8264D9d518124",
  "ProxyAdmin": "0x4ceDc84B14987B8e07ea1dc273CB89A3817557Ff",
  "Proxy": "0x8FCfC0d582dEB98ee1f67432DaA5B9b9835d84fA"
}
```

### Verified Source code

Implementation: https://sepolia.basescan.org/address/0x8FCfC0d582dEB98ee1f67432DaA5B9b9835d84fA#writeProxyContract

ProxyAdmin: https://sepolia.basescan.org/address/0x4ceDc84B14987B8e07ea1dc273CB89A3817557Ff#code

Proxy: https://sepolia.basescan.org/address/0x8FCfC0d582dEB98ee1f67432DaA5B9b9835d84fA#code

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
