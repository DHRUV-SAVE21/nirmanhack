import json
import os
from web3 import Web3
from solcx import compile_standard, install_solc
from dotenv import load_dotenv

load_dotenv()

def deploy():
    # 1. Connect to Ganache
    # Default Ganache URL is usually https://127.0.0.1:8545 or 7545
    w3 = Web3(Web3.HTTPProvider("https://127.0.0.1:8545"))
    
    if not w3.is_connected():
        print(" Failed to connect to Ganache blockchain.")
        print("   Make sure you ran 'ganache' in a separate terminal!")
        return

    # Load env from parent directory
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

    print(f" Connected to Ganache. Block Number: {w3.eth.block_number}")

    # 2. Compile Solidity
    print(" Compiling Smart Contract...")
    install_solc("0.8.0")
    
    script_dir = os.path.dirname(__file__)
    contract_path = os.path.join(script_dir, "contracts", "LandRegistry.sol")
    
    with open(contract_path, "r") as file:
        land_registry_file = file.read()

    compiled_sol = compile_standard(
        {
            "language": "Solidity",
            "sources": {"LandRegistry.sol": {"content": land_registry_file}},
            "settings": {
                "outputSelection": {
                    "*": {
                        "*": ["abi", "metadata", "evm.bytecode", "evm.sourceMap"]
                    }
                }
            },
        },
        solc_version="0.8.0",
    )

    bytecode = compiled_sol["contracts"]["LandRegistry.sol"]["LandRegistry"]["evm"]["bytecode"]["object"]
    abi = compiled_sol["contracts"]["LandRegistry.sol"]["LandRegistry"]["abi"]

    # 3. Deploy
    print(" Deploying Contract...")
    # Use the first account provided by Ganache
    my_address = w3.eth.accounts[0] 
    LandRegistry = w3.eth.contract(abi=abi, bytecode=bytecode)
    
    # Submit the transaction that deploys the contract
    tx_hash = LandRegistry.constructor().transact({"from": my_address})
    
    # Wait for the transaction to be mined, and get the transaction receipt
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    print(f" Contract Deployed! Address: {tx_receipt.contractAddress}")

    # 4. Save Config for Backend
    config = {
        "contract_address": tx_receipt.contractAddress,
        "abi": abi,
        "account": my_address
    }
    
    config_path = os.path.join(script_dir, "blockchain_config.json")
    with open(config_path, "w") as f:
        json.dump(config, f, indent=4)
        
    print(f" Configuration saved to {config_path}")

if __name__ == "__main__":
    deploy()
