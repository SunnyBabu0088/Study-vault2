const webSearchTool = require('./aiTools/webSearchTool');
const locationMapsTool = require('./aiTools/locationMapsTool');
const travelTool = require('./aiTools/travelTool');
const pptGenerationTool = require('./aiTools/pptGenerationTool');
const documentGenerationTool = require('./aiTools/documentGenerationTool');

/**
 * Central AI Orchestrator & Tool Registry Layer
 * Seamlessly routes requests to Web Search, Maps, Travel, PPT Generation, Document Generation, Code, Quiz, Image, Vision & Context tools.
 */
async function processOrchestration({ userId, mode, message, attachedFile, options = {} }) {
  const rawMsg = message.trim();
  const query = rawMsg.toLowerCase();
  const isThink = options.isThinkActive || options.think;

  const metadata = {
    orchestratorVersion: '2.0-MultiPurpose',
    toolsExecuted: [],
  };

  let combinedContent = '';

  // 1. PPT GENERATION INTENT
  if (query.includes('ppt') || query.includes('presentation') || query.includes('slides') || query.includes('powerpoint')) {
    metadata.toolsExecuted.push('pptGenerationTool');
    let slideCount = 8;
    const matchCount = query.match(/(\d+)\s*slide/);
    if (matchCount) slideCount = parseInt(matchCount[1]);

    const pptResult = await pptGenerationTool.execute({ topic: rawMsg, slideCount, userId });
    metadata.type = 'ppt_generation';
    metadata.ppt = pptResult;

    combinedContent = `### 📊 Custom Presentation Generated!\n\nI have generated a **${pptResult.slideCount}-Slide Presentation Deck** on **"${pptResult.topic}"**.\n\n**Slide Deck Preview:**\n${pptResult.slides.slice(0, 4).map(s => `- **${s.title}**: ${s.bullets.slice(0, 2).join('; ')}`).join('\n')}\n\n👉 **[Click Here to Download & View Full Presentation](${pptResult.fileDownloadUrl})**`;
    return { content: attachThinkHeader(combinedContent, isThink, 'PPT Generation Pipeline'), metadata };
  }

  // 2. DOCUMENT / RESUME / TIMETABLE GENERATION INTENT
  if (query.includes('create a report') || query.includes('make a resume') || query.includes('create resume') || query.includes('study timetable') || query.includes('lab record') || query.includes('generate doc')) {
    metadata.toolsExecuted.push('documentGenerationTool');
    const docResult = await documentGenerationTool.execute({ query: rawMsg, title: rawMsg });
    metadata.type = 'document_generation';
    metadata.document = docResult;

    combinedContent = `### 📄 Custom Document Ready!\n\nI have compiled your **${docResult.docCategory}**.\n\n\`\`\`text\n${docResult.contentText.slice(0, 300)}...\n\`\`\`\n\n👉 **[Click Here to Download ${docResult.fileName}](${docResult.fileDownloadUrl})**`;
    return { content: attachThinkHeader(combinedContent, isThink, 'Document Synthesis Pipeline'), metadata };
  }

  // 3. TRAVEL / FLIGHT / TRAIN / BUS / TRIP ITINERARY INTENT
  if (query.includes('flight') || query.includes('train') || query.includes('bus') || query.includes('trip') || query.includes('how to reach') || query.includes('travel from') || query.includes('itinerary')) {
    metadata.toolsExecuted.push('travelTool');
    const travelResult = await travelTool.execute({ query: rawMsg });
    metadata.type = 'travel';
    metadata.travel = travelResult;

    if (travelResult.type === 'flight_search') {
      const flightRows = travelResult.options.map(f => `- **${f.airline}**: Departs **${f.departure}** → Arrives **${f.arrival}** (${f.duration}, ${f.type})`).join('\n');
      combinedContent = `### ✈️ Flight Routes & Availability (${travelResult.origin} → ${travelResult.destination})\n\nHere are available flights for your journey:\n\n${flightRows}\n\n*Note: ${travelResult.note}*`;
    } else if (travelResult.type === 'train_search') {
      const trainRows = travelResult.options.map(t => `- **${t.trainName}**: Departs **${t.departure}** → Arrives **${t.arrival}** (${t.duration}) - Classes: ${t.classes.join(', ')}`).join('\n');
      combinedContent = `### 🚆 Train Options & Schedules (${travelResult.origin} → ${travelResult.destination})\n\nVerified IRCTC train connections:\n\n${trainRows}\n\n*Note: ${travelResult.note}*`;
    } else if (travelResult.type === 'bus_search') {
      const busRows = travelResult.options.map(b => `- **${b.operator}**: Departs **${b.departure}** → Arrives **${b.arrival}** (${b.duration})`).join('\n');
      combinedContent = `### 🚌 Bus Transit Connections\n\n${busRows}`;
    } else if (travelResult.type === 'trip_itinerary') {
      const dayRows = travelResult.itinerary.map(d => `#### ${d.day}: ${d.focus}\n${d.details}`).join('\n\n');
      combinedContent = `### 🌴 ${travelResult.duration} Trip Itinerary for ${travelResult.destination}\n\n${dayRows}\n\n💡 **Travel Tip**: ${travelResult.travelTips}`;
    } else {
      combinedContent = `Here is your travel route summary for **"${rawMsg}"**:\n\n${travelResult.summary}`;
    }

    return { content: attachThinkHeader(combinedContent, isThink, 'Travel Intelligence Pipeline'), metadata };
  }

  // 4. MAPS / LOCATION / RESTAURANT SEARCH INTENT
  if (query.includes('near me') || query.includes('places to visit') || query.includes('where is') || query.includes('find cafes') || query.includes('find restaurant') || query.includes('hospital near') || query.includes('distance from')) {
    metadata.toolsExecuted.push('locationMapsTool');
    const mapsResult = await locationMapsTool.execute({ query: rawMsg });
    metadata.type = 'location';
    metadata.maps = mapsResult;

    if (mapsResult.places) {
      const placeRows = mapsResult.places.map(p => `- **${p.name}** (${p.category}) - ⭐ ${p.rating} | ${p.distance}`).join('\n');
      combinedContent = `### 📍 Top Places & Attractions in ${mapsResult.city}\n\n${mapsResult.summary}\n\n${placeRows}`;
    } else if (mapsResult.results) {
      const busRows = mapsResult.results.map(r => `- **${r.name}** (${r.category}) - ⭐ ${r.rating} | ${r.distance} | *${r.status}*`).join('\n');
      combinedContent = `### 🍽️ Nearby Locations & Dining (${rawMsg})\n\n${busRows}`;
    } else {
      combinedContent = mapsResult.summary;
    }

    return { content: attachThinkHeader(combinedContent, isThink, 'Maps & Navigation Pipeline'), metadata };
  }

  // 5. LIVE WEB / CURRENT EVENTS / WEATHER INTENT
  if (query.includes('president of india') || query.includes('prime minister') || query.includes('weather') || query.includes('news') || query.includes('current price') || query.includes('latest') || query.includes('who won')) {
    metadata.toolsExecuted.push('webSearchTool');
    const webResult = await webSearchTool.execute({ query: rawMsg });
    metadata.type = 'web_info';
    metadata.webSearch = webResult;

    combinedContent = `### 🌐 ${webResult.title}\n*Source: ${webResult.source} (Updated Just Now)*\n\n${webResult.summary}`;
    return { content: attachThinkHeader(combinedContent, isThink, 'Live Web Information Pipeline'), metadata };
  }

  // Fallback to default aiService handlers (Synonyms, Math, Code, Quiz, Image, Study, Writing & General QA)
  return null;
}

function attachThinkHeader(content, isThink, pipelineName) {
  if (!isThink) return content;
  return `> [🧠 Deep Reasoning Protocol Enabled]\n> Orchestrator Pipeline: ${pipelineName}\n\n` + content;
}

module.exports = { processOrchestration };
