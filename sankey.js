// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
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

            // Get container width
            const containerWidth = document.getElementById('sankey-container').clientWidth;
            
            // Set up the dimensions and margins of the diagram
            const margin = { top: 40, right: 40, bottom: 40, left: 40 };
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
                .nodeWidth(15)
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
                        .style("stroke-opacity", 0.8)
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
                        .style("stroke-opacity", 0.4)
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
                .attr("rx", 5)
                .attr("ry", 5)
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
                    
                    const isCurrentlySelected = d3.select(this).classed("highlighted");
                    
                    // Reset all nodes and links
                    svg.selectAll(".node").classed("highlighted", false);
                    svg.selectAll(".link")
                        .style("stroke-opacity", 0.4)
                        .classed("highlighted", false);
                    
                    if (!isCurrentlySelected) {
                        // Highlight selected node
                        d3.select(this).classed("highlighted", true);
                        
                        // Get all connected links
                        const connectedLinks = svg.selectAll(".link")
                            .filter(l => l.source === d || l.target === d);
                        
                        // Highlight connected links
                        connectedLinks
                            .style("stroke-opacity", 0.8)
                            .classed("highlighted", true);
                        
                        // Update bar charts to show connected nodes
                        if (typeof barCharts !== 'undefined' && barCharts.update) {
                            barCharts.update(d);
                        }
                        
                        // Show flow tooltips
                        connectedLinks.each(function(l) {
                            const link = d3.select(this);
                            const path = link.node();
                            
                            // Get the bounding box of the path
                            const bbox = path.getBBox();
                            
                            // Get the SVG's CTM (Current Transform Matrix)
                            const ctm = path.getScreenCTM();
                            const svgRect = svg.node().getBoundingClientRect();
                            
                            // Calculate the center point of the path
                            const x = (bbox.x + bbox.width/2) * ctm.a + ctm.e + svgRect.left;
                            const y = (bbox.y + bbox.height/2) * ctm.d + ctm.f + svgRect.top;
                            
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
                    } else {
                        // Reset bar charts to show all nodes
                        if (typeof barCharts !== 'undefined' && barCharts.update) {
                            barCharts.update();
                        }
                    }
                });

            // Add labels for nodes
            node.append("text")
                .attr("x", d => d.x1 - d.x0 + 6)
                .attr("y", d => (d.y1 - d.y0) / 2)
                .attr("dy", "0.35em")
                .attr("text-anchor", "start")
                .attr("class", "node-label")
                .text(d => d.name)
                .filter(d => d.x0 > width / 2)
                .attr("x", -6)
                .attr("text-anchor", "end");

            // Add click handler to the container to dismiss tooltip
            d3.select("#sankey-container").on("click", function() {
                // Reset all nodes and links
                svg.selectAll(".node").classed("highlighted", false);
                svg.selectAll(".link")
                    .style("stroke-opacity", 0.4)
                    .classed("highlighted", false);
                
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

        // Initial render
        updateVisualization();

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
}); 