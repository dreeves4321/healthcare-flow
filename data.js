// Function to parse CSV data
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
        }, {});
    });
}

// Function to process nodes data
function processNodes(nodesData) {
    return nodesData.map(node => ({
        name: node.Name,
        id: parseInt(node.ID)
    }));
}

// Function to process links data
function processLinks(linksData) {
    return linksData
        .filter(link => {
            // Skip links with empty or invalid values
            if (!link['Amount (B$)'] || link['Amount (B$)'].trim() === '') {
                console.warn(`Skipping link with empty value: ${link.Name}`);
                return false;
            }
            return true;
        })
        .map(link => {
            const value = parseFloat(link['Amount (B$)'].replace(/[^0-9.-]+/g, ''));
            if (isNaN(value) || value < 0) {
                console.warn(`Invalid value for link ${link.Name}: ${link['Amount (B$)']}`);
            }
            return {
                source: parseInt(link['From ID']) - 1, // Convert to 0-based index
                target: parseInt(link['To ID']) - 1,   // Convert to 0-based index
                value: value || 0
            };
        });
}

// Function to validate the data structure
function validateData(nodes, links) {
    console.log("Validating data structure...");
    
    // Check for unique node names
    const nodeNames = new Set(nodes.map(n => n.name));
    if (nodeNames.size !== nodes.length) {
        throw new Error("Duplicate node names found");
    }

    // Check that all source and target indices are valid
    links.forEach(link => {
        if (link.source < 0 || link.source >= nodes.length) {
            throw new Error(`Invalid source index: ${link.source} for link ${nodes[link.source]?.name || 'unknown'}`);
        }
        if (link.target < 0 || link.target >= nodes.length) {
            throw new Error(`Invalid target index: ${link.target} for link ${nodes[link.target]?.name || 'unknown'}`);
        }
    });

    // Check for valid values
    links.forEach(link => {
        if (typeof link.value !== 'number' || link.value < 0) {
            const sourceName = nodes[link.source].name;
            const targetName = nodes[link.target].name;
            throw new Error(`Invalid value (${link.value}) for link: ${sourceName} -> ${targetName}`);
        }
    });

    console.log("Data validation completed successfully");
}

// Function to load and process CSV data
async function loadCSVData(url) {
    try {
        console.log(`Attempting to load CSV from ${url}...`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log(`Successfully fetched ${url}`);
        const csvText = await response.text();
        console.log(`CSV text length: ${csvText.length} characters`);
        const result = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true
        });
        
        if (result.errors.length > 0) {
            console.warn(`Warnings while parsing ${url}:`, result.errors);
        }
        
        console.log(`Successfully parsed ${url}, found ${result.data.length} rows`);
        return result.data;
    } catch (error) {
        console.error(`Error loading CSV from ${url}:`, error);
        throw error;
    }
}

// Initialize the data
async function initializeData() {
    try {
        // Show loading state
        const container = document.getElementById('sankey-container');
        if (container) {
            container.innerHTML = '<div class="loading">Loading data...</div>';
        }

        // Load nodes and links data
        const [nodesData, linksData] = await Promise.all([
            loadCSVData('data/nodes.csv'),
            loadCSVData('data/links.csv')
        ]);

        // Process the data
        const nodes = processNodes(nodesData);
        const links = processLinks(linksData);

        // Validate the data
        validateData(nodes, links);

        // Store the processed data globally
        window.healthcareData = { nodes, links };
        console.log('Healthcare data loaded and validated:', window.healthcareData);

        // Dispatch event that data is loaded
        const event = new CustomEvent('healthcareDataLoaded', {
            detail: window.healthcareData
        });
        document.dispatchEvent(event);

        // Clear loading state
        if (container) {
            container.innerHTML = '';
        }

    } catch (error) {
        console.error('Error initializing data:', error);
        // Show error state
        const container = document.getElementById('sankey-container');
        if (container) {
            container.innerHTML = `<div class="error">Error loading data: ${error.message}</div>`;
        }
    }
}

// Initialize when the page loads
console.log("Setting up DOMContentLoaded event listener...");
document.addEventListener('DOMContentLoaded', initializeData); 