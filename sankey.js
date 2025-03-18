// Function to initialize the Sankey diagram
function initializeSankey() {
    try {
        // Verify data is available
        if (!window.healthcareData) {
            throw new Error("Healthcare data is not loaded");
        }

        // Create a copy of the original data for Sankey processing
        const sankeyData = {
            nodes: window.healthcareData.nodes.map(node => ({...node})),
            links: window.healthcareData.links.map(link => ({...link}))
        };

        // Function to update the visualization
        function updateVisualization() {
            // Clear any existing SVG and tooltips
            d3.select("#sankey-container svg").remove();
            d3.selectAll(".tooltip").remove();

            // Get container width and ensure it's not zero
            const container = document.getElementById('sankey-container');
            const containerWidth = Math.max(container.clientWidth, 800); // Fallback width if container is empty
            
            // Set up the dimensions and margins of the diagram
            const margin = { top: 0, right: 160, bottom: 0, left: 0 };
            const width = containerWidth - margin.left - margin.right;
            const height = 600 - margin.top - margin.bottom;

            // Create the SVG container
            const svg = d3.select("#sankey-container")
                .append("svg")
                .attr("width", "100%")
                .attr("height", height + margin.top + margin.bottom)
                .attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom])
                .attr("preserveAspectRatio", "none")
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            // Create tooltip divs
            const tooltip = d3.select("body")
                .append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

            
            // Create the Sankey generator
            const sankey = d3.sankey()
                .nodeWidth(6)
                .nodePadding(18)
                .extent([[0, 0], [width, height]]);

            // Generate the Sankey data
            let processedData;
            try {
                processedData = sankey(sankeyData);
            } catch (error) {
                console.error("Error generating Sankey data:", error);
                throw new Error("Failed to generate Sankey diagram. Please check the data structure.");
            }

            const { nodes, links } = processedData;

            // Add gradient definitions
            const gradients = svg.append("defs")
                .selectAll("linearGradient")
                .data(links)
                .join("linearGradient")
                .attr("id", (d, i) => `gradient-${i}`)
                .attr("gradientUnits", "userSpaceOnUse")
                .attr("x1", d => d.source.x1)
                .attr("x2", d => d.target.x0)
                .attr("y1", d => (d.source.y0 + d.source.y1) / 2)
                .attr("y2", d => (d.target.y0 + d.target.y1) / 2);

            // Add gradient stops with colors based on source node depth
            gradients.append("stop")
                .attr("offset", "0%")
                .attr("class", d => `gradient-start depth${(d.source.depth % 3) + 1}`);

            gradients.append("stop")
                .attr("offset", "50%")
                .attr("class", d => `gradient-middle depth${(d.source.depth % 3) + 1}`);

            gradients.append("stop")
                .attr("offset", "100%")
                .attr("class", d => `gradient-end depth${(d.source.depth % 3) + 1}`);

            // Add links
            svg.append("g")
                .selectAll("path")
                .data(links)
                .join("path")
                .attr("d", d3.sankeyLinkHorizontal())
                .attr("stroke-width", d => 0.8*d.width)
                .attr("class", "link")
                .style("stroke", (d, i) => `url(#gradient-${i})`)
                .on("mouseover", function(event, d) {
                    d3.select(this)
                        .classed("highlighted", true);
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html(`$${d.value.toLocaleString()} billion`);
                })
                .on("mousemove", function(event, d) {
                    const tooltipWidth = tooltip.node().offsetWidth;
                    const tooltipHeight = tooltip.node().offsetHeight;
                    tooltip
                        .style("left", (event.pageX - tooltipWidth + 10) + "px")
                        .style("top", (event.pageY - tooltipHeight - 15) + "px");
                })
                .on("mouseout", function() {
                    d3.select(this)
                        .classed("highlighted", false);
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                });

            // Add nodes
            const node = svg.append("g")
                .selectAll("g")
                .data(nodes)
                .join("g")
                .attr("transform", d => `translate(${d.x0},${d.y0})`);

            // Add rectangles for nodes
            node.append("rect")
                .attr("height", d => d.y1 - d.y0)
                .attr("width", d => d.x1 - d.x0)
                .attr("rx", 1)
                .attr("ry", 1)
                .attr("class", d => `node depth${(d.depth % 3) + 1}`)
                .on("mouseover", function(event, d) {
                    // Prevent event from bubbling up
                    event.stopPropagation();
                    
                    // Calculate total inflow and outflow
                    const inflow = d3.sum(links.filter(l => l.target === d), l => l.value);
                    const outflow = d3.sum(links.filter(l => l.source === d), l => l.value);
                    
                    // Create tooltip content
                    let tooltipContent = `${d.name}<br>`;
                    if (inflow > 0) {
                        tooltipContent += `Inflow: $<strong>${inflow.toLocaleString()}</strong>B<br>`;
                    }
                    if (outflow > 0) {
                        tooltipContent += `Outflow: $<strong>${outflow.toLocaleString()}</strong>B`;
                    }
                    
                    // Show node tooltip
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html(tooltipContent);
                    
                    // Position tooltip with edge protection
                    const tooltipWidth = tooltip.node().offsetWidth;
                    const tooltipHeight = tooltip.node().offsetHeight;
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    
                    let left = event.pageX - tooltipWidth + 20;
                    let top = event.pageY - tooltipHeight - 15;
                    
                    // Check right edge
                    if (left + tooltipWidth > viewportWidth) {
                        left = event.pageX - tooltipWidth - 10;
                    }
                    
                    // Check bottom edge
                    if (top + tooltipHeight > viewportHeight) {
                        top = event.pageY - tooltipHeight - 10;
                    }
                    
                    tooltip
                        .style("left", left + "px")
                        .style("top", top + "px");
                })
                .on("mouseout", function() {
                    // Hide tooltip
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                })
                .on("click", function(event, d) {
                    // Prevent event from bubbling up
                    event.stopPropagation();
                    
                    // Get the container's position and scroll info
                    const container = document.getElementById('sankey-container');
                    const containerRect = container.getBoundingClientRect();
                    const scrollY = window.scrollY;
                    
                    // Calculate the target scroll position to bring the top of the diagram into view
                    const targetScrollY = scrollY + containerRect.top - 20; // 20px padding from top
                    
                    // Animate the scroll
                    window.scrollTo({
                        top: targetScrollY,
                        behavior: 'smooth'
                    });
                    
                    // Convert Set to Array for the highlight function
                    highlightNodes([d.index]);
                });

            // Add labels for nodes
            node.append("text")
                .attr("x", d => d.x1 - d.x0 + 5)
                .attr("y", d => (d.y1 - d.y0) / 2)  // Position 1/3 from top of rectangle
                .attr("dy", "0px")
                .attr("text-anchor", "start")
                .attr("class", "node-label")
                .text(d => d.name)
                .call(wrapText, 140, 12)

            // Add click handler to the container to dismiss tooltip
            d3.select("#sankey-container").on("click", function() {
                highlightNodes(); // Reset all highlighting
            });
        }

        window.updateSankey = updateVisualization;
        // Initial render with a small delay to ensure container is ready
        setTimeout(updateVisualization, 0);

        
        console.log("Sankey diagram initialized successfully");
    } catch (error) {
        console.error("Error initializing Sankey diagram:", error);
        // Add error message to the container
        d3.select("#sankey-container")
            .append("div")
            .style("color", "red")
            .style("padding", "20px")
            .text("Error loading visualization. Please check the console for details.");
    }
}

