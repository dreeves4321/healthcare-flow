// Function to initialize the Sankey diagram
function initializeSankey() {
    try {
        // Verify data is available
        if (!window.healthcareData) {
            throw new Error("Healthcare data is not loaded");
        }

        // Get the current nodes and links based on grouping state
        const nodes = window.healthcareData.isGrouped 
            ? [...window.healthcareData.originalNodes, ...window.healthcareData.groupNodes]
            : window.healthcareData.originalNodes;
        
        const links = window.healthcareData.isGrouped
            ? window.healthcareData.groupLinks
            : window.healthcareData.originalLinks;

        // Filter nodes if grouped
        const visibleNodes = window.healthcareData.isGrouped
            ? nodes.filter(d => d.isGroup || !window.healthcareData.groups.some(g => g.nodes.includes(d.index)))
            : nodes;

        window.updateSankey = updateVisualization;
        // Initial render with a small delay to ensure container is ready
        setTimeout(() => {
            updateVisualization({
                nodes: visibleNodes,
                links: links
            });
        }, 0);

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


// Function to populate the focus container with node details
function populateFocusContainer(node) {
    const focusContainer = document.querySelector('#focus-container');
    if (!node) {
        focusContainer.classList.remove('focus');
        focusContainer.classList.add('no-focus');
        return;
    }

    window.nodeClicked = true;
    // Get the current links based on grouping state
    const links = window.healthcareData.isGrouped
        ? window.healthcareData.groupLinks
        : window.healthcareData.originalLinks;

    // Calculate inflow and outflow
    const inflow = d3.sum(links.filter(l => l.target === node.id), l => l.value);
    const outflow = d3.sum(links.filter(l => l.source === node.id), l => l.value);
    const totalflow = Math.max(inflow, outflow);

    // get the notes of the node. if it's blank, set it to an empty string
    const notes = node.notes || '';


    // Create focus content
    let focusContent = `
        <div class="focus-row"> 
            <h2>${node.name}${node.isGroup ? ' (Group)' : ''}</h2>
            <button class="close-button"><img src="images/close.svg" alt="X" style="width: 100%; height: 100%;"></button>
        </div>
        <div class="focus-row">
            <div class="flow-label">Total flow: $<strong>${totalflow.toLocaleString()}</strong>B</div>
            <div>${notes}</div>
        </div>
    `;

    // Add group members if it's a group node, whether grups are on or off
    if (node.isGroup) {
        const group = window.healthcareData.groups[node.groupIndex];
        focusContent += `
            <hr>            
            <div class="focus-row">
                <div><p>Group Members:</p><p> ${group.nodes.map(n => window.healthcareData.originalNodes[n-1].name).join(', ')}</p></div>
                <button onclick="toggleGroups()" id="groupToggle">
                    Expand this group
                </button>
              
            </div>
        `;
    }else if (window.healthcareData.groups.some(g => g.nodes.includes(node.index))) {
        // get the name of the group
        const groupName = window.healthcareData.groups.find(g => g.nodes.includes(node.index)).name;
        focusContent += `
            <hr>
            <div class="focus-row">
                <p>This is inside the group <i>${groupName}</i>.</p>
                <button onclick="toggleGroups()" id="groupToggle">
                    Collapse this group
                </button>
            </div>
        `;
    }

    focusContainer.innerHTML = focusContent;
    focusContainer.classList.remove('no-focus');
    focusContainer.classList.add('focus');


    // get the height of the sankey container
    const sankeyHeight = document.querySelector('#sankey-container').clientHeight;
    // set the bottom of the focus container to the top of the sankey container
    focusContainer.style.bottom = +sankeyHeight + 'px';


    // Add close button functionality
    const closeButton = focusContainer.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        focusContainer.classList.remove('focus');
        focusContainer.classList.add('no-focus');
        highlightNodes(); // Reset highlighting
        window.selectStory(window.selectedStory);
        
    });
}

// Add text wrapping function
// text is a d3 selection of the text element
// width is the target width of the text element
// lineheight is the target height of the text element
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


