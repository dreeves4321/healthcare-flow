// Create a namespace for bar chart functionality
const barCharts = {
    resizeTimeout: null,
    highlightedNode: null,
    
    update: function(highlightedNode = null) {
        // Store the highlighted node
        this.highlightedNode = highlightedNode;
        
        // Verify data is available
        if (!window.healthcareData || !window.healthcareData.nodes || !window.healthcareData.links) {
            console.error("Healthcare data is not available");
            return;
        }

        // Clear any existing charts
        d3.select("#source-barchart").selectAll("*").remove();
        d3.select("#sink-barchart").selectAll("*").remove();

        // Get the data from healthcareData
        const nodes = window.healthcareData.nodes;
        const links = window.healthcareData.links;

        // Calculate inflows and outflows for each node
        const flows = nodes.map((node, i) => {
            // Find all links where this node is the target (inflow)
            const inflowLinks = links.filter(l => l.target === i);
            const inflow = d3.sum(inflowLinks, l => l.value);
            
            // Find all links where this node is the source (outflow)
            const outflowLinks = links.filter(l => l.source === i);
            const outflow = d3.sum(outflowLinks, l => l.value);

            return {
                name: node.name,
                inflow,
                outflow
            };
        });

        // Filter for source nodes (primarily outflow) and sink nodes (primarily inflow)
        let sources, sinks;
        
        if (highlightedNode) {
            // If a node is highlighted, show only its direct connections
            const nodeIndex = nodes.findIndex(n => n.name === highlightedNode.name);
            
            // Find direct connections (nodes that flow directly to/from the highlighted node)
            const directConnections = links.reduce((acc, link) => {
                if (link.source === nodeIndex) {
                    // This is an outflow connection
                    acc.outflows.push({
                        name: nodes[link.target].name,
                        value: link.value
                    });
                }
                if (link.target === nodeIndex) {
                    // This is an inflow connection
                    acc.inflows.push({
                        name: nodes[link.source].name,
                        value: link.value
                    });
                }
                return acc;
            }, { inflows: [], outflows: [] });
            
            // Sort by value
            sources = directConnections.outflows.sort((a, b) => b.value - a.value);
            sinks = directConnections.inflows.sort((a, b) => b.value - a.value);
        } else {
            // Show all nodes if no node is highlighted
            sources = flows.filter(n => n.outflow > 0 && n.inflow === 0).sort((a, b) => b.outflow - a.outflow);
            sinks = flows.filter(n => n.inflow > 0 && n.outflow === 0).sort((a, b) => b.inflow - a.inflow);
        }

        // Verify we have data to display
        if (sources.length === 0 && sinks.length === 0) {
            console.error("No valid source or sink nodes found");
            return;
        }

        // Get container widths
        const sourceContainer = document.getElementById('source-barchart');
        const sinkContainer = document.getElementById('sink-barchart');
        
        if (!sourceContainer || !sinkContainer) {
            console.error("Chart containers not found");
            return;
        }
        
        // Set up dimensions for charts
        const margin = { top: 40, right: 20, bottom: 60, left: 120 };
        const height = 350 - margin.top - margin.bottom;
        
        // Calculate widths based on container sizes
        const sourceWidth = sourceContainer.clientWidth - margin.left - margin.right;
        const sinkWidth = sinkContainer.clientWidth - margin.left - margin.right;

        // Create source nodes chart
        if (sources.length > 0) {
            this.createBarChart("#source-barchart", sources, highlightedNode ? "value" : "outflow", 
                highlightedNode ? `Destinations from ${highlightedNode.name}` : "Source Nodes", 
                sourceWidth, height, margin);
        }
        
        // Create sink nodes chart
        if (sinks.length > 0) {
            this.createBarChart("#sink-barchart", sinks, highlightedNode ? "value" : "inflow", 
                highlightedNode ? `Sources to ${highlightedNode.name}` : "Destination Nodes", 
                sinkWidth, height, margin);
        }
    },

    createBarChart: function(selector, data, valueKey, title, width, height, margin) {
        const svg = d3.select(selector)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom])
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create scales
        const y = d3.scaleBand()
            .range([height, 0])
            .padding(0.1);

        const x = d3.scaleLinear()
            .range([0, width]);

        // Set domains
        y.domain(data.map(d => d.name));
        x.domain([0, d3.max(data, d => d[valueKey])]);

        // Add bars
        svg.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("y", d => y(d.name))
            .attr("height", y.bandwidth())
            .attr("x", 0)
            .attr("width", d => x(d[valueKey]))
            .attr("fill", "#3498db");

        // Add axes
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x)
                .ticks(6)
                .tickFormat(d => `$${d/100}M`)); // Convert to hundreds of millions

        svg.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-0.5em");

        // Add title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("class", "chart-title")
            .text(title);
    },

    init: function() {
        // Initial render
        this.update();

        // Add resize handler
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.update();
            }, 250);
        });
    }
};

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (window.healthcareData) {
        barCharts.init();
    }
}); 