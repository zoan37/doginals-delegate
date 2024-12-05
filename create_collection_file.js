const fs = require('fs');

function processDoggyMarketUrls(inputFilePath, outputFilePath) {
    try {
        // Read the input file
        const fileContent = fs.readFileSync(inputFilePath, 'utf8');
        
        // Split the content into lines and filter out empty lines
        const lines = fileContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .filter(line => line.startsWith('https://doggy.market/inscription/'));

        // If there are more than 420 URLs, only take the first 420
        if (lines.length > 420) {
            console.log(`Found ${lines.length} URLs. Only processing the first 420.`);
            lines.length = 420;
        } else if (lines.length < 420) {
            throw new Error(`Invalid number of inscriptions. Expected 420, got ${lines.length}`);
        }

        // Extract inscription IDs from URLs
        const inscriptions = lines.map((url, index) => {
            const inscriptionId = url.split('/').pop().trim();
            return {
                inscriptionId,
                name: `Doginal Bat #${index + 1}`
            };
        });

        // Check for duplicate inscription IDs
        const uniqueIds = new Set(inscriptions.map(insc => insc.inscriptionId));
        if (uniqueIds.size !== inscriptions.length) {
            throw new Error('Duplicate inscription IDs found');
        }

        // Write to output file
        fs.writeFileSync(
            outputFilePath,
            JSON.stringify(inscriptions, null, 2),
            'utf8'
        );

        console.log(`Successfully processed ${inscriptions.length} inscriptions`);
        console.log(`Output written to ${outputFilePath}`);

    } catch (error) {
        console.error('Error processing file:', error.message);
        process.exit(1);
    }
}

// Example usage:
const inputFile = 'child_inscription_links.txt';  // Your input file with URLs
const outputFile = 'inscriptions.json'; // The output file to be generated

processDoggyMarketUrls(inputFile, outputFile);