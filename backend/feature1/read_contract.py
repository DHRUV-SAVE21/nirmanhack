import json
import os
from web3 import Web3
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "blockchain_config.json")

def read_chain():
    if not os.path.exists(CONFIG_PATH):
        print("[ERROR] Config not found. Deploy first!")
        return

    with open(CONFIG_PATH, "r") as f:
        config = json.load(f)

    # Connect to Ganache
    w3 = Web3(Web3.HTTPProvider("https://127.0.0.1:8545"))
    if not w3.is_connected():
        print("[ERROR] Could not connect to Ganache.")
        return

    contract = w3.eth.contract(address=config["contract_address"], abi=config["abi"])

    print(f"[INFO] Reading from Smart Contract: {config['contract_address']}")
    print("-" * 50)

    try:
        # Get count of lands (we stored landIds array in contract)
        # Note: In our simple contract we made 'landIds' public, so we can access it by index
        # But standard getter usually needed for array length.
        # For simplicity, let's just try to read a known ID or loop if we added a length getter.
        # Wait, our contract has public landIds array.
        # We can't easily get length without a custom getter function in Solidity usually, 
        # unless we generated a specific getter. 
        # For this demo, we'll try to iterate a few or just listen to events.
        
        # ACTUALLY, usually simpler: Event Logs.
        print("[INFO] Scanning for 'LandVerified' Events...")
        # Create filter for all logs
        event_filter = contract.events.LandVerified.create_filter(from_block=0)
        events = event_filter.get_all_entries()

        print(f"Found {len(events)} verified land records on blockchain.\n")

        for event in events:
            args = event['args']
            print(f"[OK] Land ID: {args.landId}")
            print(f"   Status: {args.status}")
            print(f"   Confidence: {args.confidenceScore}%")
            print(f"   Timestamp: {args.timestamp}")
            
            # Fetch full details
            record = contract.functions.getLandRecord(args.landId).call()
            # Returns tuple: (landId, ownerName, mappedArea, docArea, conf, status, time, ipfs)
            print(f"   Owner: {record[1]}")
            print(f"   Area: {record[2]} sqm")
            print("-" * 30)

    except Exception as e:
        print(f"Error reading chain: {e}")

if __name__ == "__main__":
    read_chain()
