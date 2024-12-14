const fs = require('fs');

function parseMintLog(filePath) {
  const data = fs.readFileSync(filePath, 'utf8');
  const lines = data.split('\n');
  
  const inscriptions = [];
  let count = 0;

  lines.forEach(line => {
    if (line.includes('Success - Inscription')) {
      count++;
      const match = line.match(/TXID: ([a-f0-9]{64})/);
      if (match) {
        const txid = match[1];
        inscriptions.push({
          inscriptionId: `${txid}i0`,
          name: `Doginal Megaphone #${count}`
        });
      }
    }
  });

  if (count !== 1337) {
    throw new Error(`Expected 1337 inscriptions, found ${count}`);
  }

  return inscriptions;
}

// Read and parse the log file
try {
  const inscriptions = parseMintLog('mint_log.txt');
  
  // Write to output file
  fs.writeFileSync(
    'megaphone_inscriptions.json', 
    JSON.stringify(inscriptions, null, 2)
  );
  
  console.log(`Successfully processed ${inscriptions.length} inscriptions`);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}