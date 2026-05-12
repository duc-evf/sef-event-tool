import {
  SECTOR_OPTIONS, APPLICATION_AREA_OPTIONS,
  SEFMAP_ORG_CATEGORY_OPTIONS, SEFMAP_ROLE_IN_POLICY_OPTIONS,
  SEFMAP_RELEVANCE_OPTIONS, SEFMAP_STAKEHOLDER_THEME_OPTIONS,
  SEFMAP_COUNTRY_OPTIONS,
} from './constants';

const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const OPENAI_MODEL = 'gpt-4o';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

function parseJsonResponse(text) {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  return JSON.parse(jsonMatch[1].trim());
}

async function callClaude(apiKey, systemPrompt, userMessage) {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  return parseJsonResponse(text);
}

async function callOpenAI(apiKey, systemPrompt, userMessage) {
  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  return parseJsonResponse(text);
}

async function callAI(apiKey, provider, systemPrompt, userMessage) {
  if (provider === 'openai') {
    return callOpenAI(apiKey, systemPrompt, userMessage);
  }
  return callClaude(apiKey, systemPrompt, userMessage);
}

const TAXONOMY_SYSTEM = `You are an expert in Earth Observation (EO) and environmental policy. You help categorize stakeholder requirements using established taxonomies.

Available sectors: ${SECTOR_OPTIONS.join(', ')}

Available EARSC application areas: ${APPLICATION_AREA_OPTIONS.join(', ')}`;

export async function aiSuggestRequirement(apiKey, description, eventName, eventDate, provider = 'anthropic') {
  const userMessage = `Given a stakeholder requirement description from an event, suggest the following fields. Respond ONLY in JSON format with no preamble.

The requirement description is:
"${description}"

The event context is: "${eventName}" (${eventDate})

Respond with this exact JSON structure:
{
  "name": "short descriptive name, max 10 words",
  "requirement_category": ["one or more of: Functional requirement, Technical requirement, Other requirement"],
  "sef_themes": ["one or more of: Ecosystem and Biodiversity, Carbon, Energy and the Green Transition, Sustainable Development Goals, Food Systems"],
  "sectors": ["one or more from the sector list"],
  "application_areas": ["one or more from the EARSC taxonomy"],
  "biogeophysical_variables": "relevant variables or 'Not specified'"
}`;

  return callAI(apiKey, provider, TAXONOMY_SYSTEM, userMessage);
}

export async function aiDraftReport(apiKey, eventName, eventDates, contacts, requirements, provider = 'anthropic') {
  const systemPrompt = 'You are writing a post-event report for the SEF (Stakeholder Engagement Facility) team.';
  const userMessage = `Based on the contacts made and stakeholder requirements gathered at this event, draft each section below.

Event: ${eventName} (${eventDates})
Contacts made: ${JSON.stringify(contacts.map(c => ({ name: `${c.first_name} ${c.last_name}`, company: c.company_name, type: c.stakeholder_type, note: c.associated_note })))}
Stakeholder requirements collected: ${JSON.stringify(requirements.map(r => ({ name: r.name, description: r.description, themes: r.sef_themes, priority: r.stakeholder_priority })))}

Write a concise, professional report. Respond ONLY in JSON:
{
  "rationale": "paragraph",
  "key_messages": "bullet points as a single string, each bullet on new line starting with •",
  "key_stakeholders": "bullet points of key organisations and why they matter",
  "follow_on": "bullet points of action items",
  "lessons_learned": "paragraph",
  "other_points": "paragraph or empty string"
}`;

  return callAI(apiKey, provider, systemPrompt, userMessage);
}

export async function aiMergeReports(apiKey, eventName, reports, provider = 'anthropic') {
  const systemPrompt = 'You are synthesizing multiple post-event report submissions into a single consolidated report for the SEF team.';
  const userMessage = `Multiple colleagues attended "${eventName}" and submitted their individual reports. Merge them into one cohesive report without duplicating information.

Individual reports:
${JSON.stringify(reports, null, 2)}

Respond ONLY in JSON:
{
  "rationale": "merged paragraph",
  "key_messages": "merged bullet points, each on new line starting with •",
  "key_stakeholders": "merged bullet points of key organisations",
  "follow_on": "merged action items",
  "lessons_learned": "merged paragraph",
  "other_points": "merged or empty string"
}`;

  return callAI(apiKey, provider, systemPrompt, userMessage);
}

export async function aiEnrichStakeholder(apiKey, orgName, braveSnippets, provider = 'anthropic') {
  const systemPrompt = `You are an expert in Earth Observation (EO), environmental policy, and international organisations. Given an organisation name and optional web search snippets, populate structured fields about the organisation.

Valid Organisational categories: ${SEFMAP_ORG_CATEGORY_OPTIONS.join(', ')}
Valid Roles in policy: ${SEFMAP_ROLE_IN_POLICY_OPTIONS.join(', ')}
Valid Relevance values: ${SEFMAP_RELEVANCE_OPTIONS.join(', ')}
Valid Themes: ${SEFMAP_STAKEHOLDER_THEME_OPTIONS.join(', ')}
Valid Sectors: ${SECTOR_OPTIONS.join(', ')}
Valid Application Areas: ${APPLICATION_AREA_OPTIONS.join(', ')}
Valid Countries: ${SEFMAP_COUNTRY_OPTIONS.join(', ')}`;

  const snippetText = braveSnippets?.length
    ? `\n\nWeb search results for context:\n${braveSnippets.map((s, i) => `${i + 1}. ${s.title}\n   URL: ${s.url}\n   ${s.description}`).join('\n\n')}`
    : '\n\nNo web results available — use training knowledge only.';

  const userMessage = `Organisation name: "${orgName}"${snippetText}

Respond ONLY in JSON (no preamble):
{
  "org_name": "Full name as: Acronym - Local language name - English name (omit parts that don't apply)",
  "short_description": "1-2 sentence description of what this organisation does",
  "country": "one value from Valid Countries list, or empty string",
  "website": "official website URL, or empty string",
  "org_category": "one value from Valid Organisational categories, or empty string",
  "role_in_policy": ["zero or more values from Valid Roles in policy"],
  "relevance": "one value from Valid Relevance values, or empty string",
  "themes": ["zero or more values from Valid Themes"],
  "sectors": ["zero or more values from Valid Sectors"],
  "application_areas": ["zero or more values from Valid Application Areas"]
}`;

  return callAI(apiKey, provider, systemPrompt, userMessage);
}

export { testBraveViaProxy as testBraveConnection } from './brave';

export async function testConnection(apiKey, provider = 'anthropic') {
  if (provider === 'openai') {
    const res = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "OK"' }],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI API error ${res.status}`);
    return true;
  }

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "OK"' }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error ${res.status}`);
  return true;
}