// Wait for data to be loaded before initializing
document.addEventListener('healthcareDataLoaded', function(event) {
    console.log("Received healthcareDataLoaded event");
    try {
        if (!event.detail) {
            throw new Error("Event detail is missing");
        }
        console.log("Event detail received:", event.detail);
        initializeSankey();
    } catch (error) {
        console.error("Error handling healthcareDataLoaded event:", error);
        // Show error message to user
        const container = document.getElementById('sankey-container');
        if (container) {
            container.innerHTML = `<div class="error">Error initializing visualization: ${error.message}</div>`;
        }
    }
});

// Remove the DOMContentLoaded event listener if it exists
document.removeEventListener('DOMContentLoaded', initializeSankey);

// Add text wrapping function
function wrapText(text, width, lineheight) {
    text.each(function() {
        const text = d3.select(this);
        const words = text.text().split(/\s+/);
        const lineHeight = lineheight; // px
        const y = text.attr("y");
        const dy = parseFloat(text.attr("dy"));
        let tspan = text.text(null).append("tspan")
            .attr("x", text.attr("x"))
            .attr("y", y)
            .attr("dy", dy);
        let line = [];
        let lineNumber = 0;
        let wordNumber = 0;

        while (wordNumber < words.length) {
            line.push(words[wordNumber]);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [words[wordNumber]];
                lineNumber++;
                tspan = text.append("tspan")
                    .attr("x", text.attr("x"))
                    .attr("y", y)
                    .attr("dy", lineNumber * lineHeight + "px")
                    .text(wordNumber > 0 ? words[wordNumber] : "");
            }
            wordNumber++;
        }
    });
}

