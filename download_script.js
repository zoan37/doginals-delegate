const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Read and parse the JSON file
const doginalsData = JSON.parse(fs.readFileSync('bat/inscriptions.json', 'utf8'));

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'doginal_html');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Function to download HTML for a single inscription
async function downloadHtml(inscription) {
    const url = `https://wonky-ord.dogeord.io/shibescription/${inscription.inscriptionId}`;
    const outputPath = path.join(outputDir, `${inscription.name.replace(/\s+/g, '_')}.html`);

    try {
        const response = await axios.get(url);
        fs.writeFileSync(outputPath, response.data);
        console.log(`Successfully downloaded: ${inscription.name}`);
    } catch (error) {
        console.error(`Error downloading ${inscription.name}: ${error.message}`);
    }
}

// Main function to process all inscriptions with delay
async function processAll() {
    console.log('Starting downloads...');
    console.log(`Total Doginals to process: ${doginalsData.length}`);

    for (let i = 0; i < doginalsData.length; i++) {
        const inscription = doginalsData[i];
        await downloadHtml(inscription);
        console.log(`Progress: ${i + 1}/${doginalsData.length}`);
        
        // Add delay except for the last item
        if (i < doginalsData.length - 1) {
            await delay(1000); // 1 second delay
        }
    }

    console.log('Download process completed!');
}

// Run the script
processAll().catch(console.error);