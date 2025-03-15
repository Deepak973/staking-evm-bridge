# Run the deployment script

forge script script/Deploy.s.sol \
 --rpc-url ${RPC_URL} \
 --verify \
 --etherscan-api-key ${ETHERSCAN_API_KEY} \
 -vv \
 --broadcast