// Commenting out the bar chart container creation
// const barChartContainer = d3.select("#bar-chart-container")
//     .append("svg")
//     .attr("width", "100%")
//     .attr("height", barChartHeight); 

// Function to highlight nodes and their connected elements
function highlightNodes(nodeIndices = []) {
    // Get all nodes and links
    const nodes = d3.selectAll('.node');
    const links = d3.selectAll('.link');
    const nodeLabels = d3.selectAll('.node-label');
   
    // Get all connected nodes
    const connectedNodes = new Set();
    links.each(function(link) {
        if (nodeIndices.includes(link.source.index) || nodeIndices.includes(link.target.index)) {
            connectedNodes.add(link.source.index);
            connectedNodes.add(link.target.index);
        }
    });
    
     // If no nodes provided, return after reset
     if (nodeIndices.length === 0) {
        // First reset all elements
        nodes.classed('highlighted', false)
            .classed('lowlighted', false);
        nodeLabels.classed('highlighted', false)
            .classed('lowlighted', false);
        links.classed('highlighted', false)
            .classed('lowlighted', false);

        // Remove all existing flow tooltips
        d3.selectAll('.flow-tooltip').remove();

        return;
    }
   
    // Reset
    // First lowlight all elements
    nodes.classed('highlighted', false)
        .classed('lowlighted', true);
    nodeLabels.classed('highlighted', false)
        .classed('lowlighted', true);
    links.classed('highlighted', false)
        .classed('lowlighted', true);
    
    // Remove all existing flow tooltips
    d3.selectAll('.flow-tooltip').remove();
    
    
    // All connected nodes should be neither highlighted nor lowlighted
    connectedNodes.forEach(index => {
        nodes.filter(d => d.index === index)
            .classed('highlighted', false)
            .classed('lowlighted', false);
        nodeLabels.filter(d => d.index === index)
            .classed('highlighted', false)
            .classed('lowlighted', false);
    });

    // Highlight selected nodes and their labels
    nodes.filter((d, i) => nodeIndices.includes(i))
        .classed('highlighted', true)
        .classed('lowlighted', false);
    
    nodeLabels.filter((d, i) => nodeIndices.includes(i))
        .classed('highlighted', true)
        .classed('lowlighted', false);
    
    // Get connected links
    const connectedLinks = links.filter(d => 
        nodeIndices.includes(d.source.index) || 
        nodeIndices.includes(d.target.index)
    );
    
    // Highlight connected links
    connectedLinks
        .classed('highlighted', true)
        .classed('lowlighted', false);
    
    // Add flow tooltips to connected links
    connectedLinks.each(function(l) {
        const path = d3.select(this);
        const pathNode = path.node();
        const pathRect = pathNode.getBoundingClientRect();
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        
        // Use the center of the path's bounding box and add scroll position
        const x = pathRect.left + (pathRect.width / 2) + scrollX;
        const y = pathRect.top + (pathRect.height / 2) + scrollY;
        
        // Create a new tooltip for this flow
        const flowTooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip flow-tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("left", (x - 30) + "px")
            .style("top", (y - 20) + "px")
            .html(`$${l.value.toLocaleString()} million`);
            
        flowTooltip.transition()
            .duration(200)
            .style("opacity", .9);
    });
} 