// Function to highlight nodes and their connected elements
function highlightNodes(nodeIndices = []) {
    // Get all nodes and links
    const nodeRects = d3.selectAll('.node-rectangles rect');
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
        nodeRects.classed('highlighted', false)
            .classed('lowlighted', false);
        nodeLabels.classed('highlighted', false)
            .classed('lowlighted', false);
        links.classed('highlighted', false)
            .classed('lowlighted', false);
        // Remove all existing flow tooltips
        d3.selectAll('.flow-tooltip').remove();
        return;
    }
   
    // Reset - First lowlight all elements
    d3.selectAll('.node-rectangles')
        .select('rect')
        .classed('highlighted', false)
        .classed('lowlighted', true);
    nodeLabels.classed('highlighted', false)
        .classed('lowlighted', true);
    links.classed('highlighted', false)
        .classed('lowlighted', true);
    
    // Remove all existing flow tooltips
    d3.selectAll('.flow-tooltip').remove();
    
    // All connected nodes should be neither highlighted nor lowlighted
    connectedNodes.forEach(index => {
        d3.selectAll('.node-rectangles')
            .filter(r => r.index === index)  // Use the current connected node index
            .select('rect')
            .classed('highlighted', false)
            .classed('lowlighted', false);
        nodeLabels.filter(d => d.index === index)  // Use the current connected node index
            .classed('highlighted', false)
            .classed('lowlighted', false); 
    });

    // Highlight selected nodes and their labels
    d3.selectAll('.node-rectangles')
        .filter(r => nodeIndices.includes(r.index))  // for all nodes in the nodeIndices array
        .select('rect')
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
            .html(`$${l.value.toLocaleString()}B`);
            
        flowTooltip.transition()
            .duration(200)
            .style("opacity", .9);
    });
}

function toggleGroups() {
    const data = window.healthcareData;
    data.isGrouped = !data.isGrouped;

    // Determine which nodes and links to use
    const nodes = data.isGrouped 
        ? [...data.originalNodes, ...data.groupNodes]
        : data.originalNodes;
    
    const links = data.isGrouped
        ? data.groupLinks
        : data.originalLinks;

    populateFocusContainer(null);

    // Update visualization with new data
    updateVisualization({ nodes, links });
}

