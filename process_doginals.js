const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

/**
 * Parse the owner's address from a doginal NFT HTML content
 * @param {string} htmlContent - The HTML content to parse
 * @returns {string|null} The owner's Dogecoin address or null if not found
 */
function parseDoginalOwner(htmlContent) {
    if (!htmlContent) {
        throw new Error('HTML content cannot be empty');
    }

    try {
        const $ = cheerio.load(htmlContent);
        const address = $('dt')
            .filter((_, element) => $(element).text().trim().toLowerCase() === 'address')
            .next('dd.monospace')
            .text()
            .trim();

        return address || null;
    } catch (error) {
        console.error('Error parsing HTML:', error);
        return null;
    }
}

/**
 * Calculate ownership statistics from results
 * @param {Array<{id: string, address: string|null}>} results 
 * @returns {Array<{address: string, count: number, ownedIds: string[]}>}
 */
function calculateOwnershipStats(results) {
    // Create ownership map
    const ownershipMap = new Map();

    results.forEach(({ id, address }) => {
        if (address) {
            if (!ownershipMap.has(address)) {
                ownershipMap.set(address, {
                    address,
                    count: 0,
                    ownedIds: []
                });
            }
            const ownerData = ownershipMap.get(address);
            ownerData.count++;
            ownerData.ownedIds.push(id);
        }
    });

    // Convert to array and sort by count (descending)
    return Array.from(ownershipMap.values())
        .sort((a, b) => b.count - a.count);
}

/**
 * Process all Doginal Megaphone HTML files in a directory
 * @param {string} directoryPath - Path to the directory containing HTML files
 * @returns {Promise<{results: Array, statistics: Object}>} Processing results and statistics
 */
async function processDoginalDirectory(directoryPath) {
    try {
        const results = [];
        const errorLog = [];

        // Read all files in the directory
        const files = await fs.readdir(directoryPath);
        
        // Filter for Megaphone HTML files and sort them numerically
        const megaphoneFiles = files
            .filter(file => file.startsWith('Doginal_Bat_#') && file.endsWith('.html'))
            .sort((a, b) => {
                const numA = parseInt(a.match(/#(\d+)\.html/)[1]);
                const numB = parseInt(b.match(/#(\d+)\.html/)[1]);
                return numA - numB;
            });

        console.log(`Found ${megaphoneFiles.length} Bat HTML files to process`);

        // Process each file
        for (const filename of megaphoneFiles) {
            try {
                const filePath = path.join(directoryPath, filename);
                const htmlContent = await fs.readFile(filePath, 'utf8');
                const address = parseDoginalOwner(htmlContent);
                
                const id = filename.match(/#(\d+)\.html/)[1];
                results.push({
                    id: `#${id}`,
                    address: address
                });

                // Log progress every 100 files
                if (results.length % 100 === 0) {
                    console.log(`Processed ${results.length} files...`);
                }

            } catch (error) {
                errorLog.push({
                    file: filename,
                    error: error.message
                });
                console.error(`Error processing ${filename}:`, error.message);
            }
        }

        // Calculate ownership statistics
        const ownershipStats = calculateOwnershipStats(results);

        // Generate summary statistics
        const summary = {
            totalDoginals: results.length,
            uniqueOwners: ownershipStats.length,
            topOwners: ownershipStats.slice(0, 10),
            ownershipDistribution: {
                singleOwners: ownershipStats.filter(o => o.count === 1).length,
                '2-5': ownershipStats.filter(o => o.count >= 2 && o.count <= 5).length,
                '6-10': ownershipStats.filter(o => o.count >= 6 && o.count <= 10).length,
                '11-20': ownershipStats.filter(o => o.count >= 11 && o.count <= 20).length,
                '21+': ownershipStats.filter(o => o.count > 20).length
            }
        };

        // Write detailed results to JSON files
        await Promise.all([
            // Write main results
            fs.writeFile(
                path.join(directoryPath, 'bat_owners.json'),
                JSON.stringify({
                    totalProcessed: results.length,
                    errors: errorLog,
                    owners: results
                }, null, 2)
            ),
            // Write ownership statistics
            fs.writeFile(
                path.join(directoryPath, 'bat_ownership_statistics.json'),
                JSON.stringify({
                    summary,
                    ownershipStats
                }, null, 2)
            ),
            // Simple line-by-line ownership counts
            fs.writeFile(
                path.join(directoryPath, 'bat_ownership_counts.json'),
                ownershipStats
                    .map(owner => `${owner.address},${owner.count}`)
                    .join('\n')
            )
        ]);

        console.log('\nProcessing complete!');
        console.log(`Successfully processed: ${results.length} files`);
        console.log(`Errors encountered: ${errorLog.length} files`);
        console.log('\nOwnership Summary:');
        console.log(`Total Unique Owners: ${summary.uniqueOwners}`);
        console.log('\nTop 10 Owners:');
        summary.topOwners.forEach((owner, index) => {
            console.log(`${index + 1}. Address: ${owner.address.slice(0, 10)}...`);
            console.log(`   Owned: ${owner.count} Doginals`);
        });
        console.log('\nOwnership Distribution:');
        Object.entries(summary.ownershipDistribution).forEach(([range, count]) => {
            console.log(`${range}: ${count} owners`);
        });

        return { results, summary, ownershipStats };

    } catch (error) {
        console.error('Error processing directory:', error);
        throw error;
    }
}

// Main execution
async function main() {
    const directoryPath = path.join(process.cwd(), 'doginal_html');
    
    console.log('Starting to process Doginal Bat HTML files...');
    console.log(`Reading from directory: ${directoryPath}`);
    
    try {
        await processDoginalDirectory(directoryPath);
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

// Run the script if it's called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    parseDoginalOwner,
    processDoginalDirectory,
    calculateOwnershipStats
};