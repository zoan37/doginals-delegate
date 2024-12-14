#!/bin/bash

# Configuration
TOTAL_INSCRIPTIONS=1337
ADDRESS="DQBBNsCkuQXoB4UjJNmDPZvVTXTAmbhcWp"
DELEGATE_TXID="3c3f89b3c1a9d3958a12aaceb03aa1f95cd738ea19666e97d3c2225355bb7dd1i0"
MEMPOOL_WAIT_TIME=60  # Time to wait in seconds when mempool is full
MINT_INTERVAL=5      # Time to wait between each mint attempt
RETRY_INTERVAL=10    # Time to wait before retrying after any failure
LOG_FILE="mint_log.txt"
PENDING_TXS_FILE="pending-txs.json"

# Initialize counter and log file
count=0
echo "Starting mint process at $(date)" > "$LOG_FILE"

# Check and remove pending transactions file
if [ -f "$PENDING_TXS_FILE" ]; then
    echo "Found existing $PENDING_TXS_FILE, removing it..."
    rm "$PENDING_TXS_FILE"
fi

mint_inscription() {
    # Remove pending-txs.json before each mint attempt
    if [ -f "$PENDING_TXS_FILE" ]; then
        rm "$PENDING_TXS_FILE"
    fi
    
    output=$(node . mint "$ADDRESS" "" "" "$DELEGATE_TXID" 2>&1)
    echo "$output"
    
    if echo "$output" | grep -q "too-long-mempool-chain"; then
        echo "Mempool full, waiting $MEMPOOL_WAIT_TIME seconds..."
        echo "Mempool full at inscription $count - $(date)" >> "$LOG_FILE"
        sleep $MEMPOOL_WAIT_TIME
        return 1
    elif echo "$output" | grep -q "txid:"; then
        tx_id=$(echo "$output" | grep "txid:" | tail -n1 | awk '{print $2}')
        echo "Success - Inscription $count - TXID: $tx_id - $(date)" >> "$LOG_FILE"
        return 0
    elif echo "$output" | grep -q "Cannot read properties of undefined"; then
        echo "Invalid pending transaction detected, clearing and retrying..."
        if [ -f "$PENDING_TXS_FILE" ]; then
            rm "$PENDING_TXS_FILE"
        fi
        sleep $RETRY_INTERVAL
        return 1
    else
        echo "Unknown error occurred - $(date)" >> "$LOG_FILE"
        echo "$output" >> "$LOG_FILE"
        sleep $RETRY_INTERVAL
        return 1
    fi
}

# Main mint loop
while [ $count -lt $TOTAL_INSCRIPTIONS ]; do
    echo "Minting inscription $((count + 1)) of $TOTAL_INSCRIPTIONS"
    
    if mint_inscription; then
        ((count++))
        echo "Successfully minted inscription $count"
        
        # Add delay between successful mints
        echo "Waiting $MINT_INTERVAL seconds before next mint..."
        sleep $MINT_INTERVAL
    else
        echo "Retrying after $RETRY_INTERVAL seconds delay..."
        sleep $RETRY_INTERVAL
    fi
done

echo "Minting process completed at $(date)" >> "$LOG_FILE"
echo "Total inscriptions minted: $count"