// Global updateVisualization function
function updateVisualization(data) {
    if (!data) {
        console.error("No data provided to updateVisualization");
        return;
    }

    console.log("Starting visualization update with data:", {
        nodes: data.nodes.length,
        links: data.links.length
    });

    // Clear existing visualization
    d3.select("#sankey-container").selectAll("*").remove();
    
    // Create tooltip if it doesn't exist
    if (!d3.select(".tooltip").node()) {
        d3.select("body")
            .append("div")
            .attr("class", "tooltip");
    }

    // Initialize variables at the top
    const rightPadding = 140; // space for the labels
    const height = 800; // this is a first guess, will be adjusted below
    const minWidth = 500; // minimum width of the sankey diagram
    const margins = 0; // margins for the container. maybe i can get this from the css?
    // get the width of the container
    const container = document.getElementById('sankey-container');
    const containerWidth = container ? container.offsetWidth : 0; //
    
    // set the size of the sankey diagram
    const width = containerWidth >  minWidth + rightPadding + 2*margins? containerWidth - rightPadding - 2*margins : minWidth;
    let filteredNodes = data.nodes;
    let links = data.links;

    // Create SVG container if it doesn't exist
    const svg = d3.select("#sankey-container")
        .append("svg")
        .attr("width", width + rightPadding)
        .attr("height", height)
        .attr("viewBox", [0, 0, width + rightPadding, height])
        .attr("style", "max-width: 100%; height: auto;");

    console.log("SVG container created");

    // Filter nodes if in grouped mode
    if (window.healthcareData.isGrouped) {
        filteredNodes = filteredNodes.filter(d => d.isGroup || 
            !window.healthcareData.groups.some(g => g.nodes.includes(d.index)));
    }

    console.log("Filtered nodes:", filteredNodes.length);

    // Create the Sankey generator
    const sankey = d3.sankey()
        .nodeWidth(15)
        .nodePadding(10)
        .extent([[1, 1], [width - 1, height - 1]]);

    // Generate the Sankey data
    let processedData;
    try {
        processedData = sankey({
            nodes: filteredNodes.map(d => Object.assign({}, d)),
            links: links.map(d => Object.assign({}, d))
        });
        console.log("Sankey data processed successfully:", {
            nodes: processedData.nodes.length,
            links: processedData.links.length
        });
    } catch (error) {
        console.error("Error generating Sankey data:", error);
        throw new Error("Failed to generate Sankey diagram. Please check the data structure.");
    }

    const { nodes: sankeyNodes, links: sankeyLinks } = processedData;
    
    // Add gradient definitions
    const gradients = svg.append("defs")
        .selectAll("linearGradient")
        .data(sankeyLinks)
        .join("linearGradient")
        .attr("id", (d, i) => `gradient-${i}`)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", d => d.source.x1)
        .attr("x2", d => d.target.x0)
        .attr("y1", d => (d.source.y0 + d.source.y1) / 2)
        .attr("y2", d => (d.target.y0 + d.target.y1) / 2);

    console.log("Gradients created");

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
        .data(sankeyLinks)
        .join("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke-width", d => 0.8*d.width)
        .attr("class", "link")
        .style("stroke", (d, i) => `url(#gradient-${i})`)
        // hover behvior for links
        .on("mouseover", function(event, d) {
            if (window.nodeClicked) {
                return;
            }
            d3.select(this)
                .classed("highlighted", true);
            const tooltip = d3.select(".tooltip");
            tooltip.style("opacity", .9)
                .html(`$${d.value.toLocaleString()}B`);
            
            // Select the rect elements and apply classes
            const sourceNode = d3.selectAll(".node-rectangles")
                .filter(r => r.index === d.source.index)
                .select("rect");
            const targetNode = d3.selectAll(".node-rectangles")
                .filter(r => r.index === d.target.index)
                .select("rect");
            
            sourceNode.classed("midlighted", true);
            targetNode.classed("midlighted", true);
        })
        .on("mousemove", function(event, d) {
            const tooltip = d3.select(".tooltip");
            const tooltipWidth = tooltip.node().offsetWidth;
            const tooltipHeight = tooltip.node().offsetHeight;
            tooltip.style("left", (event.pageX - tooltipWidth + 10) + "px")
                .style("top", (event.pageY - tooltipHeight - 10) + "px");
        })
        .on("mouseout", function() {
            if (window.nodeClicked) {
                return;
            }
            d3.select(this)
                .classed("highlighted", false);
            d3.select(".tooltip").style("opacity", 0);
            // unhighlight all nodes
            //d3.selectAll(".node-rectangles rect").classed("highlighted", false);
            d3.selectAll(".node-rectangles rect").classed("midlighted", false);
       });

    console.log("Links created");

    // Add nodes
    const node = svg.append("g")
        .selectAll("g")
        .data(sankeyNodes)  // Use all sankeyNodes without additional filtering
        .join("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    console.log("Nodes created");

    // Add rectangles for nodes in a separate group
    const nodeRectangles = node.append("g")
        .attr("class", "node-rectangles")
        .attr("data-index", d => d.index);

    nodeRectangles.append("rect")
        .datum(d => d)  // Bind the node data directly to the rect element
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("rx", 1)
        .attr("ry", 1)
        .attr("class", "node-rectangle")
        .attr("class", d => `depth${(d.depth % 3) + 1} ${d.isGroup ? 'group-node' : ''}`)
        .on("mouseover", function(event, d) {
            // Prevent event from bubbling up
            event.stopPropagation();
            
            // if a node was clicked, don't show the tooltip or highlight the node
            if (window.nodeClicked) {
                return;
            }
 
            d3.select(this)
                .classed("highlighted", true);
            // select the node label and apply the highlighted class
            d3.selectAll(".node-label")
                .filter(l => l.index === d.index)
                .classed("highlighted", true);
           
            // Calculate total outflow
            const inflow = d3.sum(sankeyLinks.filter(l => l.target === d), l => l.value);
            const outflow = d3.sum(sankeyLinks.filter(l => l.source === d), l => l.value);
            const totalflow = Math.max(inflow, outflow);


            // Create tooltip content
            let tooltipContent = `${d.name}${d.isGroup ? ' (Group)' : ''}<br>`;
            tooltipContent += `$<strong>${totalflow.toLocaleString()}</strong>B`;
            

            // Show node tooltip
            const tooltip = d3.select(".tooltip");
            tooltip.style("opacity", .9)
                .html(tooltipContent);
            
            // Position tooltip with edge protection
            const tooltipWidth = tooltip.node().offsetWidth;
            const tooltipHeight = tooltip.node().offsetHeight;
            const viewportHeight = window.innerHeight;
            
            let left = event.pageX - tooltipWidth + 20;
            let top = event.pageY - tooltipHeight - 15;
            
            // Check left edge
            if (left - tooltipWidth < 0) {
                left = 0;
            }
            
            // Check bottom edge
            if (top + tooltipHeight > viewportHeight) {
                top = event.pageY - tooltipHeight - 10;
            }
            
            tooltip.style("left", left + "px")
                .style("top", top + "px");
        })
        .on("mousemove", function(event, d) {
            const tooltip = d3.select(".tooltip");
            // Position tooltip with edge protection
             const tooltipWidth = tooltip.node().offsetWidth;
             const tooltipHeight = tooltip.node().offsetHeight;
             const viewportHeight = window.innerHeight;
             
             let left = event.pageX - tooltipWidth + 20;
             let top = event.pageY - tooltipHeight - 15;
             
             // Check left edge
             if (left - tooltipWidth < 0) {
                 left = 0;
             }
             
             // Check bottom edge
             if (top + tooltipHeight > viewportHeight) {
                 top = event.pageY - tooltipHeight - 10;
             }
             
             tooltip.style("left", left + "px")
                 .style("top", top + "px");
        })
        .on("mouseout", function() {
            // Hide tooltip
            d3.select(".tooltip").style("opacity", 0);
            
            // if a node was clicked, don't hide the tooltip or unhighlight the node
            if (window.nodeClicked) {
                return;
            }
            // unhighlight the node
            d3.selectAll(".node-rectangles rect").classed("highlighted", false);
            d3.selectAll(".node-label").classed("highlighted", false);
        })
        .on("click", function(event, d) {
            // set a flag to indicate that the node was clicked
            window.nodeClicked = true;

            // Prevent event from bubbling up
            event.stopPropagation();
            
            // Update the focus container with the node's name
            populateFocusContainer(d);

            // Convert Set to Array for the highlight function
            highlightNodes([d.index]);
        });

    // Add labels for nodes in a separate group that will be on top
    const nodeLabels = node.append("g")
        .attr("class", "node-labels");

    nodeLabels.append("text")
        .attr("x", d => d.x1 - d.x0 + 6)
        .attr("y", d => (d.y1 - d.y0) / 3)  // Position 1/3 from top of rectangle
        .attr("dy", "0px")
        .attr("text-anchor", "start")
        .attr("class", "node-label")
        .text(d => d.name)
        // if the node is a group, make the text italic
        .style("font-style", d => d.isGroup ? "italic" : "normal")
        .classed("hidden", d => (d.y1 - d.y0) === 0)  // Hide labels for nodes with no height
        .call(wrapText, 140, 13);

    // Add click handler to the container to dismiss tooltip and clear highlights
    svg.on("click", function(event) {
        // Clear if clicking on anything except nodes
        if (!event.target.classList.contains('node')) {
            // clear the focus contianer if node is clicked
            if (window.nodeClicked) {
                populateFocusContainer(null);
                highlightNodes(); // Reset all highlighting
                window.selectStory(window.selectedStory);
                window.nodeClicked = false;                
            }
        }
    });

    console.log("Visualization update complete");
} 