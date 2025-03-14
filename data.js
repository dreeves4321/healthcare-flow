// Define the healthcare flow data
const healthcareData = {
    nodes: [
        { name: "Employers" },
        { name: "Government" },
        { name: "Individuals" },
        { name: "Hospitals" },
        { name: "Physicians" },
        { name: "Pharmaceuticals" },
        { name: "Medical Devices" },
        { name: "Administrative Costs" },
        { name: "Other Healthcare Providers" }
    ],
    links: [
        { source: 0, target: 3, value: 1000 },  // Employers -> Hospitals
        { source: 1, target: 3, value: 800 },   // Government -> Hospitals
        { source: 2, target: 3, value: 200 },   // Individuals -> Hospitals
        { source: 3, target: 4, value: 400 },   // Hospitals -> Physicians
        { source: 3, target: 7, value: 300 },   // Hospitals -> Administrative Costs
        { source: 3, target: 8, value: 300 },   // Hospitals -> Other Healthcare Providers
        { source: 3, target: 5, value: 200 },   // Hospitals -> Pharmaceuticals
        { source: 3, target: 6, value: 200 },   // Hospitals -> Medical Devices
        { source: 0, target: 4, value: 500 },   // Employers -> Physicians
        { source: 1, target: 4, value: 400 },   // Government -> Physicians
        { source: 2, target: 4, value: 100 },   // Individuals -> Physicians
        { source: 0, target: 5, value: 300 },   // Employers -> Pharmaceuticals
        { source: 1, target: 5, value: 200 },   // Government -> Pharmaceuticals
        { source: 2, target: 5, value: 100 },   // Individuals -> Pharmaceuticals
        { source: 0, target: 6, value: 200 },   // Employers -> Medical Devices
        { source: 1, target: 6, value: 150 },   // Government -> Medical Devices
        { source: 2, target: 6, value: 50 },    // Individuals -> Medical Devices
        { source: 0, target: 7, value: 200 },   // Employers -> Administrative Costs
        { source: 1, target: 7, value: 150 },   // Government -> Administrative Costs
        { source: 2, target: 7, value: 50 },    // Individuals -> Administrative Costs
        { source: 0, target: 8, value: 300 },   // Employers -> Other Healthcare Providers
        { source: 1, target: 8, value: 200 },   // Government -> Other Healthcare Providers
        { source: 2, target: 8, value: 100 }    // Individuals -> Other Healthcare Providers
    ]
};

// Validate the data structure
function validateData(data) {
    // Check for unique node names
    const nodeNames = new Set(data.nodes.map(n => n.name));
    if (nodeNames.size !== data.nodes.length) {
        throw new Error("Duplicate node names found");
    }

    // Check that all source and target indices are valid
    data.links.forEach(link => {
        if (link.source < 0 || link.source >= data.nodes.length) {
            throw new Error(`Invalid source index: ${link.source}`);
        }
        if (link.target < 0 || link.target >= data.nodes.length) {
            throw new Error(`Invalid target index: ${link.target}`);
        }
    });

    // Check for valid values
    data.links.forEach(link => {
        if (typeof link.value !== 'number' || link.value <= 0) {
            throw new Error(`Invalid value for link: ${data.nodes[link.source].name} -> ${data.nodes[link.target].name}`);
        }
    });
}

// Validate the data before exporting
try {
    validateData(healthcareData);
    console.log("Healthcare data validated successfully");
} catch (error) {
    console.error("Data validation error:", error);
    throw error;
}

// Make healthcareData available globally
window.healthcareData = healthcareData;

// Log the data to verify it's loaded correctly
console.log("Healthcare data loaded:", healthcareData); 