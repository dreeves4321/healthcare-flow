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
            const margin = { top: 40, right: 160, bottom: 40, left: 20 };
            const width = containerWidth - margin.left - margin.right;
            const height = 600 - margin.top - margin.bottom;

            // Create the SVG container
            const svg = d3.select("#sankey-container")
                .append("svg")
                .attr("width", "100%")
                .attr("height", height + margin.top + margin.bottom)
                .attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom])
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            // Create tooltip divs
            const tooltip = d3.select("body")
                .append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

            const nodeTooltip = d3.select("body")
                .append("div")
                .attr("class", "tooltip node-tooltip")
                .style("opacity", 0);

            // Create the Sankey generator
            const sankey = d3.sankey()
                .nodeWidth(10)
                .nodePadding(10)
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

            // Add gradient stops
            gradients.append("stop")
                .attr("offset", "0%")
                .attr("class", "gradient-start");

            gradients.append("stop")
                .attr("offset", "50%")
                .attr("class", "gradient-middle");

            gradients.append("stop")
                .attr("offset", "100%")
                .attr("class", "gradient-end");

            // Calculate the maximum flow value for scaling
            const maxFlow = d3.max(links, d => d.value);

            // Add links
            svg.append("g")
                .selectAll("path")
                .data(links)
                .join("path")
                .attr("d", d3.sankeyLinkHorizontal())
                .attr("stroke-width", d => {
                    // Scale the width based on the value relative to maxFlow
                    // Minimum width of 4, maximum of 40
                    return 4 + (d.value / maxFlow) * 36;
                })
                .attr("class", "link")
                .style("stroke", (d, i) => `url(#gradient-${i})`)
                .on("mouseover", function(event, d) {
                    d3.select(this)
                        .classed("highlighted", true);
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html(`$${d.value.toLocaleString()} million`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
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
                .attr("class", "node")
                .on("mouseover", function(event, d) {
                    // Prevent event from bubbling up
                    event.stopPropagation();
                    
                    // Calculate total inflow and outflow
                    const inflow = d3.sum(links.filter(l => l.target === d), l => l.value);
                    const outflow = d3.sum(links.filter(l => l.source === d), l => l.value);
                    
                    // Create tooltip content
                    let tooltipContent = `<strong>${d.name}</strong><br>`;
                    if (inflow > 0) {
                        tooltipContent += `Inflow: $${inflow.toLocaleString()}M<br>`;
                    }
                    if (outflow > 0) {
                        tooltipContent += `Outflow: $${outflow.toLocaleString()}M`;
                    }
                    
                    // Show node tooltip
                    nodeTooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    nodeTooltip.html(tooltipContent);
                    
                    // Position tooltip with edge protection
                    const tooltipWidth = nodeTooltip.node().offsetWidth;
                    const tooltipHeight = nodeTooltip.node().offsetHeight;
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    
                    let left = event.pageX + 10;
                    let top = event.pageY - 28;
                    
                    // Check right edge
                    if (left + tooltipWidth > viewportWidth) {
                        left = event.pageX - tooltipWidth - 10;
                    }
                    
                    // Check bottom edge
                    if (top + tooltipHeight > viewportHeight) {
                        top = event.pageY - tooltipHeight - 10;
                    }
                    
                    nodeTooltip
                        .style("left", left + "px")
                        .style("top", top + "px");
                })
                .on("mouseout", function() {
                    // Hide tooltip
                    nodeTooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                })
                .on("click", function(event, d) {
                    // Prevent event from bubbling up
                    event.stopPropagation();
                    
                    // Get all currently highlighted nodes
                    const currentlyHighlighted = svg.selectAll(".node.highlighted");
                    
                    // If clicking the same node that's already highlighted, deactivate it
                    if (currentlyHighlighted.node() === this) {
                        // Reset all nodes and links
                        svg.selectAll(".node, .node-label")
                            .classed("highlighted", false)
                            .classed("lowlighted", false);
                        svg.selectAll(".link")
                            .classed("highlighted", false)
                            .classed("lowlighted", false);
                        
                        // Hide all tooltips
                        nodeTooltip.transition()
                            .duration(500)
                            .style("opacity", 0);
                        d3.selectAll(".flow-tooltip").remove();
                        
                        // Reset bar charts to show all nodes
                        if (typeof barCharts !== 'undefined' && barCharts.update) {
                            barCharts.update();
                        }
                        return;
                    }
                    
                    // Reset all nodes and links first
                    svg.selectAll(".node, .node-label")
                        .classed("highlighted", false)
                        .classed("lowlighted", false);
                    svg.selectAll(".link")
                        .classed("highlighted", false)
                        .classed("lowlighted", false);
                    
                    // Remove all existing flow tooltips
                    d3.selectAll(".flow-tooltip").remove();
                    
                    // Hide node tooltip
                    nodeTooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                    
                    // Highlight selected node and its label
                    d3.select(this)
                        .classed("highlighted", true);
                    d3.select(this.parentNode)
                        .select(".node-label")
                        .classed("highlighted", true);
                    
                    // Get all connected nodes
                    const connectedNodes = new Set();
                    links.forEach(link => {
                        if (link.source === d || link.target === d) {
                            connectedNodes.add(link.source);
                            connectedNodes.add(link.target);
                        }
                    });
                    
                    // Dim only disconnected nodes and their labels
                    svg.selectAll(".node, .node-label")
                        .filter(node => !connectedNodes.has(node))
                        .classed("lowlighted", true);
                    
                    // Get all connected links
                    const connectedLinks = svg.selectAll(".link")
                        .filter(l => l.source === d || l.target === d);
                    
                    // Highlight connected links
                    connectedLinks
                        .classed("highlighted", true);
                    
                    // Dim all other links
                    svg.selectAll(".link:not(.highlighted)")
                        .classed("lowlighted", true);
                    
                    // Update bar charts to show connected nodes
                    if (typeof barCharts !== 'undefined' && barCharts.update) {
                        barCharts.update(d);
                    }
                    
                    // Show flow tooltips
                    connectedLinks.each(function(l) {
                        const path = d3.select(this);
                        const pathNode = path.node();
                        
                        // Get the total length of the path
                        const pathLength = pathNode.getTotalLength();
                        
                        // Get the point halfway along the path
                        const midPoint = pathNode.getPointAtLength(pathLength / 2);
                        
                        // Get SVG position and scroll info
                        const svgRect = svg.node().getBoundingClientRect();
                        const scrollX = window.scrollX;
                        const scrollY = window.scrollY;
                        
                        // Calculate final position (add scroll offset for absolute positioning)
                        const x = midPoint.x + svgRect.left + scrollX + margin.left;
                        const y = midPoint.y + svgRect.top + scrollY + margin.top;
                        
                        // Create a new tooltip for this flow
                        const flowTooltip = d3.select("body")
                            .append("div")
                            .attr("class", "tooltip flow-tooltip")
                            .style("opacity", 0)
                            .style("position", "absolute")
                            .style("left", (x + 10) + "px")
                            .style("top", (y - 28) + "px")
                            .html(`$${l.value.toLocaleString()} million`);
                            
                        flowTooltip.transition()
                            .duration(200)
                            .style("opacity", .9);
                    });
                });

            // Add labels for nodes
            node.append("text")
                .attr("x", d => d.x1 - d.x0 + 6)
                .attr("y", d => (d.y1 - d.y0) / 3)  // Position 1/3 from top of rectangle
                .attr("dy", "0px")
                .attr("text-anchor", "start")
                .attr("class", "node-label")
                .text(d => d.name)
                .call(wrapText, 140, 12)

            // Add click handler to the container to dismiss tooltip
            d3.select("#sankey-container").on("click", function() {
                // Reset all nodes and links
                svg.selectAll(".node, .node-label")
                    .classed("highlighted", false)
                    .classed("lowlighted", false);
                svg.selectAll(".link")
                    .classed("highlighted", false)
                    .classed("lowlighted", false);
                
                // Hide all tooltips
                nodeTooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
                d3.selectAll(".flow-tooltip").remove();
                
                // Reset bar charts to show all nodes
                if (typeof barCharts !== 'undefined' && barCharts.update) {
                    barCharts.update();
                }
            });
        }

        // Initial render with a small delay to ensure container is ready
        setTimeout(updateVisualization, 0);

        // Update on window resize
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                // Verify data is still available
                if (!window.healthcareData) {
                    console.error("Healthcare data lost during resize");
                    return;
                }
                
                // Update visualization
                updateVisualization();
            }, 250);
        });

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